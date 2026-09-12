import cv2
import numpy as np


def analyze_defect_and_severity(
    img_rgb: np.ndarray,
    prediction: str,
    confidence: float,
    quality_metrics: dict = None
) -> dict:
    """
    Milestone 3 Defect Categorization, Severity Scoring & Quality Risk Assessment Engine.

    Formula (Official Project Specification):
    Severity Score = (Size * 30%) + (Location * 25%) + (Defect Type * 25%) + (Confidence * 20%)

    Severity Levels:
    - Critical (80 - 100)
    - High (60 - 79)
    - Medium (40 - 59)
    - Low (0 - 39)
    """
    is_anomaly = (prediction == "Anomaly")

    if not is_anomaly:
        return {
            "defect_type": "None (Clean)",
            "severity_score": 0.0,
            "severity_level": "Low",
            "risk_level": "Acceptable",
            "quality_status": "PASS",
            "recommendation": "Product quality acceptable — approve for production release.",
            "breakdown": {
                "size_score": 0.0,
                "location_score": 0.0,
                "defect_type_score": 0.0,
                "confidence_score": round(confidence * 100.0, 1)
            }
        }

    # Ensure standardized 256x256 dimensions for spatial analysis
    if img_rgb.shape[:2] != (256, 256):
        img_rgb = cv2.resize(img_rgb, (256, 256))

    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)

    # 1. Defect Feature & Subtype Analysis
    # Sobel gradient line energy
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.sqrt(sobelx**2 + sobely**2)
    max_grad = np.max(grad_mag)
    mean_grad = np.mean(grad_mag)

    # Color variance across 4x4 spatial cells
    cell_h, cell_w = 64, 64
    cell_stds = []
    cell_means = []
    for i in range(4):
        for j in range(4):
            cell = gray[i*cell_h:(i+1)*cell_h, j*cell_w:(j+1)*cell_w]
            cell_stds.append(np.std(cell))
            cell_means.append(np.mean(cell))

    std_diff = max(cell_stds) - min(cell_stds)
    mean_diff = max(cell_means) - min(cell_means)

    # Determine defect category based on physical edge & color variance signatures
    if max_grad > 180 and mean_grad > 25:
        defect_type = "Crack / Break"
        type_score = 95.0
    elif mean_diff > 75 or std_diff > 45:
        defect_type = "Contamination"
        type_score = 70.0
    elif max_grad > 110:
        defect_type = "Surface Scratch / Dent"
        type_score = 50.0
    else:
        defect_type = "Structural Defect"
        type_score = 85.0

    # 2. Defect Size Score (0-100)
    # Threshold high-variance regions to estimate anomalous contour coverage
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    diff_pixels = np.count_nonzero(thresh == 0)
    coverage_ratio = diff_pixels / (256.0 * 256.0)
    size_score = min(100.0, round(coverage_ratio * 150.0 + 40.0, 1))

    # 3. Defect Location Score (0-100)
    # Distance from center of product surface (128, 128)
    M = cv2.moments(thresh)
    if M["m00"] != 0:
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
        dist_from_center = np.sqrt((cx - 128)**2 + (cy - 128)**2)
        # Inner 50% radius (dist < 64) is critical component zone
        location_score = 90.0 if dist_from_center < 64 else 60.0
    else:
        location_score = 70.0

    # 4. Confidence Score (0-100)
    conf_score = round(confidence * 100.0, 1)

    # 5. Overall Weighted Severity Calculation
    # Formula: Size (30%) + Location (25%) + Defect Type (25%) + Confidence (20%)
    severity_raw = (
        (float(size_score) * 0.30) +
        (float(location_score) * 0.25) +
        (float(type_score) * 0.25) +
        (float(conf_score) * 0.20)
    )
    severity_score = float(round(min(100.0, max(0.0, severity_raw)), 1))

    # 6. Map Severity Score to Severity Level
    if severity_score >= 80.0:
        severity_level = "Critical"
        risk_level = "Critical Risk"
        quality_status = "FAIL"
        recommendation = "Reject product and trigger immediate quality containment workflow."
    elif severity_score >= 60.0:
        severity_level = "High"
        risk_level = "High Risk"
        quality_status = "FAIL"
        recommendation = "Reject product and send to rework line for technical inspection."
    elif severity_score >= 40.0:
        severity_level = "Medium"
        risk_level = "Moderate Risk"
        quality_status = "REVIEW"
        recommendation = "Moderate concern — trigger manual quality inspector review."
    else:
        severity_level = "Low"
        risk_level = "Low Risk"
        quality_status = "PASS" if confidence > 0.85 else "REVIEW"
        recommendation = "Minor cosmetic variation — acceptable for secondary grade release."

    return {
        "defect_type": defect_type,
        "severity_score": float(severity_score),
        "severity_level": severity_level,
        "risk_level": risk_level,
        "quality_status": quality_status,
        "recommendation": recommendation,
        "breakdown": {
            "size_score": float(size_score),
            "location_score": float(location_score),
            "defect_type_score": float(type_score),
            "confidence_score": float(conf_score)
        }
    }
