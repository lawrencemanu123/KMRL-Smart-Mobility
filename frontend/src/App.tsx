import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PlannerPage } from './pages/PlannerPage';
import { LiveStatusPage } from './pages/LiveStatusPage';
import { MlAnalyticsPage } from './pages/MlAnalyticsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { MyJourneysPage } from './pages/MyJourneysPage';
import { AuthModal } from './components/AuthModal';
import { Station, User, JourneyPlan } from './types';
import { api } from './services/api';
import { Compass, Sparkles, Shield, Github, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('planner');
  const [stations, setStations] = useState<Station[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [stationList, currentUser, liveStatus] = await Promise.all([
        api.getStations(),
        api.getMe(),
        api.getLiveStatus()
      ]);
      setStations(stationList);
      setUser(currentUser);
      const hasDelays = liveStatus.lines.some(l => l.delay_minutes > 0);
      setSimulationActive(hasDelays);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  const handleSaveJourney = async (route: JourneyPlan) => {
    try {
      const modesStr = route.legs.map(l => l.line).join(' → ');
      await api.saveJourney({
        origin_name: route.origin_name,
        destination_name: route.destination_name,
        travel_mode_summary: modesStr,
        total_duration_min: route.total_duration_min,
        total_fare_inr: route.total_fare_inr,
        co2_saved_kg: route.co2_saved_kg
      });
      alert('✓ Route saved to your favorites!');
    } catch (err) {
      alert('Failed to save route. Please sign in first.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        simulationActive={simulationActive}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'planner' && (
          <PlannerPage stations={stations} onSaveJourney={handleSaveJourney} />
        )}
        {activeTab === 'live' && <LiveStatusPage />}
        {activeTab === 'ml' && <MlAnalyticsPage />}
        {activeTab === 'admin' && <AdminDashboardPage />}
        {activeTab === 'journeys' && (
          <MyJourneysPage user={user} onOpenAuth={() => setIsAuthOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-sky-500/20 flex items-center justify-center text-sky-400">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">KMLR Urban Mobility Platform</span>
            <span>•</span>
            <span>Kochi Metropolitan Region</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span>FastAPI + NetworkX Engine</span>
            <span>•</span>
            <span>Scikit-Learn / XGBoost</span>
            <span>•</span>
            <span>React + Leaflet GIS</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </div>
  );
};

export default App;
