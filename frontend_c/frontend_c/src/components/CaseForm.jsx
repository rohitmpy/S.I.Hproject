import { useState } from "react";

function CaseForm({ onAdd }) {
  const [form, setForm] = useState({
    case_id: "",
    case_age_years: "",
    case_type: "CIVIL",
    delay_risk: "LOW",
    stage: "FILING",
    urgency: 3,
    undertrial: false,
    senior_citizen: false,
    women_related: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.case_id || !form.case_age_years) {
      alert("Please enter Case ID and Case Age");
      return;
    }

    onAdd({
      ...form,
      case_age_years: Number(form.case_age_years),
      urgency: Number(form.urgency),
    });

    setForm({
      case_id: "",
      case_age_years: "",
      case_type: "CIVIL",
      delay_risk: "LOW",
      stage: "FILING",
      urgency: 3,
      undertrial: false,
      senior_citizen: false,
      women_related: false,
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>

      <label>
        Case ID
        <input
          name="case_id"
          type="text"
          value={form.case_id}
          onChange={handleChange}
          placeholder="C101"
        />
      </label>

      <label>
        Case Age (Years)
        <input
          name="case_age_years"
          type="number"
          step="0.1"
          value={form.case_age_years}
          onChange={handleChange}
          placeholder="5.2"
        />
      </label>

      <label>
        Case Type
        <select
          name="case_type"
          value={form.case_type}
          onChange={handleChange}
        >
          <option value="CIVIL">Civil</option>
          <option value="CRIMINAL">Criminal</option>
        </select>
      </label>

      <label>
        Delay Risk
        <select
          name="delay_risk"
          value={form.delay_risk}
          onChange={handleChange}
        >
          <option value="LOW">Low</option>
          <option value="MODERATE">Moderate</option>
          <option value="HIGH">High</option>
          <option value="SEVERE">Severe</option>
        </select>
      </label>

      <label>
        Current Stage
        <select
          name="stage"
          value={form.stage}
          onChange={handleChange}
        >
          <option value="FILING">Filing</option>
          <option value="PRELIMINARY">Preliminary</option>
          <option value="EVIDENCE">Evidence</option>
          <option value="ARGUMENT">Argument</option>
          <option value="FINAL_HEARING">Final Hearing</option>
        </select>
      </label>

      <label>
        Urgency
        <select
          name="urgency"
          value={form.urgency}
          onChange={handleChange}
        >
          <option value="1">1 - Low</option>
          <option value="2">2</option>
          <option value="3">3 - Normal</option>
          <option value="4">4</option>
          <option value="5">5 - High</option>
        </select>
      </label>

      <div className="checkbox-group">

        <label className="checkbox">
          <input
            type="checkbox"
            name="undertrial"
            checked={form.undertrial}
            onChange={handleChange}
          />
          Undertrial
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            name="senior_citizen"
            checked={form.senior_citizen}
            onChange={handleChange}
          />
          Senior Citizen
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            name="women_related"
            checked={form.women_related}
            onChange={handleChange}
          />
          Women Related
        </label>

      </div>

      <button type="submit" className="add-btn">
        + Add Case
      </button>

    </form>
  );
}

export default CaseForm;