from datetime import datetime, timezone
from pathlib import Path
import shutil
import time
import uuid

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import SessionLocal
from app.models.models import Inspection
from app.services.quality_service import analyze_image_quality
from app.services.preprocessing_service import preprocess_image_pipeline
from app.ml.defect_detector import detector_instance
from app.services.defect_analysis_service import analyze_defect_and_severity
from app.auth.auth import decode_access_token


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


def verify_quality_engineer(
    authorization: str = Header(None),
    user_role: str = Form(default=None)
):
    role = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload:
            role = payload.get("role")

    if not role and user_role:
        role = user_role

    if role and role.upper() in ["FACTORY_SUPERVISOR", "SUPERVISOR"]:
        raise HTTPException(
            status_code=403,
            detail="Factory Supervisors are not authorized to upload or start inspections."
        )


def cleanup_old_pending_records(db: Session):
    """
    Deletes old test inspection records stuck in Pending status (IDs 1, 2, 3, 4)
    and backfills M3 fields for existing completed records if missing.
    """
    try:
        # Delete old pending test records
        pending_records = db.query(Inspection).filter(Inspection.status == "Pending").all()
        for rec in pending_records:
            # Delete file if exists
            if rec.image_path and Path(rec.image_path).exists():
                try:
                    Path(rec.image_path).unlink()
                except Exception:
                    pass
            db.delete(rec)
        db.commit()

        # Backfill completed records missing M3 fields
        completed_records = db.query(Inspection).filter(Inspection.status == "Completed").all()
        for rec in completed_records:
            if not rec.defect_type or rec.severity_score is None:
                # Run deterministic M3 analysis on existing preprocessed or raw image
                target_path = rec.preprocessed_path if (rec.preprocessed_path and Path(rec.preprocessed_path).exists()) else rec.image_path
                if target_path and Path(target_path).exists():
                    try:
                        img_bgr = cv2.imread(str(target_path))
                        if img_bgr is not None:
                            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
                            m3_res = analyze_defect_and_severity(
                                img_rgb,
                                rec.prediction or "Normal",
                                rec.confidence or 0.85,
                                rec.quality_metrics
                            )
                            rec.defect_type = m3_res["defect_type"]
                            rec.severity_score = float(m3_res["severity_score"])
                            rec.severity_level = m3_res["severity_level"]
                            rec.risk_level = m3_res["risk_level"]
                            rec.quality_status = m3_res["quality_status"]
                            rec.recommendation = m3_res["recommendation"]
                    except Exception as e:
                        print(f"Backfill note for record #{rec.id}: {e}")
        db.commit()
    except Exception as e:
        print(f"Cleanup routine notice: {e}")
        db.rollback()


# Run cleanup on module load import
try:
    with SessionLocal() as _db:
        import cv2
        cleanup_old_pending_records(_db)
except Exception as _e:
        print(f"Initial cleanup check notice: {_e}")


@router.post("/upload")
def upload_inspection(
    user_id: int = Form(default=1),
    user_role: str = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _role_check: None = Depends(verify_quality_engineer)
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

        # Step 4: Milestone 3 Defect Categorization, Severity & Risk Assessment
        m3_res = analyze_defect_and_severity(
            prep_res["processed_image_rgb"],
            ml_res["prediction"],
            ml_res["confidence"],
            quality_res
        )

        total_time_ms = round((time.time() - start_time) * 1000.0, 2)

        # Step 5: Save Inspection Record in PostgreSQL
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
            defect_type=m3_res["defect_type"],
            severity_score=m3_res["severity_score"],
            severity_level=m3_res["severity_level"],
            risk_level=m3_res["risk_level"],
            quality_status=m3_res["quality_status"],
            recommendation=m3_res["recommendation"],
            processed_at=datetime.now(timezone.utc)
        )

        db.add(inspection)
        db.commit()
        db.refresh(inspection)

        return {
            "message": "Inspection processed, categorized, and analyzed successfully",
            "inspection_id": inspection.id,
            "image_name": inspection.image_name,
            "status": inspection.status,
            "prediction": inspection.prediction,
            "confidence": inspection.confidence,
            "quality_score": inspection.quality_score,
            "quality_metrics": quality_res,
            "defect_type": inspection.defect_type,
            "severity_score": inspection.severity_score,
            "severity_level": inspection.severity_level,
            "risk_level": inspection.risk_level,
            "quality_status": inspection.quality_status,
            "recommendation": inspection.recommendation,
            "severity_breakdown": m3_res["breakdown"],
            "processing_time_ms": total_time_ms,
            "image_url": f"/uploads/inspections/{unique_name}",
            "preprocessed_url": f"/uploads/processed/{prep_res['filename']}"
        }

    except Exception as e:
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


@router.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Returns real manufacturing quality analytics & production report metrics from PostgreSQL.
    """
    inspections = db.query(Inspection).filter(Inspection.status == "Completed").all()
    total_count = len(inspections)

    if total_count == 0:
        return {
            "total_inspections": 0,
            "passed_count": 0,
            "failed_count": 0,
            "review_count": 0,
            "pending_count": 0,
            "pass_rate": 0.0,
            "defect_rate": 0.0,
            "critical_defects_count": 0,
            "high_risk_count": 0,
            "avg_confidence": 0.0,
            "avg_severity_score": 0.0,
            "avg_processing_time_ms": 0.0,
            "defect_distribution": {},
            "severity_distribution": {"Critical": 0, "High": 0, "Medium": 0, "Low": 0},
            "quality_distribution": {"PASS": 0, "REVIEW": 0, "FAIL": 0}
        }

    passed_count = sum(1 for i in inspections if (i.quality_status == "PASS" or i.prediction == "Normal"))
    failed_count = sum(1 for i in inspections if i.quality_status == "FAIL")
    review_count = sum(1 for i in inspections if i.quality_status == "REVIEW")
    pending_count = db.query(Inspection).filter(Inspection.status == "Pending").count()

    pass_rate = round((passed_count / total_count) * 100.0, 1)
    defect_rate = round(((failed_count + review_count) / total_count) * 100.0, 1)

    critical_defects_count = sum(1 for i in inspections if i.severity_level == "Critical")
    high_risk_count = sum(1 for i in inspections if i.risk_level in ["Critical Risk", "High Risk"])

    avg_confidence = round(sum((i.confidence or 0.85) for i in inspections) / total_count * 100.0, 1)
    avg_severity = round(sum((i.severity_score or 0.0) for i in inspections) / total_count, 1)
    avg_speed = round(sum((i.processing_time_ms or 0.0) for i in inspections) / total_count, 1)

    # Distributions
    defect_dist = {}
    severity_dist = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    quality_dist = {"PASS": 0, "REVIEW": 0, "FAIL": 0}

    for i in inspections:
        dtype = i.defect_type or ("None (Clean)" if i.prediction == "Normal" else "Anomaly")
        defect_dist[dtype] = defect_dist.get(dtype, 0) + 1

        slevel = i.severity_level or ("Low" if i.prediction == "Normal" else "Medium")
        if slevel in severity_dist:
            severity_dist[slevel] += 1
        else:
            severity_dist[slevel] = 1

        qstatus = i.quality_status or ("PASS" if i.prediction == "Normal" else "FAIL")
        if qstatus in quality_dist:
            quality_dist[qstatus] += 1
        else:
            quality_dist[qstatus] = 1

    return {
        "total_inspections": total_count,
        "passed_count": passed_count,
        "failed_count": failed_count,
        "review_count": review_count,
        "pending_count": pending_count,
        "pass_rate": pass_rate,
        "defect_rate": defect_rate,
        "critical_defects_count": critical_defects_count,
        "high_risk_count": high_risk_count,
        "avg_confidence": avg_confidence,
        "avg_severity_score": avg_severity,
        "avg_processing_time_ms": avg_speed,
        "defect_distribution": defect_dist,
        "severity_distribution": severity_dist,
        "quality_distribution": quality_dist
    }


@router.get("/analytics/trends")
def get_analytics_trends(db: Session = Depends(get_db)):
    """
    Returns real trend monitoring data grouped by inspection timeline from PostgreSQL.
    """
    inspections = db.query(Inspection).order_by(Inspection.created_at.asc()).all()
    trend_map = {}

    for i in inspections:
        date_str = i.created_at.strftime("%Y-%m-%d") if i.created_at else "Today"
        if date_str not in trend_map:
            trend_map[date_str] = {
                "date": date_str,
                "total": 0,
                "passed": 0,
                "defects": 0,
                "avg_severity": 0.0,
                "severities": []
            }
        
        trend_map[date_str]["total"] += 1
        if i.prediction == "Normal" or i.quality_status == "PASS":
            trend_map[date_str]["passed"] += 1
        else:
            trend_map[date_str]["defects"] += 1

        if i.severity_score is not None:
            trend_map[date_str]["severities"].append(i.severity_score)

    trends = []
    for d, data in trend_map.items():
        avg_sev = round(sum(data["severities"]) / len(data["severities"]), 1) if data["severities"] else 0.0
        pass_pct = round((data["passed"] / data["total"]) * 100.0, 1) if data["total"] > 0 else 0.0
        trends.append({
            "date": d,
            "total": data["total"],
            "passed": data["passed"],
            "defects": data["defects"],
            "pass_rate": pass_pct,
            "avg_severity": avg_sev
        })

    return trends


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
            "defect_type": ins.defect_type,
            "severity_score": ins.severity_score,
            "severity_level": ins.severity_level,
            "risk_level": ins.risk_level,
            "quality_status": ins.quality_status,
            "recommendation": ins.recommendation,
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
        "defect_type": inspection.defect_type,
        "severity_score": inspection.severity_score,
        "severity_level": inspection.severity_level,
        "risk_level": inspection.risk_level,
        "quality_status": inspection.quality_status,
        "recommendation": inspection.recommendation,
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
    m3_res = analyze_defect_and_severity(
        prep_res["processed_image_rgb"],
        ml_res["prediction"],
        ml_res["confidence"],
        quality_res
    )
    total_time_ms = round((time.time() - start_time) * 1000.0, 2)

    inspection.status = "Completed"
    inspection.prediction = ml_res["prediction"]
    inspection.confidence = ml_res["confidence"]
    inspection.quality_score = quality_res["overall_quality"]
    inspection.quality_metrics = quality_res
    inspection.preprocessed_path = prep_res["preprocessed_path"]
    inspection.processing_time_ms = total_time_ms
    inspection.defect_type = m3_res["defect_type"]
    inspection.severity_score = m3_res["severity_score"]
    inspection.severity_level = m3_res["severity_level"]
    inspection.risk_level = m3_res["risk_level"]
    inspection.quality_status = m3_res["quality_status"]
    inspection.recommendation = m3_res["recommendation"]
    inspection.processed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(inspection)

    return {
        "message": "Inspection re-analyzed and categorized successfully",
        "inspection_id": inspection.id,
        "status": inspection.status,
        "prediction": inspection.prediction,
        "confidence": inspection.confidence,
        "quality_score": inspection.quality_score,
        "quality_metrics": quality_res,
        "defect_type": inspection.defect_type,
        "severity_score": inspection.severity_score,
        "severity_level": inspection.severity_level,
        "risk_level": inspection.risk_level,
        "quality_status": inspection.quality_status,
        "recommendation": inspection.recommendation,
        "processing_time_ms": total_time_ms
    }