"""
delay_predictor.py
-------------------
Wraps the delay-prediction ANN (built by teammate) so the rest of the
app can call one function instead of spinning up a second server.

Loads the model + preprocessing objects ONCE at import time (module-level
globals), not per-request — loading a Keras model on every call would be
far too slow for an API.

IMPORTANT FIX vs the original standalone main.py:
The original FastAPI endpoint declared every categorical field as `str`
in the Pydantic model, then looked values up directly in `category_maps`.
But category_maps keys are actually numpy int64 / float64 for 7 of the
10 columns (state_code, dist_code, court_no, female_adv_def,
female_adv_pet, type_name, purpose_name) — only judge_position,
female_defendant and female_petitioner use string keys. A str value like
"1" never equals np.int64(1) in a dict lookup, so those 7 columns were
silently falling back to the "unknown" encoding (0) on every request,
regardless of what was actually sent in. This version detects each
column's real key type from the loaded map and casts the incoming value
to match before doing the lookup.
"""

import os
import numpy as np
import pandas as pd
import joblib
import tensorflow as tf

_ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")

_MODEL = None
_SCALER = None
_CATEGORY_MAPS = None

CATEGORICAL_COLS = [
    "state_code",
    "dist_code",
    "court_no",
    "judge_position",
    "female_defendant",
    "female_petitioner",
    "female_adv_def",
    "female_adv_pet",
    "type_name",
    "purpose_name",
]

# Bucket thresholds for predicted delay (in days).
# NOTE: these are placeholder defaults (~6 months / ~1 year).
# Re-check against the actual training-label distribution in
# JupyterProject/model.ipynb and tighten these before the final demo.
LOW_MAX_DAYS = 180
MEDIUM_MAX_DAYS = 365


def _load_artifacts():
    global _MODEL, _SCALER, _CATEGORY_MAPS

    if _MODEL is None:
        _MODEL = tf.keras.models.load_model(
            os.path.join(_ARTIFACT_DIR, "case_delay_model.keras")
        )
        _SCALER = joblib.load(
            os.path.join(_ARTIFACT_DIR, "numeric_scaler.pkl")
        )
        _CATEGORY_MAPS = joblib.load(
            os.path.join(_ARTIFACT_DIR, "category_maps.pkl")
        )


def _cast_to_map_key_type(col: str, value):
    """
    Cast an incoming value to whatever type that column's map keys
    actually are, so the lookup can succeed. Falls back to the raw
    value (and therefore to the 'unknown' encoding) if casting fails.
    """
    sample_key = next(iter(_CATEGORY_MAPS[col].keys()))
    key_type = type(sample_key)

    try:
        if np.issubdtype(key_type, np.integer):
            return int(float(value))
        if np.issubdtype(key_type, np.floating):
            return float(value)
        return str(value)
    except (TypeError, ValueError):
        return value


def predict_delay_days(case: dict) -> float:
    """
    case: dict with keys matching CATEGORICAL_COLS plus
          filing_year, filing_month, filing_dayofweek.
    Returns predicted delay in days (float).
    """

    _load_artifacts()

    df = pd.DataFrame([case])

    numeric_features = pd.DataFrame(index=df.index)
    numeric_features["filing_year"] = df["filing_year"]
    numeric_features["month_sin"] = np.sin(2 * np.pi * df["filing_month"] / 12)
    numeric_features["month_cos"] = np.cos(2 * np.pi * df["filing_month"] / 12)
    numeric_features["day_sin"] = np.sin(2 * np.pi * df["filing_dayofweek"] / 7)
    numeric_features["day_cos"] = np.cos(2 * np.pi * df["filing_dayofweek"] / 7)
    numeric_features = _SCALER.transform(numeric_features)

    model_inputs = {}
    for col in CATEGORICAL_COLS:
        raw_value = df[col].iloc[0]
        casted_value = _cast_to_map_key_type(col, raw_value)
        encoded = _CATEGORY_MAPS[col].get(casted_value, 0)
        model_inputs[col] = np.array([encoded], dtype=np.int32)

    model_inputs["numeric_features"] = numeric_features.astype(np.float32)

    pred_log = _MODEL.predict(model_inputs, verbose=0)
    pred_days = float(np.expm1(pred_log.ravel())[0])

    # Model can't predict negative delay; clamp for sanity.
    return max(pred_days, 0.0)


def days_to_risk_band(days: float) -> str:
    if days <= LOW_MAX_DAYS:
        return "low"
    if days <= MEDIUM_MAX_DAYS:
        return "medium"
    return "high"


def predict_delay_risk_band(case: dict) -> dict:
    """Convenience wrapper: returns both the raw prediction and the band
    that src/priority/priority_score.py's Case.delay_risk_band expects."""

    days = predict_delay_days(case)

    return {
        "predicted_delay_days": round(days, 1),
        "delay_risk_band": days_to_risk_band(days),
    }
