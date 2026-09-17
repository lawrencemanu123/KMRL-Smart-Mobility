import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Zap, 
  IndianRupee, 
  Shuffle, 
  Armchair, 
  Leaf, 
  SlidersHorizontal,
  Navigation,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Station, PreferenceProfile, TransportMode } from '../../types';

import { LocationAutocomplete } from './LocationAutocomplete';

interface JourneyPlannerProps {
  stations: Station[];
  originId: string;
  setOriginId: (id: string) => void;
  destinationId: string;
  setDestinationId: (id: string) => void;
  customOrigin: { lat: number; lng: number; name: string } | null;
  setCustomOrigin: (c: { lat: number; lng: number; name: string } | null) => void;
  customDest: { lat: number; lng: number; name: string } | null;
  setCustomDest: (c: { lat: number; lng: number; name: string } | null) => void;
  preference: PreferenceProfile;
  setPreference: (p: PreferenceProfile) => void;
  maxWalking: number;
  setMaxWalking: (m: number) => void;
  avoidModes: TransportMode[];
  setAvoidModes: (modes: TransportMode[]) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const PRESETS = [
  { label: 'Aluva → Fort Kochi', origin: 'METRO_ALUVA', dest: 'WATER_FORT_KOCHI' },
  { label: 'Edappally → Infopark', origin: 'METRO_EDAPPALLY', dest: 'BUS_INFOPARK_EXPRESS' },
  { label: 'High Court → Vypin', origin: 'WATER_HIGH_COURT', dest: 'WATER_VYPIN' },
  { label: 'Vyttila → High Court', origin: 'METRO_VYTTILA', dest: 'WATER_HIGH_COURT' },
];

export const JourneyPlanner: React.FC<JourneyPlannerProps> = ({
  stations,
  originId,
  setOriginId,
  destinationId,
  setDestinationId,
  customOrigin,
  setCustomOrigin,
  customDest,
  setCustomDest,
  preference,
  setPreference,
  maxWalking,
  setMaxWalking,
  avoidModes,
  setAvoidModes,
  onSearch,
  isLoading
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const swapLocations = () => {
    const tempId = originId;
    setOriginId(destinationId);
    setDestinationId(tempId);
    const tempCustom = customOrigin;
    setCustomOrigin(customDest);
    setCustomDest(tempCustom);
  };

  const toggleAvoidMode = (mode: TransportMode) => {
    if (avoidModes.includes(mode)) {
      setAvoidModes(avoidModes.filter(m => m !== mode));
    } else {
      setAvoidModes([...avoidModes, mode]);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Quick Demo Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Kochi Demo Quick Routes</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setOriginId(p.origin);
                setDestinationId(p.dest);
                setCustomOrigin(null);
                setCustomDest(null);
              }}
              className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all truncate"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Origin & Destination Inputs */}
      <div className="space-y-2 relative z-20">
        <LocationAutocomplete
          label="Origin Station / Custom Location"
          placeholder="Search places or stations..."
          stations={stations}
          value={originId}
          indicatorColor="bg-sky-400"
          onChange={(id, custom) => {
            setOriginId(id);
            setCustomOrigin(custom);
          }}
        />

        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={swapLocations}
            title="Swap Origin and Destination"
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-sky-400 shadow-md transition-transform active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <LocationAutocomplete
          label="Destination Station / Custom Location"
          placeholder="Search places or stations..."
          stations={stations}
          value={destinationId}
          indicatorColor="bg-cyan-400"
          onChange={(id, custom) => {
            setDestinationId(id);
            setCustomDest(custom);
          }}
        />
      </div>

      {/* Travel Preferences */}
      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Optimize Route For</label>
        <div className="grid grid-cols-5 gap-1">
          {[
            { id: 'fastest', label: 'Fastest', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'cheapest', label: 'Cheapest', icon: <IndianRupee className="w-3.5 h-3.5" /> },
            { id: 'min_transfers', label: 'Few Transfers', icon: <Shuffle className="w-3.5 h-3.5" /> },
            { id: 'comfortable', label: 'Comfort', icon: <Armchair className="w-3.5 h-3.5" /> },
            { id: 'eco', label: 'Eco', icon: <Leaf className="w-3.5 h-3.5" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPreference(item.id as PreferenceProfile)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-medium border transition-all ${
                preference === item.id
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="mt-1 leading-none truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filter Toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
          <span>{showAdvanced ? 'Hide Advanced Constraints' : 'Advanced Constraints'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Maximum Walking Distance</span>
                <span className="font-semibold text-sky-400">{maxWalking} meters</span>
              </div>
              <input
                type="range"
                min="300"
                max="3000"
                step="100"
                value={maxWalking}
                onChange={(e) => setMaxWalking(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <span className="block text-xs text-slate-400 mb-1.5">Avoid Specific Modes</span>
              <div className="flex flex-wrap gap-1.5">
                {(['auto', 'feeder_bus'] as TransportMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => toggleAvoidMode(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      avoidModes.includes(m)
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {avoidModes.includes(m) ? `✕ Avoiding ${m}` : `Include ${m}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Find Routes Submit Button */}
      <button
        onClick={onSearch}
        disabled={isLoading || !originId || !destinationId}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Evaluating Multimodal Routes & AI Models...</span>
          </div>
        ) : (
          <>
            <Navigation className="w-4 h-4" />
            <span>Find Optimal Multimodal Routes</span>
          </>
        )}
      </button>
    </div>
  );
};
