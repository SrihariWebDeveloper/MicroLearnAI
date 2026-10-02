from datetime import datetime, timezone


class AdminService:
    def __init__(self, db):
        self.db = db
        self.users = db.get_collection("users")

    def get_status(self):
        manager = self.db
        return {
            "database_connected": bool(getattr(manager, "is_connected", False)),
            "environment": "development" if getattr(manager, "allow_memory_fallback", False) else "configured",
            "user_count": len(self.users.find({})),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    def list_users(self):
        output = []
        for user in self.users.find({}):
            output.append({
                "id": user.get("id"),
                "full_name": user.get("full_name"),
                "email": user.get("email"),
                "role": user.get("role", "learner"),
                "created_at": user.get("created_at"),
            })
        return output

    def update_role(self, actor_id, user_id, role):
        if role not in {"learner", "admin"}:
            raise ValueError("Role must be learner or admin.")
        target = self.users.find_one({"id": user_id})
        if not target:
            return False
        if actor_id == user_id and role != "admin":
            raise ValueError("Administrators cannot remove their own administrator role.")
        self.users.update_one({"id": user_id}, {"$set": {"role": role}})
        return True