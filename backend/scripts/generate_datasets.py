"""Synthetic Dataset Generator for KMLR (Kochi Metropolitan Transit).

NOTE: This dataset represents realistically modeled Demo / Synthetic Data
calibrated to Kochi's geographic scale, station layout, and operational parameters.
Real-world KMRL / Kochi Water Metro telemetry can directly replace this pipeline.
"""
import os
import random
import numpy as np
import pandas as pd

# Set fixed seed for reproducibility
np.random.seed(42)
random.seed(42)

DATASET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
os.makedirs(DATASET_DIR, exist_ok=True)
OUTPUT_CSV = os.path.join(DATASET_DIR, "kochi_transit_synthetic.csv")

SAMPLE_SIZE = 15000

# Transit Modes and Characteristics
MODES = ["metro", "water_metro", "feeder_bus", "auto", "walking"]
MODE_PROBS = [0.40, 0.22, 0.22, 0.10, 0.06]

WEATHER_CONDITIONS = ["Clear", "Moderate Rain", "Monsoon Heavy Rain"]
WEATHER_PROBS = [0.65, 0.25, 0.10]

SAMPLE_ROUTES = [
    ("METRO_ALUVA", "METRO_EDAPPALLY", "metro", 8.2),
    ("METRO_EDAPPALLY", "METRO_KALOOR", "metro", 4.1),
    ("METRO_KALOOR", "METRO_MG_ROAD", "metro", 2.2),
    ("METRO_MG_ROAD", "METRO_VYTTILA", "metro", 4.8),
    ("METRO_VYTTILA", "METRO_THRIPUNITHURA", "metro", 5.1),
    ("WATER_HIGH_COURT", "WATER_VYPIN", "water_metro", 3.8),
    ("WATER_HIGH_COURT", "WATER_FORT_KOCHI", "water_metro", 4.3),
    ("WATER_HIGH_COURT", "WATER_BOLGATTY", "water_metro", 1.4),
    ("WATER_VYTTILA", "WATER_KAKKANAD", "water_metro", 9.4),
    ("WATER_SOUTH_CHITTOOR", "WATER_CHERANALLOOR", "water_metro", 2.6),
    ("METRO_EDAPPALLY", "BUS_AMRITA_HOSPITAL", "feeder_bus", 1.8),
    ("METRO_MG_ROAD", "WATER_HIGH_COURT", "feeder_bus", 1.1),
    ("BUS_VYTTILA_HUB_BAY1", "BUS_KAKKANAD_CIVIL", "feeder_bus", 6.8),
    ("BUS_FORT_KOCHI_STAND", "BUS_MATTANCHERRY_BAZAAR", "feeder_bus", 1.8),
    ("BUS_THOPPUMPADY", "METRO_ERNAKULAM_SOUTH", "feeder_bus", 5.2),
    ("METRO_MG_ROAD", "WATER_HIGH_COURT", "auto", 1.1),
    ("METRO_VYTTILA", "WATER_VYTTILA", "walking", 0.25),
    ("WATER_FORT_KOCHI", "BUS_FORT_KOCHI_STAND", "walking", 0.35),
]


def generate_dataset():
    records = []

    for i in range(SAMPLE_SIZE):
        # Pick route or randomize mode
        if random.random() < 0.85:
            origin, dest, mode, base_dist = random.choice(SAMPLE_ROUTES)
            distance_km = round(max(0.2, base_dist + np.random.normal(0, 0.1)), 2)
        else:
            mode = np.random.choice(MODES, p=MODE_PROBS)
            distance_km = round(random.uniform(0.5, 12.0), 2)
            origin = f"ORIGIN_{random.randint(1, 20)}"
            dest = f"DEST_{random.randint(1, 20)}"

        hour = random.randint(5, 23)
        day_of_week = random.randint(0, 6)
        is_weekend = 1 if day_of_week >= 5 else 0
        is_peak_hour = 1 if ((8 <= hour <= 10) or (17 <= hour <= 20)) else 0
        weather = np.random.choice(WEATHER_CONDITIONS, p=WEATHER_PROBS)

        # Base traffic severity (1=Free, 2=Moderate, 3=Heavy, 4=Severe)
        if is_peak_hour:
            traffic_level = np.random.choice([2, 3, 4], p=[0.2, 0.5, 0.3])
        else:
            traffic_level = np.random.choice([1, 2, 3], p=[0.6, 0.3, 0.1])

        # Mode-specific parameters
        if mode == "metro":
            base_speed_kmh = 34.0
            scheduled_headway = 7.0
            weather_impact = 0.5 if weather == "Monsoon Heavy Rain" else 0.0
            traffic_impact = 0.0  # Grade-separated metro unaffected by road traffic
            delay_scale = 1.2 if is_peak_hour else 0.4
            delay_min = max(0.0, np.random.exponential(scale=delay_scale) - 0.2 + weather_impact)

        elif mode == "water_metro":
            base_speed_kmh = 20.0  # ~11 knots electric catamarans
            scheduled_headway = 15.0
            weather_impact = 4.0 if weather == "Monsoon Heavy Rain" else (1.5 if weather == "Moderate Rain" else 0.0)
            traffic_impact = 0.5 if is_peak_hour else 0.0  # ferry channel congestion
            delay_scale = 2.5 if is_peak_hour else 1.0
            delay_min = max(0.0, np.random.exponential(scale=delay_scale) + weather_impact + traffic_impact)

        elif mode == "feeder_bus":
            base_speed_kmh = 19.0
            scheduled_headway = 12.0
            weather_impact = 3.5 if weather == "Monsoon Heavy Rain" else (1.0 if weather == "Moderate Rain" else 0.0)
            traffic_impact = (traffic_level - 1) * 3.0  # directly tied to city roads
            delay_scale = 4.0 if is_peak_hour else 1.5
            delay_min = max(0.0, np.random.exponential(scale=delay_scale) + weather_impact + traffic_impact)

        elif mode == "auto":
            base_speed_kmh = 24.0
            scheduled_headway = 2.0  # on-demand at auto stand
            weather_impact = 2.0 if weather == "Monsoon Heavy Rain" else 0.5
            traffic_impact = (traffic_level - 1) * 2.2
            delay_min = max(0.0, weather_impact + traffic_impact + np.random.normal(0, 0.8))

        else:  # walking
            base_speed_kmh = 4.5
            scheduled_headway = 0.0
            weather_impact = 1.0 if weather != "Clear" else 0.0
            traffic_impact = 0.0
            delay_min = 0.0

        # Compute travel time
        raw_travel_time = (distance_km / base_speed_kmh) * 60.0
        # Add small operational noise
        actual_travel_time = round(max(1.0, raw_travel_time + (delay_min * 0.4) + np.random.normal(0, 0.4)), 1)
        delay_minutes = round(max(0.0, delay_min), 1)

        # Compute actual waiting time
        if scheduled_headway > 0:
            expected_wait = scheduled_headway / 2.0
            actual_wait = round(max(0.5, expected_wait + (delay_minutes * 0.3) + np.random.normal(0, 0.8)), 1)
        else:
            actual_wait = 0.0

        # Passenger crowding index (0.1 to 1.0)
        passenger_density = round(min(1.0, 0.3 + (0.4 if is_peak_hour else 0.0) + (0.2 if weather != "Clear" else 0.0) + np.random.uniform(-0.1, 0.1)), 2)

        # Fare calculation
        if mode == "metro":
            fare = 10.0 + min(50.0, distance_km * 2.2)
        elif mode == "water_metro":
            fare = 20.0 if distance_km < 5.0 else 30.0
        elif mode == "feeder_bus":
            fare = 10.0 + min(25.0, distance_km * 1.8)
        elif mode == "auto":
            fare = 30.0 + max(0.0, (distance_km - 1.5) * 15.0)
        else:
            fare = 0.0

        records.append({
            "trip_id": f"TRIP_{i+1:06d}",
            "origin_id": origin,
            "destination_id": dest,
            "mode": mode,
            "distance_km": distance_km,
            "hour_of_day": hour,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "is_peak_hour": is_peak_hour,
            "weather": weather,
            "traffic_level": traffic_level,
            "scheduled_headway_min": scheduled_headway,
            "passenger_density": passenger_density,
            "upstream_delay_min": round(max(0.0, delay_min * 0.5 + np.random.normal(0, 0.3)), 1),
            "actual_travel_time_min": actual_travel_time,
            "delay_minutes": delay_minutes,
            "actual_waiting_time_min": actual_wait,
            "fare_inr": round(fare, 1),
            "dataset_label": "Demo / Synthetic Data"
        })

    df = pd.DataFrame(records)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Successfully generated {len(df)} synthetic transit records at {OUTPUT_CSV}")
    return df


if __name__ == "__main__":
    generate_dataset()
