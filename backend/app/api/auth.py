"""Authentication and User Profile endpoints for KMLR."""
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import bcrypt

from ..database import get_db, User, UserPreference
from ..schemas import UserCreate, UserLogin, UserOut, Token, UserPreferenceUpdate, UserPreferenceOut

SECRET_KEY = "kmlr-kochi-transit-super-secret-jwt-key-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None

    user = db.query(User).filter(User.email == email).first()
    return user


@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        is_admin=(user_in.email == "admin@kmlr.kerala.gov.in")
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default preferences
    pref = UserPreference(user_id=user.id)
    db.add(pref)
    db.commit()

    token = create_access_token({"sub": user.email, "id": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": user.email, "id": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserOut)
def get_me(user: Optional[User] = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.get("/preferences", response_model=UserPreferenceOut)
def get_preferences(user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user:
        # Default guest preferences
        return UserPreferenceOut(
            preferred_mode="any",
            max_walking_meters=1000,
            preference_profile="fastest",
            wheelchair_accessible=False,
            avoid_modes=""
        )
    pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    if not pref:
        pref = UserPreference(user_id=user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.put("/preferences", response_model=UserPreferenceOut)
def update_preferences(pref_in: UserPreferenceUpdate, user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=401, detail="Please log in to save preferences")

    pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    if not pref:
        pref = UserPreference(user_id=user.id)
        db.add(pref)

    pref.preferred_mode = pref_in.preferred_mode or pref.preferred_mode
    pref.max_walking_meters = pref_in.max_walking_meters or pref.max_walking_meters
    pref.preference_profile = pref_in.preference_profile or pref.preference_profile
    if pref_in.wheelchair_accessible is not None:
        pref.wheelchair_accessible = pref_in.wheelchair_accessible
    if pref_in.avoid_modes is not None:
        pref.avoid_modes = pref_in.avoid_modes

    db.commit()
    db.refresh(pref)
    return pref
