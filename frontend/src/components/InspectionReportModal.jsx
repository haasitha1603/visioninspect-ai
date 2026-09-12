import React from "react";

const InspectionReportModal = ({ inspection, onClose }) => {
  if (!inspection) return null;

  const isAnomaly = inspection.prediction === "Anomaly";
  const qualityStatus = inspection.quality_status || (isAnomaly ? "FAIL" : "PASS");
  const metrics = inspection.quality_metrics || {};
  const baseUrl = "http://127.0.0.1:8000";

  const getImageUrl = (path, fallbackUrl) => {
    if (!path && !fallbackUrl) return null;
    if (fallbackUrl) {
      return fallbackUrl.startsWith("http") ? fallbackUrl : `${baseUrl}${fallbackUrl}`;
    }
    const filename = path.split(/[/\\]/).pop();
    if (path.includes("processed")) {
      return `${baseUrl}/uploads/processed/${filename}`;
    }
    return `${baseUrl}/uploads/inspections/${filename}`;
  };

  const rawImgUrl = getImageUrl(inspection.image_path, inspection.image_url);
  const procImgUrl = getImageUrl(inspection.preprocessed_path, inspection.preprocessed_url);

  const getStatusBannerClass = () => {
    if (qualityStatus === "FAIL") return "banner-anomaly";
    if (qualityStatus === "REVIEW") return "banner-review";
    return "banner-normal";
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-subtitle">MILESTONE 3 MANUFACTURING INSPECTION REPORT</span>
            <h2 className="modal-title">Inspection #{inspection.id} — {inspection.image_name}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Top Status Banner */}
          <div className={`status-banner ${getStatusBannerClass()}`}>
            <div className="banner-badge">
              <span className="banner-indicator"></span>
              STATUS: {qualityStatus} ({inspection.prediction || "Normal"})
            </div>
            <div className="banner-meta">
              <span>Category: <strong>{inspection.defect_type || "None (Clean)"}</strong></span>
              <span>•</span>
              <span>Severity Score: <strong>{inspection.severity_score ?? 0} / 100</strong></span>
              <span>•</span>
              <span>Level: <strong>{inspection.severity_level || "Low"}</strong></span>
            </div>
          </div>

          {/* Section 1: Image Comparison */}
          <div className="report-section">
            <h3 className="section-title">1. Image Comparison & Preprocessing</h3>
            <div className="image-comparison-grid">
              <div className="image-card">
                <div className="image-card-header">Raw Upload Image</div>
                <div className="image-container">
                  {rawImgUrl ? (
                    <img src={rawImgUrl} alt="Raw original" />
                  ) : (
                    <div className="image-placeholder">Original Image Not Available</div>
                  )}
                </div>
              </div>

              <div className="image-card">
                <div className="image-card-header">CV Preprocessed Image (Denoised & Enhanced)</div>
                <div className="image-container">
                  {procImgUrl ? (
                    <img src={procImgUrl} alt="Preprocessed" />
                  ) : (
                    <div className="image-placeholder">Processed Image Processing...</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Quantitative Quality Analysis & AI Diagnostics */}
          <div className="report-grid">
            <div className="report-card">
              <h3 className="section-title">2. Image Quality Metrics</h3>
              <table className="report-table">
                <tbody>
                  <tr>
                    <td>Resolution</td>
                    <td><strong>{metrics.resolution || metrics.width ? `${metrics.width}×${metrics.height}` : "256 × 256"}</strong></td>
                  </tr>
                  <tr>
                    <td>Brightness</td>
                    <td>
                      <span>{metrics.brightness ?? "N/A"} </span>
                      <span className={`status-tag tag-${(metrics.brightness_status || "Good").toLowerCase()}`}>
                        {metrics.brightness_status || "Good"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Contrast</td>
                    <td>
                      <span>{metrics.contrast ?? "N/A"} </span>
                      <span className={`status-tag tag-${(metrics.contrast_status || "Good").toLowerCase()}`}>
                        {metrics.contrast_status || "Good"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Sharpness (Laplacian Var)</td>
                    <td>
                      <span>{metrics.sharpness ?? "N/A"} </span>
                      <span className={`status-tag tag-${(metrics.sharpness_status || "Good").toLowerCase()}`}>
                        {metrics.sharpness_status || "Good"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>File Size</td>
                    <td><strong>{metrics.file_size_kb ? `${metrics.file_size_kb} KB` : "N/A"}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="report-card">
              <h3 className="section-title">3. AI Computer Vision Detection</h3>
              <div className="metric-box-container">
                <div className="metric-box">
                  <span className="metric-label">AI Decision</span>
                  <span className={`metric-value ${isAnomaly ? "text-anomaly" : "text-normal"}`}>
                    {inspection.prediction || "Normal"}
                  </span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Model Confidence</span>
                  <span className="metric-value">
                    {inspection.confidence ? `${(inspection.confidence * 100).toFixed(1)}%` : "N/A"}
                  </span>
                  <div className="progress-bar-bg">
                    <div 
                      className={`progress-bar-fill ${isAnomaly ? "bg-anomaly" : "bg-normal"}`} 
                      style={{ width: `${(inspection.confidence || 0.85) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Processing Time</span>
                  <span className="metric-value">{inspection.processing_time_ms ? `${inspection.processing_time_ms} ms` : "< 100 ms"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Milestone 3 Defect Categorization & Severity Framework */}
          <div className="report-card">
            <h3 className="section-title">4. Defect Classification & Weighted Severity Framework</h3>
            <div className="severity-framework-grid">
              <div className="severity-metric-item">
                <span className="stat-label">Defect Category</span>
                <span className="stat-value-highlight">{inspection.defect_type || "None (Clean)"}</span>
              </div>

              <div className="severity-metric-item">
                <span className="stat-label">Calculated Severity Score</span>
                <span className="stat-value-highlight text-purple">{inspection.severity_score ?? 0} / 100</span>
              </div>

              <div className="severity-metric-item">
                <span className="stat-label">Severity Level</span>
                <span className={`status-tag tag-${(inspection.severity_level || "Low").toLowerCase()}`}>
                  {inspection.severity_level || "Low"}
                </span>
              </div>

              <div className="severity-metric-item">
                <span className="stat-label">Risk Level</span>
                <span className="stat-value-highlight">{inspection.risk_level || "Acceptable"}</span>
              </div>
            </div>

            <div className="formula-note">
              <strong>Official Severity Formula:</strong> (Defect Size × 30%) + (Defect Location × 25%) + (Defect Type × 25%) + (Confidence × 20%)
            </div>
          </div>

          {/* Section 4: Quality Assessment & Recommendation */}
          <div className="report-card recommendation-card">
            <h3 className="section-title">5. Quality Decision & Recommended Action</h3>
            <div className="recommendation-box">
              <div className="recommendation-badge-wrap">
                <span className={`status-tag tag-${qualityStatus.toLowerCase()}`}>
                  QUALITY DECISION: {qualityStatus}
                </span>
              </div>
              <p className="recommendation-text">
                {inspection.recommendation || "Product quality acceptable — approve for production release."}
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close Inspection Report</button>
        </div>
      </div>
    </div>
  );
};

export default InspectionReportModal;
