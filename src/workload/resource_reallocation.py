"""
resource_reallocation.py
------------------------
Civil-vs-criminal workload pressure analysis for NyayaFlow.

This module provides:
1. Civil vs Criminal pressure calculation
2. Explainable workload recommendation
3. What-if resource reallocation simulation
4. Automatic testing of 0, 1 and 2 resource movements
5. Selection of the safest useful scenario

IMPORTANT:
This is a prototype decision-support simulation.
It does NOT automatically recommend or perform judicial transfers.
"""

import math
import pandas as pd


# ============================================================
# PROTOTYPE THRESHOLDS
# ============================================================

# These are demo thresholds, NOT official NJDG thresholds.

RECOMMENDATION_GAP = 0.15
STRONG_GAP = 0.30

MAX_SIMULATION_MOVES = 2

# A movement is considered useful only if criminal pressure
# improves by at least this percentage.
MIN_CRIMINAL_REDUCTION_PCT = 2.0

# We don't want civil pressure to increase excessively.
MAX_ACCEPTABLE_CIVIL_INCREASE_PCT = 20.0


# ============================================================
# 1. CIVIL / CRIMINAL PRESSURE FEATURES
# ============================================================

def add_stream_pressure_features(features: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate civil/criminal workload share, capacity share
    and pressure indexes.
    """

    out = features.copy()

    stream_total = (
        out["civil_courts"] + out["criminal_courts"]
    ).replace(0, 1)

    pending_total = (
        out["civil_pending"] + out["criminal_pending"]
    )

    # --------------------------------------------------------
    # Pending workload shares
    # --------------------------------------------------------

    out["civil_pending_share"] = (
        out["civil_pending"]
        / pending_total.replace(0, 1)
    ).round(4)

    out["criminal_pending_share"] = (
        out["criminal_pending"]
        / pending_total.replace(0, 1)
    ).round(4)

    # --------------------------------------------------------
    # Capacity shares
    # --------------------------------------------------------

    out["civil_capacity_share"] = (
        out["civil_courts"]
        / stream_total
    ).round(4)

    out["criminal_capacity_share"] = (
        out["criminal_courts"]
        / stream_total
    ).round(4)

    # --------------------------------------------------------
    # Pressure index
    #
    # > 1  = workload share is greater than capacity share
    # < 1  = relatively lower pressure
    # --------------------------------------------------------

    out["civil_pressure_index"] = (
        out["civil_pending_share"]
        / out["civil_capacity_share"].replace(0, 1)
    ).round(3)

    out["criminal_pressure_index"] = (
        out["criminal_pending_share"]
        / out["criminal_capacity_share"].replace(0, 1)
    ).round(3)

    # --------------------------------------------------------
    # Criminal / Civil pressure ratio
    # --------------------------------------------------------

    out["criminal_vs_civil_pressure_ratio"] = (
        out["criminal_pressure_index"]
        / out["civil_pressure_index"].replace(0, 1)
    ).round(3)

    # --------------------------------------------------------
    # Disposal rates
    # --------------------------------------------------------

    out["civil_disposal_rate"] = (
        out["disposed_civil"]
        / out["civil_pending"].replace(0, 1)
    ).round(4)

    out["criminal_disposal_rate"] = (
        out["disposed_criminal"]
        / out["criminal_pending"].replace(0, 1)
    ).round(4)

    # Positive value means criminal side has more pressure.
    out["criminal_civil_pressure_gap"] = (
        out["criminal_pressure_index"]
        - out["civil_pressure_index"]
    ).round(3)

    return out


# ============================================================
# 2. BASIC WORKLOAD RECOMMENDATION
# ============================================================

def recommend_reallocation(row: pd.Series) -> dict:
    """
    Decide whether the district has enough imbalance
    to test a resource reallocation scenario.

    IMPORTANT:
    This function does NOT blindly select 2 resources.

    It tests:
        1 resource
        2 resources

    and chooses the best SAFE scenario.
    """

    gap = float(row["criminal_civil_pressure_gap"])

    civil_courts = int(row["civil_courts"])

    # --------------------------------------------------------
    # No significant imbalance
    # --------------------------------------------------------

    if gap < RECOMMENDATION_GAP:

        return {
            "status": "NO_REALLOCATION_SIGNAL",
            "candidate_resources": 0,
            "message": (
                "Civil and Criminal workload pressure is "
                "not sufficiently imbalanced for reallocation."
            )
        }

    # --------------------------------------------------------
    # No civil capacity
    # --------------------------------------------------------

    if civil_courts <= 0:

        return {
            "status": "NO_CIVIL_CAPACITY",
            "candidate_resources": 0,
            "message": (
                "No civil-side capacity is available "
                "for simulation."
            )
        }

    # --------------------------------------------------------
    # Test possible resource movements
    # --------------------------------------------------------

    max_resources = min(
        MAX_SIMULATION_MOVES,
        civil_courts
    )

    scenarios = []

    for resources in range(1, max_resources + 1):

        simulation = simulate_reallocation(
            row,
            resources
        )

        criminal_reduction = simulation[
            "criminal_pressure_reduction_pct"
        ]

        civil_increase = simulation[
            "civil_pressure_increase_pct"
        ]

        scenarios.append({
            "resources": resources,
            "criminal_reduction": criminal_reduction,
            "civil_increase": civil_increase,
            "simulation": simulation
        })

    # --------------------------------------------------------
    # Find SAFE scenarios
    #
    # Criminal pressure must improve >= 5%
    # Civil pressure must increase <= 20%
    # --------------------------------------------------------

    safe_scenarios = [
        s for s in scenarios
        if (
            s["criminal_reduction"]
            >= MIN_CRIMINAL_REDUCTION_PCT
            and
            s["civil_increase"]
            <= MAX_ACCEPTABLE_CIVIL_INCREASE_PCT
        )
    ]

    # --------------------------------------------------------
    # SAFE scenario found
    # --------------------------------------------------------

    if safe_scenarios:

        best = max(
            safe_scenarios,
            key=lambda x: x["criminal_reduction"]
        )

        resources = best["resources"]

        if gap >= STRONG_GAP:
            status = "STRONG_SIGNAL"
        else:
            status = "MODERATE_SIGNAL"

        return {
            "status": status,
            "candidate_resources": resources,
            "message": (
                f"Simulate {resources} civil-side resource(s) "
                f"toward criminal workload. "
                f"Expected criminal pressure reduction: "
                f"{best['criminal_reduction']:.2f}%. "
                f"Expected civil pressure increase: "
                f"{best['civil_increase']:.2f}%. "
                f"Scenario passes prototype safety thresholds."
            )
        }

    # --------------------------------------------------------
    # No SAFE scenario
    # --------------------------------------------------------

    best_tradeoff = max(
        scenarios,
        key=lambda x: x["criminal_reduction"]
    )

    return {
        "status": "TRADEOFF_WARNING",
        "candidate_resources": 0,
        "message": (
            f"Resource movement may reduce criminal pressure, "
            f"but available scenarios create an excessive "
            f"civil-side pressure increase. "
            f"Best tested scenario was "
            f"{best_tradeoff['resources']} resource(s), "
            f"with {best_tradeoff['criminal_reduction']:.2f}% "
            f"criminal pressure reduction and "
            f"{best_tradeoff['civil_increase']:.2f}% "
            f"civil pressure increase. "
            f"No reallocation selected."
        )
    }


# ============================================================
# 3. WHAT-IF RESOURCE SIMULATION
# ============================================================

def simulate_reallocation(
    row: pd.Series,
    resources: int
) -> dict:
    """
    Simulate moving civil-side court capacity
    toward criminal-side capacity.

    This is a WHAT-IF simulation.

    It does NOT represent an actual judicial transfer.
    """

    civil_courts_before = float(
        row["civil_courts"]
    )

    criminal_courts_before = float(
        row["criminal_courts"]
    )

    # Cannot move more resources than available.
    resources = min(
        resources,
        int(civil_courts_before)
    )

    # --------------------------------------------------------
    # BEFORE
    # --------------------------------------------------------

    civil_pressure_before = float(
        row["civil_pressure_index"]
    )

    criminal_pressure_before = float(
        row["criminal_pressure_index"]
    )

    # --------------------------------------------------------
    # AFTER RESOURCE MOVEMENT
    # --------------------------------------------------------

    civil_courts_after = (
        civil_courts_before - resources
    )

    criminal_courts_after = (
        criminal_courts_before + resources
    )

    # Total capacity stays constant.
    total_capacity_after = (
        civil_courts_after
        + criminal_courts_after
    )

    # --------------------------------------------------------
    # Workload shares remain unchanged.
    #
    # We are only changing capacity in this prototype.
    # --------------------------------------------------------

    total_pending = (
        float(row["civil_pending"])
        + float(row["criminal_pending"])
    )

    if total_pending > 0:

        civil_pending_share = (
            float(row["civil_pending"])
            / total_pending
        )

        criminal_pending_share = (
            float(row["criminal_pending"])
            / total_pending
        )

    else:

        civil_pending_share = 0
        criminal_pending_share = 0

    # --------------------------------------------------------
    # New capacity shares
    # --------------------------------------------------------

    if total_capacity_after > 0:

        civil_capacity_share_after = (
            civil_courts_after
            / total_capacity_after
        )

        criminal_capacity_share_after = (
            criminal_courts_after
            / total_capacity_after
        )

    else:

        civil_capacity_share_after = 0
        criminal_capacity_share_after = 0

    # --------------------------------------------------------
    # New pressure
    # --------------------------------------------------------

    if civil_capacity_share_after > 0:

        civil_pressure_after = (
            civil_pending_share
            / civil_capacity_share_after
        )

    else:

        civil_pressure_after = math.inf

    if criminal_capacity_share_after > 0:

        criminal_pressure_after = (
            criminal_pending_share
            / criminal_capacity_share_after
        )

    else:

        criminal_pressure_after = math.inf

    # --------------------------------------------------------
    # Absolute pressure changes
    # --------------------------------------------------------

    criminal_pressure_change = (
        criminal_pressure_before
        - criminal_pressure_after
    )

    civil_pressure_change = (
        civil_pressure_after
        - civil_pressure_before
    )

    # --------------------------------------------------------
    # Percentage impact
    # --------------------------------------------------------

    if criminal_pressure_before != 0:

        criminal_pressure_reduction_pct = (
            (
                criminal_pressure_before
                - criminal_pressure_after
            )
            / criminal_pressure_before
        ) * 100

    else:

        criminal_pressure_reduction_pct = 0.0

    if civil_pressure_before != 0:

        civil_pressure_increase_pct = (
            (
                civil_pressure_after
                - civil_pressure_before
            )
            / civil_pressure_before
        ) * 100

    else:

        civil_pressure_increase_pct = 0.0

    return {

        "resources_moved": resources,

        # Capacity
        "civil_courts_before": civil_courts_before,
        "criminal_courts_before": criminal_courts_before,

        "civil_courts_after": civil_courts_after,
        "criminal_courts_after": criminal_courts_after,

        # Pressure BEFORE
        "civil_pressure_before": round(
            civil_pressure_before,
            3
        ),

        "criminal_pressure_before": round(
            criminal_pressure_before,
            3
        ),

        # Pressure AFTER
        "civil_pressure_after": round(
            civil_pressure_after,
            3
        ),

        "criminal_pressure_after": round(
            criminal_pressure_after,
            3
        ),

        # Absolute change
        "criminal_pressure_change": round(
            criminal_pressure_change,
            3
        ),

        "civil_pressure_change": round(
            civil_pressure_change,
            3
        ),

        # Percentage change
        "criminal_pressure_reduction_pct": round(
            criminal_pressure_reduction_pct,
            2
        ),

        "civil_pressure_increase_pct": round(
            civil_pressure_increase_pct,
            2
        ),
    }


# ============================================================
# 4. BUILD FINAL REALLOCATION REPORT
# ============================================================

def build_reallocation_report(
    features: pd.DataFrame
) -> pd.DataFrame:
    """
    Create district-level resource reallocation report.
    """

    # --------------------------------------------------------
    # Pressure features
    # --------------------------------------------------------

    out = add_stream_pressure_features(
        features
    )

    # --------------------------------------------------------
    # Recommendation
    #
    # This now automatically tests 1 and 2 resources.
    # --------------------------------------------------------

    recommendations = out.apply(
        recommend_reallocation,
        axis=1,
        result_type="expand"
    )

    out = pd.concat(
        [
            out,
            recommendations
        ],
        axis=1
    )

    # --------------------------------------------------------
    # Run the selected scenario.
    #
    # If no safe scenario exists,
    # candidate_resources = 0.
    # --------------------------------------------------------

    simulations = out.apply(
        lambda row: simulate_reallocation(
            row,
            int(row["candidate_resources"])
        ),
        axis=1,
        result_type="expand"
    )

    out = pd.concat(
        [
            out,
            simulations
        ],
        axis=1
    )

    # --------------------------------------------------------
    # Final columns
    # --------------------------------------------------------

    columns = [

        "district",

        # Workload
        "civil_pending",
        "criminal_pending",

        # Capacity
        "civil_courts",
        "criminal_courts",
        "dual_courts",

        # Shares
        "civil_pending_share",
        "criminal_pending_share",

        "civil_capacity_share",
        "criminal_capacity_share",

        # Pressure
        "civil_pressure_index",
        "criminal_pressure_index",

        "criminal_vs_civil_pressure_ratio",
        "criminal_civil_pressure_gap",

        # Disposal
        "civil_disposal_rate",
        "criminal_disposal_rate",

        # Recommendation
        "status",
        "candidate_resources",
        "message",

        # Simulation
        "resources_moved",

        "civil_courts_before",
        "criminal_courts_before",

        "civil_courts_after",
        "criminal_courts_after",

        "civil_pressure_before",
        "criminal_pressure_before",

        "civil_pressure_after",
        "criminal_pressure_after",

        "criminal_pressure_change",
        "civil_pressure_change",

        "criminal_pressure_reduction_pct",
        "civil_pressure_increase_pct",
    ]

    return (
        out[columns]
        .sort_values(
            "criminal_civil_pressure_gap",
            ascending=False
        )
        .reset_index(drop=True)
    )


# ============================================================
# 5. WORKLOAD CLASSIFICATION
# ============================================================

def generate_workload_recommendation(
    row: pd.Series
) -> dict:
    """
    Generate explainable Civil vs Criminal workload status.

    This is a prototype decision-support rule.
    """

    civil_pressure = float(
        row["civil_pressure_index"]
    )

    criminal_pressure = float(
        row["criminal_pressure_index"]
    )

    pressure_ratio = float(
        row["criminal_vs_civil_pressure_ratio"]
    )

    if (
        pressure_ratio >= 3.0
        and criminal_pressure >= 1.0
    ):

        status = "HIGH_CRIMINAL_PRESSURE"

        recommendation = (
            "Criminal workload is significantly higher "
            "than Civil workload. Review eligible "
            "judicial resources for temporary/additional "
            "allocation toward Criminal workload."
        )

    elif pressure_ratio >= 1.5:

        status = "MODERATE_CRIMINAL_PRESSURE"

        recommendation = (
            "Criminal workload is moderately higher "
            "than Civil workload. Consider workload "
            "balancing and review available resources."
        )

    elif pressure_ratio <= 0.67:

        status = "HIGH_CIVIL_PRESSURE"

        recommendation = (
            "Civil workload is significantly higher "
            "than Criminal workload. Review eligible "
            "judicial resources for allocation toward Civil workload."
        )

    else:

        status = "BALANCED"

        recommendation = (
            "Civil and Criminal workloads are relatively "
            "balanced. No major resource reallocation "
            "is indicated."
        )

    return {
        "workload_status": status,
        "workload_recommendation": recommendation,
    }


def add_workload_recommendations(
    df: pd.DataFrame
) -> pd.DataFrame:
    """
    Add workload status and recommendation columns.
    """

    recommendations = df.apply(
        generate_workload_recommendation,
        axis=1
    )

    recommendation_df = pd.DataFrame(
        recommendations.tolist(),
        index=df.index
    )

    df = df.copy()

    df["workload_status"] = (
        recommendation_df["workload_status"]
    )

    df["workload_recommendation"] = (
        recommendation_df["workload_recommendation"]
    )

    return df


# ============================================================
# 6. TEST MODULE
# ============================================================

if __name__ == "__main__":

    from src.data_processing.feature_engineering import (
        build_features
    )

    features = build_features()

    report = build_reallocation_report(
        features
    )

    print("\n========== NYAYAFLOW RESOURCE REALLOCATION ==========\n")

    display_columns = [
        "district",
        "civil_pressure_index",
        "criminal_pressure_index",
        "criminal_vs_civil_pressure_ratio",
        "status",
        "candidate_resources",
        "resources_moved",
        "civil_pressure_after",
        "criminal_pressure_after",
        "criminal_pressure_reduction_pct",
        "civil_pressure_increase_pct",
    ]

    print(
        report[display_columns].to_string(index=False)
    )