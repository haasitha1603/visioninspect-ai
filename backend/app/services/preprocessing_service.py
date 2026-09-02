from pathlib import Path
import cv2
import numpy as np
from PIL import Image


PROCESSED_DIR = Path(__file__).resolve().parents[2] / "uploads" / "processed"


def preprocess_image_pipeline(image_path: str, output_filename: str = None) -> dict:
    """
    Image preprocessing pipeline for manufacturing defect detection:
    1. Validation & loading
    2. Color space conversion (RGB)
    3. Resizing (256x256)
    4. Denoising (Gaussian Blur)
    5. Contrast enhancement (CLAHE on luminance channel)
    6. Normalization
    7. Save preprocessed image
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Input image not found: {image_path}")

    # Verify PIL image can be opened
    try:
        with Image.open(path) as img:
            img.verify()
    except Exception as e:
        raise ValueError(f"Invalid or corrupted image file: {e}")

    # Read image using OpenCV
    img_bgr = cv2.imread(str(path))
    if img_bgr is None:
        raise ValueError(f"Could not decode image at {image_path}")

    # Convert BGR to RGB
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # Standardized Resizing to 256x256
    target_size = (256, 256)
    resized_rgb = cv2.resize(img_rgb, target_size, interpolation=cv2.INTER_AREA)

    # Denoising using Gaussian Blur
    denoised_rgb = cv2.GaussianBlur(resized_rgb, (3, 3), 0)

    # Contrast Enhancement using CLAHE on LAB color space (L channel)
    lab = cv2.cvtColor(denoised_rgb, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    enhanced_lab = cv2.merge((cl, a, b))
    enhanced_rgb = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)

    # Normalization (0.0 to 1.0)
    normalized_array = enhanced_rgb.astype(np.float32) / 255.0

    # Ensure output directory exists
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    if not output_filename:
        output_filename = f"proc_{path.name}"
    
    out_path = PROCESSED_DIR / output_filename
    enhanced_bgr = cv2.cvtColor(enhanced_rgb, cv2.COLOR_RGB2BGR)
    cv2.imwrite(str(out_path), enhanced_bgr)

    return {
        "preprocessed_path": str(out_path),
        "filename": out_path.name,
        "processed_image_rgb": enhanced_rgb,
        "normalized_matrix": normalized_array,
        "original_shape": img_bgr.shape,
        "target_size": target_size
    }
