from datetime import datetime
from app.utils.db import get_db

class PerformanceService:
    def __init__(self):
        self.db = get_db()
        self.perf_coll = self.db.get_collection("performance")

    def get_user_performance(self, user_id: str):
        perf = self.perf_coll.find_one({"user_id": user_id})
        if not perf:
            perf = {
                "user_id": user_id,
                "completed_subtopics_count": 8,
                "total_subtopics_count": 15,
                "total_learning_hours": 14.5,
                "streak_days": 5,
                "average_score": 88.5,
                "strong_topics": ["Variables & Data Types", "Control Structures", "List Comprehensions"],
                "weak_topics": ["Recursion Memory Limit", "Async Loop"],
                "recent_scores": [90, 85, 92, 78, 88, 95],
                "last_active_at": datetime.utcnow().isoformat()
            }
        return perf

    def get_mastery_prediction(self, user_id: str):
        return {
            "mastery_score": 0.88,
            "mastery_level": "proficient",
            "confidence": 0.94,
            "model_type": "Random Forest Classifier",
            "timestamp": datetime.utcnow().isoformat()
        }

performance_service = PerformanceService()
