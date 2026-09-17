import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Station, JourneyPlan, TransportMode } from '../../types';
import { 
  Layers, 
  LocateFixed, 
  Eye, 
  EyeOff, 
  Search, 
  X, 
  Navigation, 
  Train, 
  Ship, 
  Bus, 
  MapPin, 
  ArrowRight,
  Clock,
  Compass,
  CheckCircle2
} from 'lucide-react';

interface KochiTransitMapProps {
  stations: Station[];
  selectedRoute: JourneyPlan | null;
  onStationSelect?: (stationId: string) => void;
  onSetOrigin?: (stationId: string) => void;
  onSetDestination?: (stationId: string) => void;
  activeDisruptionLine?: string;
}

type MapTheme = 'google_streets' | 'google_hybrid' | 'google_terrain';

// Sequential coordinates for Kochi Metro Line 1 (Aluva to Thripunithura)
const METRO_LINE_COORDS: [number, number][] = [
  [10.1098, 76.3571], // Aluva
  [10.0964, 76.3475], // Pulinchodu
  [10.0863, 76.3402], // Companypady
  [10.0772, 76.3347], // Ambattukavu
  [10.0684, 76.3279], // Muttom
  [10.0535, 76.3204], // Kalamassery
  [10.0435, 76.3155], // Cochin University
  [10.0337, 76.3113], // Pathadipalam
  [10.0253, 76.3082], // Edappally
  [10.0157, 76.3032], // Changampuzha Park
  [10.0076, 76.3005], // Palarivattom
  [9.9984, 76.2996],  // JLN Stadium
  [9.9912, 76.2934],  // Kaloor
  [9.9880, 76.2863],  // Lissie
  [9.9803, 76.2818],  // M.G. Road
  [9.9723, 76.2838],  // Maharaja's College
  [9.9676, 76.2882],  // Ernakulam South
  [9.9678, 76.2989],  // Kadavanthra
  [9.9687, 76.3079],  // Elamkulam
  [9.9671, 76.3197],  // Vyttila Mobility Hub
  [9.9576, 76.3242],  // Thykoodam
  [9.9515, 76.3361],  // Petta
  [9.9501, 76.3448],  // Vadakkekotta
  [9.9482, 76.3533],  // SN Junction
  [9.9475, 76.3601]   // Thripunithura
];

// Water Metro Ferry corridors across backwaters (following deep navigation fairways)
const WATER_METRO_CORRIDORS: [number, number][][] = [
  // High Court <-> Vypin (across harbour shipping channel)
  [[9.9839, 76.2736], [9.9855, 76.2620], [9.9877, 76.2421]],
  // High Court <-> Bolgatty
  [[9.9839, 76.2736], [9.9818, 76.2652]],
  // High Court <-> Willingdon <-> Fort Kochi (navigable fairway)
  [[9.9839, 76.2736], [9.9780, 76.2660], [9.9680, 76.2580], [9.9674, 76.2435]],
  // Vyttila Jetty <-> Kakkanad (Chittethukara) via Kaniyampuzha River
  [[9.9665, 76.3210], [9.9750, 76.3280], [9.9850, 76.3380], [9.9980, 76.3530], [10.0072, 76.3644]],
  // South Chittoor <-> Cheranalloor <-> Eloor (Periyar River channel)
  [[10.0315, 76.2662], [10.0420, 76.2720], [10.0528, 76.2798], [10.0630, 76.2890], [10.0732, 76.2985]],
  // Fort Kochi <-> Mattancherry <-> Willingdon
  [[9.9674, 76.2435], [9.9620, 76.2510], [9.9568, 76.2573], [9.9555, 76.2650], [9.9542, 76.2730]]
];

// Feeder Bus Corridors (strictly following highway, arterial streets & bridges)
const FEEDER_BUS_CORRIDORS: [number, number][][] = [
  // Aluva Metro <-> Aluva KSRTC
  [[10.1098, 76.3571], [10.1090, 76.3565], [10.1085, 76.3562]],
  // Edappally Metro <-> Amrita Hospital (Ponekkara Rd)
  [[10.0253, 76.3082], [10.0245, 76.3095], [10.0300, 76.3020], [10.0345, 76.2952]],
  // Kaloor <-> Kakkanad Civil <-> InfoPark Express (via Palarivattom & Seaport-Airport Rd)
  [[9.9912, 76.2934], [10.0076, 76.3005], [10.0120, 76.3200], [10.0185, 76.3475], [10.0150, 76.3530], [10.0102, 76.3621]],
  // Ernakulam South <-> Menaka <-> Marine Drive <-> High Court (Shanmugham Rd)
  [[9.9676, 76.2882], [9.9723, 76.2838], [9.9768, 76.2782], [9.9790, 76.2750], [9.9822, 76.2755]],
  // Ernakulam South <-> Thoppumpady <-> Mattancherry <-> Fort Kochi (via Alexander Parambithara Bridge & BOT Bridge)
  [
    [9.9676, 76.2882],
    [9.9670, 76.2840],
    [9.9540, 76.2910],
    [9.9360, 76.2990],
    [9.9325, 76.2890],
    [9.9330, 76.2830],
    [9.9340, 76.2780],
    [9.9355, 76.2690],
    [9.9392, 76.2650],
    [9.9480, 76.2610],
    [9.9550, 76.2588],
    [9.9610, 76.2510],
    [9.9655, 76.2442],
    [9.9674, 76.2435]
  ],
  // Vyttila Hub <-> Kakkanad Civil Station
  [[9.9668, 76.3188], [9.9780, 76.3240], [10.0076, 76.3005], [10.0185, 76.3475]]
];

export const KochiTransitMap: React.FC<KochiTransitMapProps> = ({
  stations,
  selectedRoute,
  onStationSelect,
  onSetOrigin,
  onSetDestination,
  activeDisruptionLine
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const transitLinesGroupRef = useRef<L.LayerGroup | null>(null);
  const stationsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [currentTheme, setCurrentTheme] = useState<MapTheme>('google_streets');
  const [showLabels, setShowLabels] = useState(true);
  const [showTransitLines, setShowTransitLines] = useState(true);
  const [modeFilter, setModeFilter] = useState<'all' | 'metro' | 'water_metro' | 'feeder_bus'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Filter stations based on mode and search
  const filteredStations = useMemo(() => {
    return stations.filter(st => {
      const matchesMode = modeFilter === 'all' || st.mode === modeFilter;
      const matchesSearch = !searchQuery || st.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMode && matchesSearch;
    });
  }, [stations, modeFilter, searchQuery]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on Kochi Central Backwaters / MG Road
    const map = L.map(mapContainerRef.current, {
      center: [9.9816, 76.2999],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Google Maps Style Zoom Control (+ / -) in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Tile: Google Maps Roadmap (Standard clean Google theme, zero watermark)
    const googleRoadmap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    tileLayerRef.current = googleRoadmap;
    mapInstanceRef.current = map;

    // Ordered Layer Groups
    transitLinesGroupRef.current = L.layerGroup().addTo(map);
    stationsLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Theme Switching (Google Roadmap, Google Hybrid/Satellite, Google Terrain)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    if (currentTheme === 'google_hybrid') {
      url = 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    } else if (currentTheme === 'google_terrain') {
      url = 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
    }

    const newLayer = L.tileLayer(url, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [currentTheme]);

  // Recenter map on Kochi central
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([9.9816, 76.2999], 12, { animate: true });
    }
  };

  // 1. Render Google Transit Network Lines (Metro Spine, Water Channels, Feeder Bus)
  useEffect(() => {
    if (!mapInstanceRef.current || !transitLinesGroupRef.current) return;
    const group = transitLinesGroupRef.current;
    group.clearLayers();

    if (!showTransitLines) return;

    // A. Kochi Metro Line 1 (Aluva -> Thripunithura continuous spine)
    if (modeFilter === 'all' || modeFilter === 'metro') {
      // Outer casing for elevation depth
      const metroCasing = L.polyline(METRO_LINE_COORDS, {
        color: '#ffffff',
        weight: 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      group.addLayer(metroCasing);

      // Core Metro Blue Line (Google Transit blue #1a73e8)
      const metroCore = L.polyline(METRO_LINE_COORDS, {
        color: '#1a73e8',
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      metroCore.bindTooltip('<strong>Kochi Metro Line 1</strong><br/>Aluva ⇄ Thripunithura (25 Stations)', {
        sticky: true,
        className: 'google-transit-tooltip'
      });
      group.addLayer(metroCore);
    }

    // B. Kochi Water Metro Ferry Channels across backwaters
    if (modeFilter === 'all' || modeFilter === 'water_metro') {
      WATER_METRO_CORRIDORS.forEach(corridor => {
        const waterCasing = L.polyline(corridor, {
          color: '#ffffff',
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          dashArray: '3, 6'
        });
        group.addLayer(waterCasing);

        const waterLine = L.polyline(corridor, {
          color: '#0284c7', // Water Metro Cyan
          weight: 3.5,
          opacity: 0.95,
          dashArray: '4, 6',
          lineCap: 'round'
        });
        waterLine.bindTooltip('<strong>Kochi Water Metro Corridor</strong><br/>Electric-Hybrid Ferry Service', {
          sticky: true,
          className: 'google-transit-tooltip'
        });
        group.addLayer(waterLine);
      });
    }

    // C. Feeder Bus Corridors
    if (modeFilter === 'all' || modeFilter === 'feeder_bus') {
      FEEDER_BUS_CORRIDORS.forEach(corridor => {
        const busLine = L.polyline(corridor, {
          color: '#ea580c', // Feeder Bus Orange
          weight: 3,
          opacity: 0.85,
          dashArray: '5, 8',
          lineCap: 'round'
        });
        busLine.bindTooltip('<strong>KMRL Feeder Bus Route</strong><br/>Last-Mile Public Transit', {
          sticky: true,
          className: 'google-transit-tooltip'
        });
        group.addLayer(busLine);
      });
    }
  }, [showTransitLines, modeFilter]);

  // 2. Render Google Maps Transit Station Badges & Place Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !stationsLayerGroupRef.current) return;
    const group = stationsLayerGroupRef.current;
    group.clearLayers();

    filteredStations.forEach((st) => {
      const isMetro = st.mode === 'metro';
      const isWater = st.mode === 'water_metro';

      let bg = '#1a73e8'; // Google Blue (Metro)
      let svgIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>`;

      if (isWater) {
        bg = '#0284c7'; // Turquoise (Water Metro Ferry)
        svgIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/></svg>`;
      } else if (st.mode === 'feeder_bus') {
        bg = '#ea580c'; // Orange (Bus)
        svgIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`;
      }

      const isSelected = selectedStation?.id === st.id;
      const showPill = showLabels && (
        isWater || 
        st.is_terminal || 
        st.name === 'Edappally' || 
        st.name === 'M.G. Road' || 
        st.name === 'Aluva' || 
        st.name === 'Vyttila Mobility Hub' || 
        st.name === 'Fort Kochi Water Metro'
      );

      const markerHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            width: ${isSelected ? '32px' : (isMetro || isWater ? '26px' : '20px')};
            height: ${isSelected ? '32px' : (isMetro || isWater ? '26px' : '20px')};
            background: ${bg};
            border: ${isSelected ? '3px solid #facc15' : '2.5px solid #ffffff'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            ${svgIcon}
          </div>
          ${showPill ? `
            <div style="
              background: rgba(255, 255, 255, 0.98);
              color: #1e293b;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: 10px;
              font-weight: 700;
              padding: 1.5px 6px;
              border-radius: 4px;
              margin-top: 2px;
              white-space: nowrap;
              box-shadow: 0 2px 5px rgba(0,0,0,0.22);
              border: 1px solid rgba(0,0,0,0.08);
              pointer-events: none;
            ">
              ${st.name}
            </div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'google-transit-marker',
        html: markerHtml,
        iconSize: [30, 42],
        iconAnchor: [15, 13]
      });

      const marker = L.marker([st.lat, st.lon], { icon: customIcon });

      marker.on('click', () => {
        setSelectedStation(st);
        if (onStationSelect) onStationSelect(st.id);
      });

      group.addLayer(marker);
    });
  }, [filteredStations, showLabels, selectedStation, onStationSelect]);

  // 3. Render Google Maps Navigation Route Polylines & Direction Pins
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerGroupRef.current) return;
    const group = routeLayerGroupRef.current;
    group.clearLayers();

    if (!selectedRoute || !selectedRoute.legs || selectedRoute.legs.length === 0) return;

    const latLngsToFit: L.LatLngExpression[] = [];

    selectedRoute.legs.forEach((leg, index) => {
      const startCoord: [number, number] = leg.from_coord;
      const endCoord: [number, number] = leg.to_coord;

      // Extract high-fidelity road, track, or waterway geometry
      const coords: [number, number][] = (leg.path_coords && leg.path_coords.length > 1)
        ? (leg.path_coords as [number, number][])
        : [startCoord, endCoord];

      coords.forEach(pt => latLngsToFit.push(pt));

      const isWalking = leg.mode === 'walking';
      let strokeColor = '#1a73e8'; // Google Blue (Metro)

      if (leg.mode === 'water_metro') strokeColor = '#00897b'; // Vibrant Teal / Water Metro
      else if (leg.mode === 'feeder_bus') strokeColor = '#e65100'; // Transit Orange
      else if (leg.mode === 'auto') strokeColor = '#f59e0b'; // Amber Auto
      else if (isWalking) strokeColor = '#10b981'; // Green Walk

      // Outer Border / Casing (Google Maps dual-stroke navigation contrast)
      const casing = L.polyline(coords, {
        color: '#ffffff',
        weight: isWalking ? 6 : 9,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      group.addLayer(casing);

      // Inner Core Polyline
      const polyline = L.polyline(coords, {
        color: strokeColor,
        weight: isWalking ? 4 : 6,
        opacity: 1.0,
        dashArray: isWalking ? '4, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round'
      });

      polyline.bindTooltip(`
        <div style="font-family: sans-serif; padding: 2px;">
          <strong>${leg.mode.toUpperCase()}: ${leg.line}</strong>
          <div>Duration: ${Math.round(leg.duration_min)} min (${leg.distance_km} km)</div>
        </div>
      `, {
        sticky: true,
        className: 'google-tooltip'
      });

      group.addLayer(polyline);

      // Transfer Nodes between legs
      if (index > 0) {
        const transferHtml = `
          <div style="
            width: 14px;
            height: 14px;
            background: #ffffff;
            border: 3.5px solid ${strokeColor};
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>
        `;
        const transferIcon = L.divIcon({
          html: transferHtml,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        group.addLayer(L.marker(coords[0], { icon: transferIcon }));
      }
    });

    // Google Maps Origin Pin (Green Teardrop Pin 'A')
    const firstLeg = selectedRoute.legs[0];
    const originCoord = (firstLeg.path_coords && firstLeg.path_coords.length > 0)
      ? firstLeg.path_coords[0]
      : firstLeg.from_coord;
    const originHtml = `
      <div style="
        width: 34px;
        height: 40px;
        position: relative;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.45));
        cursor: pointer;
      ">
        <svg viewBox="0 0 24 30" width="34" height="40">
          <path d="M12 0C5.38 0 0 5.38 0 12c0 8.5 12 18 12 18s12-9.5 12-18c0-6.62-5.38-12-12-12z" fill="#0f9d58"/>
          <circle cx="12" cy="11" r="5.5" fill="#ffffff"/>
          <text x="12" y="14.5" font-size="8.5" font-weight="bold" fill="#0f9d58" text-anchor="middle">A</text>
        </svg>
      </div>
    `;
    const originPin = L.divIcon({
      html: originHtml,
      iconSize: [34, 40],
      iconAnchor: [17, 40]
    });
    group.addLayer(L.marker(originCoord, { icon: originPin, zIndexOffset: 1000 }));

    // Google Maps Destination Pin (Red Teardrop Pin 'B')
    const lastLeg = selectedRoute.legs[selectedRoute.legs.length - 1];
    const destCoord = (lastLeg.path_coords && lastLeg.path_coords.length > 0)
      ? lastLeg.path_coords[lastLeg.path_coords.length - 1]
      : lastLeg.to_coord;
    const destHtml = `
      <div style="
        width: 34px;
        height: 40px;
        position: relative;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.45));
        cursor: pointer;
      ">
        <svg viewBox="0 0 24 30" width="34" height="40">
          <path d="M12 0C5.38 0 0 5.38 0 12c0 8.5 12 18 12 18s12-9.5 12-18c0-6.62-5.38-12-12-12z" fill="#ea4335"/>
          <circle cx="12" cy="11" r="5.5" fill="#ffffff"/>
          <text x="12" y="14.5" font-size="8.5" font-weight="bold" fill="#ea4335" text-anchor="middle">B</text>
        </svg>
      </div>
    `;
    const destPin = L.divIcon({
      html: destHtml,
      iconSize: [34, 40],
      iconAnchor: [17, 40]
    });
    group.addLayer(L.marker(destCoord, { icon: destPin, zIndexOffset: 1000 }));

    // Zoom & Fit bounds smoothly
    if (latLngsToFit.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(latLngsToFit), {
        padding: [60, 60],
        maxZoom: 14,
        animate: true
      });
    }
  }, [selectedRoute]);

  // Handle setting station as origin or destination
  const handleSetAsOrigin = (st: Station) => {
    if (onSetOrigin) onSetOrigin(st.id);
    setSelectedStation(null);
  };

  const handleSetAsDestination = (st: Station) => {
    if (onSetDestination) onSetDestination(st.id);
    setSelectedStation(null);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-[#e5e3df]">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Google Maps Style Search Bar & Filter Chips (Top Left) */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col space-y-2 pointer-events-auto max-w-[340px] w-full">
        {/* Search Bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 flex items-center px-3 py-2 text-slate-800">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search stations, water jetties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Google Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 no-scrollbar">
          <button
            onClick={() => setModeFilter('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap transition-all ${
              modeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white/95 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Modes ({stations.length})
          </button>
          <button
            onClick={() => setModeFilter('metro')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap transition-all flex items-center space-x-1 ${
              modeFilter === 'metro'
                ? 'bg-[#1a73e8] text-white'
                : 'bg-white/95 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🚇 Metro</span>
          </button>
          <button
            onClick={() => setModeFilter('water_metro')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap transition-all flex items-center space-x-1 ${
              modeFilter === 'water_metro'
                ? 'bg-[#0284c7] text-white'
                : 'bg-white/95 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>⛴️ Water</span>
          </button>
          <button
            onClick={() => setModeFilter('feeder_bus')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap transition-all flex items-center space-x-1 ${
              modeFilter === 'feeder_bus'
                ? 'bg-[#ea580c] text-white'
                : 'bg-white/95 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🚌 Buses</span>
          </button>
        </div>
      </div>

      {/* Floating Google Maps Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col space-y-2 pointer-events-auto items-end">
        {/* Map / Satellite / Terrain Toggle */}
        <div className="bg-white/95 backdrop-blur-md px-1.5 py-1 rounded-xl shadow-lg border border-slate-200 flex items-center space-x-1 text-xs">
          <button
            onClick={() => setCurrentTheme('google_streets')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              currentTheme === 'google_streets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Google Map
          </button>
          <button
            onClick={() => setCurrentTheme('google_hybrid')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              currentTheme === 'google_hybrid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setCurrentTheme('google_terrain')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              currentTheme === 'google_terrain'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Terrain
          </button>
        </div>

        {/* Toggle Overlays & Recenter */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTransitLines(!showTransitLines)}
            title="Toggle Transit Corridors"
            className={`p-2 rounded-xl shadow-md border border-slate-200 transition-colors ${
              showTransitLines ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white/95 text-slate-600 hover:text-blue-600'
            }`}
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            title="Toggle Station Labels"
            className="p-2 rounded-xl bg-white/95 text-slate-700 hover:text-blue-600 shadow-md border border-slate-200 transition-colors"
          >
            {showLabels ? <Eye className="w-4 h-4 text-blue-600" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={handleRecenter}
            title="Recenter on Kochi City"
            className="p-2 rounded-xl bg-white/95 text-slate-700 hover:text-blue-600 shadow-md border border-slate-200 transition-colors"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Google Transit Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl text-xs space-y-1.5 shadow-2xl border border-slate-200 pointer-events-auto max-w-[240px]">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Kochi Transit Layer</span>
          <span className="flex items-center space-x-1 text-[10px] text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#1a73e8] border border-white shadow-sm shrink-0"></div>
          <span className="text-slate-800 font-medium text-[11px]">Kochi Metro Line (25 Stns)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#0284c7] border border-white shadow-sm shrink-0"></div>
          <span className="text-slate-800 font-medium text-[11px]">Water Metro (11 Jetties)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ea580c] border border-white shadow-sm shrink-0"></div>
          <span className="text-slate-800 font-medium text-[11px]">Feeder Buses (12 Hubs)</span>
        </div>
      </div>

      {/* Google Maps Style Station Place Sheet / Details Card */}
      {selectedStation && (
        <div className="absolute bottom-4 right-4 sm:right-16 z-[400] bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-4 max-w-[320px] w-full animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
          <div className="flex items-start justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${
                selectedStation.mode === 'metro' ? 'bg-[#1a73e8]' : selectedStation.mode === 'water_metro' ? 'bg-[#0284c7]' : 'bg-[#ea580c]'
              }`}>
                {selectedStation.mode === 'metro' ? <Train className="w-4 h-4" /> : selectedStation.mode === 'water_metro' ? <Ship className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{selectedStation.name}</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {selectedStation.mode.replace('_', ' ')} {selectedStation.is_terminal ? '• Terminal' : ''}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedStation(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Next Frequency:</span>
              </span>
              <span className="font-bold text-slate-800">
                {selectedStation.mode === 'metro' ? 'Every ~4 mins' : selectedStation.mode === 'water_metro' ? 'Every ~8 mins' : 'Every ~10 mins'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Operation:</span>
              </span>
              <span className="font-semibold text-emerald-600">Normal Service</span>
            </div>
            <div className="text-[10px] text-slate-400 pt-1">
              ♿ Step-free wheelchair access • Integrated QR / Kochi1 Card
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleSetAsOrigin(selectedStation)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center space-x-1 shadow-sm transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Set as Start</span>
            </button>
            <button
              onClick={() => handleSetAsDestination(selectedStation)}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center space-x-1 shadow-sm transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Set as End</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
