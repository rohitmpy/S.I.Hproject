"""
workload_score.py
-----------------
Calculate an explainable 0-100 workload score
for each district in NyayaFlow.

This is a prototype analytical score.
It is NOT an official judicial workload standard.
"""

import pandas as pd
import math


# ============================================================
# WEIGHTS
# ============================================================

# The weights add up to 100.

WEIGHTS = {
    "pending": 25,
    "cases_per_judge": 25,
    "old_cases": 20,
    "critical_cases": 15,
    "pressure": 15,
}


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_series(series: pd.Series) -> pd.Series:
    """
    Convert workload values into a 0-100 relative burden score.

    Uses logarithmic scaling so very large values do not completely
    dominate the score while districts with substantial workload
    still receive an appropriate burden score.
    """

    series = series.astype(float).clip(lower=0)

    log_values = (series + 1).apply(__import__("math").log1p)

    minimum = log_values.min()
    maximum = log_values.max()

    if maximum == minimum:
        return pd.Series(
            50.0,
            index=series.index
        )

    return (
        (log_values - minimum)
        / (maximum - minimum)
        * 100
    )

# ============================================================
# WORKLOAD SCORE
# ============================================================

def calculate_workload_score(
    features: pd.DataFrame
) -> pd.DataFrame:

    df = features.copy()

    # --------------------------------------------------------
    # 1. Pending cases score
    # --------------------------------------------------------

    df["pending_score"] = normalize_series(
        df["total_pending"]
    )

    # --------------------------------------------------------
    # 2. Cases per judge score
    # --------------------------------------------------------

    df["judge_load_score"] = normalize_series(
        df["cases_per_judge"]
    )

    # --------------------------------------------------------
    # 3. Old cases score
    # --------------------------------------------------------

    df["old_cases_score"] = normalize_series(
        df["old_cases_est"]
    )

    # --------------------------------------------------------
    # 4. Critical cases score
    # --------------------------------------------------------

    df["critical_cases_score"] = normalize_series(
        df["critical_cases_est"]
    )

    # --------------------------------------------------------
    # 5. Pressure score
    #
    # Take the higher pressure between Civil and Criminal.
    # --------------------------------------------------------

    df["max_pressure"] = df[
        [
            "civil_pressure_index",
            "criminal_pressure_index",
        ]
    ].max(axis=1)

    df["pressure_score"] = normalize_series(
        df["max_pressure"]
    )

    # --------------------------------------------------------
    # 6. Weighted workload score
    # --------------------------------------------------------

    df["workload_score"] = (
        df["pending_score"]
        * WEIGHTS["pending"]
        / 100

        +

        df["judge_load_score"]
        * WEIGHTS["cases_per_judge"]
        / 100

        +

        df["old_cases_score"]
        * WEIGHTS["old_cases"]
        / 100

        +

        df["critical_cases_score"]
        * WEIGHTS["critical_cases"]
        / 100

        +

        df["pressure_score"]
        * WEIGHTS["pressure"]
        / 100
    )

    df["workload_score"] = (
        df["workload_score"]
        .clip(0, 100)
        .round(2)
    )

    # --------------------------------------------------------
    # 7. Workload level
    # --------------------------------------------------------

    df["workload_level"] = pd.cut(
        df["workload_score"],
        bins=[
            -1,
            40,
            60,
            80,
            100
        ],
        labels=[
            "LOW",
            "MODERATE",
            "HIGH",
            "CRITICAL"
        ]
    )

    # --------------------------------------------------------
    # 8. Rank districts
    # --------------------------------------------------------

    df["workload_rank"] = (
        df["workload_score"]
        .rank(
            ascending=False,
            method="min"
        )
        .astype(int)
    )

    return (
        df.sort_values(
            "workload_score",
            ascending=False
        )
        .reset_index(drop=True)
    )


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    from src.data_processing.feature_engineering import (
        build_features
    )

    features = build_features()

    result = calculate_workload_score(
        features
    )

    print(
        "\n========== NYAYAFLOW WORKLOAD SCORE ==========\n"
    )

    print(
        result[
            [
                "district",
                "total_pending",
                "cases_per_judge",
                "old_cases_est",
                "critical_cases_est",
                "civil_pressure_index",
                "criminal_pressure_index",
                "workload_score",
                "workload_level",
                "workload_rank",
            ]
        ].to_string(index=False)
    )