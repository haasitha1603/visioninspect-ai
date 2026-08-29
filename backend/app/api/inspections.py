from pathlib import Path
import shutil
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.models import Inspection


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
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG and PNG images are allowed"
        )

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    unique_name = f"{uuid.uuid4()}{extension}"

    file_path = UPLOAD_DIR / unique_name

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    inspection = Inspection(
        user_id=user_id,
        image_name=file.filename,
        image_path=str(file_path),
        status="Pending"
    )

    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    return {
        "message": "Image uploaded successfully",
        "inspection_id": inspection.id,
        "image_name": inspection.image_name,
        "status": inspection.status
    }

@router.get("")
def get_inspections(
    db: Session = Depends(get_db)
):
    inspections = db.query(Inspection).order_by(
        Inspection.created_at.desc()
    ).all()

    return inspections