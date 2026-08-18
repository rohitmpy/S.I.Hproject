function RecommendationTable({ recommendations = [] }) {
  return (
    <div className="table-wrapper">
      <table>

        <thead>
          <tr>
            <th>Rank</th>
            <th>Case ID</th>
            <th>District</th>
            <th>Case Type</th>
            <th>Priority Score</th>
          </tr>
        </thead>

        <tbody>
          {recommendations.map((item, index) => (
            <tr key={item.case_id}>

              <td>
                <strong>#{index + 1}</strong>
              </td>

              <td>
                <strong>{item.case_id}</strong>
              </td>

              <td>
                {item.district}
              </td>

              <td>
                {item.case_type}
              </td>

              <td>
                <span className="priority-score">
                  {item.priority_score}
                </span>
              </td>

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}

export default RecommendationTable;