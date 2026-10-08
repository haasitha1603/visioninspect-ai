import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

is_vercel = os.getenv("VERCEL") == "1" or "VERCEL" in os.environ

if not DATABASE_URL or is_vercel:
    # Use SQLite in temp directory for Vercel serverless environment or fallback
    db_path = Path(tempfile.gettempdir()) / "visioninspect.db"
    DATABASE_URL = f"sqlite:///{db_path}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception:
    # Fallback to SQLite in temp directory if PostgreSQL server is unreachable
    db_path = Path(tempfile.gettempdir()) / "visioninspect.db"
    DATABASE_URL = f"sqlite:///{db_path}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()