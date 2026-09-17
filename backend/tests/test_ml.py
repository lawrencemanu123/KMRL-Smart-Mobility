"""Unit tests for ML prediction pipelines."""
import pytest
from app.ml import ml_service


def test_ml_models_loaded():
    """Verify that all 3 serialized .joblib models and metrics are loaded."""
    assert ml_service.travel_time_model is not None
    assert ml_service.delay_model is not None
    assert ml_service.wait_model is not None
    assert "travel_time" in ml_service.metrics
    assert "delay_prediction" in ml_service.metrics
    assert "waiting_time" in ml_service.metrics


def test_travel_time_prediction():
    """Ensure travel time prediction returns positive, realistic minutes."""
    pred_metro = ml_service.predict_travel_time(
        mode="metro",
        distance_km=10.0,
        hour_of_day=9,
        weather="Clear",
        traffic_level=2
    )
    assert 10.0 <= pred_metro <= 30.0

    pred_walk = ml_service.predict_travel_time(
        mode="walking",
        distance_km=1.0,
        hour_of_day=12,
        weather="Clear",
        traffic_level=1
    )
    assert 10.0 <= pred_walk <= 20.0


def test_delay_prediction():
    """Ensure delay model outputs reasonable delay minutes and status."""
    res = ml_service.predict_delay(
        mode="feeder_bus",
        distance_km=5.0,
        traffic_level=4,  # severe congestion
        upstream_delay_min=8.0
    )
    assert res["predicted_delay_min"] >= 0.0
    assert 0.0 <= res["delay_probability"] <= 1.0
    assert res["status"] in ["On Time", "Minor Delay", "Significant Delay"]


def test_waiting_time_prediction():
    """Verify waiting time predictor outputs expected duration."""
    wait = ml_service.predict_waiting_time(
        mode="water_metro",
        scheduled_headway_min=15.0,
        delay_minutes=2.0
    )
    assert 2.0 <= wait <= 15.0
