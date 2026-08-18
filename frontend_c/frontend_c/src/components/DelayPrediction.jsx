import React, { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const initialForm = {
  state_code: "",
  dist_code: "",
  court_no: "",
  judge_position: "",
  female_defendant: "",
  female_petitioner: "",
  female_adv_def: "",
  female_adv_pet: "",
  type_name: "",
  purpose_name: "",
  filing_year: 2024,
  filing_month: 1,
  filing_dayofweek: 0,
};

function DelayPrediction() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const predictDelay = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        state_code: String(form.state_code),
        dist_code: String(form.dist_code),
        court_no: String(form.court_no),
        judge_position: String(form.judge_position),
        female_defendant: String(form.female_defendant),
        female_petitioner: String(form.female_petitioner),
        female_adv_def: String(form.female_adv_def),
        female_adv_pet: String(form.female_adv_pet),
        type_name: String(form.type_name),
        purpose_name: String(form.purpose_name),
        filing_year: Number(form.filing_year),
        filing_month: Number(form.filing_month),
        filing_dayofweek: Number(form.filing_dayofweek),
      };

      console.log("Delay Prediction Payload:", payload);

      const response = await fetch(
        `${API_URL}/predict/delay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Prediction API returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Delay Prediction Response:", data);

      setResult(data);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to generate delay prediction."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDemoCase = () => {
    setForm({
      state_code: "UP",
      dist_code: "GBN",
      court_no: "1",
      judge_position: "District Judge",
      female_defendant: "No",
      female_petitioner: "No",
      female_adv_def: "No",
      female_adv_pet: "No",
      type_name: "Civil",
      purpose_name: "Hearing",
      filing_year: 2024,
      filing_month: 6,
      filing_dayofweek: 2,
    });

    setResult(null);
    setError("");
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
      }}
    >

      {/* HEADER */}

      <section
        style={{
          background: "#F6F3EC",
          borderRadius: 4,
          padding: 22,
        }}
      >
        <div
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            color: "#5B6472",
            marginBottom: 8,
          }}
        >
          Module B
        </div>

        <h2
          style={{
            fontFamily:
              "Georgia, 'Times New Roman', serif",
            fontSize: 26,
            margin: "0 0 8px",
            color: "#12161F",
          }}
        >
          Judicial Case Delay Prediction
        </h2>

        <p
          style={{
            margin: 0,
            color: "#5B6472",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Predict the delay risk of a judicial case using
          court, judge, case type, filing and participant
          features processed by the NyayaFlow ML model.
        </p>
      </section>


      {/* INPUT FORM */}

      <section
        style={{
          background: "#F6F3EC",
          borderRadius: 4,
          padding: 22,
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontFamily:
                "Georgia, 'Times New Roman', serif",
              fontSize: 20,
              margin: 0,
              color: "#12161F",
            }}
          >
            Case Information
          </h3>

          <button
            type="button"
            onClick={loadDemoCase}
            style={{
              padding: "9px 14px",
              border: "1px solid #B8925A",
              borderRadius: 4,
              background: "#B8925A",
              color: "#F6F3EC",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            Load Demo Case
          </button>
        </div>


        {/* COURT INFORMATION */}

        <div style={sectionTitleStyle}>
          Court Information
        </div>

        <div style={gridStyle}>

          <Field
            label="State Code"
            name="state_code"
            value={form.state_code}
            onChange={handleChange}
            placeholder="e.g. UP"
          />

          <Field
            label="District Code"
            name="dist_code"
            value={form.dist_code}
            onChange={handleChange}
            placeholder="e.g. GBN"
          />

          <Field
            label="Court Number"
            name="court_no"
            value={form.court_no}
            onChange={handleChange}
            placeholder="e.g. 1"
          />

          <Field
            label="Judge Position"
            name="judge_position"
            value={form.judge_position}
            onChange={handleChange}
            placeholder="e.g. District Judge"
          />

        </div>


        {/* CASE INFORMATION */}

        <div style={sectionTitleStyle}>
          Case Information
        </div>

        <div style={gridStyle}>

          <Field
            label="Case Type"
            name="type_name"
            value={form.type_name}
            onChange={handleChange}
            placeholder="e.g. Civil"
          />

          <Field
            label="Purpose"
            name="purpose_name"
            value={form.purpose_name}
            onChange={handleChange}
            placeholder="e.g. Hearing"
          />

        </div>


        {/* PARTICIPANT INFORMATION */}

        <div style={sectionTitleStyle}>
          Participant Information
        </div>

        <div style={gridStyle}>

          <SelectField
            label="Female Defendant"
            name="female_defendant"
            value={form.female_defendant}
            onChange={handleChange}
          />

          <SelectField
            label="Female Petitioner"
            name="female_petitioner"
            value={form.female_petitioner}
            onChange={handleChange}
          />

          <SelectField
            label="Female Defence Advocate"
            name="female_adv_def"
            value={form.female_adv_def}
            onChange={handleChange}
          />

          <SelectField
            label="Female Petitioner's Advocate"
            name="female_adv_pet"
            value={form.female_adv_pet}
            onChange={handleChange}
          />

        </div>


        {/* FILING INFORMATION */}

        <div style={sectionTitleStyle}>
          Filing Information
        </div>

        <div style={gridStyle}>

          <NumberField
            label="Filing Year"
            name="filing_year"
            value={form.filing_year}
            onChange={handleChange}
          />

          <NumberField
            label="Filing Month"
            name="filing_month"
            value={form.filing_month}
            min={1}
            max={12}
            onChange={handleChange}
          />

          <NumberField
            label="Day of Week"
            name="filing_dayofweek"
            value={form.filing_dayofweek}
            min={0}
            max={6}
            onChange={handleChange}
          />

        </div>


        {/* ERROR */}

        {error && (
          <div
            style={{
              padding: 13,
              marginTop: 18,
              background: "#F1E1DA",
              color: "#8C3D24",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <strong>Prediction Failed:</strong>{" "}
            {error}
          </div>
        )}


        {/* PREDICT BUTTON */}

        <button
          type="button"
          onClick={predictDelay}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "14px 18px",
            border: "none",
            borderRadius: 4,
            background: "#B8925A",
            color: "#F6F3EC",
            cursor: loading
              ? "not-allowed"
              : "pointer",
            opacity: loading ? 0.6 : 1,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {loading
            ? "Analyzing Case..."
            : "Predict Case Delay"}
        </button>

      </section>


      {/* RESULT */}

      {result && (
        <PredictionResult result={result} />
      )}

    </div>
  );
}


/* -------------------------------- */
/* INPUT COMPONENTS */
/* -------------------------------- */

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}


function NumberField({
  label,
  name,
  value,
  onChange,
  min,
  max,
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        type="number"
        name={name}
        value={value}
        min={min}
        max={max}
        onChange={onChange}
        style={inputStyle}
      />
    </div>
  );
}


function SelectField({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        style={inputStyle}
      >
        <option value="">
          Select
        </option>

        <option value="Yes">
          Yes
        </option>

        <option value="No">
          No
        </option>
      </select>
    </div>
  );
}


/* -------------------------------- */
/* RESULT */
/* -------------------------------- */

function PredictionResult({ result }) {
  const prediction =
    result.prediction ??
    result.delay_prediction ??
    result.result ??
    result.label ??
    "Prediction generated";

  const probability =
    result.probability ??
    result.delay_probability ??
    result.confidence ??
    null;

  const predictionText =
    String(prediction).toUpperCase();

  const isHigh =
    predictionText.includes("HIGH") ||
    predictionText.includes("DELAY");

  return (
    <section
      style={{
        background: "#F6F3EC",
        borderRadius: 4,
        padding: 22,
      }}
    >

      <div style={sectionTitleStyle}>
        PREDICTION RESULT
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 22,
          background:
            isHigh
              ? "#F1E1DA"
              : "#E1EFEA",
          borderRadius: 4,
          textAlign: "center",
        }}
      >

        <div
          style={{
            fontSize: 12,
            color: "#5B6472",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Predicted Delay Risk
        </div>

        <div
          style={{
            fontFamily:
              "Georgia, 'Times New Roman', serif",
            fontSize: 30,
            fontWeight: 800,
            color:
              isHigh
                ? "#B5502F"
                : "#3E7568",
          }}
        >
          {prediction}
        </div>

        {probability !== null && (
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: "#5B6472",
            }}
          >
            Confidence / Probability:{" "}
            <strong>
              {typeof probability === "number"
                ? `${(probability * 100).toFixed(1)}%`
                : probability}
            </strong>
          </div>
        )}

      </div>


      {/* RAW RESPONSE */}

      <details
        style={{
          marginTop: 16,
          fontSize: 11,
          color: "#5B6472",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          View model response
        </summary>

        <pre
          style={{
            marginTop: 10,
            padding: 14,
            background: "#EDE8DB",
            borderRadius: 4,
            overflowX: "auto",
            fontSize: 10,
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>

    </section>
  );
}


/* -------------------------------- */
/* STYLES */
/* -------------------------------- */

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 20,
};

const sectionTitleStyle = {
  fontFamily:
    "Georgia, 'Times New Roman', serif",
  fontSize: 15,
  fontWeight: 700,
  color: "#5B6472",
  textTransform: "uppercase",
  borderLeft: "3px solid #B8925A",
  paddingLeft: 10,
  marginBottom: 12,
};

const labelStyle = {
  display: "block",
  fontSize: 10,
  color: "#5B6472",
  textTransform: "uppercase",
  marginBottom: 6,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 11px",
  border: "1px solid #D8D2C5",
  borderRadius: 4,
  background: "#EDE8DB",
  color: "#12161F",
  fontSize: 12,
  outline: "none",
};

export default DelayPrediction;