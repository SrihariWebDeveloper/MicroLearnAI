import unittest

from app import create_app


class StubCodeRunner:
    def run_tests(self, source, function_name, test_cases, language):
        passed = "return [score for score in scores if score >= 85]" in source
        return {
            "passed": passed,
            "execution_time_ms": 3,
            "test_results": [
                {
                    "test_case_id": case["id"],
                    "passed": passed,
                    "actual_output": repr(case["expected"]) if passed else "[]",
                    "expected_output": repr(case["expected"]),
                    "execution_time_ms": 1,
                }
                for case in test_cases
            ],
        }


class LearningApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True, "CODE_RUNNER": StubCodeRunner()})
        self.client = self.app.test_client()
        registered = self.client.post(
            "/api/auth/register",
            json={"full_name": "Lesson Learner", "email": "lessons@example.com", "password": "test-password-123"},
        )
        self.token = registered.json["data"]["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.client.post(
            "/api/auth/onboarding",
            headers=self.headers,
            json={
                "learning_goal": "Learn Python",
                "topic": "Python",
                "skill_level": "beginner",
                "hours_per_day": 2,
                "preferred_schedule": "Evenings",
            },
        )
        self.roadmap = self.client.post(
            "/api/roadmap/generate", headers=self.headers, json={}
        ).json["data"]
        self.current = self.roadmap["levels"][0]["subtopics"][0]
        self.locked = self.roadmap["levels"][0]["subtopics"][1]

    def test_lesson_and_lab_require_accessible_roadmap_subtopic(self):
        lesson = self.client.get(
            f"/api/learning/lessons/{self.current['id']}", headers=self.headers
        )
        self.assertEqual(lesson.status_code, 200)
        self.assertEqual(lesson.json["data"]["content_source"], "curated_development")

        problem = self.client.get(
            f"/api/learning/labs/{self.current['id']}", headers=self.headers
        )
        self.assertEqual(problem.status_code, 200)
        self.assertEqual(problem.json["data"]["language"], "python")
        self.assertEqual(
            self.client.get(
                f"/api/learning/lessons/{self.locked['id']}", headers=self.headers
            ).status_code,
            404,
        )
        self.assertEqual(
            self.client.get(f"/api/learning/labs/{self.current['id']}").status_code,
            401,
        )

    def test_code_submission_uses_runner_result_not_a_mock_pass(self):
        problem_id = f"lab_{self.current['id']}"
        failed = self.client.post(
            "/api/learning/labs/submit",
            headers=self.headers,
            json={"problem_id": problem_id, "code": "pass", "language": "python"},
        )
        self.assertEqual(failed.status_code, 200)
        self.assertEqual(failed.json["data"]["status"], "failed")

        passing_code = "def filter_85(scores): return [score for score in scores if score >= 85]"
        passed = self.client.post(
            "/api/learning/labs/submit",
            headers=self.headers,
            json={"problem_id": problem_id, "code": passing_code, "language": "python"},
        )
        self.assertEqual(passed.status_code, 200)
        self.assertEqual(passed.json["data"]["status"], "passed")

    def test_lesson_completion_persists_idempotently_and_updates_activity(self):
        url = f"/api/learning/lessons/{self.current['id']}/complete"
        first = self.client.post(url, headers=self.headers)
        second = self.client.post(url, headers=self.headers)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json["data"]["completed_at"], second.json["data"]["completed_at"])

        performance = self.client.get("/api/performance", headers=self.headers).json["data"]
        self.assertGreaterEqual(performance["streak_days"], 1)
        self.assertEqual(performance["total_learning_hours"], 0)


if __name__ == "__main__":
    unittest.main()