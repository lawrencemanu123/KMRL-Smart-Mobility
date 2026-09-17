"""Seed initial stations, lines, metrics, and default accounts into database."""
import os
import sys
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, SessionLocal, User, UserPreference, Station, RouteLine, MLModelMetric
from app.routing.graph import METRO_STATIONS, WATER_METRO_TERMINALS, BUS_STOPS
from app.api.auth import hash_password
from app.ml.predictor import METRICS_PATH

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def seed_database():
    print("Seeding KMLR database...")

    # 1. Seed default Admin User if not exists
    admin = db.query(User).filter(User.email == "admin@kmlr.kerala.gov.in").first()
    if not admin:
        admin = User(
            email="admin@kmlr.kerala.gov.in",
            hashed_password=hash_password("Admin@123"),
            full_name="KMRL Transit Administrator",
            is_active=True,
            is_admin=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        db.add(UserPreference(user_id=admin.id, preference_profile="fastest"))
        db.commit()
        print("Created default admin user: admin@kmlr.kerala.gov.in")

    # 2. Seed Stations
    count_stations = 0
    all_stations_raw = (
        [(s, "metro", "Blue Line") for s in METRO_STATIONS] +
        [(w, "water_metro", "Water Metro") for w in WATER_METRO_TERMINALS] +
        [(b, "feeder_bus", "Feeder Network") for b in BUS_STOPS]
    )

    for st_data, mode, line in all_stations_raw:
        st_id = st_data["id"]
        existing = db.query(Station).filter(Station.id == st_id).first()
        if not existing:
            st = Station(
                id=st_id,
                name=st_data["name"],
                mode=mode,
                latitude=st_data["lat"],
                longitude=st_data["lon"],
                line_name=line,
                is_terminal=st_data.get("is_terminal", False),
                facilities=json.dumps({"smart_ticketing": True, "wheelchair_ramp": True})
            )
            db.add(st)
            count_stations += 1

    db.commit()
    print(f"Seeded {count_stations} transit stations & terminals.")

    # 3. Seed ML Metrics
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            metrics_data = json.load(f)

        for mod_key, mod_info in metrics_data.items():
            existing = db.query(MLModelMetric).filter(MLModelMetric.model_name == mod_key).first()
            if not existing:
                metric_row = MLModelMetric(
                    model_name=mod_key,
                    algorithm=mod_info["algorithm"],
                    mae=mod_info["mae"],
                    rmse=mod_info["rmse"],
                    r2_score=mod_info["r2_score"],
                    training_samples=mod_info.get("training_samples", 15000),
                    feature_importances=json.dumps(mod_info.get("feature_importances", {}))
                )
                db.add(metric_row)
        db.commit()
        print("Seeded ML evaluation metrics into database.")


if __name__ == "__main__":
    seed_database()
