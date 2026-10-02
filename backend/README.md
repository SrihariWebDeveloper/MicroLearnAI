---
noteId: "782c2310bd5e11f1802d1b1dbe85b662"
tags: []

---

# MicroLearn AI Backend

## Local development

1. Create and activate a Python virtual environment, then install `requirements.txt`.
2. Copy `.env.example` to `.env` and set a MongoDB URI. The in-memory fallback is for development only and is not persistent.
3. Start the API with `python run.py` from this directory. It listens on port 5000 by default.

Set `ALLOW_IN_MEMORY_DB=false` to require MongoDB. Production must use unique `SECRET_KEY` and `JWT_SECRET_KEY` values and disable the in-memory fallback.

## Local test accounts

From the `backend` directory, run `python -m scripts.seed_test_users` while connected to the local development MongoDB. The command is idempotent, refuses to modify accounts that are not marked as test accounts, and only runs with `APP_ENV=development` and a persistent MongoDB connection.

- Learner: `learner.test@microlearn.local` / `LearnerTest2026!`
- Admin: `admin.test@microlearn.local` / `AdminTest2026!`

These public development credentials must never be used in production. New public registrations remain learner-only; this seed utility is the trusted local-only path for creating an admin test account.

## Authentication API

- `POST /api/auth/register` creates a learner account; client-supplied roles are ignored.
- `POST /api/auth/login` returns a bearer token and public user record.
- `POST /api/auth/logout` revokes the current token.
- `GET /api/auth/me` returns the current database-backed user.
- `GET` and `POST /api/auth/onboarding` read and validate the authenticated learner's profile.
- `PUT /api/auth/profile` updates the authenticated user's name.
- `GET /api/admin/status` demonstrates backend-enforced administrator authorization.

User roles are read from MongoDB for authorization. New administrators must be provisioned through a trusted administrative process, not public registration.