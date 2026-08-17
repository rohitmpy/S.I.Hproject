import { useState } from "react";

import CaseForm from "./components/CaseForm";
import CaseTable from "./components/CaseTable";
import CourtForm from "./components/CourtForm";
import RecommendationTable from "./components/RecommendationTable";

import "./App.css";

function App() {
  const [cases, setCases] = useState([]);
  const [courts, setCourts] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const addCase = (newCase) => {
    setCases((prev) => [...prev, newCase]);
  };

  const removeCase = (caseId) => {
    setCases((prev) =>
      prev.filter((item) => item.case_id !== caseId)
    );
  };

  const addCourt = (newCourt) => {
    setCourts((prev) => [...prev, newCourt]);
  };

  const removeCourt = (courtId) => {
    setCourts((prev) =>
      prev.filter((item) => item.court_id !== courtId)
    );
  };

  const optimizeCases = async () => {
    if (cases.length === 0) {
      alert("Please add at least one case.");
      return;
    }

    if (courts.length === 0) {
      alert("Please add at least one court.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/optimize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cases,
            courts,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Backend error");
      }

      const data = await response.json();

      setResult(data);

    } catch (error) {
      console.error(error);

      alert(
        "Backend connection failed. Make sure FastAPI is running."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      <header className="header">
        <div>
          <h1>NyayaFlow</h1>
          <p>
            AI Judicial Backlog Intelligence &
            Resource Optimization
          </p>
        </div>

        <div className="header-badge">
          Decision Support System
        </div>
      </header>

      <main className="container">

        <section className="hero">
          <h2>Case Listing Optimization</h2>

          <p>
            Prioritize cases based on age, delay risk,
            vulnerability and stage, then generate
            capacity-aware recommendations.
          </p>
        </section>

        <div className="grid">

          <section className="card">

            <div className="section-title">
              <h2>Add Case</h2>
              <span>Module C</span>
            </div>

            <CaseForm onAdd={addCase} />

          </section>

          <section className="card">

            <div className="section-title">
              <h2>Add Court</h2>
              <span>Module D</span>
            </div>

            <CourtForm onAdd={addCourt} />

          </section>

        </div>

        <section className="card">

          <div className="section-title">
            <h2>Cases</h2>
            <span>{cases.length} cases</span>
          </div>

          <CaseTable
            cases={cases}
            onRemove={removeCase}
          />

        </section>

        <section className="card">

          <div className="section-title">
            <h2>Courts</h2>
            <span>{courts.length} courts</span>
          </div>

          {courts.length === 0 ? (
            <p className="empty">
              No courts added yet.
            </p>
          ) : (
            courts.map((court) => (
              <div className="court-item" key={court.court_id}>

                <div>
                  <strong>{court.court_id}</strong>

                  <p>
                    Capacity: {court.capacity}
                    <br />
                    Current Load: {court.current_load}%
                  </p>
                </div>

                <button
                  className="delete-btn"
                  onClick={() =>
                    removeCourt(court.court_id)
                  }
                >
                  Remove
                </button>

              </div>
            ))
          )}

        </section>

        <button
          className="optimize-btn"
          onClick={optimizeCases}
          disabled={loading}
        >
          {loading
            ? "Optimizing..."
            : "Generate Recommended Listing"}
        </button>

        {result && (
          <>
            <section className="card">

              <div className="section-title">
                <h2>Priority Analysis</h2>
                <span>Module C</span>
              </div>

              <CaseTable
                cases={result.prioritized_cases}
                showPriority
              />

            </section>

            <section className="card">

              <div className="section-title">
                <h2>Recommended Listing</h2>
                <span>Module D</span>
              </div>

              <RecommendationTable
                recommendations={result.recommendations}
              />

            </section>
          </>
        )}

      </main>

      <footer>
        NyayaFlow • AI-assisted judicial decision support
      </footer>

    </div>
  );
}

export default App;