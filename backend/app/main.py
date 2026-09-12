from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.database import engine, Base
from app.models.models import User, Inspection
from app.api.auth import router as auth_router
from app.api.inspections import router as inspection_router


app = FastAPI(
    title="VisionInspect AI",
    description="AI-powered manufacturing quality inspection platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def auto_migrate_db():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        columns = [
            ("prediction", "VARCHAR(100)"),
            ("confidence", "FLOAT"),
            ("quality_score", "VARCHAR(50)"),
            ("quality_metrics", "JSON"),
            ("preprocessed_path", "VARCHAR(500)"),
            ("processing_time_ms", "FLOAT"),
            ("processed_at", "TIMESTAMP WITH TIME ZONE"),
            ("defect_type", "VARCHAR(100)"),
            ("severity_score", "FLOAT"),
            ("severity_level", "VARCHAR(50)"),
            ("risk_level", "VARCHAR(50)"),
            ("quality_status", "VARCHAR(50)"),
            ("recommendation", "VARCHAR(255)")
        ]
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE inspections ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
            except Exception as e:
                print(f"Column migration check note ({col_name}): {e}")


auto_migrate_db()

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(auth_router)
app.include_router(inspection_router)


@app.get("/")
def root():
    return {
        "message": "VisionInspect AI API is running",
        "version": "1.0.0",
        "status": "Healthy"
    }