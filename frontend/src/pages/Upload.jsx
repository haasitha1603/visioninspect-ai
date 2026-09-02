import React, { useState } from "react";
import InspectionReportModal from "../components/InspectionReportModal";

function Upload({ onViewDashboard }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Idle, 1: Validating, 2: Quality Analysis, 3: Preprocessing, 4: AI Model Inference
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validate type
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

    setLoading(true);
    setErrorMessage(null);
    setResult(null);
    setStep(1);

    const formData = new FormData();
    formData.append("user_id", "1");
    formData.append("file", file);

    try {
      // Simulate visual pipeline step updates
      setTimeout(() => setStep(2), 300);
      setTimeout(() => setStep(3), 600);
      setTimeout(() => setStep(4), 900);

      const response = await fetch("http://127.0.0.1:8000/inspections/upload", {
        method: "POST",
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

  return (
    <div className="page-container">
      <div className="upload-header">
        <div>
          <h1 className="page-title">Upload Manufacturing Image</h1>
          <p className="page-subtitle">Run automated quality analysis, image preprocessing, and AI defect detection.</p>
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
                <strong>CV Preprocessing</strong>
                <p>Gaussian Denoising & CLAHE</p>
              </div>
            </div>

            <div className={`step-item ${step >= 4 ? "step-active" : ""}`}>
              <div className="step-num">4</div>
              <div className="step-label">
                <strong>AI Defect Model</strong>
                <p>Feature extraction & anomaly score</p>
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
                <span className={`prediction-badge ${result.prediction === "Anomaly" ? "badge-anomaly" : "badge-normal"}`}>
                  {result.prediction === "Anomaly" ? "⚠️ Anomaly Detected" : "✓ Normal Quality"}
                </span>
              </div>

              <div className="result-stats">
                <div className="result-stat-item">
                  <span className="stat-label">Model Confidence</span>
                  <span className="stat-value">{(result.confidence * 100).toFixed(1)}%</span>
                </div>

                <div className="result-stat-item">
                  <span className="stat-label">Quality Score</span>
                  <span className="stat-value">{result.quality_score}</span>
                </div>

                <div className="result-stat-item">
                  <span className="stat-label">Inference Speed</span>
                  <span className="stat-value">{result.processing_time_ms} ms</span>
                </div>
              </div>

              <div className="result-actions">
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => setShowReportModal(true)}
                >
                  📄 View Complete Inspection Report
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