export type TransportMode = 'metro' | 'water_metro' | 'feeder_bus' | 'auto' | 'walking' | 'cycling';

export type PreferenceProfile = 'fastest' | 'cheapest' | 'min_transfers' | 'comfortable' | 'eco';

export interface Station {
  id: string;
  name: string;
  mode: TransportMode;
  lat: number;
  lon: number;
  line?: string;
  is_terminal?: boolean;
}

export interface Leg {
  leg_index: number;
  mode: TransportMode;
  line: string;
  from_station_id: string;
  from_station_name: string;
  to_station_id: string;
  to_station_name: string;
  from_coord: [number, number];
  to_coord: [number, number];
  path_coords?: [number, number][];
  distance_km: number;
  duration_min: number;
  in_vehicle_time_min: number;
  waiting_time_min: number;
  delay_min: number;
  fare_inr: number;
  color: string;
  transfer_safety?: {
    feasible: boolean;
    safety: 'safe' | 'risky' | 'missed';
    message: string;
  };
}

export interface JourneyPlan {
  origin_id: string;
  origin_name: string;
  destination_id: string;
  destination_name: string;
  total_duration_min: number;
  walking_time_min: number;
  waiting_time_min: number;
  total_fare_inr: number;
  total_distance_km: number;
  co2_saved_kg: number;
  transfers_count: number;
  predicted_delay_min: number;

  primary_modes: TransportMode[];
  legs: Leg[];
  recommendation_badges: string[];
  confidence_score: number;
  ranking_score: number;
  is_recommended?: boolean;
}

export interface RouteSearchResponse {
  origin: string;
  destination: string;
  preference_applied: PreferenceProfile;
  routes: JourneyPlan[];
  weather_condition: string;
  traffic_level: number;
  simulation_mode: boolean;
}

export interface DynamicRerouteResponse {
  disruption_detected: boolean;
  notification_message: string;
  delay_added_min: number;
  time_saved_min: number;
  new_recommended_route: JourneyPlan | null;
}

export interface LineStatus {
  line_name: string;
  mode: TransportMode;
  delay_minutes: number;
  status: string;
  severity: 'normal' | 'low' | 'severe';
  frequency_min: number;
}

export interface DisruptionAlert {
  id: string;
  mode: TransportMode;
  line: string;
  severity: string;
  title: string;
  description: string;
  delay_minutes: number;
  timestamp: string;
}

export interface LiveStatusResponse {
  simulation_mode: boolean;
  weather: string;
  traffic_level: number;
  lines: LineStatus[];
  alerts: DisruptionAlert[];
  last_updated: string;
}

export interface MLModelMetric {
  model_name: string;
  algorithm: string;
  mae: number;
  rmse: number;
  r2_score: number;
  training_samples: number;
  feature_importances: Record<string, number>;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
}
