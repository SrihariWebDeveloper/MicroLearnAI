import unittest

from app import create_app


class RoadmapApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True, "ALLOW_IN_MEMORY_DB": True})
        self.client = self.app.test_client()
        response = self.client.post(
            "/api/auth/register",
            json={"full_name": "Roadmap Learner", "email": "roadmap@example.com", "password": "test-password-123"},
        )
        self.token = response.json["data"]["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_roadmap_requires_authentication_and_onboarding(self):
        self.assertEqual(self.client.get("/api/roadmap").status_code, 401)
        self.assertIsNone(self.client.get("/api/roadmap", headers=self.headers).json["data"])
        response = self.client.post("/api/roadmap/generate", headers=self.headers, json={})
        self.assertEqual(response.status_code, 409)

    def test_generated_roadmap_uses_saved_profile_without_fake_progress(self):
        profile = {
            "learning_goal": "Learn Python",
            "topic": "Python",
            "skill_level": "intermediate",
            "hours_per_day": 1.5,
            "preferred_schedule": "Evenings",
            "preferences": ["Practice"],
        }
        self.assertEqual(
            self.client.post("/api/auth/onboarding", headers=self.headers, json=profile).status_code,
            200,
        )

        response = self.client.post(
            "/api/roadmap/generate",
            headers=self.headers,
            json={"target_domain": "client-controlled value"},
        )
        self.assertEqual(response.status_code, 200)
        roadmap = response.json["data"]
        self.assertEqual(roadmap["target_domain"], "Python")
        self.assertEqual(roadmap["skill_level"], "intermediate")
        self.assertEqual(roadmap["progress_percentage"], 0)
        self.assertEqual(roadmap["total_levels"], 3)
        self.assertEqual(roadmap["levels"][0]["status"], "unlocked")
        self.assertEqual(roadmap["levels"][0]["subtopics"][0]["status"], "in_progress")
        self.assertNotIn("score", roadmap["levels"][0]["subtopics"][0])

        fetched = self.client.get("/api/roadmap", headers=self.headers).json["data"]
        self.assertEqual(fetched["id"], roadmap["id"])
        self.assertNotIn("_id", fetched)

    def test_subtopic_lookup_is_scoped_to_the_learner_roadmap(self):
        profile = {
            "learning_goal": "Learn Python",
            "topic": "Python",
            "skill_level": "beginner",
            "hours_per_day": 2,
            "preferred_schedule": "Evenings",
        }
        self.client.post("/api/auth/onboarding", headers=self.headers, json=profile)
        roadmap = self.client.post("/api/roadmap/generate", headers=self.headers, json={}).json["data"]
        subtopic_id = roadmap["levels"][0]["subtopics"][0]["id"]

        self.assertEqual(
            self.client.get(f"/api/roadmap/subtopics/{subtopic_id}", headers=self.headers).status_code,
            200,
        )
        self.assertEqual(
            self.client.get("/api/roadmap/subtopics/not-owned", headers=self.headers).status_code,
            404,
        )


if __name__ == "__main__":
    unittest.main()