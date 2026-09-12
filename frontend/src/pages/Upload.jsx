import React, { useState } from "react";
import InspectionReportModal from "../components/InspectionReportModal";

function Upload({ onViewDashboard, user }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Idle, 1: Validating, 2: Quality Analysis, 3: Preprocessing, 4: AI Model Inference
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const isSupervisor = user?.role === "FACTORY_SUPERVISOR" || user?.role === "factory_supervisor";

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMessage("Please select a valid JPG, JPEG, or PNG image.");
      return;
    }

    setErrorMessage(null);
    setResult(null);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please select an image file first.");
      return;
    }

    if (isSupervisor) {
      setErrorMessage("Factory Supervisors are not authorized to upload or start new inspections.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setResult(null);
    setStep(1);

    const formData = new FormData();
    formData.append("user_id", user?.id || "1");
    formData.append("user_role", user?.role || "QUALITY_ENGINEER");
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      setTimeout(() => setStep(2), 300);
      setTimeout(() => setStep(3), 600);
      setTimeout(() => setStep(4), 900);

      const response = await fetch("http://127.0.0.1:8000/inspections/upload", {
        method: "POST",
        headers: headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setResult(data);
      setStep(4);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "Could not connect to VisionInspect API server.");
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setStep(0);
  };

  if (isSupervisor) {
    return (
      <div className="page-container">
        <div className="upload-header">
          <h1 className="page-title">Access Restricted</h1>
          <button className="btn btn-secondary" onClick={onViewDashboard}>
            ← Back to Monitoring Dashboard
          </button>
        </div>
        <div className="upload-card" style={{ textAlign: "center", padding: "40px" }}>
          <h3>🛡️ Factory Supervisor Oversight View</h3>
          <p className="text-muted" style={{ marginTop: "10px" }}>
            Factory Supervisors monitor inspection activity and review quality reports. Image acquisition & upload execution is restricted to Quality Engineers.
          </p>
          <div style={{ marginTop: "20px" }}>
            <button className="btn btn-primary" onClick={onViewDashboard}>
              Return to Monitoring Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="upload-header">
        <div>
          <h1 className="page-title">Upload Manufacturing Image</h1>
          <p className="page-subtitle">Run automated quality analysis, CV image preprocessing, and AI defect detection.</p>
        </div>
        <button className="btn btn-secondary" onClick={onViewDashboard}>
          ← Back to Dashboard
        </button>
      </div>

      {errorMessage && (
        <div className="alert alert-error">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      <div className="upload-grid">
        {/* Left Column: Dropzone & File Preview */}
        <div className="upload-card">
          <h3 className="section-title">Product Image Acquisition</h3>

          {!previewUrl ? (
            <div
              className="dropzone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input").click()}
            >
              <div className="dropzone-icon">📷</div>
              <h4>Drag & Drop product image here</h4>
              <p>Supports JPG, JPEG, and PNG formats (MVTec AD compatible)</p>
              <button type="button" className="btn btn-outline">
                Browse Files
              </button>
              <input
                id="file-input"
                type="file"
                accept=".jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="preview-container">
              <img src={previewUrl} alt="Upload preview" className="preview-image" />
              <div className="preview-meta">
                <span>File: <strong>{file.name}</strong></span>
                <span>Size: <strong>{(file.size / 1024).toFixed(1)} KB</strong></span>
              </div>
              <div className="preview-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Choose Different Image
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={loading}
                >
                  {loading ? "Processing Pipeline..." : "▶ Start AI Inspection"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Processing Pipeline & Result Summary */}
        <div className="upload-card">
          <h3 className="section-title">AI Inspection Pipeline Workflow</h3>

          {/* Step Indicator */}
          <div className="pipeline-steps">
            <div className={`step-item ${step >= 1 ? "step-active" : ""}`}>
              <div className="step-num">1</div>
              <div className="step-label">
                <strong>Image Validation</strong>
                <p>Format & corruption check</p>
              </div>
            </div>

            <div className={`step-item ${step >= 2 ? "step-active" : ""}`}>
              <div className="step-num">2</div>
              <div className="step-label">
                <strong>Quality Analysis</strong>
                <p>Resolution, sharpness & contrast</p>
              </div>
            </div>

            <div className={`step-item ${step >= 3 ? "step-active" : ""}`}>
              <div className="step-num">3</div>
              <div className="step-label">
                <strong>CV Preprocessing & Categorization</strong>
                <p>Gaussian Denoising & Sobel Gradient</p>
              </div>
            </div>

            <div className={`step-item ${step >= 4 ? "step-active" : ""}`}>
              <div className="step-num">4</div>
              <div className="step-label">
                <strong>AI Defect Model & Severity Engine</strong>
                <p>Weighted scoring & risk assessment</p>
              </div>
            </div>
          </div>

          {/* Processing Result Display */}
          {result && (
            <div className="result-summary-card">
              <div className="result-header">
                <div>
                  <span className="result-id">INSPECTION RECORD #{result.inspection_id}</span>
                  <h3 className="result-title">{result.image_name}</h3>
                </div>
                <span className={`status-tag tag-${(result.quality_status || "FAIL").toLowerCase()}`}>
                  {result.quality_status || "FAIL"}
                </span>
              </div>

              <div className="result-stats">
                <div className="result-stat-item">
                  <span className="stat-label">Category</span>
                  <span className="stat-value">{result.defect_type || "Anomaly"}</span>
                </div>

                <div className="result-stat-item">
                  <span className="stat-label">Severity Score</span>
                  <span className="stat-value text-purple">{result.severity_score ?? 0} / 100</span>
                </div>

                <div className="result-stat-item">
                  <span className="stat-label">Model Confidence</span>
                  <span className="stat-value">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="result-actions">
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => setShowReportModal(true)}
                >
                  📄 View Complete Milestone 3 Inspection Report
                </button>
                <button
                  className="btn btn-secondary btn-block"
                  onClick={resetForm}
                >
                  + Upload Another Image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal View */}
      {showReportModal && result && (
        <InspectionReportModal
          inspection={{
            ...result,
            id: result.inspection_id,
          }}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

export default Upload;