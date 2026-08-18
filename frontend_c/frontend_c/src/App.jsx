import React, { useState } from "react";
import NyayaFlowDashboard from "./nyayaflow_dashboard";
import CaseWiseDashboard from "./dashboards/CaseWiseDashboard";

function App() {
  const [section, setSection] = useState("court");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#12161F",
        color: "#F6F3EC",
      }}
    >
      {/* GLOBAL HEADER */}
      <header
        style={{
          padding: "35px 5% 20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 42,
            margin: 0,
          }}
        >
          ⚖ NyayaFlow
        </h1>

        <p
          style={{
            color: "#9BA3B0",
            marginTop: 8,
          }}
        >
          AI-assisted judicial workload and case-level decision support system.
        </p>

        {/* MAIN NAVIGATION */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            gap: 10,
            marginTop: 25,
          }}
        >
          <button
            type="button"
            onClick={() => {
              console.log("COURT WISE CLICKED");
              setSection("court");
            }}
            style={{
              padding: "12px 20px",
              borderRadius: 5,
              border:
                section === "court"
                  ? "1px solid #B8925A"
                  : "1px solid #303746",
              background:
                section === "court"
                  ? "#B8925A"
                  : "#12161F",
              color:
                section === "court"
                  ? "#12161F"
                  : "#AEB5C1",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            🏛 Court Wise
          </button>

          <button
            type="button"
            onClick={() => {
              console.log("CASE WISE CLICKED");
              setSection("case");
            }}
            style={{
              padding: "12px 20px",
              borderRadius: 5,
              border:
                section === "case"
                  ? "1px solid #B8925A"
                  : "1px solid #303746",
              background:
                section === "case"
                  ? "#B8925A"
                  : "#12161F",
              color:
                section === "case"
                  ? "#12161F"
                  : "#AEB5C1",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            📁 Case Wise
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <main>
        {section === "court" ? (
          <NyayaFlowDashboard />
        ) : (
          <CaseWiseDashboard />
        )}
      </main>
    </div>
  );
}

export default App;