"""Train, evaluate, and serialize machine learning models for KMLR:
1. Travel Time Predictor (Gradient Boosting Regressor)
2. Service Delay Predictor (Gradient Boosting Regressor)
3. Station Waiting Time Predictor (Random Forest Regressor)

Calculates evaluation metrics (MAE, RMSE, R²) and feature importances,
saving serialized model pipelines to backend/app/ml/models/
"""
import os
import sys
import json

sys.path.append(os.path.dirname(__file__))

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from generate_datasets import generate_dataset, OUTPUT_CSV


MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "ml", "models"))
os.makedirs(MODELS_DIR, exist_ok=True)
METRICS_JSON = os.path.join(MODELS_DIR, "metrics.json")


def train_all_models():
    # 1. Ensure dataset exists
    if not os.path.exists(OUTPUT_CSV):
        print("Dataset not found. Generating synthetic transit data...")
        df = generate_dataset()
    else:
        df = pd.read_csv(OUTPUT_CSV)

    print(f"Loaded dataset with {len(df)} samples.")
    metrics_summary = {}

    # -------------------------------------------------------------
    # MODEL 1: TRAVEL TIME PREDICTOR
    # -------------------------------------------------------------
    print("\n--- Training Model 1: Travel Time Predictor ---")
    cat_features_tt = ["mode", "weather"]
    num_features_tt = ["distance_km", "hour_of_day", "day_of_week", "is_weekend", "is_peak_hour", "traffic_level"]
    X_tt = df[cat_features_tt + num_features_tt]
    y_tt = df["actual_travel_time_min"]

    X_train_tt, X_test_tt, y_train_tt, y_test_tt = train_test_split(X_tt, y_tt, test_size=0.2, random_state=42)

    preprocessor_tt = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features_tt),
            ("num", "passthrough", num_features_tt)
        ]
    )

    tt_model = GradientBoostingRegressor(n_estimators=120, max_depth=5, random_state=42)
    pipeline_tt = Pipeline([
        ("preprocessor", preprocessor_tt),
        ("regressor", tt_model)
    ])

    pipeline_tt.fit(X_train_tt, y_train_tt)
    preds_tt = pipeline_tt.predict(X_test_tt)

    mae_tt = float(mean_absolute_error(y_test_tt, preds_tt))
    rmse_tt = float(np.sqrt(mean_squared_error(y_test_tt, preds_tt)))
    r2_tt = float(r2_score(y_test_tt, preds_tt))

    # Feature importances
    encoder_features_tt = list(pipeline_tt.named_steps["preprocessor"].named_transformers_["cat"].get_feature_names_out(cat_features_tt))
    all_feature_names_tt = encoder_features_tt + num_features_tt
    importances_tt = pipeline_tt.named_steps["regressor"].feature_importances_
    feat_imp_tt = {name: round(float(imp), 4) for name, imp in zip(all_feature_names_tt, importances_tt)}
    # Sort top 8
    feat_imp_tt = dict(sorted(feat_imp_tt.items(), key=lambda x: x[1], reverse=True)[:8])

    print(f"Travel Time Model Results: MAE={mae_tt:.2f} min, RMSE={rmse_tt:.2f} min, R²={r2_tt:.4f}")
    joblib.dump(pipeline_tt, os.path.join(MODELS_DIR, "travel_time_pipeline.joblib"))

    metrics_summary["travel_time"] = {
        "model_name": "Travel Time Predictor",
        "algorithm": "Gradient Boosting Regressor",
        "mae": round(mae_tt, 2),
        "rmse": round(rmse_tt, 2),
        "r2_score": round(r2_tt, 4),
        "training_samples": len(X_train_tt),
        "feature_importances": feat_imp_tt
    }

    # -------------------------------------------------------------
    # MODEL 2: SERVICE DELAY PREDICTOR
    # -------------------------------------------------------------
    print("\n--- Training Model 2: Service Delay Predictor ---")
    cat_features_delay = ["mode", "weather"]
    num_features_delay = ["distance_km", "hour_of_day", "day_of_week", "traffic_level", "passenger_density", "upstream_delay_min"]
    X_delay = df[cat_features_delay + num_features_delay]
    y_delay = df["delay_minutes"]

    X_train_dl, X_test_dl, y_train_dl, y_test_dl = train_test_split(X_delay, y_delay, test_size=0.2, random_state=42)

    preprocessor_delay = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features_delay),
            ("num", "passthrough", num_features_delay)
        ]
    )

    delay_model = GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=42)
    pipeline_delay = Pipeline([
        ("preprocessor", preprocessor_delay),
        ("regressor", delay_model)
    ])

    pipeline_delay.fit(X_train_dl, y_train_dl)
    preds_dl = pipeline_delay.predict(X_test_dl)

    mae_dl = float(mean_absolute_error(y_test_dl, preds_dl))
    rmse_dl = float(np.sqrt(mean_squared_error(y_test_dl, preds_dl)))
    r2_dl = float(r2_score(y_test_dl, preds_dl))

    encoder_features_dl = list(pipeline_delay.named_steps["preprocessor"].named_transformers_["cat"].get_feature_names_out(cat_features_delay))
    all_feature_names_dl = encoder_features_dl + num_features_delay
    importances_dl = pipeline_delay.named_steps["regressor"].feature_importances_
    feat_imp_dl = {name: round(float(imp), 4) for name, imp in zip(all_feature_names_dl, importances_dl)}
    feat_imp_dl = dict(sorted(feat_imp_dl.items(), key=lambda x: x[1], reverse=True)[:8])

    print(f"Delay Model Results: MAE={mae_dl:.2f} min, RMSE={rmse_dl:.2f} min, R²={r2_dl:.4f}")
    joblib.dump(pipeline_delay, os.path.join(MODELS_DIR, "delay_prediction_pipeline.joblib"))

    metrics_summary["delay_prediction"] = {
        "model_name": "Service Delay Predictor",
        "algorithm": "Gradient Boosting Regressor",
        "mae": round(mae_dl, 2),
        "rmse": round(rmse_dl, 2),
        "r2_score": round(r2_dl, 4),
        "training_samples": len(X_train_dl),
        "feature_importances": feat_imp_dl
    }

    # -------------------------------------------------------------
    # MODEL 3: STATION WAITING TIME PREDICTOR
    # -------------------------------------------------------------
    print("\n--- Training Model 3: Waiting Time Predictor ---")
    cat_features_wait = ["mode"]
    num_features_wait = ["scheduled_headway_min", "delay_minutes", "hour_of_day", "passenger_density"]
    X_wait = df[cat_features_wait + num_features_wait]
    y_wait = df["actual_waiting_time_min"]

    X_train_wt, X_test_wt, y_train_wt, y_test_wt = train_test_split(X_wait, y_wait, test_size=0.2, random_state=42)

    preprocessor_wait = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features_wait),
            ("num", "passthrough", num_features_wait)
        ]
    )

    wait_model = RandomForestRegressor(n_estimators=80, max_depth=6, random_state=42)
    pipeline_wait = Pipeline([
        ("preprocessor", preprocessor_wait),
        ("regressor", wait_model)
    ])

    pipeline_wait.fit(X_train_wt, y_train_wt)
    preds_wt = pipeline_wait.predict(X_test_wt)

    mae_wt = float(mean_absolute_error(y_test_wt, preds_wt))
    rmse_wt = float(np.sqrt(mean_squared_error(y_test_wt, preds_wt)))
    r2_wt = float(r2_score(y_test_wt, preds_wt))

    encoder_features_wt = list(pipeline_wait.named_steps["preprocessor"].named_transformers_["cat"].get_feature_names_out(cat_features_wait))
    all_feature_names_wt = encoder_features_wt + num_features_wait
    importances_wt = pipeline_wait.named_steps["regressor"].feature_importances_
    feat_imp_wt = {name: round(float(imp), 4) for name, imp in zip(all_feature_names_wt, importances_wt)}
    feat_imp_wt = dict(sorted(feat_imp_wt.items(), key=lambda x: x[1], reverse=True)[:8])

    print(f"Waiting Time Model Results: MAE={mae_wt:.2f} min, RMSE={rmse_wt:.2f} min, R²={r2_wt:.4f}")
    joblib.dump(pipeline_wait, os.path.join(MODELS_DIR, "waiting_time_pipeline.joblib"))

    metrics_summary["waiting_time"] = {
        "model_name": "Station Waiting Time Predictor",
        "algorithm": "Random Forest Regressor",
        "mae": round(mae_wt, 2),
        "rmse": round(rmse_wt, 2),
        "r2_score": round(r2_wt, 4),
        "training_samples": len(X_train_wt),
        "feature_importances": feat_imp_wt
    }

    # 4. Save metrics JSON
    with open(METRICS_JSON, "w") as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"\nAll models trained and saved to {MODELS_DIR}. Metrics saved to {METRICS_JSON}.")


if __name__ == "__main__":
    train_all_models()
