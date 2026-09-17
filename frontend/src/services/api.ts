import {
  Station,
  RouteSearchResponse,
  DynamicRerouteResponse,
  LiveStatusResponse,
  MLModelMetric,
  User,
  PreferenceProfile,
  TransportMode
} from '../types';

const API_BASE = 'http://localhost:8000';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('kmlr_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // --- Stations ---
  async getStations(mode?: string): Promise<Station[]> {
    const url = mode ? `${API_BASE}/api/stations?mode=${mode}` : `${API_BASE}/api/stations`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch stations');
    return res.json();
  },

  async getStationDetails(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/stations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch station details');
    return res.json();
  },

  // --- Multimodal Routing ---
  async searchRoutes(params: {
    origin_id: string;
    destination_id: string;
    preference: PreferenceProfile;
    max_walking_meters?: number;
    avoid_modes?: TransportMode[];
  }): Promise<RouteSearchResponse> {
    const res = await fetch(`${API_BASE}/api/routes/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to search routes');
    }
    return res.json();
  },

  async dynamicReroute(params: {
    current_station_id: string;
    destination_id: string;
    preference: PreferenceProfile;
  }): Promise<DynamicRerouteResponse> {
    const res = await fetch(`${API_BASE}/api/routes/reroute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to check dynamic rerouting');
    return res.json();
  },

  // --- Real-time Simulation & Status ---
  async getLiveStatus(): Promise<LiveStatusResponse> {
    const res = await fetch(`${API_BASE}/api/live/status`);
    if (!res.ok) throw new Error('Failed to fetch live transit status');
    return res.json();
  },

  async simulateWaterMetroDelay(delayMinutes = 12): Promise<any> {
    const res = await fetch(`${API_BASE}/api/live/simulate/water-metro-delay?delay_minutes=${delayMinutes}`, {
      method: 'POST'
    });
    return res.json();
  },

  async simulateBusDelay(delayMinutes = 15): Promise<any> {
    const res = await fetch(`${API_BASE}/api/live/simulate/bus-delay?delay_minutes=${delayMinutes}`, {
      method: 'POST'
    });
    return res.json();
  },

  async resetSimulation(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/live/simulate/reset`, { method: 'POST' });
    return res.json();
  },

  // --- AI & Machine Learning ---
  async getMLMetrics(): Promise<{ models: Record<string, MLModelMetric>; total_training_samples: number }> {
    const res = await fetch(`${API_BASE}/api/predict/metrics`);
    if (!res.ok) throw new Error('Failed to fetch ML metrics');
    return res.json();
  },

  async predictTravelTime(data: {
    mode: string;
    distance_km: number;
    hour_of_day?: number;
    day_of_week?: number;
    weather?: string;
    traffic_level?: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/predict/travel-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async predictDelay(data: {
    mode: string;
    distance_km: number;
    traffic_level?: number;
    upstream_delay_min?: number;
    weather?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/predict/delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async predictWait(data: {
    mode: string;
    scheduled_headway_min?: number;
    delay_minutes?: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/predict/waiting-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // --- Admin & Stats ---
  async getAdminStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/stats`);
    if (!res.ok) throw new Error('Failed to fetch admin KPIs');
    return res.json();
  },

  // --- Journeys ---
  async getJourneys(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/api/journeys`, {
      headers: getAuthHeader()
    });
    return res.json();
  },

  async saveJourney(journey: {
    origin_name: string;
    destination_name: string;
    travel_mode_summary: string;
    total_duration_min: number;
    total_fare_inr: number;
    co2_saved_kg: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(journey)
    });
    return res.json();
  },

  // --- Auth ---
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('kmlr_token', data.access_token);
    return data;
  },

  async register(email: string, password: string, full_name: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem('kmlr_token', data.access_token);
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem('kmlr_token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeader() });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('kmlr_token');
  }
};
