import heapq

def optimize_schedule(cases, courts):

    heap = []

    for case in cases:
        heapq.heappush(
            heap,
            (-case["priority_score"], case["case_id"], case)
        )

    court_state = {}

    for court in courts:
        court_state[court["court_id"]] = {
            **court,
            "remaining_capacity": court["capacity"]
        }

    recommendations = []

    while heap:

        _, _, case = heapq.heappop(heap)

        compatible_courts = []

        for court in court_state.values():

            if court["remaining_capacity"] <= 0:
                continue

            # Optional compatibility check
            supported_types = court.get("supported_types", [])

            if supported_types and case.get("case_type") not in supported_types:
                continue

            compatible_courts.append(court)

        if not compatible_courts:
            recommendations.append({
                "case_id": case["case_id"],
                "priority": case["priority_score"],
                "recommended_court": None,
                "reason": "No compatible court with available capacity"
            })
            continue


        selected = min(
            compatible_courts,
            key=lambda c: c["current_load"] / c["capacity"]
        )

        selected["remaining_capacity"] -= 1

        recommendations.append({
            "case_id": case["case_id"],
            "priority": case["priority_score"],
            "priority_band": case["priority_band"],
            "recommended_court": selected["court_id"],
            "reason": (
                f"Priority {case['priority_score']}; "
                f"{selected['court_id']} has the lowest workload "
                f"among compatible courts."
            )
        })

    return recommendations