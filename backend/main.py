from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "NyayaFlow API is running"}


@app.post("/optimize")
def optimize(data: dict):
    cases = data.get("cases", [])
    courts = data.get("courts", [])

    # Temporary test response
    prioritized_cases = []

    for case in cases:
        case_copy = case.copy()

        # Temporary priority calculation
        score = (
            case.get("case_age_years", 0) * 10
            + case.get("urgency", 0) * 10
        )

        case_copy["priority_score"] = round(score, 2)

        if score >= 70:
            case_copy["priority_band"] = "CRITICAL"
        elif score >= 40:
            case_copy["priority_band"] = "HIGH"
        else:
            case_copy["priority_band"] = "MEDIUM"

        prioritized_cases.append(case_copy)

    recommendations = []

    for i, case in enumerate(prioritized_cases):

        court = courts[i % len(courts)]

        recommendations.append({
            "case_id": case["case_id"],
            "priority": case["priority_score"],
            "priority_band": case["priority_band"],
            "recommended_court": court["court_id"],
            "reason": "Assigned based on priority and court availability."
        })

    return {
        "prioritized_cases": prioritized_cases,
        "recommendations": recommendations
    }