function RecommendationTable({ recommendations }) {
  return (
    <div className="table-wrapper">

      <table>

        <thead>
          <tr>
            <th>Case</th>
            <th>Priority</th>
            <th>Band</th>
            <th>Recommended Court</th>
            <th>Reason</th>
          </tr>
        </thead>

        <tbody>

          {recommendations.map((item) => (
            <tr key={item.case_id}>

              <td>
                <strong>{item.case_id}</strong>
              </td>

              <td>{item.priority}</td>

              <td>
                <span
                  className={`priority ${
                    item.priority_band?.toLowerCase() || ""
                  }`}
                >
                  {item.priority_band || "N/A"}
                </span>
              </td>

              <td>
                {item.recommended_court || "No Available Court"}
              </td>

              <td>{item.reason}</td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

export default RecommendationTable;