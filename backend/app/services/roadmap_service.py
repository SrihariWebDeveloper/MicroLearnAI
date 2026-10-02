import uuid
from datetime import datetime, timezone
from app.utils.db import get_db


class RoadmapService:
    def __init__(self, db=None):
        self.db = db or get_db()
        self.roadmap_coll = self.db.get_collection("roadmaps")

    def get_roadmap_for_user(self, user_id: str):
        roadmap = self.roadmap_coll.find_one({"user_id": user_id})
        if roadmap:
            roadmap.pop("_id", None)
        return roadmap

    def generate_for_profile(self, user_id: str, profile_data: dict):
        domain = profile_data["topic"]
        skill_level = profile_data["skill_level"]
        level_specs = [
            (
                "Foundations",
                "Build a reliable understanding of core concepts.",
                [
                    ("Key concepts", "Learn the core terms and ideas.", 20),
                    ("Fundamental techniques", "Practice the essential techniques.", 30),
                    ("Foundation check", "Apply foundational ideas to short exercises.", 25),
                ],
            ),
            (
                "Applied practice",
                "Use core concepts in realistic, guided tasks.",
                [
                    ("Worked applications", "Follow a structured example from start to finish.", 30),
                    ("Independent practice", "Solve focused problems with less guidance.", 35),
                    ("Applied review", "Connect concepts across practical exercises.", 25),
                ],
            ),
            (
                "Advanced projects",
                "Combine skills in a larger independent project.",
                [
                    ("Design an approach", "Break a larger task into achievable steps.", 25),
                    ("Build and refine", "Create a solution and improve it with feedback.", 45),
                    ("Reflect and extend", "Review the result and identify next steps.", 20),
                ],
            ),
        ]

        roadmap_id = f"road_{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc).isoformat()
        levels = []
        for level_index, (level_title, level_description, topics) in enumerate(level_specs, start=1):
            level_id = f"{roadmap_id}_level_{level_index}"
            level_status = "unlocked" if level_index == 1 else "locked"
            subtopics = []
            for topic_index, (title, description, minutes) in enumerate(topics, start=1):
                subtopics.append({
                    "id": f"{roadmap_id}_l{level_index}_s{topic_index}",
                    "level_id": level_id,
                    "title": f"{domain}: {title}",
                    "description": description,
                    "estimated_minutes": minutes,
                    "status": "in_progress" if level_index == 1 and topic_index == 1 else "locked",
                    "order": topic_index,
                    "prerequisites": [] if level_index == 1 and topic_index == 1 else [
                        f"{roadmap_id}_l{level_index}_s{topic_index - 1}"
                        if topic_index > 1
                        else f"{roadmap_id}_l{level_index - 1}_s3"
                    ],
                })
            levels.append({
                "id": level_id,
                "level_number": level_index,
                "title": f"Level {level_index}: {level_title}",
                "description": level_description,
                "status": level_status,
                "subtopics": subtopics,
            })

        roadmap_doc = {
            "id": roadmap_id,
            "user_id": user_id,
            "title": f"{domain} Path",
            "description": f"A deterministic learning path for a {skill_level} learner. Progress is updated as learning activities are completed.",
            "target_domain": domain,
            "skill_level": skill_level,
            "total_levels": len(levels),
            "progress_percentage": 0,
            "created_at": now,
            "updated_at": now,
            "levels": levels,
        }

        self.roadmap_coll.update_one({"user_id": user_id}, {"$set": roadmap_doc}, upsert=True)
        return roadmap_doc

    def get_subtopic_for_user(self, user_id: str, subtopic_id: str):
        roadmap = self.get_roadmap_for_user(user_id)
        if not roadmap:
            return None
        for level in roadmap.get("levels", []):
            for subtopic in level.get("subtopics", []):
                if subtopic.get("id") == subtopic_id:
                    return subtopic
        return None

    def record_assessment_result(self, user_id: str, subtopic_id: str, score: float, passed: bool):
        roadmap = self.get_roadmap_for_user(user_id)
        if not roadmap:
            return None

        subtopics = [
            subtopic
            for level in roadmap.get("levels", [])
            for subtopic in level.get("subtopics", [])
        ]
        target = next((item for item in subtopics if item.get("id") == subtopic_id), None)
        if target is None or target.get("status") == "locked":
            return None

        target["attempts_count"] = target.get("attempts_count", 0) + 1
        target["last_score"] = score
        if passed:
            target["status"] = "completed"
            target["score"] = score
            target_index = subtopics.index(target)
            if target_index + 1 < len(subtopics):
                next_subtopic = subtopics[target_index + 1]
                if next_subtopic.get("status") == "locked":
                    next_subtopic["status"] = "in_progress"

        for level in roadmap.get("levels", []):
            subtopic_statuses = [item.get("status") for item in level.get("subtopics", [])]
            if subtopic_statuses and all(status == "completed" for status in subtopic_statuses):
                level["status"] = "completed"
                level_number = level["level_number"]
                next_level = next(
                    (item for item in roadmap["levels"] if item["level_number"] == level_number + 1),
                    None,
                )
                if next_level and next_level.get("status") == "locked":
                    next_level["status"] = "unlocked"

        completed_count = sum(item.get("status") == "completed" for item in subtopics)
        roadmap["progress_percentage"] = round(completed_count / len(subtopics) * 100, 1) if subtopics else 0
        roadmap["updated_at"] = datetime.now(timezone.utc).isoformat()
        self.roadmap_coll.update_one(
            {"user_id": user_id},
            {"$set": roadmap},
        )
        return roadmap

roadmap_service = RoadmapService()
