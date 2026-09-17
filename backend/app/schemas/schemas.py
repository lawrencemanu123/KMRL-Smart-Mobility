"""Pydantic schemas for KMLR API requests and responses."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_admin: bool
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserPreferenceUpdate(BaseModel):
    preferred_mode: Optional[str] = "any"
    max_walking_meters: Optional[int] = 1000
    preference_profile: Optional[str] = "fastest"
    wheelchair_accessible: Optional[bool] = False
    avoid_modes: Optional[str] = ""


class UserPreferenceOut(BaseModel):
    preferred_mode: str
    max_walking_meters: int
    preference_profile: str
    wheelchair_accessible: bool
    avoid_modes: str
    model_config = {"from_attributes": True}



# --- TRANSIT SCHEMAS ---
class StationOut(BaseModel):
    id: str
    name: str
    mode: str
    lat: float
    lon: float
    line: Optional[str] = None
    is_terminal: bool = False


class RouteSearchRequest(BaseModel):
    origin_id: str
    destination_id: str
    preference: str = "fastest"  # fastest, cheapest, min_transfers, comfortable, eco
    max_walking_meters: int = 1500
    avoid_modes: Optional[List[str]] = Field(default_factory=list)


class LegOut(BaseModel):
    leg_index: int
    mode: str
    line: str
    from_station_id: str
    from_station_name: str
    to_station_id: str
    to_station_name: str
    from_coord: List[float]
    to_coord: List[float]
    path_coords: Optional[List[List[float]]] = None
    distance_km: float
    duration_min: float
    in_vehicle_time_min: float
    waiting_time_min: float
    delay_min: float
    fare_inr: float
    color: str
    transfer_safety: Optional[Dict[str, Any]] = None


class JourneyPlanOut(BaseModel):
    origin_id: str
    origin_name: str
    destination_id: str
    destination_name: str
    total_duration_min: float
    walking_time_min: float
    waiting_time_min: float
    total_fare_inr: float
    total_distance_km: float
    co2_saved_kg: float
    transfers_count: int
    predicted_delay_min: float
    primary_modes: List[str]
    legs: List[LegOut]
    recommendation_badges: List[str]
    confidence_score: float
    ranking_score: float
    is_recommended: bool = False


class RouteSearchResponse(BaseModel):
    origin: str
    destination: str
    preference_applied: str
    routes: List[JourneyPlanOut]
    weather_condition: str
    traffic_level: int
    simulation_mode: bool = True


# --- DYNAMIC REROUTING SCHEMAS ---
class DynamicRerouteRequest(BaseModel):
    current_station_id: str
    destination_id: str
    preference: str = "fastest"


class DynamicRerouteResponse(BaseModel):
    disruption_detected: bool
    notification_message: str
    delay_added_min: float
    time_saved_min: float
    new_recommended_route: Optional[JourneyPlanOut] = None


# --- LIVE STATUS & PREDICTION SCHEMAS ---
class LineStatusOut(BaseModel):
    line_name: str
    mode: str
    delay_minutes: float
    status: str
    severity: str
    frequency_min: int


class DisruptionAlertOut(BaseModel):
    id: str
    mode: str
    line: str
    severity: str
    title: str
    description: str
    delay_minutes: int
    timestamp: str


class LiveStatusResponse(BaseModel):
    simulation_mode: bool
    weather: str
    traffic_level: int
    lines: List[LineStatusOut]
    alerts: List[DisruptionAlertOut]
    last_updated: str


class PredictTravelTimeRequest(BaseModel):
    mode: str
    distance_km: float
    hour_of_day: int = 10
    day_of_week: int = 2
    weather: str = "Clear"
    traffic_level: int = 2


class PredictDelayRequest(BaseModel):
    mode: str
    distance_km: float = 3.0
    hour_of_day: int = 10
    day_of_week: int = 2
    weather: str = "Clear"
    traffic_level: int = 2
    passenger_density: float = 0.5
    upstream_delay_min: float = 0.0


class PredictWaitRequest(BaseModel):
    mode: str
    scheduled_headway_min: float = 8.0
    delay_minutes: float = 0.0
    hour_of_day: int = 10
    passenger_density: float = 0.5
