from datetime import datetime, timezone
import uuid


class LearningService:
    def __init__(self, db, roadmap_service, code_runner, agent_service=None):
        self.db = db
        self.roadmap_service = roadmap_service
        self.code_runner = code_runner
        self.agent_service = agent_service
        self.lessons = db.get_collection("lessons")
        self.completions = db.get_collection("lesson_completions")
        self.submissions = db.get_collection("code_submissions")

    def _accessible_subtopic(self, user_id, subtopic_id):
        subtopic = self.roadmap_service.get_subtopic_for_user(user_id, subtopic_id)
        if subtopic is None or subtopic.get("status") == "locked":
            return None
        return subtopic

    def get_lesson(self, user_id, subtopic_id):
        subtopic = self._accessible_subtopic(user_id, subtopic_id)
        if subtopic is None:
            return None
        lesson = self.lessons.find_one({"user_id": user_id, "subtopic_id": subtopic_id})
        if lesson:
            lesson.pop("_id", None)
            return lesson

        title = subtopic["title"]
        return {
            "id": f"lesson_{subtopic_id}",
            "subtopic_id": subtopic_id,
            "title": title,
            "overview": subtopic["description"],
            "key_concepts": [
                "Identify the concept and its prerequisites.",
                "Work through a small example before attempting a full problem.",
                "Check edge cases and explain why the solution works.",
            ],
            "detailed_content": (
                f"## {title}\n\n"
                f"{subtopic['description']}\n\n"
                "Start by writing down what you already know about this topic. Work through the example, "
                "then change its inputs and observe how the result changes. Use the coding lab to test "
                "your own solution. This is curated development content, not AI-generated material."
            ),
            "code_examples": [],
            "summary": f"Review the core idea behind {title}, practice it, and check your reasoning against edge cases.",
            "video_script": None,
            "content_source": "curated_development",
        }

    def generate_lesson(self, user_id, subtopic_id):
        subtopic = self._accessible_subtopic(user_id, subtopic_id)
        if subtopic is None:
            return None
        if self.agent_service is None:
            raise RuntimeError("Google ADK lesson generation is not configured.")
        profile = self.db.get_collection("learner_profiles").find_one({"user_id": user_id}) or {}
        lesson = self.agent_service.generate_lesson(
            user_id,
            subtopic_id,
            profile.get("topic", profile.get("target_domain", "")),
            profile.get("skill_level", "beginner"),
            subtopic["description"],
        )
        lesson.update({
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        self.lessons.update_one(
            {"user_id": user_id, "subtopic_id": subtopic_id},
            {"$set": lesson},
            upsert=True,
        )
        lesson.pop("user_id", None)
        return lesson

    def get_coding_problem(self, user_id, subtopic_id):
        subtopic = self._accessible_subtopic(user_id, subtopic_id)
        if subtopic is None:
            return None
        return {
            "id": f"lab_{subtopic_id}",
            "subtopic_id": subtopic_id,
            "title": "Filter passing scores",
            "description": "Implement filter_85(scores) to return only integer scores greater than or equal to 85.",
            "difficulty": "easy",
            "initial_code": "def filter_85(scores):\n    pass\n",
            "language": "python",
            "function_name": "filter_85",
            "test_cases": [
                {"id": "t1", "input": "[75, 85, 90, 60]", "expected_output": "[85, 90]"},
                {"id": "t2", "input": "[]", "expected_output": "[]"},
            ],
            "solution_hint": "Use a list comprehension with a condition that keeps scores >= 85.",
        }

    def submit_code(self, user_id, problem_id, code, language):
        if not isinstance(code, str) or len(code) > 20_000:
            raise ValueError("Code must contain at most 20,000 characters.")
        if not isinstance(language, str) or language != "python":
            raise ValueError("Only Python submissions are currently supported.")
        if not isinstance(problem_id, str) or not problem_id.startswith("lab_"):
            raise ValueError("A valid coding problem id is required.")
        subtopic_id = problem_id.removeprefix("lab_")
        problem = self.get_coding_problem(user_id, subtopic_id)
        if problem is None or problem["id"] != problem_id:
            return None

        cases = [
            {"id": "t1", "args": [[75, 85, 90, 60]], "expected": [85, 90]},
            {"id": "t2", "args": [[]], "expected": []},
        ]
        execution = self.code_runner.run_tests(code, "filter_85", cases, language)
        submission = {
            "id": f"submission_{uuid.uuid4().hex}",
            "user_id": user_id,
            "problem_id": problem_id,
            "code": code,
            "language": language,
            "status": "passed" if execution["passed"] else "failed",
            "test_results": execution["test_results"],
            "execution_time_ms": execution["execution_time_ms"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.submissions.insert_one(submission)
        return submission

    def complete_lesson(self, user_id, subtopic_id):
        if self._accessible_subtopic(user_id, subtopic_id) is None:
            return None
        existing = self.completions.find_one({"user_id": user_id, "subtopic_id": subtopic_id})
        if existing:
            existing.pop("_id", None)
            return existing
        completion = {
            "id": f"completion_{uuid.uuid4().hex}",
            "user_id": user_id,
            "subtopic_id": subtopic_id,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        self.completions.insert_one(completion)
        return completion