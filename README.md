# NyayaFlow

AI judicial backlog intelligence & court resource optimization system.
Built for Smart India Hackathon 2026.

## Pipeline

```
NJDG DATA (pendency, age-wise, court capacity)
        │
        ▼
data/raw/*.csv  ──────────────►  src/data_processing/clean_data.py
                                          │  (load + validate)
                                          ▼
                                  feature_engineering.py
                                          │  (join + derive)
                                          ▼
                        data/processed/court_workload_features.csv
                                          │
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
          src/workload/            src/priority/         src/simulator/
          workload_score.py        priority_score.py     what_if.py
          imbalance.py             (max-heap engine)      (interventions)
                     │                    │                    │
                     └────────────────────┴────────────────────┘
                                          │
                                        app.py (FastAPI)
```

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run the pipeline standalone (no API)

```bash
python3 -m src.data_processing.feature_engineering   # builds data/processed/court_workload_features.csv
python3 -m src.workload.workload_score               # prints per-district scores
python3 -m src.workload.imbalance                     # prints imbalance report
python3 -m src.priority.priority_score                # demo of the max-heap engine
python3 -m src.simulator.what_if                      # demo what-if intervention
```

## Run the API

```bash
uvicorn app:app --reload
```

Then visit `http://127.0.0.1:8000/docs` for interactive Swagger UI.

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | health check |
| `/workload` | GET | workload scores for all districts |
| `/imbalance` | GET | intra-district (civil vs criminal) + inter-district (staffing) imbalance |
| `/priority/rank` | POST | submit a batch of cases, get back the top-N ranked by priority |
| `/simulate` | POST | run a what-if intervention (add judges / hearing capacity / reallocate) and see projected impact |
| `/refresh` | POST | rebuild feature table after updating raw CSVs |

## Data files (data/raw/)

- **court_pendency_data.csv** — civil/criminal pending, instituted, disposed, listed, undated, excessive-dated (from NJDG dashboard)
- **age_wise_pendency_data.csv** — % of pending cases by age bracket, with civil/criminal split within each bracket
- **court_capacity.csv** — sanctioned courts per district by type (civil/criminal/dual/family), sourced from Allahabad HC + eCourts India
- **judicial_resource.csv** — sanctioned/working judges and estimated vacancies

**Important:** all `_est` and `_pct`-derived count columns in `court_workload_features.csv`
are DERIVED ESTIMATES computed from rounded NJDG dashboard percentages, not official
exact NJDG counts. Keep them labeled as such in any report or slide.

## Design decisions (carried through the whole pipeline)

1. **Recommendation-only.** `priority_score.py` ranks cases; it never assigns
   a judge or auto-schedules a hearing. A human always makes the final call.
2. **Risk bands over point predictions.** `delay_risk_band` (low/medium/high)
   feeds the priority score — plug your XGBoost delay-prediction module's
   output in here once it's ready.
3. **NJDG-API-independent.** Everything here runs off static CSVs derived
   from the Zenodo dataset + manually verified capacity data, so the whole
   demo works offline without hitting the live NJDG API.

## Extending to more districts

1. Add a row to each `data/raw/*.csv` file for the new district.
2. Add any name variants to `DISTRICT_ALIASES` in `clean_data.py`.
3. Run `python3 -m src.data_processing.feature_engineering` to rebuild.
Everything downstream (workload, imbalance, simulator) picks it up automatically.
