# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ with PostGIS extension
- Redis 6+ installed and running

## Step-by-Step Setup

### 1. Install PostgreSQL and PostGIS

**Windows:**
- Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- During installation, make sure to install PostGIS extension
- Or install PostGIS later using Stack Builder

**macOS:**
```bash
brew install postgresql postgis
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis
sudo systemctl start postgresql
```

### 2. Install Redis

**Windows:**
- Download from [redis.io](https://redis.io/download) or use WSL
- Or use a Redis service like Memurai

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

### 3. Create Database and Enable PostGIS

```bash
# Connect to PostgreSQL (use your postgres user password)
psql -U postgres

# Create database
CREATE DATABASE gis_hospital_db;

# Connect to the new database
\c gis_hospital_db

# Enable PostGIS extension
CREATE EXTENSION postgis;

# Verify PostGIS is installed
SELECT PostGIS_version();

# Exit psql
\q
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Configure Backend Environment

Create `backend/.env` file:

```env
PORT=3000
NODE_ENV=development

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password_here
DB_DATABASE=gis_hospital_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password.

### 6. Verify Services Are Running

**PostgreSQL:**
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"
```

**Redis:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

### 7. Start Backend

```bash
cd backend
npm run dev
```

You should see:
- ✓ Database connected
- ✓ PostGIS extension enabled
- ✓ Database tables synchronized
- ✓ Seeded 10 hospitals
- ✓ Seeded 5 ambulances
- ✓ Server running on http://localhost:3000

### 8. Start Frontend

In a new terminal:
```bash
cd frontend
npm run dev
```

Frontend will open at http://localhost:5173

## Verify It Works

1. Open http://localhost:5173
2. You should see:
   - Map with blue hospital markers and green/orange ambulance markers
   - Sidebar with hospital list
   - Top bar showing DB and Cache status (green dots)
3. Click a hospital in the sidebar
4. You should see:
   - Hospital highlighted
   - Nearest ambulance details appear
   - Red dashed line on map connecting hospital to ambulance
   - Distance in kilometers

## Troubleshooting

### Backend won't start - Database connection error
- Verify PostgreSQL is running:
  - Windows: Check Services app for "postgresql" service
  - macOS: `brew services list`
  - Linux: `sudo systemctl status postgresql`
- Check your `.env` file has correct credentials
- Verify database exists: `psql -U postgres -l` (should list `gis_hospital_db`)
- Test connection: `psql -U postgres -d gis_hospital_db`

### PostGIS extension error
- Verify PostGIS is installed:
  ```bash
  psql -U postgres -d gis_hospital_db -c "SELECT PostGIS_version();"
  ```
- If not installed, install PostGIS:
  - Windows: Use Stack Builder or download PostGIS installer
  - macOS: `brew install postgis`
  - Linux: `sudo apt-get install postgis`

### Frontend can't connect to backend
- Verify backend is running on port 3000
- Check browser console for CORS errors
- Verify proxy configuration in `frontend/vite.config.ts`
- Check backend console for errors

### No data on map
- Check backend console for database connection errors
- Verify seed data exists:
  ```bash
  psql -U postgres -d gis_hospital_db -c "SELECT COUNT(*) FROM hospitals;"
  ```
- Should return 10. If 0, restart backend to trigger seeding

### Redis cache not working
- Check Redis is running:
  - Windows: Check if Redis service is running
  - macOS: `brew services list | grep redis`
  - Linux: `sudo systemctl status redis-server`
- Test Redis connection:
  ```bash
  redis-cli ping
  ```
- Backend will still work without Redis, just no caching (you'll see cache errors in console)

### Port already in use
- Backend (3000): Change `PORT` in `backend/.env`
- Frontend (5173): Change port in `frontend/vite.config.ts`
- PostgreSQL (5432): Update `DB_PORT` in `backend/.env`
- Redis (6379): Update `REDIS_PORT` in `backend/.env`

## Stopping Services

```bash
# Stop backend (Ctrl+C in terminal)
# Stop frontend (Ctrl+C in terminal)

# Stop PostgreSQL (if needed)
# Windows: Stop service in Services app
# macOS: brew services stop postgresql
# Linux: sudo systemctl stop postgresql

# Stop Redis (if needed)
# Windows: Stop service in Services app
# macOS: brew services stop redis
# Linux: sudo systemctl stop redis-server
```

## Resetting Database

To clear all data and start fresh:

```bash
# Connect to database
psql -U postgres -d gis_hospital_db

# Drop tables
DROP TABLE IF EXISTS ambulances CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;

# Exit
\q

# Restart backend - it will recreate tables and seed data
cd backend
npm run dev
```
