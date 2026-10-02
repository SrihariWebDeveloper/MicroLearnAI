import unittest

from app import create_app


class AnalyticsAdminNotificationTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True})
        self.client = self.app.test_client()
        self.admin = self.register("admin@example.com")
        self.learner = self.register("learner2@example.com")
        self.app.extensions["auth_service"].users_coll.update_one(
            {"id": self.admin["user"]["id"]}, {"$set": {"role": "admin"}}
        )

    def register(self, email):
        response = self.client.post(
            "/api/auth/register",
            json={"full_name": "Test Account", "email": email, "password": "test-password-123"},
        )
        return response.json["data"]

    @staticmethod
    def headers(account):
        return {"Authorization": f"Bearer {account['token']}"}

    def test_analytics_returns_no_fabricated_scores_or_progress(self):
        headers = self.headers(self.learner)
        performance = self.client.get("/api/performance", headers=headers).json["data"]
        self.assertEqual(performance["completed_subtopics_count"], 0)
        self.assertEqual(performance["total_subtopics_count"], 0)
        self.assertEqual(performance["total_learning_hours"], 0)
        self.assertIsNone(performance["average_score"])
        self.assertEqual(performance["recent_scores"], [])

        mastery = self.client.get("/api/performance/mastery", headers=headers).json["data"]
        self.assertIsNone(mastery["mastery_score"])
        self.assertEqual(mastery["mastery_level"], "unavailable")

    def test_admin_endpoints_authorize_from_database_and_exclude_secrets(self):
        self.assertEqual(
            self.client.get("/api/admin/users", headers=self.headers(self.learner)).status_code,
            403,
        )
        response = self.client.get("/api/admin/users", headers=self.headers(self.admin))
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("password", response.json["data"][0])

        target_id = self.learner["user"]["id"]
        changed = self.client.patch(
            f"/api/admin/users/{target_id}/role",
            headers=self.headers(self.admin),
            json={"role": "admin"},
        )
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(
            self.app.extensions["auth_service"].get_user_by_id(target_id)["role"],
            "admin",
        )

        self.assertEqual(
            self.client.patch(
                f"/api/admin/users/{self.admin['user']['id']}/role",
                headers=self.headers(self.admin),
                json={"role": "learner"},
            ).status_code,
            400,
        )

    def test_notifications_are_scoped_and_mark_read_persists(self):
        service = self.app.extensions["notification_service"]
        created = service.create(
            self.admin["user"]["id"], "Private", "Only visible to the admin", "system"
        )
        learner_headers = self.headers(self.learner)
        self.assertEqual(
            self.client.get("/api/notifications", headers=learner_headers).json["data"],
            [],
        )
        admin_headers = self.headers(self.admin)
        self.assertEqual(
            self.client.post(
                f"/api/notifications/{created['id']}/read", headers=learner_headers
            ).status_code,
            200,
        )
        self.assertFalse(service.get_for_user(self.admin["user"]["id"])[0]["is_read"])

        self.client.post(
            f"/api/notifications/{created['id']}/read", headers=admin_headers
        )
        self.assertTrue(service.get_for_user(self.admin["user"]["id"])[0]["is_read"])


if __name__ == "__main__":
    unittest.main()