"""Live Transit Status and Simulation Control API endpoints."""
from fastapi import APIRouter
from typing import Dict, Any

from ..simulation import sim_engine
from ..schemas import LiveStatusResponse

router = APIRouter(prefix="/api/live", tags=["Real-Time Status & Simulation"])


@router.get("/status", response_model=LiveStatusResponse)
def get_live_status():
    """Get network-wide operational status, active delays, and alerts."""
    return sim_engine.get_live_network_status()


@router.post("/simulate/water-metro-delay")
def trigger_water_metro_delay(delay_minutes: float = 12.0):
    """Simulate a Water Metro disruption to demonstrate dynamic rerouting."""
    return sim_engine.trigger_water_metro_delay(delay_minutes)


@router.post("/simulate/bus-delay")
def trigger_bus_delay(delay_minutes: float = 15.0):
    """Simulate feeder bus road traffic delay."""
    return sim_engine.trigger_bus_delay(delay_minutes)


@router.post("/simulate/reset")
def reset_simulation():
    """Reset all simulated delays and return to on-time state."""
    return sim_engine.reset_simulation()


@router.post("/simulate/weather")
def set_weather(weather: str = "Monsoon Heavy Rain"):
    """Update simulated weather condition."""
    sim_engine.weather_condition = weather
    return {"success": True, "weather": weather}
