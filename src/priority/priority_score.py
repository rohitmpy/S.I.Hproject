"""
priority_score.py
------------------
Priority-based case listing engine (your module).

Design: every case gets a priority_score (higher = should be listed sooner).
Cases are pushed into a max-heap so the FastAPI endpoint can pop the top-N
cases to recommend for listing on a given day, per court.

IMPORTANT (per your design decisions): this is RECOMMENDATION-ONLY.
The engine never assigns a judge or auto-schedules a hearing — it just
ranks cases so a human registrar/judge can decide the final cause list.

heapq is a MIN-heap in Python, so we push negated scores to simulate a
max-heap without pulling in a third-party dependency.
"""

import heapq
from dataclasses import dataclass, field
from typing import List, Optional


# --- Scoring weights -------------------------------------------------------
# Tune these against your XGBoost delay-prediction output once Module 1
# (delay prediction) is ready — case_age and predicted_delay_risk_band are
# meant to be filled in from that model's output.

WEIGHTS = {
    "case_age_years": 8.0,       # older cases get pushed up
    "is_undertrial": 25.0,       # undertrial detention cases are urgent (liberty at stake)
    "is_women_child_case": 15.0, # POCSO / crime-against-women fast-track priority
    "delay_risk_band": 10.0,     # 0 (low) / 1 (medium) / 2 (high) from delay-prediction module
    "adjournment_count": 3.0,    # repeatedly adjourned cases get nudged up
    "is_undated": -5.0,          # undated cases need a NEXT date assigned, but shouldn't
                                  # jump the queue ahead of already-listed old cases
}

RISK_BAND_MAP = {"low": 0, "medium": 1, "high": 2}


@dataclass
class Case:
    case_id: str
    district: str
    case_type: str              # "civil" | "criminal"
    case_age_years: float
    is_undertrial: bool = False
    is_women_child_case: bool = False
    delay_risk_band: str = "low"    # comes from the XGBoost delay-prediction module
    adjournment_count: int = 0
    is_undated: bool = False
    priority_score: float = field(init=False, default=0.0)

    def __post_init__(self):
        self.priority_score = self._compute_score()

    def _compute_score(self) -> float:
        risk = RISK_BAND_MAP.get(self.delay_risk_band, 0)
        score = (
            WEIGHTS["case_age_years"] * self.case_age_years
            + WEIGHTS["is_undertrial"] * int(self.is_undertrial)
            + WEIGHTS["is_women_child_case"] * int(self.is_women_child_case)
            + WEIGHTS["delay_risk_band"] * risk
            + WEIGHTS["adjournment_count"] * self.adjournment_count
            + WEIGHTS["is_undated"] * int(self.is_undated)
        )
        return round(score, 2)


class PriorityListingEngine:
    """
    Max-heap based case listing engine.
    Push cases in any order; pop_top_n() returns the N highest-priority
    cases without needing a full sort — O(log n) per push/pop.
    """

    def __init__(self):
        self._heap: List[tuple] = []
        self._counter = 0  # tie-breaker so heapq never compares Case objects directly

    def push(self, case: Case) -> None:
        # negate score -> min-heap behaves like a max-heap
        heapq.heappush(self._heap, (-case.priority_score, self._counter, case))
        self._counter += 1

    def push_many(self, cases: List[Case]) -> None:
        for c in cases:
            self.push(c)

    def pop_top(self) -> Optional[Case]:
        if not self._heap:
            return None
        _, _, case = heapq.heappop(self._heap)
        return case

    def peek_top_n(self, n: int) -> List[Case]:
        """Non-destructive: returns top N without removing them from the heap."""
        return [case for _, _, case in heapq.nsmallest(n, self._heap)]

    def pop_top_n(self, n: int) -> List[Case]:
        """Destructive: pops and removes top N cases (use when actually listing them)."""
        result = []
        for _ in range(min(n, len(self._heap))):
            result.append(self.pop_top())
        return result

    def size(self) -> int:
        return len(self._heap)


if __name__ == "__main__":
    engine = PriorityListingEngine()

    sample_cases = [
        Case("GBN-CR-001", "Gautam Buddha Nagar", "criminal", case_age_years=6.2,
             is_undertrial=True, delay_risk_band="high", adjournment_count=4),
        Case("GBN-CV-014", "Gautam Buddha Nagar", "civil", case_age_years=2.1,
             delay_risk_band="medium", adjournment_count=1),
        Case("GBN-CR-088", "Gautam Buddha Nagar", "criminal", case_age_years=0.4,
             is_women_child_case=True, delay_risk_band="medium"),
        Case("GBN-CV-050", "Gautam Buddha Nagar", "civil", case_age_years=11.0,
             delay_risk_band="high", adjournment_count=9),
    ]
    engine.push_many(sample_cases)

    print("Top 3 cases recommended for next listing:")
    for c in engine.pop_top_n(3):
        print(f"  {c.case_id:12s} score={c.priority_score:7.2f}  age={c.case_age_years}y  "
              f"undertrial={c.is_undertrial}  risk={c.delay_risk_band}")
