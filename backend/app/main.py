from app.api.auth import router as auth_router
from app.api.inspections import router as inspection_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models.models import User, Inspection

app = FastAPI(
    title="VisionInspect AI",
    description="AI-powered manufacturing quality inspection platform",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)
app.include_router(auth_router)
app.include_router(inspection_router)
@app.get("/")
def root():
    return {
        "message": "VisionInspect AI API is running"
    }