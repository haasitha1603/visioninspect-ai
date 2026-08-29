import { useEffect, useState } from "react";

function Dashboard() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/inspections")
      .then((response) => response.json())
      .then((data) => {
        setInspections(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading inspections:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>VisionInspect AI</h1>

      <h2>Inspection Dashboard</h2>

      {loading ? (
        <p>Loading inspections...</p>
      ) : inspections.length === 0 ? (
        <p>No inspections found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {inspections.map((inspection) => (
              <tr key={inspection.id}>
                <td>{inspection.id}</td>
                <td>{inspection.image_name}</td>
                <td>{inspection.status}</td>
                <td>{inspection.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;