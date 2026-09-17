import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Navigation, 
  Clock, 
  Leaf, 
  ShieldCheck, 
  Activity,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading Admin Operations Console...
      </div>
    );
  }

  const { kpis, mode_share_percentages, popular_origin_destinations } = stats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">KMRL Operations & Analytics Console</h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated passenger mobility, modal share, network reliability, and environmental metrics
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
          System Status: 99.98% Available
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Commuters</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{kpis.total_users.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+14.2% this month</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Journeys Today</span>
            <Navigation className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{kpis.journeys_planned_today.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>High multi-modal uptake</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Travel Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{kpis.avg_multimodal_travel_time_min} min</div>
          <div className="text-[11px] text-slate-400">
            Avg Delay: <strong>+{kpis.avg_predicted_delay_min} min</strong>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">CO₂ Offset</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{kpis.co2_emissions_saved_tons} Tons</div>
          <div className="text-[11px] text-slate-400">
            Green Electric Catamarans & Metro
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mode Split Bar Chart */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>Multimodal Passenger Modal Split (%)</span>
          </h3>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mode_share_percentages} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mode" stroke="#94a3b8" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Modal Share']}
                />
                <Bar dataKey="percentage" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Corridors */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">High-Volume Transit Corridors</h3>
          <div className="space-y-3">
            {popular_origin_destinations.map((c: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{c.corridor}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Top: {c.top_mode}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-sky-400">{c.daily_searches.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 block">daily journeys</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
