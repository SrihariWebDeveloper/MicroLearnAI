---
noteId: "fdb3f820bd6611f1802d1b1dbe85b662"
tags: []

---

# Deployment

## Container stack

1. Copy `.env.compose.example` to `.env` and replace all placeholder values. URL-encode special characters in the MongoDB password inside `MONGO_URI`.
2. Set `OPENROUTER_API_KEY` only in this server-side environment if generated lessons are required.
3. Run `docker compose up --build -d` from the repository root. The frontend is served on port 8080 by default; Nginx proxies `/api` to Flask.
4. Verify the frontend, MongoDB health check, registration, login, and authenticated API routes before exposing the service publicly.

The Compose network is internal. Do not publish MongoDB or Flask ports publicly. Terminate HTTPS at a trusted reverse proxy and set `PUBLIC_ORIGIN` to its exact origin.

## Code execution isolation

The backend runner starts a pinned Python image with no network, a read-only root filesystem, a temporary no-exec filesystem, a non-root UID, dropped Linux capabilities, no-new-privileges, CPU/memory/PID limits, and a wall-clock timeout. It uses `--pull=never` so requests never trigger an image download.

The Flask container is deliberately not mounted to the Docker host socket. For production execution, point `SANDBOX_DOCKER_HOST` at a separately isolated, TLS-protected sandbox daemon, set `SANDBOX_DOCKER_TLS_VERIFY=1`, and set `SANDBOX_CERTS_DIR` to a directory containing `ca.pem`, `cert.pem`, and `key.pem`. Start with both Compose files: `docker compose -f compose.yaml -f compose.sandbox.yaml up --build -d`. Do not expose an unrestricted Docker socket to the web/API container; Docker daemon access is effectively host-root access. Without a configured daemon, code submissions fail closed with HTTP 503.

## Operational caveats

- Random Forest and Logistic Regression use only persisted assessment outcomes. Install the pinned scikit-learn dependency and collect at least 20 real assessment attempts with at least five pass and five fail labels before a prediction is produced. No accuracy is reported until a separate validation dataset exists.
- ADK lessons use the configurable OpenRouter model and are schema-validated and cached. Missing credentials, provider errors, and invalid structured output are surfaced; curated development lessons remain separately labeled.
- Rotate all secrets and configure MongoDB Atlas/network restrictions for cloud deployment. The local compose database is a single-node setup, not a highly available production cluster.