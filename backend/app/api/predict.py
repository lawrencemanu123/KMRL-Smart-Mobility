"""Machine Learning Prediction and Model Analytics API endpoints."""
from fastapi import APIRouter
from typing import Dict, Any

from ..ml import ml_service
from ..schemas import (
    PredictTravelTimeRequest,
    PredictDelayRequest,
    PredictWaitRequest
)

router = APIRouter(prefix="/api/predict", tags=["AI & Machine Learning"])


@router.post("/travel-time")
def predict_travel_time(req: PredictTravelTimeRequest):
    """Predict travel time in minutes for a transit segment using Gradient Boosting."""
    predicted_time = ml_service.predict_travel_time(
        mode=req.mode,
        distance_km=req.distance_km,
        hour_of_day=req.hour_of_day,
        day_of_week=req.day_of_week,
        weather=req.weather,
        traffic_level=req.traffic_level
    )
    return {
        "mode": req.mode,
        "distance_km": req.distance_km,
        "predicted_travel_time_min": predicted_time,
        "model_used": "Gradient Boosting Regressor (Trained)",
        "features_considered": ["mode", "distance", "hour", "day_of_week", "weather", "traffic_level"]
    }


@router.post("/delay")
def predict_delay(req: PredictDelayRequest):
    """Predict expected service delay and delay risk probability."""
    result = ml_service.predict_delay(
        mode=req.mode,
        distance_km=req.distance_km,
        hour_of_day=req.hour_of_day,
        day_of_week=req.day_of_week,
        weather=req.weather,
        traffic_level=req.traffic_level,
        passenger_density=req.passenger_density,
        upstream_delay_min=req.upstream_delay_min
    )
    return {
        "mode": req.mode,
        "prediction": result,
        "model_used": "Gradient Boosting Regressor (Trained)"
    }


@router.post("/waiting-time")
def predict_waiting_time(req: PredictWaitRequest):
    """Predict platform/terminal waiting time based on headway, delay, and density."""
    wait_time = ml_service.predict_waiting_time(
        mode=req.mode,
        scheduled_headway_min=req.scheduled_headway_min,
        delay_minutes=req.delay_minutes,
        hour_of_day=req.hour_of_day,
        passenger_density=req.passenger_density
    )
    return {
        "mode": req.mode,
        "scheduled_headway_min": req.scheduled_headway_min,
        "predicted_waiting_time_min": wait_time,
        "model_used": "Random Forest Regressor (Trained)"
    }


@router.get("/metrics")
def get_model_metrics():
    """Retrieve comprehensive evaluation metrics and feature importances for all ML models."""
    return {
        "models": ml_service.get_metrics(),
        "dataset_source": "Demo / Synthetic Data calibrated for Kochi Metropolitan Transit",
        "total_training_samples": 15000,
        "cross_validation": "80/20 Train-Test Split with Holdout Validation"
    }
