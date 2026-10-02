from datetime import datetime, timezone

class UserModel:
    @staticmethod
    def create_user_doc(user_id: str, email: str, full_name: str, password_hash: str) -> dict:
        return {
            "id": user_id,
            "email": email.lower().strip(),
            "full_name": full_name.strip(),
            "password": password_hash,
            "role": "learner",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "avatar_url": None,
        }

    @staticmethod
    def to_public_dict(user_doc: dict) -> dict:
        if not user_doc:
            return None
        return {
            "id": user_doc.get("id") or user_doc.get("_id"),
            "email": user_doc.get("email"),
            "full_name": user_doc.get("full_name"),
            "role": user_doc.get("role", "learner"),
            "created_at": user_doc.get("created_at"),
            "avatar_url": user_doc.get("avatar_url"),
        }
