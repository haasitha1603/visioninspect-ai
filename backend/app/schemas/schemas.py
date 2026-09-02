from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "QUALITY_ENGINEER"


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QualityMetricsSchema(BaseModel):
    width: int
    height: int
    channels: int
    resolution: str
    brightness: float
    contrast: float
    sharpness: float
    file_size_kb: float
    brightness_status: str
    contrast_status: str
    sharpness_status: str
    overall_quality: str


class InspectionOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    image_name: str
    image_path: str
    status: str
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    quality_score: Optional[str] = None
    quality_metrics: Optional[Dict[str, Any]] = None
    preprocessed_path: Optional[str] = None
    processing_time_ms: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
