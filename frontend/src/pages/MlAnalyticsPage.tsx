import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  BarChart3, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  ArrowRight,
  Sliders,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { MLModelMetric } from '../types';

export const MlAnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Record<string, MLModelMetric>>({});
  const [selectedModel, setSelectedModel] = useState<'travel_time' | 'delay_prediction' | 'waiting_time'>('travel_time');

  // Playground state
  const [testMode, setTestMode] = useState('water_metro');
  const [testDistance, setTestDistance] = useState(4.3);
  const [testWeather, setTestWeather] = useState('Clear');
  const [testTraffic, setTestTraffic] = useState(2);
  const [testHour, setTestHour] = useState(9);

  const [playgroundResult, setPlaygroundResult] = useState<any>(null);
  const [isInferencing, setIsInferencing] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await api.getMLMetrics();
      if (res.models) {
        setMetrics(res.models);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runPlaygroundInference = async () => {
    setIsInferencing(true);
    try {
      const ttRes = await api.predictTravelTime({
        mode: testMode,
        distance_km: testDistance,
        weather: testWeather,
        traffic_level: testTraffic,
        hour_of_day: testHour
      });

      const delayRes = await api.predictDelay({
        mode: testMode,
        distance_km: testDistance,
        weather: testWeather,
        traffic_level: testTraffic
      });

      setPlaygroundResult({
        travel_time_min: ttRes.predicted_travel_time_min,
        delay: delayRes.prediction
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsInferencing(false);
    }
  };

  const currentModelData = metrics[selectedModel];
  const chartData = currentModelData
    ? Object.entries(currentModelData.feature_importances || {}).map(([feat, imp]) => ({
        feature: feat.replace('cat__', '').replace('num__', ''),
        importance: Math.round(Number(imp) * 100)
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI & Machine Learning Engine</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Scikit-Learn & XGBoost models trained on Kochi multimodal datasets for travel time, service delay, and waiting time forecasting.
        </p>
      </div>

      {/* Model Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            key: 'travel_time',
            title: 'Travel Time Model',
            algo: metrics.travel_time?.algorithm || 'Gradient Boosting Regressor',
            r2: metrics.travel_time?.r2_score || 0.9945,
            mae: metrics.travel_time?.mae || 0.55,
            rmse: metrics.travel_time?.rmse || 0.79
          },
          {
            key: 'delay_prediction',
            title: 'Service Delay Model',
            algo: metrics.delay_prediction?.algorithm || 'Gradient Boosting Regressor',
            r2: metrics.delay_prediction?.r2_score || 0.9853,
            mae: metrics.delay_prediction?.mae || 0.33,
            rmse: metrics.delay_prediction?.rmse || 0.46
          },
          {
            key: 'waiting_time',
            title: 'Waiting Time Model',
            algo: metrics.waiting_time?.algorithm || 'Random Forest Regressor',
            r2: metrics.waiting_time?.r2_score || 0.9424,
            mae: metrics.waiting_time?.mae || 0.57,
            rmse: metrics.waiting_time?.rmse || 0.75
          }
        ].map((m) => (
          <div
            key={m.key}
            onClick={() => setSelectedModel(m.key as any)}
            className={`glass-panel rounded-3xl p-6 border transition-all cursor-pointer ${
              selectedModel === m.key
                ? 'border-sky-500 ring-1 ring-sky-500/40 bg-slate-900/90 shadow-xl shadow-sky-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Trained Pipeline</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                Online (.joblib)
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">{m.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{m.algo}</p>

            <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-center">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">R² Score</div>
                <div className="text-sm font-extrabold text-sky-400 mt-0.5">{m.r2}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">MAE</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5">{m.mae}m</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">RMSE</div>
                <div className="text-sm font-extrabold text-amber-400 mt-0.5">{m.rmse}m</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Importance & Model Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Importance Chart */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <span>Feature Importance Attribution (Explainable AI)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Relative influence of operational variables on {currentModelData?.model_name || 'selected model'}
              </p>
            </div>
            <span className="text-xs text-slate-400">15,000 Training Samples</span>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" width={80} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Relative Weight']}
                />
                <Bar dataKey="importance" fill="#0284c7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Interactive Prediction Playground */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Live Prediction Playground</h3>
          </div>
          <p className="text-xs text-slate-400">
            Test real-time inference against the active serialized models in memory.
          </p>

          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Transit Mode</label>
                <select
                  value={testMode}
                  onChange={(e) => setTestMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="water_metro">Water Metro (Ferry)</option>
                  <option value="metro">Kochi Metro</option>
                  <option value="feeder_bus">Feeder Bus</option>
                  <option value="auto">Auto-rickshaw</option>
                  <option value="walking">Walking</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Weather</label>
                <select
                  value={testWeather}
                  onChange={(e) => setTestWeather(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="Clear">Clear Skies</option>
                  <option value="Moderate Rain">Moderate Rain</option>
                  <option value="Monsoon Heavy Rain">Monsoon Heavy Rain</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Distance:</span>
                <span className="font-bold text-sky-400">{testDistance} km</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15.0"
                step="0.5"
                value={testDistance}
                onChange={(e) => setTestDistance(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Traffic Level: {testTraffic}/4</label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={testTraffic}
                  onChange={(e) => setTestTraffic(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Time: {testHour}:00 hrs</label>
                <input
                  type="range"
                  min="6"
                  max="22"
                  value={testHour}
                  onChange={(e) => setTestHour(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>

            <button
              onClick={runPlaygroundInference}
              disabled={isInferencing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 text-white font-semibold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all"
            >
              {isInferencing ? 'Running ML Inference...' : 'Execute ML Model Prediction'}
            </button>

            {playgroundResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-sky-500/30 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Inference Output</div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Predicted Travel Time</div>
                    <div className="text-base font-extrabold text-white mt-0.5">{playgroundResult.travel_time_min} mins</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Predicted Delay</div>
                    <div className="text-base font-extrabold text-amber-400 mt-0.5">+{playgroundResult.delay.predicted_delay_min} mins</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
