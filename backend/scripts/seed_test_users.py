"""Create the documented local-only learner and admin accounts."""

import uuid

from app import create_app
from app.models.user import UserModel
from app.utils.security import hash_password


TEST_ACCOUNTS = (
    {
        "email": "learner.test@microlearn.local",
        "full_name": "Test Learner",
        "password": "LearnerTest2026!",
        "role": "learner",
    },
    {
        "email": "admin.test@microlearn.local",
        "full_name": "Test Admin",
        "password": "AdminTest2026!",
        "role": "admin",
    },
)


def seed_test_users():
    app = create_app()
    if app.config["ENVIRONMENT"] != "development":
        raise RuntimeError("Test accounts can only be seeded when APP_ENV=development.")

    db_manager = app.extensions["db_manager"]
    if not db_manager.is_connected:
        raise RuntimeError("A persistent MongoDB connection is required to seed test accounts.")

    users = db_manager.get_collection("users")
    for account in TEST_ACCOUNTS:
        existing = users.find_one({"email": account["email"]})
        if existing:
            if existing.get("is_test_account") is not True:
                raise RuntimeError(
                    f"Refusing to modify an existing non-test account: {account['email']}"
                )
            users.update_one(
                {"id": existing["id"]},
                {"$set": {"role": account["role"]}},
            )
            print(f"Existing test account retained: {account['email']} ({account['role']})")
            continue

        user_id = f"usr_test_{uuid.uuid4().hex[:12]}"
        user_doc = UserModel.create_user_doc(
            user_id,
            account["email"],
            account["full_name"],
            hash_password(account["password"]),
        )
        user_doc["role"] = account["role"]
        user_doc["is_test_account"] = True
        users.insert_one(user_doc)
        print(f"Created test account: {account['email']} ({account['role']})")


if __name__ == "__main__":
    seed_test_users()