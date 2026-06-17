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

Two terminals:

```bash
# terminal 1 — API
cd server && npm install && npm run dev

# terminal 2 — frontend
cd client && npm install && npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to the Express
server on :3001.

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
