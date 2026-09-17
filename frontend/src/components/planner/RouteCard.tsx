import React, { useState } from 'react';
import { 
  Clock, 
  IndianRupee, 
  Footprints, 
  ArrowRight, 
  Leaf, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle,
  Train,
  Ship,
  Bus,
  Car,
  Bookmark
} from 'lucide-react';
import { JourneyPlan, Leg, TransportMode } from '../../types';

interface RouteCardProps {
  route: JourneyPlan;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onSave?: (route: JourneyPlan) => void;
}

const getModeIcon = (mode: TransportMode) => {
  switch (mode) {
    case 'metro': return <Train className="w-4 h-4 text-sky-400" />;
    case 'water_metro': return <Ship className="w-4 h-4 text-cyan-400" />;
    case 'feeder_bus': return <Bus className="w-4 h-4 text-orange-400" />;
    case 'auto': return <Car className="w-4 h-4 text-yellow-400" />;
    case 'walking': return <Footprints className="w-3.5 h-3.5 text-emerald-400" />;
    default: return <Clock className="w-4 h-4 text-slate-400" />;
  }
};

const getModeBadgeClass = (mode: TransportMode) => {
  switch (mode) {
    case 'metro': return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    case 'water_metro': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    case 'feeder_bus': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'auto': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    case 'walking': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    default: return 'bg-slate-700/50 text-slate-300 border-slate-600';
  }
};

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  index,
  isSelected,
  onSelect,
  onSave
}) => {
  const [isExpanded, setIsExpanded] = useState(isSelected);

  return (
    <div 
      onClick={onSelect}
      className={`glass-card rounded-2xl p-5 border transition-all cursor-pointer ${
        isSelected 
          ? 'border-sky-500 bg-slate-900/90 shadow-xl shadow-sky-500/10 ring-1 ring-sky-500/40' 
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/80'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {route.is_recommended ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm">
              ★ Recommended
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Option {index + 1}
            </span>
          )}

          <span className="text-xs text-slate-400">
            {route.transfers_count === 0 ? 'Direct Route' : `${route.transfers_count} Transfer${route.transfers_count > 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-emerald-400 text-xs font-medium">
            <Leaf className="w-3.5 h-3.5" />
            <span>-{route.co2_saved_kg} kg CO₂</span>
          </div>

          {onSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(route);
              }}
              title="Save to favorites"
              className="p-1 rounded-md text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Summary */}
      <div className="flex items-baseline justify-between py-2 border-b border-slate-800/80">
        <div>
          <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline space-x-1">
            <span>{Math.round(route.total_duration_min)}</span>
            <span className="text-sm font-normal text-slate-400">mins</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Walk: {Math.round(route.walking_time_min)}m • Wait: {Math.round(route.waiting_time_min)}m
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-sky-400 flex items-center justify-end">
            <IndianRupee className="w-5 h-5 -mr-0.5" />
            <span>{Math.round(route.total_fare_inr)}</span>
          </div>
          <span className="text-xs text-slate-400">{route.total_distance_km} km total</span>
        </div>
      </div>

      {/* Mode Sequence Badges */}
      <div className="my-3.5 flex items-center flex-wrap gap-1.5">
        {route.legs.map((leg, i) => (
          <React.Fragment key={leg.leg_index}>
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${getModeBadgeClass(leg.mode)}`}>
              {getModeIcon(leg.mode)}
              <span>{leg.line.length > 22 ? leg.line.substring(0, 20) + '...' : leg.line}</span>
              <span className="text-[10px] opacity-75">({Math.round(leg.duration_min)}m)</span>
            </div>
            {i < route.legs.length - 1 && (
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Explainable AI (XAI) Badges */}
      {route.recommendation_badges && route.recommendation_badges.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {route.recommendation_badges.map((badge, bIdx) => (
            <span 
              key={bIdx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700 flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3 h-3 text-sky-400" />
              <span>{badge}</span>
            </span>
          ))}
        </div>
      )}

      {/* Expand / Collapse Itinerary Details */}
      <div className="pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="w-full flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 py-1 transition-colors"
        >
          <span>{isExpanded ? 'Hide Segment Details' : 'View Step-by-Step Itinerary'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
            {route.legs.map((leg, idx) => (
              <div key={idx} className="relative pl-5 pb-2 last:pb-0 border-l border-slate-800 ml-2">
                <div 
                  className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: leg.color || '#0284c7' }}
                >
                  {idx + 1}
                </div>
                
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>{leg.from_station_name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span>{leg.to_station_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {leg.line} • {leg.distance_km} km
                    </div>
                  </div>
                  
                  <div className="text-right text-xs">
                    <span className="font-semibold text-slate-200">{Math.round(leg.duration_min)} min</span>
                    {leg.fare_inr > 0 && (
                      <span className="text-slate-400 block text-[11px]">₹{leg.fare_inr}</span>
                    )}
                  </div>
                </div>

                {/* Transfer Safety Alert */}
                {leg.transfer_safety && (
                  <div className={`mt-1.5 p-2 rounded-lg text-[11px] flex items-center space-x-1.5 border ${
                    leg.transfer_safety.safety === 'safe'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  }`}>
                    {leg.transfer_safety.safety === 'safe' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    )}
                    <span>{leg.transfer_safety.message}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
