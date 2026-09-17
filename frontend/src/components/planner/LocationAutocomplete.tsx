import React, { useState, useEffect, useRef } from 'react';
import { Station } from '../../types';
import { Search, MapPin } from 'lucide-react';

interface LocationAutocompleteProps {
  label: string;
  placeholder: string;
  stations: Station[];
  value: string; // The ID of the station OR "CUSTOM_LOCATION"
  onChange: (id: string, customCoords: { lat: number; lng: number; name: string } | null) => void;
  indicatorColor: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  label,
  placeholder,
  stations,
  value,
  onChange,
  indicatorColor
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize input text based on current value
  useEffect(() => {
    if (value && value !== 'CUSTOM_LOCATION') {
      const st = stations.find(s => s.id === value);
      if (st) setQuery(st.name);
    } else if (!value) {
      setQuery('');
    }
  }, [value, stations]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  // Debounced Geocoding Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query || query.length < 3 || stations.some(s => s.name === query)) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        // Restrict search to Kochi area using Photon API (No strict user-agent limits)
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}+Kochi&limit=4`);
        const data = await res.json();
        setResults(data.features || []);
      } catch (err) {
        console.error("Geocoding error", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, stations]);

  const filteredStations = stations.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-[11px] font-medium text-slate-400 mb-1">{label}</label>
      <div className="relative flex items-center">
        <div className={`absolute left-3 w-2.5 h-2.5 rounded-full ${indicatorColor}`}></div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
        />
        {isSearching && (
          <div className="absolute right-3 w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>

      {isOpen && (query.length > 0 || filteredStations.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {/* Station Results */}
          {filteredStations.length > 0 && (
            <div className="p-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Transit Stations</div>
              {filteredStations.slice(0, 5).map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    setQuery(s.name);
                    onChange(s.id, null);
                    setIsOpen(false);
                  }}
                  className="px-2 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer text-sm text-slate-200 flex items-center space-x-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Geocoding Results */}
          {results.length > 0 && (
            <div className="p-2 border-t border-slate-800">
              <div className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Custom Locations</div>
              {results.map((r, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const displayName = r.properties.name || r.properties.street || r.properties.city || 'Custom Location';
                    setQuery(displayName);
                    onChange('CUSTOM_LOCATION', { 
                      lat: r.geometry.coordinates[1], 
                      lng: r.geometry.coordinates[0], 
                      name: displayName 
                    });
                    setIsOpen(false);
                  }}
                  className="px-2 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer text-sm text-slate-200 flex items-center space-x-2"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400 min-w-max" />
                  <span className="truncate">{r.properties.name || r.properties.street} {r.properties.city ? `, ${r.properties.city}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
