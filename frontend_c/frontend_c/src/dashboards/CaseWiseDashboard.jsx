import React, { useState } from "react";
import PriorityListing from "../components/PriorityListing";
import DelayPrediction from "../components/DelayPrediction";

function CaseWiseDashboard() {
  const [activeFeature, setActiveFeature] = useState("priority");

  return (
    <div
      style={{
        padding: "20px 5% 50px",
      }}
    >
      {/* CASE WISE HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              margin: 0,
              color: "#F6F3EC",
            }}
          >
            Case Wise Intelligence
          </h2>

          <p
            style={{
              color: "#9BA3B0",
              fontSize: 13,
            }}
          >
            Case-level prioritization and delay analysis.
          </p>
        </div>

        {/* CASE FEATURES */}
        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          {/* PRIORITY BUTTON */}
          <button
            type="button"
            onClick={() => setActiveFeature("priority")}
            style={featureButtonStyle(
              activeFeature === "priority"
            )}
          >
            📋 Priority Listing
          </button>

          {/* DELAY BUTTON */}
          <button
            type="button"
            onClick={() => setActiveFeature("delay")}
            style={featureButtonStyle(
              activeFeature === "delay"
            )}
          >
            ⏱ Delay Prediction
          </button>
        </div>
      </div>

      {/* FEATURE CONTENT */}

      {activeFeature === "priority" && (
        <PriorityListing />
      )}

      {activeFeature === "delay" && (
        <DelayPrediction />
      )}
    </div>
  );
}

function featureButtonStyle(active) {
  return {
    padding: "11px 16px",
    borderRadius: 5,
    border: active
      ? "1px solid #B8925A"
      : "1px solid #303746",

    background: active
      ? "#B8925A"
      : "#12161F",

    color: active
      ? "#12161F"
      : "#AEB5C1",

    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
  };
}

export default CaseWiseDashboard;