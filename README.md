# 🚑 GIS-Integrated Hospital Dashboard

A full-stack app that visualizes hospitals & ambulances on an interactive map, finds the nearest available ambulance using PostGIS + Redis caching, and streams updates in real time via Socket.IO. Built to be deployment-ready (Vercel + Render).

## ✨ Highlights
- 🗺️ MapLibre + PostGIS geodesic queries for accurate nearest-ambulance results
- ⚡ Redis caching for hot spatial queries
- 🔴 Real-time updates over Socket.IO
- 🛠️ Prod-minded config: env-driven, CORS allow-list, OSRM endpoint override, dev-only seeding/sync

## 🧰 Tech Stack
- **Frontend**: React, TypeScript, Vite, MapLibre GL, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, TypeScript, TypeORM, PostgreSQL + PostGIS, Redis, Socket.IO
- **Dev/Infra**: ESLint, Prettier

## 📦 Deliverables (Assessment)
- **GitHub Repository**: clean, modular frontend (`/frontend`) + backend (`/backend`) in one repo.
- **Documentation**: this `README.md` covers architecture, setup, and run instructions.
- **Learning Log**: see “Learning Log (1 page)” below.

## Project Structure

```text
/backend
  src/
    controllers/   # HTTP controllers
    services/      # Business logic (spatial, routing, incidents)
    entities/      # TypeORM entities
    db/            # Data source config
    cache/         # Redis client
    websocket/     # Socket.IO setup
    utils/         # DB init + seeding

/frontend
  src/
    components/    # UI components
    hooks/         # Map + WebSocket hooks
    services/      # API client
    store/         # Zustand store
    styles/        # Tailwind entry
```

## Local Development (Quick Start)

### Prerequisites

- Node.js 18+
- PostgreSQL 12+ with PostGIS
- Redis 6+

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Backend environment (`backend/.env`)

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_DATABASE=gis_hospital_db

REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Run backend + frontend

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

- API: `http://localhost:3000/api`
- Frontend: `http://localhost:5173`

## Production Notes (Important)

- **Schema**:
  - Dev: TypeORM `synchronize` is enabled for convenience.
  - Prod: `synchronize` is **disabled**; schema should be managed via migrations (`migration:generate`, `migration:run`).
- **Seeding**:
  - Controlled by `SEED_DATABASE` (disabled by default in production).
- **CORS**:
  - `CORS_ORIGIN` env controls allowed origins (e.g. your Vercel frontend domain).
- **Routing**:
  - `OSRM_BASE_URL` allows swapping the routing provider instead of hard-coding the public OSRM demo server.

### Schema management & migrations (assessment note)

- Dev schema was created using TypeORM `synchronize`.
- In production, this project is already configured to rely on migrations instead.

## Deploying: Vercel (Frontend) + Render (Backend)

### Backend (Render)

- Root directory: `backend`
- Build: `npm run build`
- Start: `npm start`
- Key env vars:
  - `NODE_ENV=production`
  - `CORS_ORIGIN=https://<your-vercel-domain>`
  - `SEED_DATABASE=false`
  - `DB_*` and `REDIS_*` from your managed services
  - Optional: `OSRM_BASE_URL=...`

### Frontend (Vercel)

- Root directory: `frontend`
- Build: `npm run build`
- Output: `dist`
- Env vars (Vite, must start with `VITE_`):
  - `VITE_API_BASE_URL=https://<your-render-backend-domain>/api`
  - `VITE_WS_URL=https://<your-render-backend-domain>`

## Development Scripts

- **Backend**:
  - `npm run dev` – dev server with TSX
  - `npm run build` – compile TypeScript
  - `npm start` – run compiled server
- **Frontend**:
  - `npm run dev` – Vite dev server
  - `npm run build` – production build
  - `npm run preview` – preview build

## 🧠 Learning Log (1 page)

**Challenge:** PostGIS geography columns were returned inconsistently by TypeORM (raw `POINT(...)` strings or `{x,y}` objects), breaking the map because GeoJSON was expected.  
**Research:** Checked TypeORM docs/issues, explored column transformers, and then investigated PostGIS functions directly. Verified `ST_AsGeoJSON()` in `psql` to confirm it returned the exact structure needed.  
**Solution:** Switched to raw SQL with `ST_AsGeoJSON(location)::json` in the services (hospitals/ambulances/spatial) so the backend always emits GeoJSON. This removed ORM ambiguity, kept controllers thin, and worked reliably with MapLibre.  
**Mindset:** Prioritized a production-safe, reliable path over forcing an ORM abstraction; tested incrementally; documented the decision.

## License

MIT

