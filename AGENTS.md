# Base44 Dev Environment

## Stack
Vite + React (JS) single-page app using the Base44 SDK (`@base44/sdk`) and `@base44/vite-plugin`.
No separate backend service — the client talks to the Base44 cloud API directly.

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
- Web entry point: host port 3000 → container Vite dev server (5173).
- `node:22` base image; source is bind-mounted; `npm install` runs at container start.
- Live reload is active (Vite HMR + `CHOKIDAR_USEPOLLING=true` for bind-mount reliability).

## Base44 backend connection
- `VITE_BASE44_APP_ID` — public app id, sourced from `base44/.app.jsonc` (committed in repo).
- `VITE_BASE44_BACKEND_URL` — public Base44 API (`https://base44.app`), the SDK default.
- Both are set inline in `docker-compose.base44.yml` `environment:`. They are public platform
  identifiers, NOT user secrets — no `set_secrets` needed. User auth is handled by the
  Base44 platform (login flow / tokens in localStorage).
- The `@base44/vite-plugin` API proxy (`VITE_BASE44_APP_BASE_URL`) is intentionally left off;
  the client calls the Base44 API directly (CORS is handled by the platform).

## Vite config
`vite.config.js` sets `server.host: true` and `server.allowedHosts: true` so the preview's
external hostname is accepted.

## Verifying it works
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` returns the HTML.
- The served `main.jsx` is live source (unhashed `/src/...`), confirming dev mode (not a build).
- The app renders a sign-in page (ClaimFlow v2, demo mode) on first load.
