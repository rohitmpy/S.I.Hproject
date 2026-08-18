import { useState } from "react";

function CourtForm({ onAdd }) {
  const [form, setForm] = useState({
    court_id: "",
    capacity: "",
    current_load: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.court_id || !form.capacity || !form.current_load) {
      alert("Please fill all court details");
      return;
    }

    onAdd({
      court_id: form.court_id,
      capacity: Number(form.capacity),
      current_load: Number(form.current_load),
      supported_types: ["CIVIL", "CRIMINAL"],
    });

    setForm({
      court_id: "",
      capacity: "",
      current_load: "",
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>

      <label>
        Court ID
        <input
          name="court_id"
          value={form.court_id}
          onChange={handleChange}
          placeholder="COURT_A"
        />
      </label>

      <label>
        Daily Capacity
        <input
          type="number"
          name="capacity"
          value={form.capacity}
          onChange={handleChange}
          placeholder="30"
        />
      </label>

      <label>
        Current Load (%)
        <input
          type="number"
          name="current_load"
          value={form.current_load}
          onChange={handleChange}
          placeholder="85"
        />
      </label>

      <button type="submit" className="add-btn">
        + Add Court
      </button>

    </form>
  );
}

export default CourtForm;