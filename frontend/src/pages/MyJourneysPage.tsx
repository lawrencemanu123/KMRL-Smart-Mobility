import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Clock, 
  IndianRupee, 
  Leaf, 
  MapPin, 
  Sliders, 
  CheckCircle,
  Accessibility
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface MyJourneysPageProps {
  user: User | null;
  onOpenAuth: () => void;
}

export const MyJourneysPage: React.FC<MyJourneysPageProps> = ({ user, onOpenAuth }) => {
  const [journeys, setJourneys] = useState<any[]>([]);
  const [walkingLimit, setWalkingLimit] = useState(1000);
  const [wheelchair, setWheelchair] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    loadJourneys();
  }, [user]);

  const loadJourneys = async () => {
    try {
      const data = await api.getJourneys();
      setJourneys(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePreferences = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">My Saved Journeys & Preferences</h1>
        <p className="text-sm text-slate-400 mt-1">
          Access your frequent multimodal corridors and fine-tune your personal routing constraints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Saved Journeys List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-sky-400" />
              <span>Saved Corridors ({journeys.length})</span>
            </h2>
            {!user && (
              <button
                onClick={onOpenAuth}
                className="text-xs text-sky-400 hover:text-sky-300 underline"
              >
                Sign in to sync across devices
              </button>
            )}
          </div>

          <div className="space-y-3">
            {journeys.map((j) => (
              <div 
                key={j.id}
                className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>{j.origin_name}</span>
                      <span className="text-slate-500">→</span>
                      <span>{j.destination_name}</span>
                    </h3>
                    <span className="text-xs text-sky-400 font-medium mt-1 block">
                      {j.travel_mode_summary}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-extrabold text-white">{Math.round(j.total_duration_min)} min</span>
                    <span className="block text-xs font-semibold text-sky-400">₹{Math.round(j.total_fare_inr)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <Leaf className="w-3.5 h-3.5" />
                    <span>-{j.co2_saved_kg} kg CO₂</span>
                  </span>
                  <span>{j.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Preferences Card */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 border border-slate-800 space-y-5 h-fit">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Mobility Profile</span>
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Maximum Walking Preference</span>
                <span className="font-semibold text-sky-400">{walkingLimit}m</span>
              </div>
              <input
                type="range"
                min="400"
                max="2500"
                step="100"
                value={walkingLimit}
                onChange={(e) => setWalkingLimit(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wheelchair}
                  onChange={(e) => setWheelchair(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-sky-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">Wheelchair / Step-Free Access</span>
                  <span className="text-slate-400 text-[11px]">Only prioritize lifts, escalators, and accessible jetties</span>
                </div>
              </label>
            </div>

            <button
              onClick={handleSavePreferences}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              {savedMsg ? '✓ Preferences Updated!' : 'Save Profile Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
