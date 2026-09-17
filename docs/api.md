# KMLR REST API Reference

The KMLR Backend exposes interactive OpenAPI/Swagger documentation at `http://localhost:8000/docs`.

---

## 1. Routing & Journey Planning

### `POST /api/routes/search`
Computes $k$-diverse multimodal routes ranked according to passenger preference.

**Request Body:**
```json
{
  "origin_id": "METRO_ALUVA",
  "destination_id": "WATER_FORT_KOCHI",
  "preference": "fastest",
  "max_walking_meters": 1500,
  "avoid_modes": []
}
```

**Response:**
```json
{
  "origin": "Aluva",
  "destination": "Fort Kochi Water Metro",
  "preference_applied": "fastest",
  "routes": [
    {
      "total_duration_min": 53.0,
      "walking_time_min": 0.0,
      "waiting_time_min": 7.5,
      "total_fare_inr": 113.9,
      "transfers_count": 2,
      "co2_saved_kg": 2.45,
      "legs": [
        {
          "mode": "metro",
          "line": "Kochi Metro Line 1",
          "from_station_name": "Aluva",
          "to_station_name": "M.G. Road",
          "duration_min": 36.5
        },
        {
          "mode": "auto",
          "line": "MG Road - High Court Auto",
          "from_station_name": "M.G. Road",
          "to_station_name": "High Court Water Metro",
          "duration_min": 4.0
        },
        {
          "mode": "water_metro",
          "line": "High Court - Fort Kochi",
          "from_station_name": "High Court Water Metro",
          "to_station_name": "Fort Kochi Water Metro",
          "duration_min": 18.0
        }
      ],
      "recommendation_badges": [
        "Scenic & Zero Road Congestion via Water Metro",
        "High Reliability via Kochi Metro",
        "Rapid Transit"
      ]
    }
  ]
}
```

---

### `POST /api/routes/reroute`
Evaluates ongoing passenger journey against live disruptions and provides immediate alternatives.

**Request:**
```json
{
  "current_station_id": "METRO_MG_ROAD",
  "destination_id": "WATER_FORT_KOCHI",
  "preference": "fastest"
}
```

---

## 2. Stations & Terminals

- `GET /api/stations`: Returns all 48 transit nodes with coordinates, lines, and mode.
- `GET /api/stations/{id}`: Detailed metadata, upcoming departures, and wait time.

---

## 3. Real-Time Status & Simulation

- `GET /api/live/status`: Network-wide line statuses, delays, and alerts.
- `POST /api/live/simulate/water-metro-delay?delay_minutes=12`: Injects 12-minute delay into Water Metro.
- `POST /api/live/simulate/bus-delay?delay_minutes=15`: Injects feeder bus road traffic delay.
- `POST /api/live/simulate/reset`: Resets all simulated disruptions to on-time.

---

## 4. Machine Learning Inferences

- `POST /api/predict/travel-time`: ML travel time prediction.
- `POST /api/predict/delay`: Service delay duration & probability.
- `POST /api/predict/waiting-time`: Station platform waiting time.
- `GET /api/predict/metrics`: Model evaluation statistics (MAE, RMSE, $R^2$, Feature Importances).
