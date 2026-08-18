import React, { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function PriorityListing() {
  const [cases, setCases] = useState([]);
  const [topN, setTopN] = useState(10);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rankCases = async () => {
    if (cases.length === 0) {
      setError("Please add at least one case.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/priority/rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cases, top_n: topN }),
      });

      if (!response.ok) {
        throw new Error(`Priority API returned ${response.status}`);
      }

      const data = await response.json();
      console.log("Priority API:", data);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate priority listing.");
    } finally {
      setLoading(false);
    }
  };

  const addDemoCases = () => {
    setCases([
      {
        case_id: "C001",
        district: "Gautam Buddha Nagar",
        case_type: "civil",
        case_age_years: 8,
        is_undertrial: false,
        is_women_child_case: false,
        delay_risk_band: "low",
        adjournment_count: 2,
        is_undated: false,
      },
      {
        case_id: "C002",
        district: "Gautam Buddha Nagar",
        case_type: "criminal",
        case_age_years: 5,
        is_undertrial: true,
        is_women_child_case: false,
        delay_risk_band: "high",
        adjournment_count: 4,
        is_undated: false,
      },
      {
        case_id: "C003",
        district: "Gautam Buddha Nagar",
        case_type: "civil",
        case_age_years: 2,
        is_undertrial: false,
        is_women_child_case: false,
        delay_risk_band: "low",
        adjournment_count: 1,
        is_undated: false,
      },
      {
        case_id: "C004",
        district: "Ghaziabad",
        case_type: "criminal",
        case_age_years: 10,
        is_undertrial: true,
        is_women_child_case: true,
        delay_risk_band: "high",
        adjournment_count: 6,
        is_undated: false,
      },
    ]);
    setResults([]);
    setError("");
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section style={cardStyle}>
        <div style={eyebrowStyle}>MODULE C</div>
        <div style={titleStyle}>Priority Case Listing</div>
        <p style={descriptionStyle}>
          Rank cases according to age, vulnerability, delay risk, adjournments
          and other priority factors calculated by the NyayaFlow backend.
        </p>
      </section>

      <section style={cardStyle}>
        <div style={rowStyle}>
          <div style={subTitleStyle}>Case Dataset</div>
          <button onClick={addDemoCases} style={goldButtonStyle}>
            Load Demo Cases
          </button>
        </div>

        <div style={infoStyle}>
          Cases loaded: <strong>{cases.length}</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <label style={labelStyle}>Top N cases</label>
          <input
            type="number"
            min="1"
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            style={inputStyle}
          />
        </div>

        {cases.length > 0 && (
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Case ID</th>
                  <th style={thStyle}>District</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Age</th>
                  <th style={thStyle}>Risk</th>
                  <th style={thStyle}>Adjournments</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item) => (
                  <tr key={item.case_id}>
                    <td style={tdStyle}>{item.case_id}</td>
                    <td style={tdStyle}>{item.district}</td>
                    <td style={tdStyle}>{item.case_type}</td>
                    <td style={tdStyle}>{item.case_age_years}</td>
                    <td style={tdStyle}>{item.delay_risk_band}</td>
                    <td style={tdStyle}>{item.adjournment_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        <button
          onClick={rankCases}
          disabled={loading || cases.length === 0}
          style={{ ...goldButtonStyle, width: "100%", opacity: loading || cases.length === 0 ? 0.6 : 1 }}
        >
          {loading ? "Calculating Priority..." : "Generate Priority Listing"}
        </button>
      </section>

      {results.length > 0 && (
        <section style={cardStyle}>
          <div style={subTitleStyle}>Recommended Case Listing</div>
          <div style={{ overflowX: "auto", marginTop: 15 }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Rank</th>
                  <th style={thStyle}>Case ID</th>
                  <th style={thStyle}>District</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Priority Score</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, index) => (
                  <tr key={item.case_id}>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>#{index + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{item.case_id}</td>
                    <td style={tdStyle}>{item.district}</td>
                    <td style={tdStyle}>{item.case_type}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 800,
                        color:
                          item.priority_score >= 150
                            ? "#B5502F"
                            : item.priority_score >= 100
                              ? "#B8925A"
                              : "#3E7568",
                      }}
                    >
                      {item.priority_score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

const cardStyle = {
  background: "#F6F3EC",
  borderRadius: 6,
  padding: 20,
  color: "#12161F",
};
const eyebrowStyle = { fontSize: 11, textTransform: "uppercase", color: "#5B6472", marginBottom: 8, letterSpacing: 1 };
const titleStyle = { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 25, fontWeight: 700, marginBottom: 8 };
const subTitleStyle = { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 19, fontWeight: 700 };
const descriptionStyle = { fontSize: 12, color: "#5B6472", lineHeight: 1.6, margin: 0 };
const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12 };
const goldButtonStyle = { padding: "9px 13px", border: "1px solid #B8925A", borderRadius: 4, background: "#B8925A", color: "#F6F3EC", cursor: "pointer", fontWeight: 700, fontSize: 11 };
const infoStyle = { padding: 14, background: "#EDE8DB", borderRadius: 4, marginBottom: 14, color: "#5B6472", fontSize: 12 };
const labelStyle = { fontSize: 11, color: "#5B6472", textTransform: "uppercase" };
const inputStyle = { width: 80, padding: "8px 10px", border: "1px solid #D8D2C5", borderRadius: 4, background: "#EDE8DB" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 11 };
const thStyle = { textAlign: "left", padding: "10px 8px", borderBottom: "2px solid #D8D2C5", color: "#5B6472", fontSize: 10, textTransform: "uppercase" };
const tdStyle = { padding: "11px 8px", borderBottom: "1px solid #EDE8DB", color: "#12161F", fontSize: 12 };
const errorStyle = { padding: 12, background: "#F1E1DA", color: "#8C3D24", borderRadius: 4, marginBottom: 14, fontSize: 12 };

export default PriorityListing;
