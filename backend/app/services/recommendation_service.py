import uuid
from datetime import datetime, timezone


class RecommendationService:
    def __init__(self, db, roadmap_service):
        self.results = db.get_collection("results")
        self.recommendations = db.get_collection("recommendations")
        self.roadmap_service = roadmap_service

    def get_for_user(self, user_id):
        results = self.results.find({"user_id": user_id})
        results.sort(key=lambda item: item.get("created_at", ""), reverse=True)
        if results and not results[0].get("passed"):
            result = results[0]
            return [self._recommendation(
                user_id,
                "revision",
                "Review and retry this assessment",
                "Your latest assessment was below the 85% progression threshold.",
                result.get("subtopic_id"),
                "Rule-based: the latest backend-scored assessment did not pass.",
                "high",
            )]

        roadmap = self.roadmap_service.get_roadmap_for_user(user_id)
        if not roadmap:
            return []
        for level in roadmap.get("levels", []):
            for subtopic in level.get("subtopics", []):
                if subtopic.get("status") == "in_progress":
                    return [self._recommendation(
                        user_id,
                        "next_subtopic",
                        "Continue your learning path",
                        f"Start {subtopic['title']} from your current roadmap.",
                        subtopic["id"],
                        "Rule-based: this is the next unlocked roadmap subtopic.",
                        "medium",
                    )]
        return []

    def dismiss(self, user_id, recommendation_id):
        return self.recommendations.update_one(
            {"id": recommendation_id, "user_id": user_id},
            {"$set": {"dismissed": True}},
        )

    def _recommendation(self, user_id, kind, title, description, target, reasoning, urgency):
        identifier = f"rec_{user_id}_{kind}_{target or 'general'}"
        stored = self.recommendations.find_one({"id": identifier, "user_id": user_id})
        if stored and stored.get("dismissed"):
            return None
        recommendation = stored or {
            "id": identifier,
            "user_id": user_id,
            "type": kind,
            "title": title,
            "description": description,
            "target_subtopic_id": target,
            "reasoning": reasoning,
            "urgency": urgency,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "dismissed": False,
        }
        if not stored:
            self.recommendations.insert_one(recommendation)
        recommendation.pop("_id", None)
        return recommendation