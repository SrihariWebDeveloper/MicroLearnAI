import unittest

from app import create_app


class PassingCodeRunner:
    def run_tests(self, source, function_name, test_cases, language):
        return {
            "passed": "pass" in source,
            "execution_time_ms": 1,
            "test_results": [],
        }


class AssessmentApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            "TESTING": True,
            "CODE_RUNNER": PassingCodeRunner(),
        })
        self.client = self.app.test_client()
        registered = self.client.post(
            "/api/auth/register",
            json={"full_name": "Assessment Learner", "email": "assessment@example.com", "password": "test-password-123"},
        )
        self.token = registered.json["data"]["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        profile = {
            "learning_goal": "Learn Python",
            "topic": "Python",
            "skill_level": "beginner",
            "hours_per_day": 2,
            "preferred_schedule": "Evenings",
        }
        self.client.post("/api/auth/onboarding", headers=self.headers, json=profile)
        self.roadmap = self.client.post(
            "/api/roadmap/generate", headers=self.headers, json={}
        ).json["data"]
        self.subtopic_id = self.roadmap["levels"][0]["subtopics"][0]["id"]

    def valid_submission(self):
        assessment = self.client.get(
            f"/api/assessments/{self.subtopic_id}", headers=self.headers
        ).json["data"]
        return {
            "subtopic_id": self.subtopic_id,
            "quiz_answers": {"q1": 0, "q2": 1},
            "coding_answers": {
                question["id"]: "pass" for question in assessment["coding_questions"]
            },
        }

    def test_passing_submission_unlocks_only_the_next_subtopic(self):
        response = self.client.post(
            "/api/assessments/submit",
            headers=self.headers,
            json=self.valid_submission(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["data"]["overall_score"], 100)
        self.assertTrue(response.json["data"]["passed"])
        roadmap = self.client.get("/api/roadmap", headers=self.headers).json["data"]
        subtopics = roadmap["levels"][0]["subtopics"]
        self.assertEqual(subtopics[0]["status"], "completed")
        self.assertEqual(subtopics[1]["status"], "in_progress")
        self.assertEqual(subtopics[2]["status"], "locked")

    def test_two_of_three_code_problems_fail_threshold_and_do_not_unlock(self):
        submission = self.valid_submission()
        submission["coding_answers"]["cq3"] = "fail"
        response = self.client.post(
            "/api/assessments/submit", headers=self.headers, json=submission
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["data"]["overall_score"], 76.7)
        self.assertFalse(response.json["data"]["passed"])
        roadmap = self.client.get("/api/roadmap", headers=self.headers).json["data"]
        self.assertEqual(roadmap["levels"][0]["subtopics"][0]["status"], "in_progress")

    def test_incomplete_submission_is_rejected_without_progression(self):
        response = self.client.post(
            "/api/assessments/submit",
            headers=self.headers,
            json={"subtopic_id": self.subtopic_id, "quiz_answers": {}, "coding_answers": {}},
        )

        self.assertEqual(response.status_code, 400)
        roadmap = self.client.get("/api/roadmap", headers=self.headers).json["data"]
        self.assertEqual(roadmap["levels"][0]["subtopics"][0]["status"], "in_progress")


if __name__ == "__main__":
    unittest.main()