"""
clean_data.py
--------------
Loads all raw NyayaFlow CSVs, validates them, normalizes district names,
and returns clean pandas DataFrames ready for feature engineering.

Usage:
    from src.data_processing.clean_data import load_all_raw

    data = load_all_raw()
    data["pendency"], data["age_wise"], data["capacity"], data["resources"]
"""

import os
import pandas as pd

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw")

# Canonical district names used everywhere downstream.
# Add new districts here as you expand the dataset.
DISTRICT_ALIASES = {
    "gautam buddha nagar": "Gautam Buddha Nagar",
    "gautam budh nagar": "Gautam Buddha Nagar",
    "gbnagar": "Gautam Buddha Nagar",
    "ghaziabad": "Ghaziabad",
    "lucknow": "Lucknow",
}


def _normalize_district(name: str) -> str:
    key = str(name).strip().lower()
    return DISTRICT_ALIASES.get(key, str(name).strip())


def _read_csv(filename: str) -> pd.DataFrame:
    path = os.path.join(RAW_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Expected raw file not found: {path}\n"
            f"Make sure {filename} is in data/raw/"
        )
    df = pd.read_csv(path)
    if "district" in df.columns:
        df["district"] = df["district"].apply(_normalize_district)
    return df


def load_pendency() -> pd.DataFrame:
    """court_pendency_data.csv — civil/criminal pending, instituted, disposed etc."""
    df = _read_csv("court_pendency_data.csv")
    numeric_cols = [c for c in df.columns if c not in ("date", "state", "district")]
    for c in numeric_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    _assert_no_negatives(df, numeric_cols, "court_pendency_data.csv")
    return df


def load_age_wise() -> pd.DataFrame:
    """age_wise_pendency_data.csv — % of pending cases by age bracket, civil/criminal split."""
    df = _read_csv("age_wise_pendency_data.csv")
    pct_cols = [c for c in df.columns if c.endswith("_pct")]
    for c in pct_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    _assert_pct_range(df, pct_cols, "age_wise_pendency_data.csv")
    return df


def load_capacity() -> pd.DataFrame:
    """court_capacity.csv — sanctioned courts by type (civil/criminal/dual/family)."""
    df = _read_csv("court_capacity.csv")
    numeric_cols = ["total_courts", "civil_courts", "criminal_courts", "dual_courts", "family_courts"]
    for c in numeric_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def load_judicial_resource() -> pd.DataFrame:
    """judicial_resource.csv — sanctioned/working judges, vacancies."""
    df = _read_csv("judicial_resource.csv")
    numeric_cols = ["sanctioned_judges", "working_judges", "vacant_posts", "support_staff_est"]
    for c in numeric_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def _assert_no_negatives(df: pd.DataFrame, cols: list, source: str) -> None:
    for c in cols:
        if (df[c] < 0).any():
            bad = df.loc[df[c] < 0, "district"].tolist()
            raise ValueError(f"[{source}] Negative values found in '{c}' for: {bad}")


def _assert_pct_range(df: pd.DataFrame, cols: list, source: str) -> None:
    for c in cols:
        out_of_range = df[(df[c] < 0) | (df[c] > 100)]
        if not out_of_range.empty:
            bad = out_of_range["district"].tolist()
            raise ValueError(f"[{source}] '{c}' outside 0-100 range for: {bad}")


def load_all_raw() -> dict:
    """Load and validate every raw dataset in one call."""
    return {
        "pendency": load_pendency(),
        "age_wise": load_age_wise(),
        "capacity": load_capacity(),
        "resources": load_judicial_resource(),
    }


if __name__ == "__main__":
    data = load_all_raw()
    for name, df in data.items():
        print(f"\n=== {name} ({len(df)} rows) ===")
        print(df.head())
