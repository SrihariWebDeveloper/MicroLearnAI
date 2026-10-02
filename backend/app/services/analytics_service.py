from collections import defaultdict
from datetime import datetime, timezone


class AnalyticsService:
    def __init__(self, db):
        self.roadmaps = db.get_collection("roadmaps")
        self.results = db.get_collection("results")
        self.attempts = db.get_collection("assessment_attempts")
        self.completions = db.get_collection("lesson_completions")

    def get_performance(self, user_id):
        roadmap = self.roadmaps.find_one({"user_id": user_id}) or {}
        subtopics = [
            subtopic
            for level in roadmap.get("levels", [])
            for subtopic in level.get("subtopics", [])
        ]
        records = self.results.find({"user_id": user_id})
        records.sort(key=lambda item: item.get("created_at", ""))
        scores = [float(record["overall_score"]) for record in records if "overall_score" in record]
        completed = [item for item in subtopics if item.get("status") == "completed"]
        completed_ids = {item["id"] for item in completed}
        result_by_subtopic = {
            record["subtopic_id"]: record
            for record in records
            if record.get("subtopic_id") in completed_ids
        }
        topic_by_id = {item["id"]: item["title"] for item in subtopics}
        active_dates = {
            item.get("completed_at", "")[:10]
            for item in self.completions.find({"user_id": user_id})
            if item.get("completed_at")
        }
        today = datetime.now(timezone.utc).date()
        streak = 0
        while today.isoformat() in active_dates:
            streak += 1
            today = today.fromordinal(today.toordinal() - 1)
        if streak == 0:
            yesterday = datetime.now(timezone.utc).date().fromordinal(
                datetime.now(timezone.utc).date().toordinal() - 1
            )
            while yesterday.isoformat() in active_dates:
                streak += 1
                yesterday = yesterday.fromordinal(yesterday.toordinal() - 1)

        return {
            "user_id": user_id,
            "completed_subtopics_count": len(completed),
            "total_subtopics_count": len(subtopics),
            "total_learning_hours": 0,
            "streak_days": streak,
            "average_score": round(sum(scores) / len(scores), 1) if scores else None,
            "strong_topics": [
                item["title"]
                for item in completed
                if result_by_subtopic.get(item["id"], {}).get("passed")
            ],
            "weak_topics": [
                topic_by_id.get(record["subtopic_id"], record["subtopic_id"])
                for record in records
                if not record.get("passed")
            ],
            "recent_scores": scores[-10:],
            "last_active_at": max(active_dates) if active_dates else None,
        }

    def get_mastery_prediction(self, user_id):
        attempts = self.attempts.find({})
        attempts.sort(key=lambda item: item.get("created_at", ""))
        counts_by_user = defaultdict(int)
        averages_by_user = defaultdict(float)

        rows = []
        labels = []
        for attempt in attempts:
            if not all(key in attempt for key in ("quiz_score", "coding_score", "overall_score", "passed")):
                continue
            previous_average = averages_by_user[attempt.get("user_id")]
            rows.append([
                float(attempt["quiz_score"]),
                float(attempt["coding_score"]),
                float(counts_by_user[attempt.get("user_id")] + 1),
                previous_average,
            ])
            labels.append(bool(attempt["passed"]))
            user_key = attempt.get("user_id")
            prior_count = counts_by_user[user_key]
            averages_by_user[user_key] = (
                averages_by_user[user_key] * prior_count + float(attempt["overall_score"])
            ) / (prior_count + 1)
            counts_by_user[user_key] += 1

        result = {
            "mastery_score": None,
            "mastery_level": "unavailable",
            "confidence": None,
            "model_type": "Random Forest (not trained)",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "reason": "More labeled assessment attempts are required.",
        }
        if len(rows) < 20 or min(labels.count(False), labels.count(True)) < 5:
            return result

        try:
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.linear_model import LogisticRegression
        except ImportError:
            result["model_type"] = "Random Forest (scikit-learn unavailable)"
            result["reason"] = "Install the verified scikit-learn dependency to enable mastery prediction."
            return result

        user_attempts = [item for item in attempts if item.get("user_id") == user_id]
        if not user_attempts:
            result["reason"] = "Complete an assessment before requesting a learner-specific prediction."
            return result
        current = user_attempts[-1]
        current_average = sum(float(item["overall_score"]) for item in user_attempts) / len(user_attempts)
        current_features = [[
            float(current["quiz_score"]),
            float(current["coding_score"]),
            float(len(user_attempts)),
            current_average,
        ]]
        baseline = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
        baseline.fit(rows, labels)
        baseline_class_index = list(baseline.classes_).index(True)
        baseline_score = float(baseline.predict_proba(current_features)[0][baseline_class_index])
        model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
        model.fit(rows, labels)
        class_index = list(model.classes_).index(True)
        mastery_score = float(model.predict_proba(current_features)[0][class_index])
        result.update({
            "mastery_score": round(mastery_score, 4),
            "baseline_mastery_score": round(baseline_score, 4),
            "mastery_level": (
                "weak" if mastery_score < 0.4
                else "developing" if mastery_score < 0.65
                else "proficient" if mastery_score < 0.85
                else "strong"
            ),
            "model_type": "Random Forest Classifier",
            "reason": None,
        })
        return result