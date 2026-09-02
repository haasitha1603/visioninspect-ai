from pathlib import Path
import cv2
import numpy as np


def analyze_image_quality(image_path: str) -> dict:
    """
    Computes quantitative image quality analysis metrics:
    - Resolution & channel count
    - File size in KB
    - Brightness (mean luminance 0-255)
    - Contrast (std dev of luminance)
    - Sharpness / Blur score (Laplacian variance)
    - Categorical status per metric & overall quality grade
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    file_size_kb = round(path.stat().st_size / 1024.0, 2)

    img_bgr = cv2.imread(str(path))
    if img_bgr is None:
        raise ValueError("Failed to load image for quality analysis")

    height, width = img_bgr.shape[:2]
    channels = img_bgr.shape[2] if len(img_bgr.shape) == 3 else 1

    # Convert to grayscale for brightness, contrast, and sharpness metrics
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Brightness (mean pixel intensity)
    brightness = float(np.mean(gray))

    # Contrast (standard deviation of pixel intensities)
    contrast = float(np.std(gray))

    # Sharpness (Laplacian variance - higher means sharper image, lower means blurrier)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness = float(np.var(laplacian))

    # Evaluate metric statuses
    # Brightness status (Optimal between 60 and 200)
    if 70 <= brightness <= 190:
        brightness_status = "Good"
    elif 40 <= brightness <= 220:
        brightness_status = "Acceptable"
    else:
        brightness_status = "Poor"

    # Contrast status (Optimal >= 35)
    if contrast >= 40:
        contrast_status = "Good"
    elif contrast >= 20:
        contrast_status = "Acceptable"
    else:
        contrast_status = "Poor"

    # Sharpness status (Optimal Laplacian variance >= 100)
    if sharpness >= 100:
        sharpness_status = "Good"
    elif sharpness >= 30:
        sharpness_status = "Acceptable"
    else:
        sharpness_status = "Poor"

    # Overall Quality Assessment
    statuses = [brightness_status, contrast_status, sharpness_status]
    if statuses.count("Good") >= 2 and "Poor" not in statuses:
        overall_quality = "Good"
    elif "Poor" in statuses and statuses.count("Poor") >= 2:
        overall_quality = "Poor"
    else:
        overall_quality = "Acceptable"

    return {
        "width": width,
        "height": height,
        "channels": channels,
        "resolution": f"{width} × {height}",
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "file_size_kb": file_size_kb,
        "brightness_status": brightness_status,
        "contrast_status": contrast_status,
        "sharpness_status": sharpness_status,
        "overall_quality": overall_quality
    }
