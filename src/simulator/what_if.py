"""
what_if.py
----------
WHAT-IF SIMULATOR — your demo centerpiece.

Takes a district's current workload features and applies a hypothetical
intervention (add judges, add hearing capacity, reallocate resources between
civil/criminal), then projects the resulting workload scores.

This is intentionally a TRANSPARENT, rule-based projection (not a black-box
model) — for a hackathon demo, judges want to see *why* the number moved,
not just that it moved. The projection logic mirrors workload_score.py so
"projected" and "current" scores are directly comparable.
"""

from dataclasses import dataclass
from typing import Literal, Optional

import pandas as pd

from src.workload.workload_score import normalize_series, WEIGHTS

InterventionType = Literal["add_judges", "add_hearing_capacity", "reallocate"]


@dataclass
class Intervention:
    district: str
    action: InterventionType
    # add_judges
    n_judges: int = 0
    judge_stream: Literal["civil", "criminal", "both"] = "both"
    # add_hearing_capacity  (extra cases/day the district can additionally clear)
    extra_daily_capacity: int = 0
    # reallocate  (move N sanctioned courts from one stream to the other)
    reallocate_n_courts: int = 0
    reallocate_from: Literal["civil", "criminal"] = "civil"


def _apply_intervention(row: pd.Series, iv: Intervention) -> pd.Series:
    """Returns a modified copy of the district's feature row after the intervention."""
    new_row = row.copy()

    if iv.action == "add_judges":
        new_row["working_judges"] = row["working_judges"] + iv.n_judges
        if iv.judge_stream in ("civil", "both"):
            new_row["civil_courts"] = row["civil_courts"] + (
                iv.n_judges if iv.judge_stream == "civil" else iv.n_judges // 2
            )
        if iv.judge_stream in ("criminal", "both"):
            new_row["criminal_courts"] = row["criminal_courts"] + (
                iv.n_judges if iv.judge_stream == "criminal" else iv.n_judges - iv.n_judges // 2
            )
        new_row["total_courts"] = new_row["civil_courts"] + new_row["criminal_courts"] + row.get("dual_courts", 0) + row.get("family_courts", 0)

    elif iv.action == "add_hearing_capacity":
        # Modeled as an effective reduction in pendency pressure: extra capacity
        # clears backlog faster, approximated here as a proportional cut to
        # cases_per_court (capped so it can't go negative / unrealistic).
        annual_capacity_gain = iv.extra_daily_capacity * 220  # ~220 working days/year
        new_row["total_pending"] = max(0, row["total_pending"] - annual_capacity_gain)
        # keep civil/criminal split proportional
        civil_share = row["civil_pending"] / max(row["total_pending"], 1)
        new_row["civil_pending"] = round(new_row["total_pending"] * civil_share)
        new_row["criminal_pending"] = new_row["total_pending"] - new_row["civil_pending"]

    elif iv.action == "reallocate":
        n = iv.reallocate_n_courts
        if iv.reallocate_from == "civil":
            new_row["civil_courts"] = max(0, row["civil_courts"] - n)
            new_row["criminal_courts"] = row["criminal_courts"] + n
        else:
            new_row["criminal_courts"] = max(0, row["criminal_courts"] - n)
            new_row["civil_courts"] = row["civil_courts"] + n

    # Recompute the ratios that depend on the fields we just changed
    total_courts = new_row.get("total_courts", row.get("total_courts", 1)) or 1
    working_judges = new_row.get("working_judges", row.get("working_judges", 1)) or 1
    new_row["cases_per_court"] = round(new_row["total_pending"] / total_courts, 1)
    new_row["cases_per_judge"] = round(new_row["total_pending"] / working_judges, 1)

    return new_row


def run_simulation(features: pd.DataFrame, iv: Intervention) -> dict:
    """
    features: full output of feature_engineering.build_features() (all districts)
    iv: the Intervention to apply

    Returns a dict comparing current vs projected state for iv.district only,
    normalized against the REST of the cohort so scores stay comparable.
    """
    if iv.district not in features["district"].values:
        raise ValueError(f"Unknown district: {iv.district}")

    current_row = features.loc[features["district"] == iv.district].iloc[0]
    projected_row = _apply_intervention(current_row, iv)

    # Build a mini cohort: every other district unchanged + this district's
    # before/after, so normalization is meaningful.
    others = features[features["district"] != iv.district].copy()
    before_df = pd.concat([others, current_row.to_frame().T], ignore_index=True)
    after_df = pd.concat([others, projected_row.to_frame().T], ignore_index=True)

    for df in (before_df, after_df):
        for col in ("total_pending", "cases_per_court", "cases_per_judge",
                     "civil_pending", "criminal_pending"):
            df[col] = pd.to_numeric(df[col], errors="coerce")

    before_score = _score_single_district(before_df, iv.district)
    after_score = _score_single_district(after_df, iv.district)

    return {
        "district": iv.district,
        "intervention": iv.__dict__,
        "before": before_score,
        "after": after_score,
        "delta": {
            "overall_workload_score": round(after_score["overall_workload_score"] - before_score["overall_workload_score"], 1),
            "cases_per_court": round(projected_row["cases_per_court"] - current_row["cases_per_court"], 1),
            "cases_per_judge": round(projected_row["cases_per_judge"] - current_row["cases_per_judge"], 1),
            "total_pending": int(projected_row["total_pending"] - current_row["total_pending"]),
        },
    }


def _score_single_district(df: pd.DataFrame, district: str) -> dict:
    """Lightweight reuse of the workload scoring logic for a cohort DataFrame."""
    pendency_pressure = _normalize(df["cases_per_court"])
    age_share = df["old_cases_est"] / df["total_pending"].replace(0, 1) if "old_cases_est" in df.columns else pd.Series([0] * len(df))
    age_severity = _normalize(age_share)
    capacity_strain = _normalize(df["cases_per_judge"])

    overall = (
        DEFAULT_WEIGHTS["pendency_pressure"] * pendency_pressure
        + DEFAULT_WEIGHTS["age_severity"] * age_severity
        + DEFAULT_WEIGHTS["capacity_strain"] * capacity_strain
    )

    idx = df.index[df["district"] == district][0]
    return {
        "cases_per_court": round(df.loc[idx, "cases_per_court"], 1),
        "cases_per_judge": round(df.loc[idx, "cases_per_judge"], 1),
        "total_pending": int(df.loc[idx, "total_pending"]),
        "overall_workload_score": round(overall.loc[idx], 1),
    }


if __name__ == "__main__":
    from src.data_processing.feature_engineering import build_features

    features = build_features()

    # Example: what if GBN got +5 criminal judges?
    iv = Intervention(district="Gautam Buddha Nagar", action="add_judges",
                       n_judges=5, judge_stream="criminal")
    result = run_simulation(features, iv)

    print(f"Intervention: +{iv.n_judges} {iv.judge_stream} judges in {iv.district}")
    print(f"  Before: {result['before']}")
    print(f"  After:  {result['after']}")
    print(f"  Delta:  {result['delta']}")
