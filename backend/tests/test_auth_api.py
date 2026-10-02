import unittest
import secrets

from app import create_app


class AuthApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True, "ALLOW_IN_MEMORY_DB": True})
        self.client = self.app.test_client()

    def register(self, **overrides):
        payload = {
            "full_name": "Test Learner",
            "email": "learner@example.com",
            "password": "correct horse battery",
        }
        payload.update(overrides)
        return self.client.post("/api/auth/register", json=payload)

    def token_headers(self, token):
        return {"Authorization": f"Bearer {token}"}

    def test_register_ignores_client_role_and_login_returns_token(self):
        response = self.register(role="admin")

        self.assertEqual(response.status_code, 201)
        user = response.json["data"]["user"]
        self.assertEqual(user["role"], "learner")
        self.assertNotIn("password", user)

        login_response = self.client.post(
            "/api/auth/login",
            json={"email": "learner@example.com", "password": "correct horse battery"},
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertTrue(login_response.json["data"]["token"])

    def test_duplicate_and_invalid_registration_are_rejected(self):
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(self.register().status_code, 400)
        self.assertEqual(self.register(email="not-an-email").status_code, 400)
        self.assertEqual(self.register(password="short").status_code, 400)

    def test_me_requires_token_and_returns_database_user(self):
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        token = self.register().json["data"]["token"]
        response = self.client.get("/api/auth/me", headers=self.token_headers(token))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["data"]["email"], "learner@example.com")

    def test_logout_revokes_token(self):
        token = self.register().json["data"]["token"]
        headers = self.token_headers(token)

        self.assertEqual(self.client.post("/api/auth/logout", headers=headers).status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me", headers=headers).status_code, 401)

    def test_learner_profile_is_validated_and_persisted(self):
        token = self.register().json["data"]["token"]
        headers = self.token_headers(token)
        self.assertIsNone(self.client.get("/api/auth/onboarding", headers=headers).json["data"])

        invalid = self.client.post(
            "/api/auth/onboarding", headers=headers, json={"skill_level": "expert"}
        )
        self.assertEqual(invalid.status_code, 400)

        saved = self.client.post(
            "/api/auth/onboarding",
            headers=headers,
            json={
                "learning_goal": "Build useful apps",
                "target_domain": "Python",
                "skill_level": "beginner",
                "hours_per_day": 2,
                "preferred_schedule": "Evenings",
                "preferences": ["Interactive labs"],
            },
        )
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(saved.json["data"]["topic"], "Python")

        updated = self.client.post(
            "/api/auth/onboarding",
            headers=headers,
            json={
                "learning_goal": "Build better APIs",
                "target_domain": "Flask",
                "skill_level": "intermediate",
                "hours_per_day": 3,
                "preferred_schedule": "Mornings",
                "preferences": [],
            },
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json["data"]["topic"], "Flask")
        self.assertEqual(
            self.client.get("/api/auth/onboarding", headers=headers).json["data"]["user_id"],
            updated.json["data"]["user_id"],
        )

    def test_admin_route_uses_database_role(self):
        token = self.register().json["data"]["token"]
        self.assertEqual(
            self.client.get("/api/admin/status", headers=self.token_headers(token)).status_code,
            403,
        )

        service = self.app.extensions["auth_service"]
        user = service.users_coll.find_one({"email": "learner@example.com"})
        service.users_coll.update_one({"id": user["id"]}, {"$set": {"role": "admin"}})
        self.assertEqual(
            self.client.get("/api/admin/status", headers=self.token_headers(token)).status_code,
            200,
        )

    def test_production_rejects_placeholder_secrets_and_memory_fallback(self):
        with self.assertRaises(RuntimeError):
            create_app({
                "ENVIRONMENT": "production",
                "SECRET_KEY": "replace_with_a_random_secret_before_deployment",
                "JWT_SECRET_KEY": secrets.token_urlsafe(48),
                "ALLOW_IN_MEMORY_DB": False,
            })

        with self.assertRaises(RuntimeError):
            create_app({
                "ENVIRONMENT": "production",
                "SECRET_KEY": secrets.token_urlsafe(48),
                "JWT_SECRET_KEY": secrets.token_urlsafe(48),
                "ALLOW_IN_MEMORY_DB": True,
            })

if __name__ == "__main__":
    unittest.main()