from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    image_name = Column(String(255), nullable=False)
    image_path = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False, default="Pending")
    prediction = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    quality_score = Column(String(50), nullable=True)
    quality_metrics = Column(JSON, nullable=True)
    preprocessed_path = Column(String(500), nullable=True)
    processing_time_ms = Column(Float, nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())