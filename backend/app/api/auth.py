from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.models import User
from app.auth.auth import hash_password, verify_password, create_access_token
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    if user_data.role not in ["QUALITY_ENGINEER", "FACTORY_SUPERVISOR"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be QUALITY_ENGINEER or FACTORY_SUPERVISOR."
        )

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(
        {
            "sub": str(new_user.id),
            "role": new_user.role,
            "name": new_user.name
        }
    )

    return {
        "message": "User registered successfully",
        "access_token": token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "name": new_user.name,
        "role": new_user.role
    }


@router.post("/login")
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == credentials.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role,
            "name": user.name
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "role": user.role
    }