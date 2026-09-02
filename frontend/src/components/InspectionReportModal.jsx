import React from "react";

const InspectionReportModal = ({ inspection, onClose }) => {
  if (!inspection) return null;

  const isAnomaly = inspection.prediction === "Anomaly";
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-subtitle">INSPECTION REPORT</span>
            <h2 className="modal-title">Inspection #{inspection.id} — {inspection.image_name}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Top Status Banner */}
          <div className={`status-banner ${isAnomaly ? "banner-anomaly" : "banner-normal"}`}>
            <div className="banner-badge">
              <span className="banner-indicator"></span>
              {isAnomaly ? "DEFECT / ANOMALY DETECTED" : "PASS / NORMAL QUALITY"}
            </div>
            <div className="banner-meta">
              <span>Confidence: <strong>{(inspection.confidence * 100).toFixed(1)}%</strong></span>
              <span>•</span>
              <span>Speed: <strong>{inspection.processing_time_ms || 0} ms</strong></span>
              <span>•</span>
              <span>Grade: <strong>{inspection.quality_score || "Good"}</strong></span>
            </div>
          </div>

          {/* Image Comparison */}
          <div className="report-section">
            <h3 className="section-title">Image Comparison & Processing</h3>
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

          {/* Quality Analysis & AI Metrics */}
          <div className="report-grid">
            {/* Quality Metrics */}
            <div className="report-card">
              <h3 className="section-title">Quantitative Image Quality Metrics</h3>
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

            {/* AI Diagnostics */}
            <div className="report-card">
              <h3 className="section-title">AI Computer Vision Diagnostics</h3>
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
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close Report</button>
        </div>
      </div>
    </div>
  );
};

export default InspectionReportModal;
