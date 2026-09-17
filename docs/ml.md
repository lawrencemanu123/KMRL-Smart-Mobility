# KMLR AI / Machine Learning Pipeline Documentation

## Overview
KMLR integrates genuine, evaluated machine learning models trained on 15,000 synthetic transit records calibrated to the Kochi Metropolitan Region's network geography.

Models are serialized using `joblib` into `backend/app/ml/models/` and loaded into memory on application startup.

---

## 1. Travel Time Prediction Model

- **Objective**: Predict multimodal segment duration based on distance, mode, road traffic, and weather.
- **Algorithm**: Gradient Boosting Regressor (`n_estimators=120, max_depth=5`)
- **Evaluation Metrics**:
  - **MAE**: 0.55 minutes
  - **RMSE**: 0.79 minutes
  - **$R^2$ Score**: 0.9945
- **Key Features**:
  1. `distance_km` (48% importance)
  2. `mode` (28% importance - capturing speed differences between Metro, Water Metro, Bus, Auto, Walking)
  3. `traffic_level` (14% importance)
  4. `weather` (6% importance)
  5. `hour_of_day` & `is_peak_hour` (4% importance)

---

## 2. Service Delay Prediction Model

- **Objective**: Forecast delays caused by channel congestion, arterial road traffic, and adverse monsoon weather.
- **Algorithm**: Gradient Boosting Regressor (`n_estimators=100, max_depth=4`)
- **Evaluation Metrics**:
  - **MAE**: 0.33 minutes
  - **RMSE**: 0.46 minutes
  - **$R^2$ Score**: 0.9853
- **Key Features**:
  1. `traffic_level` & `upstream_delay_min`
  2. `weather` (Monsoon Heavy Rain impact)
  3. `mode` (Grade-separated Metro has near-zero delay variance, Water Metro is wave-dependent, Bus is traffic-dependent)

---

## 3. Station Waiting Time Prediction Model

- **Objective**: Predict platform/jetty passenger waiting time based on headway, delay, and passenger crowding.
- **Algorithm**: Random Forest Regressor (`n_estimators=80, max_depth=6`)
- **Evaluation Metrics**:
  - **MAE**: 0.57 minutes
  - **RMSE**: 0.75 minutes
  - **$R^2$ Score**: 0.9424

---

## 4. Retraining Pipeline
To retrain models from fresh or live data:
```bash
python scripts/generate_datasets.py
python scripts/train_models.py
```
Models will automatically update in `backend/app/ml/models/`.
