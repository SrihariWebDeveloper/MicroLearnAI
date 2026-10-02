import uuid
import re
from datetime import datetime, timezone
from flask_jwt_extended import create_access_token
from pymongo.errors import DuplicateKeyError
from app.utils.db import get_db
from app.utils.security import hash_password, verify_password
from app.models.user import UserModel
from app.models.learner_profile import LearnerProfileInput

class AuthService:
    def __init__(self, db=None):
        self.db = db or get_db()
        self.users_coll = self.db.get_collection("users")
        self.profiles_coll = self.db.get_collection("learner_profiles")

    def register(self, full_name: str, email: str, password: str):
        if not isinstance(full_name, str) or not full_name.strip() or len(full_name.strip()) > 120:
            raise ValueError("Full name is required and must be at most 120 characters.")
        if not isinstance(email, str) or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email.strip()):
            raise ValueError("A valid email address is required.")
        if not isinstance(password, str) or len(password) < 8 or len(password) > 128:
            raise ValueError("Password must be between 8 and 128 characters.")

        email_clean = email.lower().strip()
        existing = self.users_coll.find_one({"email": email_clean})
        if existing:
            raise ValueError("An account with this email address already exists.")

        user_id = f"usr_{uuid.uuid4().hex[:10]}"
        pwd_hash = hash_password(password)
        doc = UserModel.create_user_doc(user_id, email_clean, full_name, pwd_hash)
        try:
            self.users_coll.insert_one(doc)
        except DuplicateKeyError as error:
            raise ValueError("An account with this email address already exists.") from error

        token = create_access_token(identity=user_id)
        
        return {
            "user": UserModel.to_public_dict(doc),
            "token": token
        }

    def login(self, email: str, password: str):
        if not isinstance(email, str) or not isinstance(password, str):
            raise ValueError("Invalid email or password credentials.")
        email_clean = email.lower().strip()
        user_doc = self.users_coll.find_one({"email": email_clean})
        if not user_doc or not user_doc.get("password") or not verify_password(user_doc["password"], password):
            raise ValueError("Invalid email or password credentials.")

        user_id = user_doc["id"] if "id" in user_doc else str(user_doc["_id"])
        token = create_access_token(identity=user_id)

        return {
            "user": UserModel.to_public_dict(user_doc),
            "token": token
        }

    def get_user_by_id(self, user_id: str):
        user_doc = self.users_coll.find_one({"id": user_id})
        return UserModel.to_public_dict(user_doc)

    def update_user(self, user_id: str, full_name: str):
        if not isinstance(full_name, str) or not full_name.strip() or len(full_name.strip()) > 120:
            raise ValueError("Full name is required and must be at most 120 characters.")
        self.users_coll.update_one(
            {"id": user_id},
            {"$set": {"full_name": full_name.strip()}},
        )
        return self.get_user_by_id(user_id)

    def save_learner_profile(self, user_id: str, profile_data: dict):
        profile = LearnerProfileInput.model_validate(profile_data).model_dump()
        profile["user_id"] = user_id
        profile["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        existing = self.profiles_coll.find_one({"user_id": user_id})
        if existing:
            self.profiles_coll.update_one({"user_id": user_id}, {"$set": profile})
        else:
            profile["id"] = f"prof_{uuid.uuid4().hex[:10]}"
            profile["created_at"] = datetime.now(timezone.utc).isoformat()
            self.profiles_coll.insert_one(profile)
            
        return self.get_learner_profile(user_id)

    def get_learner_profile(self, user_id: str):
        prof = self.profiles_coll.find_one({"user_id": user_id})
        if not prof:
            return None
        prof.pop("_id", None)
        return prof

auth_service = AuthService()
