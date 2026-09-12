import React, { useEffect, useState } from "react";
import InspectionReportModal from "../components/InspectionReportModal";

function Dashboard({ onViewUpload, user, isSupervisor }) {
  const [inspections, setInspections] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInspection, setSelectedInspection] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [insRes, analyticsRes, trendsRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/inspections"),
        fetch("http://127.0.0.1:8000/inspections/analytics/summary"),
        fetch("http://127.0.0.1:8000/inspections/analytics/trends")
      ]);

      if (!insRes.ok) throw new Error("Failed to fetch inspection records");
      
      const insData = await insRes.json();
      setInspections(insData);

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics(aData);
      }

      if (trendsRes.ok) {
        const tData = await trendsRes.json();
        setTrends(tData);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Could not load inspection data. Ensure backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Dashboard Statistics
  const totalCount = analytics?.total_inspections ?? inspections.length;
  const passedCount = analytics?.passed_count ?? inspections.filter((i) => i.prediction === "Normal" || i.quality_status === "PASS").length;
  const failedCount = analytics?.failed_count ?? inspections.filter((i) => i.quality_status === "FAIL").length;
  const reviewCount = analytics?.review_count ?? inspections.filter((i) => i.quality_status === "REVIEW").length;
  const pendingCount = analytics?.pending_count ?? inspections.filter((i) => i.status === "Pending").length;
  
  const passRate = analytics?.pass_rate ?? (totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) : 0);
  const defectRate = analytics?.defect_rate ?? (totalCount > 0 ? (((failedCount + reviewCount) / totalCount) * 100).toFixed(1) : 0);
  const avgSeverity = analytics?.avg_severity_score ?? 0;
  const avgTime = analytics?.avg_processing_time_ms ?? 0;

  // Filtered Inspections list
  const filteredInspections = inspections.filter((item) => {
    const matchesFilter =
      filter === "ALL"
        ? true
        : filter === "PASS"
        ? (item.quality_status === "PASS" || item.prediction === "Normal")
        : filter === "FAIL"
        ? item.quality_status === "FAIL"
        : filter === "REVIEW"
        ? item.quality_status === "REVIEW"
        : item.status === "Pending";

    const matchesSearch =
      item.image_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.defect_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <h1 className="page-title">
            {isSupervisor ? "Production Quality Analytics & Monitoring" : "Quality Inspection Dashboard"}
          </h1>
          <p className="page-subtitle">
            {isSupervisor
              ? "Supervise manufacturing quality, audit defect categories, severity scores, and trend monitoring."
              : "Run image quality analysis, perform AI defect detection, and review classification reports."}
          </p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-secondary" onClick={fetchData}>
            🔄 Refresh Analytics
          </button>

          {!isSupervisor && (
            <button className="btn btn-primary" onClick={onViewUpload}>
              + New Inspection Upload
            </button>
          )}
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
          <div className="stat-footer text-muted">Completed inspection records</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Quality Pass Rate</span>
            <span className="stat-icon icon-emerald">✓</span>
          </div>
          <div className="stat-value text-normal">{passRate}%</div>
          <div className="stat-footer text-emerald">{passedCount} Passed Products</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Defect Rate</span>
            <span className="stat-icon icon-rose">⚠️</span>
          </div>
          <div className="stat-value text-anomaly">{defectRate}%</div>
          <div className="stat-footer text-rose">{failedCount} Failed / {reviewCount} Review</div>
        </div>

        {isSupervisor ? (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Avg Severity Score</span>
              <span className="stat-icon icon-amber">🔥</span>
            </div>
            <div className="stat-value text-purple">{avgSeverity} / 100</div>
            <div className="stat-footer text-muted">{analytics?.critical_defects_count || 0} Critical Severity</div>
          </div>
        ) : (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Avg Inference Speed</span>
              <span className="stat-icon">⚡</span>
            </div>
            <div className="stat-value">{avgTime} ms</div>
            <div className="stat-footer text-muted">Real-time CV execution</div>
          </div>
        )}
      </div>

      {/* Factory Supervisor Analytics & Trend Monitoring Section */}
      {isSupervisor && analytics && (
        <div className="analytics-section-grid">
          {/* Defect Distribution */}
          <div className="analytics-card">
            <h3 className="section-title">Defect Category Distribution</h3>
            <div className="distribution-list">
              {Object.keys(analytics.defect_distribution || {}).length === 0 ? (
                <p className="text-muted">No defect category data recorded.</p>
              ) : (
                Object.entries(analytics.defect_distribution).map(([cat, count]) => {
                  const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat} className="dist-item">
                      <div className="dist-header">
                        <span className="dist-label">{cat}</span>
                        <span className="dist-count">{count} ({pct}%)</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill bg-anomaly"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Severity & Quality Status Distribution */}
          <div className="analytics-card">
            <h3 className="section-title">Severity Level & Quality Breakdown</h3>
            <div className="distribution-list">
              <div className="dist-item">
                <div className="dist-header">
                  <span className="dist-label">Critical Severity (Score 80–100)</span>
                  <span className="dist-count text-rose">{analytics.severity_distribution?.Critical || 0}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill bg-anomaly"
                    style={{ width: `${totalCount > 0 ? ((analytics.severity_distribution?.Critical / totalCount) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="dist-item">
                <div className="dist-header">
                  <span className="dist-label">High Severity (Score 60–79)</span>
                  <span className="dist-count text-rose">{analytics.severity_distribution?.High || 0}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill bg-anomaly"
                    style={{ width: `${totalCount > 0 ? ((analytics.severity_distribution?.High / totalCount) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="dist-item">
                <div className="dist-header">
                  <span className="dist-label">Quality PASS Decision</span>
                  <span className="dist-count text-normal">{analytics.quality_distribution?.PASS || 0}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill bg-normal"
                    style={{ width: `${totalCount > 0 ? ((analytics.quality_distribution?.PASS / totalCount) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="dist-item">
                <div className="dist-header">
                  <span className="dist-label">Quality FAIL Decision</span>
                  <span className="dist-count text-rose">{analytics.quality_distribution?.FAIL || 0}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill bg-anomaly"
                    style={{ width: `${totalCount > 0 ? ((analytics.quality_distribution?.FAIL / totalCount) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Trend Monitoring Section */}
      {isSupervisor && trends.length > 0 && (
        <div className="analytics-card">
          <h3 className="section-title">Production Quality Trend Monitoring</h3>
          <div className="trends-grid">
            {trends.map((t) => (
              <div key={t.date} className="trend-card-item">
                <div className="trend-date">{t.date}</div>
                <div className="trend-meta">
                  <span>Volume: <strong>{t.total}</strong></span>
                  <span>Pass Rate: <strong className="text-normal">{t.pass_rate}%</strong></span>
                  <span>Avg Severity: <strong className="text-purple">{t.avg_severity}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls & Search */}
      <div className="table-controls-card">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by file name, defect category, or ID..."
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
            className={`filter-btn ${filter === "PASS" ? "active" : ""}`}
            onClick={() => setFilter("PASS")}
          >
            PASS ({passedCount})
          </button>
          <button
            className={`filter-btn ${filter === "FAIL" ? "active" : ""}`}
            onClick={() => setFilter("FAIL")}
          >
            FAIL ({failedCount})
          </button>
          <button
            className={`filter-btn ${filter === "REVIEW" ? "active" : ""}`}
            onClick={() => setFilter("REVIEW")}
          >
            REVIEW ({reviewCount})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-card">
        {loading ? (
          <div className="state-container">
            <div className="spinner"></div>
            <p>Loading manufacturing records from PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="state-container">
            <p className="text-rose">{error}</p>
            <button className="btn btn-secondary" onClick={fetchData}>Retry</button>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="state-container">
            <p>No inspection records found matching criteria.</p>
            {!isSupervisor && (
              <button className="btn btn-primary" onClick={onViewUpload}>Upload First Image</button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Image Name</th>
                  <th>Defect Category</th>
                  <th>Severity Score</th>
                  <th>Severity Level</th>
                  <th>Decision</th>
                  <th>Confidence</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((item) => {
                  const thumb = getThumbnailUrl(item);
                  const qStatus = item.quality_status || (item.prediction === "Anomaly" ? "FAIL" : "PASS");

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
                        <strong>{item.defect_type || (item.prediction === "Normal" ? "None (Clean)" : "Anomaly")}</strong>
                      </td>
                      <td>
                        <span className="text-purple">
                          <strong>{item.severity_score ?? 0} / 100</strong>
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag tag-${(item.severity_level || "Low").toLowerCase()}`}>
                          {item.severity_level || "Low"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag tag-${qStatus.toLowerCase()}`}>
                          {qStatus}
                        </span>
                      </td>
                      <td>
                        <strong>{item.confidence ? `${(item.confidence * 100).toFixed(1)}%` : "N/A"}</strong>
                      </td>
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