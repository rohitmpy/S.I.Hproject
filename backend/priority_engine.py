def age_score(age):
    if age < 1:
        return 1
    elif age < 3:
        return 2
    elif age < 5:
        return 3
    elif age < 10:
        return 4
    return 5


def delay_risk_score(risk):
    scores = {
        "LOW": 1,
        "MODERATE": 2,
        "HIGH": 4,
        "SEVERE": 5
    }
    return scores.get(risk.upper(), 1)


def stage_score(stage):
    scores = {
        "FILING": 1,
        "PRELIMINARY": 2,
        "EVIDENCE": 3,
        "ARGUMENT": 4,
        "FINAL_HEARING": 5
    }
    return scores.get(stage.upper(), 1)


def vulnerability_score(case):
    score = 0

    if case.get("undertrial", False):
        score += 5

    if case.get("senior_citizen", False):
        score += 3

    if case.get("women_related", False):
        score += 2

    return min(score, 5)


def calculate_priority(case):

    age = age_score(case["case_age_years"])
    risk = delay_risk_score(case["delay_risk"])
    vulnerability = vulnerability_score(case)
    stage = stage_score(case["stage"])
    urgency = case.get("urgency", 3)

    weighted_score = (
        0.25 * age +
        0.30 * risk +
        0.20 * vulnerability +
        0.15 * stage +
        0.10 * urgency
    )

    priority = round((weighted_score / 5) * 100, 2)

    if priority >= 80:
        band = "CRITICAL"
    elif priority >= 60:
        band = "HIGH"
    elif priority >= 40:
        band = "MEDIUM"
    else:
        band = "LOW"

    return {
        **case,
        "priority_score": priority,
        "priority_band": band
    }


def calculate_priorities(cases):
    return [calculate_priority(case) for case in cases]