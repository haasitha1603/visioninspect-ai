from datetime import datetime, timezone
from pathlib import Path
import shutil
import time
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.models import Inspection
from app.services.quality_service import analyze_image_quality
from app.services.preprocessing_service import preprocess_image_pipeline
from app.ml.defect_detector import detector_instance


router = APIRouter(
    prefix="/inspections",
    tags=["Inspections"]
)


UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "inspections"

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png"
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload")
def upload_inspection(
    user_id: int = Form(default=1),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    start_time = time.time()
    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG and PNG images are allowed"
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    unique_name = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / unique_name

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Step 1: Quality Analysis
        quality_res = analyze_image_quality(str(file_path))

        # Step 2: Preprocessing
        prep_res = preprocess_image_pipeline(str(file_path), output_filename=f"proc_{unique_name}")

        # Step 3: Defect Detection Model Inference
        ml_res = detector_instance.predict(prep_res["processed_image_rgb"])

        total_time_ms = round((time.time() - start_time) * 1000.0, 2)

        # Step 4: Create Inspection record in DB
        inspection = Inspection(
            user_id=user_id,
            image_name=file.filename,
            image_path=str(file_path),
            preprocessed_path=prep_res["preprocessed_path"],
            status="Completed",
            prediction=ml_res["prediction"],
            confidence=ml_res["confidence"],
            quality_score=quality_res["overall_quality"],
            quality_metrics=quality_res,
            processing_time_ms=total_time_ms,
            processed_at=datetime.now(timezone.utc)
        )

        db.add(inspection)
        db.commit()
        db.refresh(inspection)

        return {
            "message": "Inspection processed and analyzed successfully",
            "inspection_id": inspection.id,
            "image_name": inspection.image_name,
            "status": inspection.status,
            "prediction": inspection.prediction,
            "confidence": inspection.confidence,
            "quality_score": inspection.quality_score,
            "quality_metrics": quality_res,
            "processing_time_ms": total_time_ms,
            "image_url": f"/uploads/inspections/{unique_name}",
            "preprocessed_url": f"/uploads/processed/{prep_res['filename']}"
        }

    except Exception as e:
        # If processing fails, save record with Failed status
        inspection = Inspection(
            user_id=user_id,
            image_name=file.filename,
            image_path=str(file_path),
            status="Failed"
        )
        db.add(inspection)
        db.commit()
        db.refresh(inspection)

        raise HTTPException(
            status_code=500,
            detail=f"Failed to process inspection: {str(e)}"
        )


@router.get("")
def get_inspections(db: Session = Depends(get_db)):
    inspections = db.query(Inspection).order_by(Inspection.created_at.desc()).all()
    results = []

    for ins in inspections:
        img_name = Path(ins.image_path).name if ins.image_path else ""
        proc_name = Path(ins.preprocessed_path).name if ins.preprocessed_path else ""

        results.append({
            "id": ins.id,
            "user_id": ins.user_id,
            "image_name": ins.image_name,
            "image_path": ins.image_path,
            "preprocessed_path": ins.preprocessed_path,
            "image_url": f"/uploads/inspections/{img_name}" if img_name else None,
            "preprocessed_url": f"/uploads/processed/{proc_name}" if proc_name else None,
            "status": ins.status,
            "prediction": ins.prediction,
            "confidence": ins.confidence,
            "quality_score": ins.quality_score,
            "quality_metrics": ins.quality_metrics,
            "processing_time_ms": ins.processing_time_ms,
            "created_at": ins.created_at.isoformat() if ins.created_at else None,
            "processed_at": ins.processed_at.isoformat() if ins.processed_at else None
        })

    return results


@router.get("/{inspection_id}")
def get_inspection_detail(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    img_name = Path(inspection.image_path).name if inspection.image_path else ""
    proc_name = Path(inspection.preprocessed_path).name if inspection.preprocessed_path else ""

    return {
        "id": inspection.id,
        "user_id": inspection.user_id,
        "image_name": inspection.image_name,
        "image_path": inspection.image_path,
        "preprocessed_path": inspection.preprocessed_path,
        "image_url": f"/uploads/inspections/{img_name}" if img_name else None,
        "preprocessed_url": f"/uploads/processed/{proc_name}" if proc_name else None,
        "status": inspection.status,
        "prediction": inspection.prediction,
        "confidence": inspection.confidence,
        "quality_score": inspection.quality_score,
        "quality_metrics": inspection.quality_metrics,
        "processing_time_ms": inspection.processing_time_ms,
        "created_at": inspection.created_at.isoformat() if inspection.created_at else None,
        "processed_at": inspection.processed_at.isoformat() if inspection.processed_at else None
    }


@router.post("/{inspection_id}/analyze")
def analyze_existing_inspection(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    if not Path(inspection.image_path).exists():
        raise HTTPException(status_code=400, detail="Source image file missing on server")

    start_time = time.time()
    unique_name = Path(inspection.image_path).name

    quality_res = analyze_image_quality(inspection.image_path)
    prep_res = preprocess_image_pipeline(inspection.image_path, output_filename=f"proc_{unique_name}")
    ml_res = detector_instance.predict(prep_res["processed_image_rgb"])
    total_time_ms = round((time.time() - start_time) * 1000.0, 2)

    inspection.status = "Completed"
    inspection.prediction = ml_res["prediction"]
    inspection.confidence = ml_res["confidence"]
    inspection.quality_score = quality_res["overall_quality"]
    inspection.quality_metrics = quality_res
    inspection.preprocessed_path = prep_res["preprocessed_path"]
    inspection.processing_time_ms = total_time_ms
    inspection.processed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(inspection)

    return {
        "message": "Inspection re-analyzed successfully",
        "inspection_id": inspection.id,
        "status": inspection.status,
        "prediction": inspection.prediction,
        "confidence": inspection.confidence,
        "quality_score": inspection.quality_score,
        "quality_metrics": quality_res,
        "processing_time_ms": total_time_ms
    }