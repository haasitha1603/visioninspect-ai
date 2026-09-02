import React, { useEffect, useState } from "react";
import InspectionReportModal from "../components/InspectionReportModal";

function Dashboard({ onViewUpload }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInspection, setSelectedInspection] = useState(null);

  const fetchInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://127.0.0.1:8000/inspections");
      if (!response.ok) {
        throw new Error("Failed to fetch inspection records");
      }
      const data = await response.json();
      setInspections(data);
    } catch (err) {
      console.error("Error loading inspections:", err);
      setError("Could not load inspection records. Ensure backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  // Compute Dashboard Statistics
  const totalCount = inspections.length;
  const normalCount = inspections.filter((i) => i.prediction === "Normal").length;
  const anomalyCount = inspections.filter((i) => i.prediction === "Anomaly").length;
  const passRate = totalCount > 0 ? ((normalCount / totalCount) * 100).toFixed(1) : 0;
  
  const avgTime = totalCount > 0
    ? (
        inspections.reduce((acc, i) => acc + (i.processing_time_ms || 0), 0) / totalCount
      ).toFixed(0)
    : 0;

  // Filtered Inspections list
  const filteredInspections = inspections.filter((item) => {
    const matchesFilter =
      filter === "ALL"
        ? true
        : filter === "NORMAL"
        ? item.prediction === "Normal"
        : filter === "ANOMALY"
        ? item.prediction === "Anomaly"
        : item.status === "Pending";

    const matchesSearch =
      item.image_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toString().includes(searchTerm);

    return matchesFilter && matchesSearch;
  });

  const getThumbnailUrl = (item) => {
    const baseUrl = "http://127.0.0.1:8000";
    if (item.image_url) {
      return item.image_url.startsWith("http") ? item.image_url : `${baseUrl}${item.image_url}`;
    }
    if (item.image_path) {
      const filename = item.image_path.split(/[/\\]/).pop();
      return `${baseUrl}/uploads/inspections/${filename}`;
    }
    return null;
  };

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Inspection Dashboard</h1>
          <p className="page-subtitle">Real-time manufacturing quality metrics and computer vision anomaly monitoring.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-secondary" onClick={fetchInspections}>
            🔄 Refresh Data
          </button>
          <button className="btn btn-primary" onClick={onViewUpload}>
            + New Inspection Upload
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Inspections</span>
            <span className="stat-icon">📊</span>
          </div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-footer text-muted">Total processed images</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Normal / Passed</span>
            <span className="stat-icon icon-emerald">✓</span>
          </div>
          <div className="stat-value text-normal">{normalCount}</div>
          <div className="stat-footer text-emerald">{passRate}% Pass Rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Anomalies Detected</span>
            <span className="stat-icon icon-rose">⚠️</span>
          </div>
          <div className="stat-value text-anomaly">{anomalyCount}</div>
          <div className="stat-footer text-rose">
            {totalCount > 0 ? ((anomalyCount / totalCount) * 100).toFixed(1) : 0}% Defect Rate
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Avg Inspection Time</span>
            <span className="stat-icon">⚡</span>
          </div>
          <div className="stat-value">{avgTime} ms</div>
          <div className="stat-footer text-muted">High-performance AI inference</div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="table-controls-card">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by file name or inspection ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "ALL" ? "active" : ""}`}
            onClick={() => setFilter("ALL")}
          >
            All ({totalCount})
          </button>
          <button
            className={`filter-btn ${filter === "NORMAL" ? "active" : ""}`}
            onClick={() => setFilter("NORMAL")}
          >
            Normal ({normalCount})
          </button>
          <button
            className={`filter-btn ${filter === "ANOMALY" ? "active" : ""}`}
            onClick={() => setFilter("ANOMALY")}
          >
            Anomalies ({anomalyCount})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-card">
        {loading ? (
          <div className="state-container">
            <div className="spinner"></div>
            <p>Loading inspection records from PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="state-container">
            <p className="text-rose">{error}</p>
            <button className="btn btn-secondary" onClick={fetchInspections}>Retry</button>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="state-container">
            <p>No inspections found matching criteria.</p>
            <button className="btn btn-primary" onClick={onViewUpload}>Upload First Image</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Image Name</th>
                  <th>Quality Grade</th>
                  <th>AI Prediction</th>
                  <th>Confidence</th>
                  <th>Speed</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((item) => {
                  const thumb = getThumbnailUrl(item);
                  const isAnomaly = item.prediction === "Anomaly";

                  return (
                    <tr key={item.id} className="table-row">
                      <td><strong>#{item.id}</strong></td>
                      <td>
                        <div className="table-thumb-container">
                          {thumb ? (
                            <img src={thumb} alt={item.image_name} className="table-thumb" />
                          ) : (
                            <div className="thumb-placeholder">IMG</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="file-name-cell">{item.image_name}</span>
                      </td>
                      <td>
                        <span className={`status-tag tag-${(item.quality_score || "Good").toLowerCase()}`}>
                          {item.quality_score || "Good"}
                        </span>
                      </td>
                      <td>
                        {item.prediction ? (
                          <span className={`prediction-badge ${isAnomaly ? "badge-anomaly" : "badge-normal"}`}>
                            {isAnomaly ? "⚠️ Anomaly" : "✓ Normal"}
                          </span>
                        ) : (
                          <span className="badge-pending">Pending</span>
                        )}
                      </td>
                      <td>
                        <strong>{item.confidence ? `${(item.confidence * 100).toFixed(1)}%` : "N/A"}</strong>
                      </td>
                      <td>{item.processing_time_ms ? `${item.processing_time_ms} ms` : "-"}</td>
                      <td className="text-muted">
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString() : "-"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => setSelectedInspection(item)}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Report Modal */}
      {selectedInspection && (
        <InspectionReportModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;