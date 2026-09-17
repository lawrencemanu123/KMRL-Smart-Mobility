"""Integration tests for FastAPI endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert "KMLR" in res.json()["platform"]

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"


def test_get_stations():
    res = client.get("/api/stations")
    assert res.status_code == 200
    stations = res.json()
    assert len(stations) >= 36


def test_search_routes_api():
    payload = {
        "origin_id": "METRO_ALUVA",
        "destination_id": "WATER_FORT_KOCHI",
        "preference": "fastest",
        "max_walking_meters": 1500,
        "avoid_modes": []
    }
    res = client.post("/api/routes/search", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["routes"]) > 0
    assert data["origin"] == "Aluva"
    assert data["destination"] == "Fort Kochi Water Metro"


def test_dynamic_rerouting_api():
    # 1. Trigger simulated delay
    delay_res = client.post("/api/live/simulate/water-metro-delay", params={"delay_minutes": 12.0})
    assert delay_res.status_code == 200

    # 2. Check reroute endpoint
    reroute_res = client.post("/api/routes/reroute", json={
        "current_station_id": "METRO_MG_ROAD",
        "destination_id": "WATER_FORT_KOCHI",
        "preference": "fastest"
    })
    assert reroute_res.status_code == 200
    reroute_data = reroute_res.json()
    assert reroute_data["disruption_detected"] is True
    assert "delayed by approximately 12 minutes" in reroute_data["notification_message"]

    # 3. Reset simulation
    reset_res = client.post("/api/live/simulate/reset")
    assert reset_res.status_code == 200


def test_ml_predict_endpoints():
    res = client.post("/api/predict/travel-time", json={
        "mode": "metro",
        "distance_km": 12.0,
        "hour_of_day": 9,
        "weather": "Clear",
        "traffic_level": 2
    })
    assert res.status_code == 200
    assert res.json()["predicted_travel_time_min"] > 0

    metrics_res = client.get("/api/predict/metrics")
    assert metrics_res.status_code == 200
    metrics_data = metrics_res.json()
    assert "travel_time" in metrics_data["models"]
