function CaseTable({ cases, onRemove, showPriority = false }) {
  if (cases.length === 0) {
    return <p className="empty">No cases added yet.</p>;
  }

  return (
    <div className="table-wrapper">
      <table>

        <thead>
          <tr>
            <th>Case ID</th>
            <th>Type</th>
            <th>Age</th>
            <th>Risk</th>
            <th>Stage</th>

            {showPriority && (
              <>
                <th>Priority</th>
                <th>Band</th>
              </>
            )}

            {onRemove && <th>Action</th>}
          </tr>
        </thead>

        <tbody>
          {cases.map((item) => (
            <tr key={item.case_id}>

              <td>{item.case_id}</td>

              <td>{item.case_type}</td>

              <td>{item.case_age_years}</td>

              <td>
                <span className={`risk ${item.delay_risk.toLowerCase()}`}>
                  {item.delay_risk}
                </span>
              </td>

              <td>
                {item.stage.replace("_", " ")}
              </td>

              {showPriority && (
                <>
                  <td>
                    <strong>{item.priority_score}</strong>
                  </td>

                  <td>
                    <span
                      className={`priority ${
                        item.priority_band.toLowerCase()
                      }`}
                    >
                      {item.priority_band}
                    </span>
                  </td>
                </>
              )}

              {onRemove && (
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => onRemove(item.case_id)}
                  >
                    Remove
                  </button>
                </td>
              )}

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}

export default CaseTable;