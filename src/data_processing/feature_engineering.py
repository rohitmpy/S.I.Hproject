"""
feature_engineering.py
-----------------------
Joins pendency + age-wise + capacity + judicial resource data (all keyed on
`district`) into a single feature table: data/processed/court_workload_features.csv

This is the ONE file every downstream module (workload, imbalance, priority,
simulator) should read from. Nothing downstream should touch data/raw/ directly.

Usage:
    python -m src.data_processing.feature_engineering
    # or
    from src.data_processing.feature_engineering import build_features
    df = build_features()
"""

import os
import pandas as pd

from src.data_processing.clean_data import load_all_raw
from src.workload.resource_reallocation import add_stream_pressure_features
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")
OUTPUT_PATH = os.path.join(PROCESSED_DIR, "court_workload_features.csv")

AGE_BUCKETS = ["less_1yr", "1_3yr", "3_5yr", "5_10yr", "above_10yr"]


def _derive_age_bucket_counts(row: pd.Series) -> dict:
    """
    Convert age-wise % columns into estimated absolute counts using total_pending.

    NJDG displays rounded percentages, so the five age percentages may sum to
    slightly more or less than 100%. We normalize them ONLY for deriving
    estimated counts.

    These are DERIVED ESTIMATES, not official NJDG case counts.
    """
    out = {}
    total = row["total_pending"]

    bucket_pct_map = {
        "less_1yr": "age_less_1yr_pct",
        "1_3yr": "age_1_3yr_pct",
        "3_5yr": "age_3_5yr_pct",
        "5_10yr": "age_5_10yr_pct",
        "above_10yr": "age_above_10yr_pct",
    }

    # ---------------------------------------------------------
    # 1. Read the five age percentages
    # ---------------------------------------------------------
    age_percentages = {}

    for bucket, pct_col in bucket_pct_map.items():
        value = row.get(pct_col, 0)

        if pd.isna(value):
            value = 0

        age_percentages[bucket] = float(value)

    # ---------------------------------------------------------
    # 2. Normalize because NJDG percentages are rounded
    # ---------------------------------------------------------
    percentage_sum = sum(age_percentages.values())

    if percentage_sum > 0:
        normalized_percentages = {
            bucket: pct / percentage_sum
            for bucket, pct in age_percentages.items()
        }
    else:
        normalized_percentages = {
            bucket: 0
            for bucket in age_percentages
        }

    # ---------------------------------------------------------
    # 3. Convert normalized percentages into estimated counts
    # ---------------------------------------------------------
    for bucket, pct_col in bucket_pct_map.items():

        bucket_total = round(
            total * normalized_percentages[bucket]
        )

        civil_share = row.get(f"civil_{bucket}_pct", 0)

        if pd.isna(civil_share):
            civil_share = 0

        criminal_share = row.get(f"criminal_{bucket}_pct", 0)

        if pd.isna(criminal_share):
            criminal_share = 0

        civil_share /= 100.0
        criminal_share /= 100.0

        out[f"{bucket}_total_est"] = bucket_total

        out[f"{bucket}_civil_est"] = round(
            bucket_total * civil_share
        )

        out[f"{bucket}_criminal_est"] = round(
            bucket_total * criminal_share
        )

    # ---------------------------------------------------------
    # 4. Important age-derived indicators
    # ---------------------------------------------------------
    out["old_cases_est"] = (
        out["5_10yr_total_est"]
        + out["above_10yr_total_est"]
    )

    out["critical_cases_est"] = (
        out["above_10yr_total_est"]
    )

    return out

def _derive_capacity_features(row: pd.Series) -> dict:
    """Cases-per-court / cases-per-judge ratios — core inputs for imbalance + priority scoring."""
    out = {}
    total_courts = row.get("total_courts", 0) or 1  # avoid div by zero
    working_judges = row.get("working_judges", 0) or 1

    out["cases_per_court"] = round(row["total_pending"] / total_courts, 1)
    out["cases_per_judge"] = round(row["total_pending"] / working_judges, 1)
    out["criminal_courts_share_pct"] = round(
        100 * row.get("criminal_courts", 0) / total_courts, 1
    )
    out["civil_courts_share_pct"] = round(
        100 * row.get("civil_courts", 0) / total_courts, 1
    )
    return out


def build_features() -> pd.DataFrame:
    raw = load_all_raw()
    pendency = raw["pendency"]
    age_wise = raw["age_wise"]
    capacity = raw["capacity"]
    resources = raw["resources"]

    # 1. Join pendency + age-wise on district (drop duplicate date/state cols from age_wise)
    age_wise_cols = [c for c in age_wise.columns if c not in ("date", "state")]
    df = pendency.merge(age_wise[age_wise_cols], on="district", how="left")

    # 2. Join capacity + judicial resources on district
    df = df.merge(capacity, on="district", how="left")
    df = df.merge(resources, on="district", how="left", suffixes=("", "_res"))

    # 3. Derive age-bucket estimated counts
    age_features = df.apply(_derive_age_bucket_counts, axis=1, result_type="expand")
    df = pd.concat([df, age_features], axis=1)

    # 4. Derive capacity ratios
    capacity_features = df.apply(_derive_capacity_features, axis=1, result_type="expand")
    df = pd.concat([df, capacity_features], axis=1)

    # 5. Add civil-vs-criminal resource pressure features.
    # These are prototype analytics based on the supplied court-capacity data.
    df = add_stream_pressure_features(df)
   
    # 6. Reorder: identity columns first
    id_cols = ["date", "state", "district"]
    other_cols = [c for c in df.columns if c not in id_cols]
    df = df[id_cols + other_cols]

    return df


def save_features(df: pd.DataFrame) -> str:
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    return OUTPUT_PATH


if __name__ == "__main__":
    features = build_features()
    path = save_features(features)
    print(f"Saved {len(features)} rows x {len(features.columns)} cols -> {path}")
    print(features[["district", "total_pending", "cases_per_court", "cases_per_judge",
                     "old_cases_est", "critical_cases_est"]])
