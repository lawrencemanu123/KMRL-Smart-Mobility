"""Saved journeys and travel history API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db, JourneyRecord, User
from .auth import get_current_user

router = APIRouter(prefix="/api/journeys", tags=["Journeys & History"])


class SaveJourneyRequest(BaseModel):
    origin_name: str
    destination_name: str
    travel_mode_summary: str
    total_duration_min: float
    total_fare_inr: float
    co2_saved_kg: float = 0.0


@router.get("")
def get_user_journeys(user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve saved and previous journeys for the authenticated user (or demo journeys for guests)."""
    if user:
        journeys = db.query(JourneyRecord).filter(JourneyRecord.user_id == user.id).order_by(JourneyRecord.created_at.desc()).all()
        return journeys

    # Return sample recent journeys for guests
    return [
        {
            "id": 1,
            "origin_name": "Aluva Metro",
            "destination_name": "Fort Kochi Water Metro",
            "travel_mode_summary": "Metro → Auto → Water Metro",
            "total_duration_min": 44.5,
            "total_fare_inr": 85.0,
            "co2_saved_kg": 2.4,
            "is_favorite": True,
            "created_at": "2026-09-14 10:15"
        },
        {
            "id": 2,
            "origin_name": "Edappally Metro",
            "destination_name": "High Court Water Metro",
            "travel_mode_summary": "Metro → Walk → Water Metro",
            "total_duration_min": 32.0,
            "total_fare_inr": 35.0,
            "co2_saved_kg": 1.8,
            "is_favorite": False,
            "created_at": "2026-09-13 18:30"
        }
    ]


@router.post("")
def save_journey(req: SaveJourneyRequest, user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Save a planned route to user history or favorites."""
    user_id = user.id if user else None
    record = JourneyRecord(
        user_id=user_id,
        origin_name=req.origin_name,
        destination_name=req.destination_name,
        travel_mode_summary=req.travel_mode_summary,
        total_duration_min=req.total_duration_min,
        total_fare_inr=req.total_fare_inr,
        co2_saved_kg=req.co2_saved_kg,
        is_favorite=True
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"success": True, "journey_id": record.id, "message": "Journey successfully saved to your favorites."}
