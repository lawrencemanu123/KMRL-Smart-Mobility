import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CloudRain, 
  Navigation, 
  RotateCcw, 
  Ship, 
  Train, 
  Bus, 
  Car,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { LiveStatusResponse, LineStatus } from '../types';

export const LiveStatusPage: React.FC = () => {
  const [statusData, setStatusData] = useState<LiveStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLiveStatus();
    const interval = setInterval(loadLiveStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadLiveStatus = async () => {
    try {
      const data = await api.getLiveStatus();
      setStatusData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateWaterDelay = async () => {
    setIsLoading(true);
    await api.simulateWaterMetroDelay(12);
    await loadLiveStatus();
    setIsLoading(false);
  };

  const handleSimulateBusDelay = async () => {
    setIsLoading(true);
    await api.simulateBusDelay(15);
    await loadLiveStatus();
    setIsLoading(false);
  };

  const handleReset = async () => {
    setIsLoading(true);
    await api.resetSimulation();
    await loadLiveStatus();
    setIsLoading(false);
  };

  const getLineIcon = (mode: string) => {
    if (mode === 'metro') return <Train className="w-5 h-5 text-sky-400" />;
    if (mode === 'water_metro') return <Ship className="w-5 h-5 text-cyan-400" />;
    return <Bus className="w-5 h-5 text-orange-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Kochi Transit Live Network Status</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry, delay monitoring, and simulated disruption feeds across Kochi Metropolitan Region
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="glass-card px-4 py-2 rounded-xl text-xs flex items-center space-x-2 border border-slate-800">
            <CloudRain className="w-4 h-4 text-sky-400" />
            <span className="text-slate-300">Weather: <strong>{statusData?.weather || 'Clear'}</strong></span>
          </div>

          <div className="glass-card px-4 py-2 rounded-xl text-xs flex items-center space-x-2 border border-slate-800">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">Traffic Index: <strong>Level {statusData?.traffic_level || 2}/4</strong></span>
          </div>
        </div>
      </div>

      {/* Simulator Quick Action Panel */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Interactive Demonstration Simulator</h2>
            <p className="text-xs text-slate-400">Trigger simulated real-time operational events to evaluate dynamic rerouting</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={handleSimulateWaterDelay}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <span>⚠️ Simulate Water Metro High Court - Fort Kochi Delay (+12 min)</span>
          </button>

          <button
            onClick={handleSimulateBusDelay}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <span>🚌 Simulate City Bus Traffic Delay (+15 min)</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center space-x-2 ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Services to On Time</span>
          </button>
        </div>
      </div>

      {/* Lines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statusData?.lines.map((line, idx) => (
          <div 
            key={idx}
            className="glass-card rounded-2xl p-5 border border-slate-800/90 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                  {getLineIcon(line.mode)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{line.line_name}</h3>
                  <span className="text-[11px] text-slate-400 capitalize">
                    {line.mode.replace('_', ' ')} • Every {line.frequency_min} mins
                  </span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                line.severity === 'normal' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {line.status}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Expected Delay: <strong>+{Math.round(line.delay_minutes)} min</strong></span>
              <span className="text-emerald-400">99.2% Reliability</span>
            </div>
          </div>
        ))}
      </div>

      {/* Disruption Feed */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-sky-400" />
          <span>Active Operations Alerts & Bulletins</span>
        </h3>

        <div className="space-y-3">
          {statusData?.alerts.map((alert) => (
            <div 
              key={alert.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3.5"
            >
              <div className={`p-2 rounded-lg mt-0.5 ${
                alert.severity === 'normal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {alert.severity === 'normal' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                  <span className="text-[10px] text-slate-500">{alert.timestamp}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
