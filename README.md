# Marketing Visualizer

A web dashboard that combines data from multiple Airtable sources into an
interactive dashboard. Left sidebar navigation; each item opens its own page in
the main panel.

## Stack

- **Frontend:** Vite + React (plain JS), React Router
- **Backend:** Express (single server)
- **Kanban storage:** JSON file now → Neon (Postgres) later, behind a repository
  interface so the swap is a drop-in
- **Deploy target:** Render (one repo, one web service)

## Layout

```
client/   Vite + React app (dev on :5173)
server/   Express API (dev on :3001, serves client/dist in prod)
```

## Getting started (dev)

Requires **Node 18+** (Vite won't run on 16). From the repo root:

```bash
npm run setup     # first time only — installs root + client + server deps
npm run dev       # starts API (:3001) and frontend (:5173) together
```

Then open **http://localhost:5173** (not :3001 — that's the API). The Vite dev
server proxies `/api/*` to Express on :3001.

`npm run dev` auto-selects Node 22 via nvm. If you ever see a Node-version
error, run `nvm use 22` (or make it permanent with `nvm alias default 22`).

## Production build (what Render runs)

```bash
cd client && npm install && npm run build   # outputs client/dist
cd ../server && npm install && npm start     # serves client/dist + /api
```

## Roadmap

1. ✅ Scaffold: client + server + JSON-backed repo, sidebar nav, stub Kanban API
2. Kanban schema + CRUD + drag-and-drop
3. Migrate Kanban store → Neon Postgres
4. Airtable connection via Express proxy
5. Combine / normalize multiple Airtable sources
6. First visualization + interactivity
