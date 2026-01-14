# GIS-Integrated Hospital Dashboard

A production-quality full-stack application that visualizes hospitals and ambulances on an interactive map and computes the nearest ambulance using PostGIS spatial queries with Redis caching.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌────────────────────────────────────┐  │
│  │   Sidebar    │  │         MapLibre Map View           │  │
│  │ - Hospitals  │  │  - Hospital Markers (Blue)          │  │
│  │ - Details    │  │  - Ambulance Markers (Green/Orange) │  │
│  │ - Nearest    │  │  - Route Line (Red Dashed)         │  │
│  └──────────────┘  └────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
┌───────────────────────────▼─────────────────────────────────┐
│                    Backend (Node.js/Express)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Controllers  │→ │   Services   │→ │   PostGIS    │     │
│  │  (Thin)      │  │  (Business)  │  │   Queries    │     │
│  └──────────────┘  └──────┬───────┘  └──────────────┘     │
│                            │                                │
│                    ┌───────▼───────┐                        │
│                    │  Redis Cache  │                        │
│                    │  (60s TTL)    │                        │
│                    └───────────────┘                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌───────▼────────┐
│  PostgreSQL   │                    │     Redis      │
│  + PostGIS     │                    │   (Caching)     │
│  - Hospitals   │                    │                 │
│  - Ambulances  │                    │                 │
└────────────────┘                    └─────────────────┘
```

## Tech Stack

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - REST API framework
- **PostgreSQL** + **PostGIS** - Spatial database with geography support
- **Redis** - Caching layer for proximity queries
- **TypeORM** - ORM with PostGIS compatibility

### Frontend
- **React** + **TypeScript**
- **MapLibre GL** - Interactive map rendering
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **react-hot-toast** - Elegant toast notifications

### Infrastructure
- **ESLint** + **Prettier** - Code quality

## Project Structure

```
/backend
 ├── src
 │   ├── controllers/      # Thin request handlers
 │   │   ├── hospital.controller.ts
 │   │   └── ambulance.controller.ts
 │   ├── services/          # Business logic
│   │   ├── hospital.service.ts
│   │   ├── ambulance.service.ts
│   │   ├── spatial.service.ts   # PostGIS queries + caching
│   │   ├── routing.service.ts   # OSRM routing + ETA + Redis cache
│   │   └── incident.service.ts  # Incident creation + auto-dispatch
 │   ├── routes/            # API route definitions
│   │   ├── hospital.routes.ts
│   │   ├── ambulance.routes.ts
│   │   ├── incident.routes.ts   # Incident CRUD + dispatch
│   │   └── routing.routes.ts    # Routing/ETA endpoint
 │   ├── entities/          # TypeORM entities
│   │   ├── Hospital.ts
│   │   ├── Ambulance.ts
│   │   └── Incident.ts
 │   ├── db/                # Database configuration
 │   │   └── data-source.ts
 │   ├── cache/             # Redis client
│   │   └── redis-client.ts
│   ├── websocket/         # Socket.io setup
│   │   └── socket.ts
 │   ├── utils/             # Utilities
 │   │   ├── db-init.ts     # Database seeding
 │   │   └── geography.ts   # GeoJSON helpers
 │   └── index.ts           # Application entry point
 └── package.json

/frontend
 ├── src
 │   ├── components/        # React components
 │   │   ├── TopBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MapView.tsx
 │   │   ├── HospitalList.tsx
│   │   ├── HospitalDetails.tsx
│   │   ├── StatusIndicator.tsx
│   │   └── IncidentForm.tsx     # Collapsible incident panel
 │   ├── hooks/             # Custom React hooks
 │   │   └── useMap.ts      # MapLibre integration
 │   ├── services/          # API client
 │   │   └── api.ts
 │   ├── store/             # Zustand state
 │   │   └── useStore.ts
 │   ├── styles/            # Global styles
 │   │   └── index.css
 │   ├── App.tsx
 │   └── main.tsx
 ├── index.html
 └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+ with PostGIS extension installed
- Redis 6+ installed and running

### 1. Install PostgreSQL and PostGIS

**Windows:**
- Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- Install PostGIS extension using Stack Builder or via `CREATE EXTENSION postgis;`

**macOS:**
```bash
brew install postgresql postgis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql postgresql-contrib postgis
```

### 2. Install Redis

**Windows:**
- Download from [redis.io](https://redis.io/download) or use WSL

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### 3. Set Up Database

Create the database and enable PostGIS:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE gis_hospital_db;

# Connect to the new database
\c gis_hospital_db

# Enable PostGIS extension
CREATE EXTENSION postgis;

# Verify PostGIS is installed
SELECT PostGIS_version();

# Exit
\q
```

**Note:** The backend will also attempt to enable PostGIS automatically on startup, but it's recommended to enable it manually first to catch any installation issues early.

### 4. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 5. Configure Environment

Create `backend/.env`:

```bash
cd backend
# Create .env file with the following content:
```

```env
PORT=3000
NODE_ENV=development

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_DATABASE=gis_hospital_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS (recommended for production)
# Comma-separated allow-list (e.g. "https://your-frontend.com,https://www.your-frontend.com")
# In development, leaving this unset allows all origins.
# In production, set this to your frontend domain(s).
# CORS_ORIGIN=

# Routing (recommended for production)
# Public OSRM demo is not meant for production traffic. Prefer self-hosting or a paid routing API.
# OSRM_BASE_URL=https://router.project-osrm.org

# Seeding (recommended for production)
# In production, the backend defaults to NOT seeding demo data unless explicitly enabled.
# SEED_DATABASE=false
```

**Important:** Update `DB_PASSWORD` with your PostgreSQL password.

### 6. Start Backend Server

```bash
cd backend
npm run dev
```

The backend will:
- Connect to PostgreSQL (PostGIS extension should already be enabled)
- Create tables (dev) and seed demo data (dev)
- Start API server on http://localhost:3000

## Production Notes (Important)

- **TypeORM `synchronize`**: In production, auto schema sync is disabled. Use migrations:
  - `npm run migration:generate` (create migration)
  - `npm run migration:run` (apply migrations)
- **Seeding**: In production, seeding is **disabled by default**. To seed intentionally set:
  - `SEED_DATABASE=true`
- **CORS**: Set `CORS_ORIGIN` to your deployed frontend origin(s).
- **Routing**: Set `OSRM_BASE_URL` to your own OSRM instance or routing provider.

### Schema management & migrations (assessment note)

- During local development, the schema was created using TypeORM's `synchronize` feature.
- For **production**, the code is already configured to **disable `synchronize`** and to rely on migrations (`migration:generate` / `migration:run`) for schema evolution.
- In a real deployment, I would:
  - Generate an initial migration that matches the current entities.
  - Apply that migration to the production database instead of relying on `synchronize`.

## Deploying: Vercel (Frontend) + Render (Backend)

### Backend (Render) environment variables

- `NODE_ENV=production`
- `CORS_ORIGIN=https://<your-vercel-domain>` (or a comma-separated list if you have multiple domains)
- `SEED_DATABASE=false`
- `OSRM_BASE_URL=...` (optional but recommended; public OSRM demo is not for production traffic)
- `DB_*` and `REDIS_*` as provided by your managed services

### Frontend (Vercel) environment variables

Vite reads env vars at **build time** and they must start with `VITE_`.

- `VITE_API_BASE_URL=https://<your-render-backend-domain>/api`
- `VITE_WS_URL=https://<your-render-backend-domain>`

Notes:
- `VITE_API_BASE_URL` should include `/api` because the backend mounts routes under `/api/*`.
- `VITE_WS_URL` is the origin for Socket.IO (same backend, no `/api`).

### 7. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will be available at http://localhost:5173

## How Spatial Queries Work

### PostGIS Geography Type

Hospitals and ambulances store location as `GEOGRAPHY(Point, 4326)`:
- Uses WGS84 coordinate system (SRID 4326)
- Calculates distances on Earth's surface (geodesic)
- More accurate than geometry for real-world distances

### Nearest Neighbor Query

When a hospital is selected, the backend performs:

```sql
SELECT 
  a.id,
  a.status,
  ST_AsGeoJSON(a.location)::json as location,
  ST_Distance(
    a.location::geography,
    h.location::geography
  ) as distance
FROM ambulances a
CROSS JOIN hospitals h
WHERE h.id = $1
  AND a.status = 'available'
ORDER BY a.location <-> h.location
LIMIT 1
```

**Key Points:**
- `ST_Distance(geography, geography)` returns distance in **meters**
- `a.location <-> h.location` is the **KNN operator** for spatial indexing
- `ORDER BY ... <->` uses spatial index for optimal performance
- Only considers `available` ambulances

### Spatial Indexing

PostGIS automatically creates spatial indexes on geography columns, enabling fast nearest-neighbor queries even with thousands of records.

## Caching Strategy

### Redis Cache Implementation

**Cache Key Format:**
```
nearest_ambulance:{hospital_id}
```

**TTL:** 60 seconds

**Flow:**
1. Client requests nearest ambulance for hospital
2. Backend checks Redis cache
3. **Cache Hit:** Return cached result immediately (logged as `[CACHE HIT]`)
4. **Cache Miss:** 
   - Execute PostGIS query
   - Store result in Redis with 60s TTL
   - Return result (logged as `[CACHE MISS]`)

**Benefits:**
- Reduces database load for repeated queries
- 60s TTL balances freshness vs performance
- Cache automatically invalidates after TTL

**Cache Invalidation:**
- Automatic via TTL (60 seconds)
- Manual: Clear Redis or wait for expiration
- Note: Ambulance movement doesn't invalidate cache (would require pub/sub or cache tags)

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### `GET /api/hospitals`
Returns all hospitals with GeoJSON locations.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "City General Hospital",
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749]
    },
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `GET /api/ambulances`
Returns all ambulances with GeoJSON locations.

**Response:**
```json
[
  {
    "id": "uuid",
    "status": "available",
    "location": {
      "type": "Point",
      "coordinates": [-122.4144, 37.7799]
    },
    "last_updated": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `GET /api/hospitals/:id/nearest-ambulance`
Finds the nearest available ambulance to a hospital.

**Response:**
```json
{
  "ambulance": {
    "id": "uuid",
    "status": "available",
    "location": {
      "type": "Point",
      "coordinates": [-122.4144, 37.7799]
    },
    "last_updated": "2024-01-01T00:00:00.000Z"
  },
  "distance": 1234.56
}
```

**Distance:** In meters (converted to km in frontend)

**Errors:**
- `404`: No available ambulance found or hospital not found
- `500`: Server error

#### `POST /api/ambulances/:id/move`
Updates ambulance location (simulates movement).

**Request Body:**
```json
{
  "longitude": -122.4194,
  "latitude": 37.7749
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "available",
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "last_updated": "2024-01-01T00:00:00.000Z"
}
```

**Validation:**
- Longitude: -180 to 180
- Latitude: -90 to 90

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Frontend Behavior

### Initial Load
1. Fetches all hospitals and ambulances
2. Displays markers on map
3. Shows hospital list in sidebar
4. Checks backend health (DB/Cache status)

### Hospital Selection
1. User clicks hospital (list or map)
2. Hospital highlighted in blue
3. Frontend requests nearest ambulance
4. Backend checks cache → queries PostGIS if miss
5. Nearest ambulance displayed with:
   - Distance in kilometers
   - Status badge
   - Location coordinates
6. Red dashed line drawn between hospital and ambulance
7. Map auto-fits to show both points

### Map Markers
- **Hospitals:** Blue circles (red when selected)
- **Ambulances:** 
  - Green squares = Available
  - Orange squares = Busy

## Development

### Backend Scripts
```bash
npm run dev      # Start with hot reload (tsx watch)
npm run build    # Compile TypeScript
npm start        # Run compiled code
```

### Frontend Scripts
```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

### Database Management
The database is automatically initialized on first backend startup:
- Tables created via TypeORM synchronize
- Seed data inserted (10 hospitals, 5 ambulances)

To reset the database:
```bash
# Connect to PostgreSQL
psql -U postgres -d gis_hospital_db

# Drop and recreate tables (or use migrations)
DROP TABLE IF EXISTS ambulances CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;

# Exit and restart backend to recreate tables
\q
```

## Code Quality

- **TypeScript strict mode** enabled
- **No `any` types** - fully typed
- **ESLint** + **Prettier** for consistency
- **Separation of concerns:**
  - Controllers: Request/response handling
  - Services: Business logic
  - Entities: Data models
  - Routes: API definitions

## Learning Log

### The PostGIS Geography Serialization Challenge

**The Problem:**
During development, I encountered a frustrating issue where the frontend map wasn't displaying hospital and ambulance locations. The backend was successfully querying the database and returning data, but the map remained empty. After adding console logs, I discovered that TypeORM was returning PostGIS geography columns in an inconsistent format: sometimes as raw PostGIS POINT strings like `"POINT(-122.4194 37.7749)"`, other times as objects with `x` and `y` properties, but never in the GeoJSON format that MapLibre GL expected: `{ type: "Point", coordinates: [lng, lat] }`.

This was particularly challenging because:
1. The error wasn't immediately obvious - the API was returning 200 status codes
2. TypeORM's documentation on PostGIS support is sparse
3. The data format inconsistency made debugging difficult
4. The frontend silently failed without clear error messages

**The Research Process:**
My initial approach was to work within TypeORM's ecosystem. I spent several hours:

1. **Investigating TypeORM's PostGIS support**: I scoured the TypeORM documentation, GitHub issues, and Stack Overflow posts. I found that TypeORM has basic PostGIS support through the `Point` type, but the serialization behavior is inconsistent and poorly documented.

2. **Exploring custom column transformers**: I attempted to create custom TypeORM column transformers to convert PostGIS POINT to GeoJSON. This approach was complex, error-prone, and required handling multiple edge cases (null values, different coordinate systems, etc.). The transformer code became unwieldy and hard to maintain.

3. **Researching PostGIS functions**: After hitting dead ends with ORM-level solutions, I shifted my research to PostGIS itself. I discovered that PostGIS has a built-in function `ST_AsGeoJSON()` that converts geometry/geography types directly to GeoJSON format. This was a game-changer - instead of fighting the ORM, I could leverage the database's native capabilities.

4. **Testing the approach**: I wrote test queries in `psql` to verify `ST_AsGeoJSON()` worked correctly with geography types and returned the exact format needed. I confirmed it handles edge cases like null values and maintains coordinate precision.

**The Solution:**
I abandoned the ORM-level transformation approach and instead used raw SQL queries with PostGIS's native `ST_AsGeoJSON()` function. In the service layer (`hospital.service.ts`, `ambulance.service.ts`, and `spatial.service.ts`), I replaced TypeORM's `find()` methods with raw SQL queries:

```sql
SELECT 
  id,
  name,
  ST_AsGeoJSON(location)::json as location
FROM hospitals
```

This approach:
- **Works reliably**: PostGIS handles all the serialization complexity
- **Returns exact format**: GeoJSON is the standard format for web mapping libraries
- **Maintains type safety**: TypeScript interfaces ensure type correctness
- **Keeps architecture clean**: The transformation happens in the service layer, so controllers remain simple

**The Lesson:**
This experience taught me an important architectural lesson: **when working with specialized database features (like PostGIS), sometimes the best solution is to leverage the database's native capabilities rather than forcing ORM abstractions**. The key is to encapsulate these database-specific operations in the service layer, maintaining clean separation of concerns while taking advantage of powerful database features.

This approach also reinforced the value of:
- **Researching the problem domain** (PostGIS) rather than just the tool (TypeORM)
- **Testing solutions incrementally** (starting with raw SQL in psql before implementing)
- **Prioritizing reliability over abstraction** when dealing with specialized features
- **Maintaining clean architecture** even when using raw SQL (keeping it in services, not controllers)

The solution was elegant, performant, and maintainable - a reminder that sometimes the "simpler" ORM approach isn't always the best approach.

## Future Enhancements

- [ ] WebSocket support for real-time ambulance updates
- [ ] Polling mechanism for automatic ambulance position updates
- [ ] Dark mode toggle
- [ ] Multiple hospital selection and comparison
- [ ] Ambulance route visualization
- [ ] Historical tracking of ambulance movements
- [ ] Cache invalidation on ambulance movement (pub/sub)
- [ ] Unit and integration tests
- [ ] CI/CD pipeline

## License

MIT

