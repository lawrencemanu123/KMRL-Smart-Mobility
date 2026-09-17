import React, { useState, useEffect } from 'react';
import { 
  Station, 
  JourneyPlan, 
  PreferenceProfile, 
  TransportMode,
  DynamicRerouteResponse 
} from '../types';
import { api } from '../services/api';
import { JourneyPlanner } from '../components/planner/JourneyPlanner';
import { RouteCard } from '../components/planner/RouteCard';
import { KochiTransitMap } from '../components/map/KochiTransitMap';
import { DisruptionAlertBanner } from '../components/live/DisruptionAlertBanner';
import { Sparkles, Layers, Info } from 'lucide-react';

interface PlannerPageProps {
  stations: Station[];
  onSaveJourney?: (journey: JourneyPlan) => void;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({ stations, onSaveJourney }) => {
  // Default evaluation journey: Aluva to Fort Kochi
  const [originId, setOriginId] = useState('METRO_ALUVA');
  const [destinationId, setDestinationId] = useState('WATER_FORT_KOCHI');
  const [preference, setPreference] = useState<PreferenceProfile>('fastest');
  const [maxWalking, setMaxWalking] = useState(1500);
  const [avoidModes, setAvoidModes] = useState<TransportMode[]>([]);

  const [routes, setRoutes] = useState<JourneyPlan[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<JourneyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic reroute state
  const [rerouteData, setRerouteData] = useState<DynamicRerouteResponse | null>(null);

  // Perform initial search on mount
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!originId || !destinationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.searchRoutes({
        origin_id: originId,
        destination_id: destinationId,
        preference,
        max_walking_meters: maxWalking,
        avoid_modes: avoidModes
      });
      setRoutes(data.routes);
      if (data.routes.length > 0) {
        setSelectedRoute(data.routes[0]);
      }
      // Check if there are active disruptions on this corridor
      const rerouteCheck = await api.dynamicReroute({
        current_station_id: originId,
        destination_id: destinationId,
        preference
      });
      setRerouteData(rerouteCheck);
    } catch (err: any) {
      setError(err.message || 'Error finding routes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateWaterMetroDelay = async () => {
    setIsLoading(true);
    try {
      await api.simulateWaterMetroDelay(12);
      // Trigger reroute evaluation
      const check = await api.dynamicReroute({
        current_station_id: originId,
        destination_id: destinationId,
        preference
      });
      setRerouteData(check);
      // Re-run search to show updated delay times on existing options
      const updated = await api.searchRoutes({
        origin_id: originId,
        destination_id: destinationId,
        preference,
        max_walking_meters: maxWalking,
        avoid_modes: avoidModes
      });
      setRoutes(updated.routes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateBusDelay = async () => {
    setIsLoading(true);
    try {
      await api.simulateBusDelay(15);
      const check = await api.dynamicReroute({
        current_station_id: originId,
        destination_id: destinationId,
        preference
      });
      setRerouteData(check);
      const updated = await api.searchRoutes({
        origin_id: originId,
        destination_id: destinationId,
        preference,
        max_walking_meters: maxWalking,
        avoid_modes: avoidModes
      });
      setRoutes(updated.routes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSimulation = async () => {
    setIsLoading(true);
    try {
      await api.resetSimulation();
      setRerouteData(null);
      await handleSearch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyReroute = (newRoute: JourneyPlan) => {
    setSelectedRoute(newRoute);
    // Put new route at top of results
    setRoutes([newRoute, ...routes.filter(r => r.ranking_score !== newRoute.ranking_score)]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Simulation & Dynamic Reroute Alert Banner */}
      <DisruptionAlertBanner
        onTriggerWaterMetroDelay={handleSimulateWaterMetroDelay}
        onTriggerBusDelay={handleSimulateBusDelay}
        onResetSimulation={handleResetSimulation}
        rerouteData={rerouteData}
        onApplyReroute={handleApplyReroute}
        isLoading={isLoading}
      />

      {/* Main Grid: Left Planner/Results, Right Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Planner & Results) */}
        <div className="lg:col-span-5 space-y-6">
          <JourneyPlanner
            stations={stations}
            originId={originId}
            setOriginId={setOriginId}
            destinationId={destinationId}
            setDestinationId={setDestinationId}
            preference={preference}
            setPreference={setPreference}
            maxWalking={maxWalking}
            setMaxWalking={setMaxWalking}
            avoidModes={avoidModes}
            setAvoidModes={setAvoidModes}
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Route Options List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Recommended Multimodal Itineraries ({routes.length})</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium capitalize">
                Mode: {preference}
              </span>
            </div>

            {routes.map((r, idx) => (
              <RouteCard
                key={idx}
                route={r}
                index={idx}
                isSelected={selectedRoute?.ranking_score === r.ranking_score}
                onSelect={() => setSelectedRoute(r)}
                onSave={onSaveJourney}
              />
            ))}
          </div>
        </div>

        {/* Right Column (GIS Map) */}
        <div className="lg:col-span-7 h-[680px] sticky top-20">
          <KochiTransitMap
            stations={stations}
            selectedRoute={selectedRoute}
            onStationSelect={(stId) => {
              if (!originId) setOriginId(stId);
              else if (!destinationId && stId !== originId) setDestinationId(stId);
            }}
            onSetOrigin={(stId) => setOriginId(stId)}
            onSetDestination={(stId) => setDestinationId(stId)}
          />
        </div>
      </div>
    </div>
  );
};
