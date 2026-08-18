"""
app.py
------
FastAPI entrypoint for NyayaFlow.

Run with:
    uvicorn app:app --reload

Endpoints:
    GET  /                         -> health check
    POST /refresh                  -> rebuild feature table
    GET  /workload                 -> workload scores for all districts
    GET  /workload/{district}      -> workload details for one district
    GET  /resource-reallocation    -> civil/criminal pressure + what-if results
    GET  /imbalance                -> intra + inter district imbalance report
    POST /priority/rank            -> rank a batch of cases
    POST /simulate                 -> run a what-if intervention

The API layer is intentionally thin.
All data processing and decision-support logic lives inside src/.
"""

from typing import List, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.data_processing.feature_engineering import build_features

# IMPORTANT:
# Actual function in workload_score.py is calculate_workload_score
from src.workload.workload_score import calculate_workload_score

from src.workload.imbalance import full_imbalance_report
from src.workload.resource_reallocation import build_reallocation_report

from src.priority.priority_score import Case, PriorityListingEngine
from src.simulator.what_if import Intervention, run_simulation
from src.delay.delay_predictor import predict_delay_risk_band


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="NyayaFlow API",
    description=(
        "AI judicial backlog intelligence & "
        "court resource optimization (SIH 2026)"
    ),
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# FEATURE CACHE
# ============================================================

_features_cache = None


def get_features():
    """
    Load and cache the processed feature table.

    The feature table is rebuilt only when:
    - the server starts for the first request
    - /refresh is called
    """

    global _features_cache

    if _features_cache is None:
        _features_cache = build_features()

    return _features_cache


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "NyayaFlow API",
        "version": "0.1.0"
    }


# ============================================================
# REFRESH FEATURES
# ============================================================

@app.post("/refresh")
def refresh_features():
    """
    Rebuild the feature table from the raw data.

    Use this after changing files inside data/raw/.
    """

    global _features_cache

    try:
        _features_cache = build_features()

        return {
            "status": "refreshed",
            "rows": len(_features_cache),
            "columns": len(_features_cache.columns)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Feature generation failed: {str(e)}"
        )


# ============================================================
# WORKLOAD ANALYSIS
# ============================================================

@app.get("/workload")
def get_workload():
    """
    Return workload scores for all districts.
    """

    try:
        features = get_features()

        scores = calculate_workload_score(features)

        columns = [
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

        # Prevent KeyError if a field is absent
        columns = [
            column
            for column in columns
            if column in scores.columns
        ]

        return scores[columns].to_dict(
            orient="records"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Workload calculation failed: {str(e)}"
        )


# ============================================================
# SINGLE DISTRICT WORKLOAD
# ============================================================

@app.get("/workload/{district}")
def get_district_workload(district: str):
    """
    Return workload information for a single district.

    Example:
        GET /workload/Lucknow
    """

    try:
        features = get_features()

        scores = calculate_workload_score(features)

        district_scores = scores[
            scores["district"]
            .astype(str)
            .str.lower()
            == district.lower()
        ]

        if district_scores.empty:
            raise HTTPException(
                status_code=404,
                detail=f"District '{district}' not found"
            )

        return district_scores.iloc[0].to_dict()

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"District workload calculation failed: {str(e)}"
        )


# ============================================================
# CIVIL / CRIMINAL RESOURCE PRESSURE
# ============================================================

@app.get("/resource-reallocation")
def get_resource_reallocation():
    """
    Return civil-vs-criminal workload pressure and
    What-If resource reallocation results.
    """

    try:
        features = get_features()

        report = build_reallocation_report(features)

        return report.to_dict(
            orient="records"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resource reallocation calculation failed: {str(e)}"
        )


# ============================================================
# IMBALANCE ANALYSIS
# ============================================================

@app.get("/imbalance")
def get_imbalance():
    """
    Return intra-district and inter-district imbalance report.
    """

    try:
        features = get_features()

        scores = calculate_workload_score(features)

        return full_imbalance_report(
            features,
            scores
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Imbalance calculation failed: {str(e)}"
        )


# ============================================================
# DELAY PREDICTION (teammate's module, wired in-process)
# ============================================================

class DelayPredictIn(BaseModel):
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


@app.post("/predict/delay")
def predict_delay(req: DelayPredictIn):
    """
    Run the delay-prediction ANN for a single case.

    Returns predicted_delay_days plus a delay_risk_band
    (low/medium/high) that can be fed straight into
    /priority/rank as a case's delay_risk_band field.
    """

    try:
        return predict_delay_risk_band(req.model_dump())

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Delay prediction failed: {str(e)}"
        )


# ============================================================
# PRIORITY CASE LISTING
# ============================================================

class CaseIn(BaseModel):
    case_id: str
    district: str

    case_type: Literal[
        "civil",
        "criminal"
    ]

    case_age_years: float

    is_undertrial: bool = False

    is_women_child_case: bool = False

    delay_risk_band: Literal[
        "low",
        "medium",
        "high"
    ] = "low"

    adjournment_count: int = 0

    is_undated: bool = False


class RankRequest(BaseModel):
    cases: List[CaseIn]

    top_n: int = 10


@app.post("/priority/rank")
def rank_cases(req: RankRequest):
    """
    Rank a batch of cases and return top-N priority cases.
    """

    engine = PriorityListingEngine()

    for case in req.cases:

        engine.push(
            Case(**case.model_dump())
        )

    top = engine.pop_top_n(
        req.top_n
    )

    return [
        {
            "case_id": case.case_id,
            "district": case.district,
            "case_type": case.case_type,
            "priority_score": case.priority_score,
        }

        for case in top
    ]


# ============================================================
# WHAT-IF SIMULATOR
# ============================================================

class InterventionIn(BaseModel):

    district: str

    action: Literal[
        "add_judges",
        "add_hearing_capacity",
        "reallocate"
    ]

    n_judges: int = 0

    judge_stream: Literal[
        "civil",
        "criminal",
        "both"
    ] = "both"

    extra_daily_capacity: int = 0

    reallocate_n_courts: int = 0

    reallocate_from: Literal[
        "civil",
        "criminal"
    ] = "civil"


@app.post("/simulate")
def simulate(req: InterventionIn):
    """
    Run a What-If intervention for a district.
    """

    features = get_features()

    try:

        intervention = Intervention(
            **req.model_dump()
        )

        result = run_simulation(
            features,
            intervention
        )

        return result

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {str(e)}"
        )