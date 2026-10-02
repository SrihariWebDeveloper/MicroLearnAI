from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password: str) -> str:
    """Hashes plain text password securely."""
    return generate_password_hash(password, method='pbkdf2:sha256')

def verify_password(hashed_password: str, password: str) -> bool:
    """Verifies plain text password against hash."""
    return check_password_hash(hashed_password, password)
