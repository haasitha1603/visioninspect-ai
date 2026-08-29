from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = PROJECT_ROOT / "dataset" / "raw" / "mvtec_anomaly_detection"


def get_categories():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"MVTec dataset not found at: {DATASET_PATH}"
        )

    categories = [
        folder.name
        for folder in DATASET_PATH.iterdir()
        if folder.is_dir()
    ]

    return sorted(categories)


def get_images(category):
    category_path = DATASET_PATH / category / "train" / "good"

    if not category_path.exists():
        raise FileNotFoundError(
            f"Category path not found: {category_path}"
        )

    images = [
        file
        for file in category_path.iterdir()
        if file.suffix.lower() in [".png", ".jpg", ".jpeg"]
    ]

    return sorted(images)