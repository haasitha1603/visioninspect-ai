from pathlib import Path
import time
import cv2
import numpy as np

from app.dataset_loader import DATASET_PATH, get_categories
from app.ml.defect_detector import detector_instance
from app.services.preprocessing_service import preprocess_image_pipeline
from app.services.quality_service import analyze_image_quality


def evaluate_model_performance(max_images_per_subfolder: int = 15) -> dict:
    """
    Evaluates VisionInspect AI computer vision & anomaly detection model performance
    on MVTec AD test datasets.
    """
    print("=== Running VisionInspect AI Model Evaluation ===")

    try:
        categories = get_categories()
    except Exception as e:
        print(f"Evaluation notice: {e}")
        categories = []

    y_true = []
    y_pred = []
    prep_times = []
    infer_times = []

    for cat in categories:
        test_dir = DATASET_PATH / cat / "test"
        if not test_dir.exists():
            continue

        for sub in test_dir.iterdir():
            if not sub.is_dir():
                continue

            is_good = (sub.name == "good")
            label = 0 if is_good else 1  # 0 = Normal, 1 = Defect / Anomaly
            imgs = list(sub.glob("*.png")) + list(sub.glob("*.jpg"))

            for img_p in imgs[:max_images_per_subfolder]:
                # Measure Preprocessing Time
                t0 = time.time()
                try:
                    prep_res = preprocess_image_pipeline(str(img_p))
                    prep_time_ms = (time.time() - t0) * 1000.0
                    prep_times.append(prep_time_ms)
                except Exception:
                    continue

                # Measure AI Model Inference Time
                t1 = time.time()
                pred_res = detector_instance.predict(prep_res["processed_image_rgb"])
                infer_time_ms = (time.time() - t1) * 1000.0
                infer_times.append(infer_time_ms)

                pred_label = 1 if pred_res["is_anomaly"] else 0

                y_true.append(label)
                y_pred.append(pred_label)

    if len(y_true) == 0:
        return {
            "error": "No test images found for evaluation",
            "total_images": 0
        }

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))

    total = len(y_true)
    accuracy = round(float((tp + tn) / total * 100.0), 2)
    precision = round(float(tp / (tp + fp) * 100.0), 2) if (tp + fp) > 0 else 0.0
    recall = round(float(tp / (tp + fn) * 100.0), 2) if (tp + fn) > 0 else 0.0
    f1_score = round(float(2 * precision * recall / (precision + recall)), 2) if (precision + recall) > 0 else 0.0
    false_defect_rate = round(float(fp / (fp + tn) * 100.0), 2) if (fp + tn) > 0 else 0.0
    automation_rate = accuracy

    avg_prep_time_ms = round(float(np.mean(prep_times)), 2) if prep_times else 0.0
    avg_infer_time_ms = round(float(np.mean(infer_times)), 2) if infer_times else 0.0
    avg_total_response_ms = round(avg_prep_time_ms + avg_infer_time_ms, 2)

    eval_summary = {
        "dataset": "MVTec Anomaly Detection (MVTec AD)",
        "total_test_images_evaluated": total,
        "categories_evaluated": len(categories),
        "confusion_matrix": {
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn
        },
        "ai_model_performance": {
            "accuracy_pct": accuracy,
            "precision_pct": precision,
            "recall_pct": recall,
            "f1_score_pct": f1_score,
            "map_score_note": "mAP (mean Average Precision) is not applicable to the current anomaly-detection model because the model performs image-level anomaly decision scoring rather than bounding-box object detection."
        },
        "manufacturing_performance": {
            "inspection_automation_rate_pct": automation_rate,
            "defect_identification_accuracy_pct": accuracy,
            "false_defect_detection_rate_pct": false_defect_rate
        },
        "system_performance": {
            "avg_image_preprocessing_time_ms": avg_prep_time_ms,
            "avg_ai_inference_time_ms": avg_infer_time_ms,
            "avg_total_inspection_time_ms": avg_total_response_ms
        }
    }

    return eval_summary


def main():
    res = evaluate_model_performance(max_images_per_subfolder=15)
    print("\n=== Model Evaluation Results ===")
    import json
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
