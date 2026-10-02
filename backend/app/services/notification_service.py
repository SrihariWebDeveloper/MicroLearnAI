import uuid
from datetime import datetime, timezone


class NotificationService:
    def __init__(self, db):
        self.notifications = db.get_collection("notifications")

    def create(self, user_id, title, message, kind="system", action_url=None):
        notification = {
            "id": f"notification_{uuid.uuid4().hex}",
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": kind,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "action_url": action_url,
        }
        self.notifications.insert_one(notification)
        return notification

    def get_for_user(self, user_id):
        items = self.notifications.find({"user_id": user_id})
        items.sort(key=lambda item: item.get("created_at", ""), reverse=True)
        return items

    def mark_read(self, user_id, notification_id):
        return self.notifications.update_one(
            {"user_id": user_id, "id": notification_id},
            {"$set": {"is_read": True}},
        )

    def mark_all_read(self, user_id):
        for notification in self.notifications.find({"user_id": user_id}):
            self.notifications.update_one(
                {"user_id": user_id, "id": notification["id"]},
                {"$set": {"is_read": True}},
            )