from app.api.auth import router as auth_router
from fastapi import FastAPI
from app.database import engine, Base
from app.models.models import User, Inspection

app = FastAPI(
    title="VisionInspect AI",
    description="AI-powered manufacturing quality inspection platform",
    version="1.0.0"
)
Base.metadata.create_all(bind=engine)
app.include_router(auth_router)
@app.get("/")
def root():
    return {
        "message": "VisionInspect AI API is running"
    }