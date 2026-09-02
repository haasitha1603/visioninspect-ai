from app.ml.defect_detector import DefectDetector

def main():
    print("=== VisionInspect AI Model Training ===")
    detector = DefectDetector()
    detector.train_on_mvtec(max_samples_per_category=50)
    print("=== Training Complete ===")

if __name__ == "__main__":
    main()
