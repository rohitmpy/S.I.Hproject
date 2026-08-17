"""
imbalance.py
------------
IMBALANCE DETECTOR from your architecture diagram.

Two kinds of imbalance NyayaFlow cares about:

1. INTRA-district imbalance: within one district, is the civil workload
   score wildly different from the criminal workload score? (e.g. criminal
   courts are drowning while civil courts are comparatively fine)

2. INTER-district imbalance: across your 3 (or more) districts, is one
   district carrying a disproportionate cases-per-judge burden compared to
   the rest? This is what would justify a resource-reallocation recommendation.

Both return a simple severity label so the frontend / demo can color-code
districts red/yellow/green without re-deriving thresholds.
"""

import pandas as pd

# Severity thresholds — tune these after you see real numbers on demo day.
INTRA_IMBALANCE_THRESHOLD = 20     # civil vs criminal score gap (points, 0-100 scale)
INTER_IMBALANCE_THRESHOLD = 1.5    # ratio vs cohort median cases_per_judge


def detect_intra_district_imbalance(workload_scores: pd.DataFrame) -> pd.DataFrame:
    """
    Input: output of workload_score.compute_workload_scores()
    Output: adds `civil_criminal_gap` and `intra_imbalance_flag`
    """
    out = workload_scores.copy()
    out["civil_criminal_gap"] = (
        out["criminal_workload_score"] - out["civil_workload_score"]
    ).round(1)

    def label(gap):
        if abs(gap) < INTRA_IMBALANCE_THRESHOLD:
            return "balanced"
        return "criminal-heavy" if gap > 0 else "civil-heavy"

    out["intra_imbalance_flag"] = out["civil_criminal_gap"].apply(label)
    return out


def detect_inter_district_imbalance(features: pd.DataFrame) -> pd.DataFrame:
    """
    Input: output of feature_engineering.build_features()
    Output: per-district ratio of cases_per_judge against the cohort median,
    flagged as understaffed / overstaffed / normal.
    """
    out = features[["district", "cases_per_judge", "working_judges", "total_pending"]].copy()
    median = out["cases_per_judge"].median()
    out["cases_per_judge_ratio_to_median"] = (out["cases_per_judge"] / median).round(2)

    def label(ratio):
        if ratio >= INTER_IMBALANCE_THRESHOLD:
            return "understaffed (high priority for reallocation)"
        if ratio <= 1 / INTER_IMBALANCE_THRESHOLD:
            return "comparatively well-staffed"
        return "normal"

    out["staffing_flag"] = out["cases_per_judge_ratio_to_median"].apply(label)
    return out.sort_values("cases_per_judge_ratio_to_median", ascending=False).reset_index(drop=True)


def full_imbalance_report(features: pd.DataFrame, workload_scores: pd.DataFrame) -> dict:
    """Convenience wrapper returning both reports together for the API layer."""
    return {
        "intra_district": detect_intra_district_imbalance(workload_scores).to_dict(orient="records"),
        "inter_district": detect_inter_district_imbalance(features).to_dict(orient="records"),
    }


if __name__ == "__main__":
    from src.data_processing.feature_engineering import build_features
    from src.workload.workload_score import compute_workload_scores

    features = build_features()
    scores = compute_workload_scores(features)

    print("=== Intra-district (civil vs criminal) ===")
    print(detect_intra_district_imbalance(scores).to_string(index=False))

    print("\n=== Inter-district (staffing) ===")
    print(detect_inter_district_imbalance(features).to_string(index=False))
