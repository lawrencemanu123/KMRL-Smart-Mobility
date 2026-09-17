"""Stations, Water Metro Terminals, and Bus Stops API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from ..routing.graph import MultimodalGraph, METRO_STATIONS, WATER_METRO_TERMINALS, BUS_STOPS
from ..simulation.simulator import sim_engine

router = APIRouter(prefix="/api/stations", tags=["Stations & Terminals"])

# Graph instance
graph_mgr = MultimodalGraph()


@router.get("", response_model=List[Dict[str, Any]])
def get_all_stations(mode: Optional[str] = None):
    """Retrieve all stations, water metro jetties, and bus stops in Kochi."""
    all_stations = graph_mgr.get_all_stations()
    if mode:
        all_stations = [s for s in all_stations if s["mode"] == mode]
    return all_stations


@router.get("/search")
def search_stations(q: str):
    """Search stations by name substring."""
    query = q.lower().strip()
    all_stations = graph_mgr.get_all_stations()
    matches = [s for s in all_stations if query in s["name"].lower() or query in s["id"].lower()]
    return matches[:10]


@router.get("/{station_id}")
def get_station_details(station_id: str):
    """Get station metadata, next departures, and live wait time."""
    if station_id not in graph_mgr.graph:
        raise HTTPException(status_code=404, detail="Station not found")

    node_data = graph_mgr.graph.nodes[station_id]
    mode = node_data.get("mode", "metro")
    line = node_data.get("line", "Transit")

    delays = sim_engine.get_live_delays()
    active_delay = delays.get(line, 0.0)

    # Next departure calculation
    headway = 7 if mode == "metro" else (15 if mode == "water_metro" else 10)
    next_departure_in = round(max(1.0, (headway / 2.0) + active_delay), 1)

    return {
        "id": station_id,
        "name": node_data.get("name"),
        "mode": mode,
        "line": line,
        "lat": node_data.get("lat"),
        "lon": node_data.get("lon"),
        "is_terminal": node_data.get("is_terminal", False),
        "next_departure_min": next_departure_in,
        "estimated_wait_min": round(next_departure_in, 1),
        "delay_status": f"+{int(active_delay)} min delay" if active_delay > 0 else "On Time",
        "facilities": {
            "wheelchair_accessible": True,
            "smart_ticketing": True,
            "feeder_auto_stand": True,
            "bicycle_parking": mode in ["metro", "water_metro"]
        }
    }
