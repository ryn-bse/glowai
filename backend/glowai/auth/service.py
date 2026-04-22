import os
import re
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from glowai.models.user import create_user, find_by_email, find_by_id
from glowai.models.session import create_session, invalidate_session, find_valid_session

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# Step field requirements
STEP1_REQUIRED = ["first_name", "last_name", "email", "date_of_birth", "gender"]
STEP2_REQUIRED = ["skin_type", "primary_concern", "skin_tone"]
STEP3_REQUIRED = ["password"]

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?[\d\s\-()]{7,20}$")


class AuthError(Exception):
    def __init__(self, message: str, status: int = 400):
        self.message = message
        self.status = status
        super().__init__(message)


class RegistrationValidationError(Exception):
    def __init__(self, field_errors: dict):
        self.field_errors = field_errors
        super().__init__(str(field_errors))


def validate_step(step: int, data: dict) -> dict:
    """Validate a registration step. Returns field_errors dict (empty = valid)."""
    errors = {}
    if step == 1:
        for field in STEP1_REQUIRED:
            if not data.get(field, "").strip():
                errors[field] = "This field is required."
        if "email" in data and data["email"] and not EMAIL_RE.match(data["email"]):
            errors["email"] = "Enter a valid email address."
        if "phone" in data and data["phone"] and not PHONE_RE.match(data["phone"]):
            errors["phone"] = "Enter a valid phone number."
    elif step == 2:
        for field in STEP2_REQUIRED:
            if not data.get(field, ""):
                errors[field] = "This field is required."
    elif step == 3:
        if not data.get("password", ""):
            errors["password"] = "This field is required."
        elif len(data["password"]) < 8:
            errors["password"] = "Password must be at least 8 characters."
        if not data.get("terms_agreed"):
            errors["terms_agreed"] = "You must agree to the Terms of Service."
    return errors


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def issue_jwt(user_id: str) -> str:
    payload = {
        "user_id": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def validate_jwt(token: str) -> dict:
    """Decode and validate JWT. Raises AuthError on failure."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthError("Token has expired.", status=401)
    except jwt.InvalidTokenError:
        raise AuthError("Invalid token.", status=401)


def register_user(step1: dict, step2: dict, step3: dict) -> tuple[dict, str]:
    """Register a new user from 3-step form data. Returns (user_doc, token)."""
    # Validate all steps
    errors = {}
    for step_num, data in [(1, step1), (2, step2), (3, step3)]:
        step_errors = validate_step(step_num, data)
        errors.update(step_errors)
    if errors:
        raise RegistrationValidationError(errors)

    email = step1["email"].lower().strip()

    # Check duplicate email in MongoDB
    if find_by_email(email):
        raise AuthError("An account with this email already exists.", status=409)

    # Register credentials in Supabase Auth (if configured), else fall back to bcrypt
    try:
        from glowai.supabase_auth import supabase_register, is_configured as supa_ok
        if supa_ok():
            supabase_register(email, step3["password"])
            password_hash = ""  # credentials stored in Supabase, not MongoDB
        else:
            password_hash = hash_password(step3["password"])
    except ValueError as e:
        raise AuthError(str(e), status=409)
    except Exception as e:
        # Log the actual error for debugging
        import traceback
        traceback.print_exc()
        raise AuthError(f"Registration failed: {str(e)}", status=500)

    user_data = {
        **step1,
        **step2,
        "known_allergies": step2.get("known_allergies", []),
        "password_hash": password_hash,
    }
    user = create_user(user_data)
    token = issue_jwt(str(user["_id"]))
    create_session(str(user["_id"]), token)
    return user, token


def login_user(email: str, password: str) -> tuple[dict, str]:
    """Authenticate user. Returns (user_doc, token). Uses identical error for wrong email/password."""
    GENERIC_ERROR = "Invalid credentials."
    email = email.lower().strip()

    # Verify credentials via Supabase Auth (if configured), else fall back to bcrypt
    try:
        from glowai.supabase_auth import supabase_login, is_configured as supa_ok
        if supa_ok():
            supabase_login(email, password)  # raises ValueError on bad credentials
        else:
            user = find_by_email(email)
            if not user or not verify_password(password, user.get("password_hash", "")):
                raise AuthError(GENERIC_ERROR, status=401)
    except ValueError:
        raise AuthError(GENERIC_ERROR, status=401)

    # Load user profile from MongoDB
    user = find_by_email(email)
    if not user:
        raise AuthError(GENERIC_ERROR, status=401)

    token = issue_jwt(str(user["_id"]))
    create_session(str(user["_id"]), token)
    return user, token


def logout_user(token: str) -> None:
    """Invalidate the session token."""
    invalidate_session(token)


def get_current_user(token: str) -> dict:
    """Validate token + session, return user doc. Raises AuthError if invalid."""
    payload = validate_jwt(token)
    session = find_valid_session(token)
    if not session:
        raise AuthError("Session has been invalidated.", status=401)
    user = find_by_id(payload["user_id"])
    if not user:
        raise AuthError("User not found.", status=401)
    return user
