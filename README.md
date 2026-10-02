# MicroLearn AI

MicroLearn AI is a full-stack learning application with personalized learning roadmaps, lessons, practice and assessments, progress tracking, recommendations, and an administrator dashboard.

## Features

- Learner registration, login, onboarding, and profile management
- Personalized roadmaps, lessons, practice, and assessments
- Learning progress, performance analytics, and recommendations
- Notifications and administrator dashboard
- Optional AI-generated learning content through OpenRouter
- Optional code-execution exercises through an isolated Docker sandbox

## Tech Stack

- Frontend: React, TypeScript, Vite, and Tailwind CSS
- Backend: Python, Flask, Flask-JWT-Extended, and PyMongo
- Database: MongoDB
- AI provider: OpenRouter (optional)

## Project Layout

```text
backend/       Flask API, services, models, and tests
frontend/      React application
compose.yaml   Local/self-hosted Docker Compose stack
DEPLOYMENT.md  Container deployment and sandbox security details
```

## Run Locally

Prerequisites: Python 3.12, Node.js with npm, and MongoDB. You can use a local MongoDB instance or an Atlas database.

### Backend

In PowerShell:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` if your MongoDB URI differs from the local default. Start the API:

```powershell
python run.py
```

The API listens on `http://localhost:5000`. Its health endpoint is `http://localhost:5000/api/health`.

### Frontend

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. During local development, Vite proxies `/api` requests to the backend on port 5000. `VITE_API_BASE_URL` is optional locally and defaults to `/api`.

The development database fallback is in-memory and is not persistent. Use MongoDB for data you need to retain. Do not use development settings or test accounts in production.

## Environment Variables

Backend settings belong in `backend/.env` locally and in the backend host's environment settings in production. See `backend/.env.example` for development defaults.

Important backend variables:

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection URI. Include a database name, such as `/microlearn_ai`, before any query parameters. |
| `SECRET_KEY` | Unique Flask secret; use a random value of at least 32 characters in production. |
| `JWT_SECRET_KEY` | Separate random JWT secret; use a value different from `SECRET_KEY`. |
| `APP_ENV` | Set to `production` for a deployed backend. |
| `ALLOW_IN_MEMORY_DB` | Set to `false` in production. |
| `CORS_ORIGINS` | Comma-separated frontend origins allowed to call the API; do not include `/api` or a trailing slash. |
| `OPENROUTER_API_KEY` | Optional server-side key for generated lessons. Never put this in the frontend. |

The frontend's `VITE_API_BASE_URL` is a public build-time setting, not a secret. Set it to the backend API base URL, such as `https://your-backend.onrender.com/api`.

Never commit `.env` files, database credentials, signing keys, or API tokens. Use the hosting provider's environment-variable settings for production secrets.

## Deploy: Vercel + Render

MongoDB Atlas can provide the production database. Deploy the API and frontend as separate services:

### Backend on Render

Create a Python Web Service from this repository:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 90 run:app`
- Health check path: `/api/health`

Set these environment variables in Render:

```text
APP_ENV=production
ALLOW_IN_MEMORY_DB=false
MONGO_URI=<Atlas URI with /microlearn_ai as the database path>
SECRET_KEY=<unique random value, at least 32 characters>
JWT_SECRET_KEY=<different unique random value, at least 32 characters>
CORS_ORIGINS=https://your-frontend.vercel.app
```

Optionally set `OPENROUTER_API_KEY` for AI-generated lessons. In MongoDB Atlas, create a database user and allow the Render service to connect through Atlas Network Access. URL-encode special characters in the MongoDB password.

### Frontend on Vercel

Import the repository as a Vercel project:

- Root directory: `frontend`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-backend.onrender.com/api`

The `frontend/vercel.json` file rewrites client-side routes, such as `/login`, to the app entry point. Set the Render `CORS_ORIGINS` value to the exact Vercel site origin, without a path or trailing slash. Redeploy the frontend after changing `VITE_API_BASE_URL`, and redeploy the backend after changing its environment variables.

## Admin Accounts

Public registration creates learner accounts only. There is no default production admin login. Provision administrators through a trusted process; the documented test-account seeder is development-only. Never use the public development test credentials in production.

## Code Execution and Analytics Notes

Code-execution features fail closed with HTTP 503 unless a separately isolated Docker sandbox daemon is configured. Do not expose an unrestricted Docker socket to the web application. See [DEPLOYMENT.md](DEPLOYMENT.md) for the sandbox requirements and the Docker Compose deployment option.

Machine-learning recommendations use persisted assessment outcomes and require sufficient pass and fail data before predictions are available. See the deployment guide for the current data requirements and operational caveats.

## Docker Compose

For local or self-hosted container deployment, copy `.env.compose.example` to `.env`, replace every placeholder, then run from the repository root:

```powershell
Copy-Item .env.compose.example .env
docker compose up --build -d
```

The frontend is published on port 8080 by default. The Compose stack keeps the backend and MongoDB off public host ports. Review [DEPLOYMENT.md](DEPLOYMENT.md) before exposing a self-hosted deployment to the internet.

## Tests and Checks

Backend tests:

```powershell
cd backend
python -m pip install pytest
python -m pytest
```

Frontend build and lint:

```powershell
cd frontend
npm run build
npm run lint
```