"""SQLAlchemy ORM models for the KMLR platform."""
import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)
from sqlalchemy.orm import relationship
from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    preference = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    journeys = relationship("JourneyRecord", back_populates="user", cascade="all, delete-orphan")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    preferred_mode = Column(String(50), default="any")  # any, metro, water_metro, bus
    max_walking_meters = Column(Integer, default=1000)
    preference_profile = Column(String(50), default="fastest")  # fastest, cheapest, min_transfers, comfortable, eco
    wheelchair_accessible = Column(Boolean, default=False)
    avoid_modes = Column(String(255), default="")  # comma-separated e.g. "auto"
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="preference")


class Station(Base):
    __tablename__ = "stations"

    id = Column(String(100), primary_key=True, index=True)  # e.g. METRO_ALUVA, WATER_FORT_KOCHI
    name = Column(String(255), index=True, nullable=False)
    mode = Column(String(50), index=True, nullable=False)   # metro, water_metro, feeder_bus, auto_stand, bike_station
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    line_name = Column(String(100), nullable=True)          # e.g. "Blue Line", "Fort Kochi Line"
    is_terminal = Column(Boolean, default=False)
    facilities = Column(Text, default="{}")                 # JSON string with amenities (parking, wifi, accessibility)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class RouteLine(Base):
    __tablename__ = "route_lines"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    mode = Column(String(50), nullable=False)
    color = Column(String(20), default="#0284c7")
    headway_min = Column(Integer, default=8)
    base_fare = Column(Float, default=10.0)
    per_km_fare = Column(Float, default=2.5)


class DisruptionAlert(Base):
    __tablename__ = "disruption_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    mode = Column(String(50), nullable=False)               # metro, water_metro, feeder_bus
    line_name = Column(String(100), nullable=False)
    station_id = Column(String(100), nullable=True)
    severity = Column(String(20), default="moderate")       # low, moderate, high
    delay_minutes = Column(Integer, default=0)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class JourneyRecord(Base):
    __tablename__ = "journey_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    origin_name = Column(String(255), nullable=False)
    destination_name = Column(String(255), nullable=False)
    travel_mode_summary = Column(String(255), nullable=False)  # e.g. "Metro -> Water Metro -> Walk"
    total_duration_min = Column(Float, nullable=False)
    total_fare_inr = Column(Float, nullable=False)
    co2_saved_kg = Column(Float, default=0.0)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="journeys")


class MLModelMetric(Base):
    __tablename__ = "ml_model_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_name = Column(String(100), unique=True, nullable=False)  # travel_time, delay_predictor, waiting_time
    algorithm = Column(String(100), nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    r2_score = Column(Float, nullable=False)
    training_samples = Column(Integer, default=0)
    feature_importances = Column(Text, default="{}")               # JSON string: {"feature": importance}
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
