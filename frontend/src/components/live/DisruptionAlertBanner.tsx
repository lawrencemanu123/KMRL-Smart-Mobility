import React, { useState } from 'react';
import { 
  AlertTriangle, 
  RotateCcw, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { DynamicRerouteResponse, JourneyPlan } from '../../types';

interface DisruptionAlertBannerProps {
  onTriggerWaterMetroDelay: () => void;
  onTriggerBusDelay: () => void;
  onResetSimulation: () => void;
  rerouteData: DynamicRerouteResponse | null;
  onApplyReroute?: (route: JourneyPlan) => void;
  isLoading: boolean;
}

export const DisruptionAlertBanner: React.FC<DisruptionAlertBannerProps> = ({
  onTriggerWaterMetroDelay,
  onTriggerBusDelay,
  onResetSimulation,
  rerouteData,
  onApplyReroute,
  isLoading
}) => {
  return (
    <div className="space-y-3">
      {/* Simulation Controls Strip */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Evaluation Demo: Real-Time Disruption Simulator</div>
            <div className="text-[11px] text-slate-400">Inject simulated service delays to demonstrate AI Dynamic Rerouting</div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onTriggerWaterMetroDelay}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition-all"
          >
            ⚠️ Simulate Water Metro Delay (+12m)
          </button>

          <button
            onClick={onTriggerBusDelay}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-medium transition-all"
          >
            🚌 Simulate Bus Delay (+15m)
          </button>

          <button
            onClick={onResetSimulation}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Dynamic Reroute Alert Notification */}
      {rerouteData && rerouteData.disruption_detected && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/50 shadow-xl space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                  AI Dynamic Reroute Recommended
                </span>
                <p className="text-sm font-semibold text-slate-100 mt-0.5">
                  {rerouteData.notification_message}
                </p>
                <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-400">
                  <span>Delayed service impact: <strong className="text-amber-300">+{rerouteData.delay_added_min} min</strong></span>
                  <span>•</span>
                  <span>Estimated time saved: <strong className="text-emerald-400">~{rerouteData.time_saved_min} min</strong></span>
                </div>
              </div>
            </div>

            {rerouteData.new_recommended_route && onApplyReroute && (
              <button
                onClick={() => onApplyReroute(rerouteData.new_recommended_route!)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all flex-shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Switch to Alternative Route</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
