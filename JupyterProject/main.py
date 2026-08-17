from fastapi import FastAPI
from pydantic import BaseModel
import tensorflow as tf
import pandas as pd
import numpy as np
import joblib


app = FastAPI()


# -----------------------------
# Load model
# -----------------------------

model = tf.keras.models.load_model(
    "case_delay_model.keras"
)


# -----------------------------
# Load preprocessing objects
# -----------------------------

numeric_scaler = joblib.load(
    "numeric_scaler.pkl"
)

category_maps = joblib.load(
    "category_maps.pkl"
)


# -----------------------------
# Categorical columns
# -----------------------------

categorical_cols = [
    "state_code",
    "dist_code",
    "court_no",
    "judge_position",
    "female_defendant",
    "female_petitioner",
    "female_adv_def",
    "female_adv_pet",
    "type_name",
    "purpose_name"
]


# -----------------------------
# Input structure
# -----------------------------

class CaseData(BaseModel):

    state_code: str
    dist_code: str
    court_no: str
    judge_position: str

    female_defendant: str
    female_petitioner: str
    female_adv_def: str
    female_adv_pet: str

    type_name: str
    purpose_name: str

    filing_year: int
    filing_month: int
    filing_dayofweek: int


# -----------------------------
# Prediction route
# -----------------------------

@app.post("/predict")
def predict(data: CaseData):

    # -------------------------
    # Create DataFrame
    # -------------------------

    df = pd.DataFrame([{
        "state_code": data.state_code,
        "dist_code": data.dist_code,
        "court_no": data.court_no,
        "judge_position": data.judge_position,
        "female_defendant": data.female_defendant,
        "female_petitioner": data.female_petitioner,
        "female_adv_def": data.female_adv_def,
        "female_adv_pet": data.female_adv_pet,
        "type_name": data.type_name,
        "purpose_name": data.purpose_name,

        "filing_year": data.filing_year,
        "filing_month": data.filing_month,
        "filing_dayofweek": data.filing_dayofweek
    }])


    # -------------------------
    # Create numeric features
    # -------------------------

    numeric_features = pd.DataFrame(index=df.index)

    numeric_features["filing_year"] = df["filing_year"]

    numeric_features["month_sin"] = np.sin(
        2 * np.pi * df["filing_month"] / 12
    )

    numeric_features["month_cos"] = np.cos(
        2 * np.pi * df["filing_month"] / 12
    )

    numeric_features["day_sin"] = np.sin(
        2 * np.pi * df["filing_dayofweek"] / 7
    )

    numeric_features["day_cos"] = np.cos(
        2 * np.pi * df["filing_dayofweek"] / 7
    )


    # -------------------------
    # Scale numeric features
    # -------------------------

    numeric_features = numeric_scaler.transform(
        numeric_features
    )


    # -------------------------
    # Encode categorical values
    # -------------------------

    categorical_inputs = {}

    for col in categorical_cols:

        value = df[col].iloc[0]

        # Unknown category → 0
        encoded_value = category_maps[col].get(
            value,
            0
        )

        categorical_inputs[col] = np.array(
            [encoded_value],
            dtype=np.int32
        )


    # -------------------------
    # Add numeric input
    # -------------------------

    categorical_inputs["numeric_features"] = (
        numeric_features.astype(np.float32)
    )


    # -------------------------
    # ANN prediction
    # -------------------------

    pred_log = model.predict(
        categorical_inputs,
        verbose=0
    )


    # Your model predicts log(delay + 1)
    pred_days = np.expm1(
        pred_log.ravel()
    )[0]


    # -------------------------
    # Return result
    # -------------------------

    return {
        "predicted_delay_days": float(pred_days)
    }