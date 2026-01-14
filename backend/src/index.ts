import 'reflect-metadata';
import express, { Express } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { AppDataSource } from './db/data-source';
import { initializeDatabase } from './utils/db-init';
import { initSocketServer } from './websocket/socket';
import hospitalRoutes from './routes/hospital.routes';
import ambulanceRoutes from './routes/ambulance.routes';
import incidentRoutes from './routes/incident.routes';
import routingRoutes from './routes/routing.routes';
import { env } from './config/env';
import { closeRedisConnection } from './cache/redis-client';

const app: Express = express();
const httpServer = createServer(app);
const PORT = env.PORT;

// Initialize WebSocket server
initSocketServer(httpServer);

// Middleware
if (env.NODE_ENV === 'production') {
  // so req.ip works correctly behind a reverse proxy / load balancer
  app.set('trust proxy', 1);
}

// Basic hardening headers (lightweight, no extra deps)
app.disable('x-powered-by');

const allowedOrigins =
  env.CORS_ORIGIN?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow same-origin / server-to-server / curl requests
      if (!origin) return callback(null, true);
      // if not configured, allow all in non-production
      if (allowedOrigins.length === 0 && env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      // in production, require explicit allow-list
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API root endpoint
app.get('/api', (_req, res) => {
  res.json({
    message: 'GIS Hospital Dashboard API',
    version: '1.0.0',
    endpoints: {
      hospitals: '/api/hospitals',
      ambulances: '/api/ambulances',
      incidents: '/api/incidents',
      routing: '/api/routing',
      health: '/health',
    },
  });
});

// API Routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/routing', routingRoutes);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
      availableEndpoints: {
        apiInfo: '/api',
        hospitals: '/api/hospitals',
        ambulances: '/api/ambulances',
        incidents: '/api/incidents',
        routing: '/api/routing',
        health: '/health',
      },
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Initialize database and start server
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await AppDataSource.initialize();
    console.log('✓ Database connected');

    // Initialize database schema and seed data
    await initializeDatabase();

    // Start HTTP server (with WebSocket support)
    httpServer.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log(`✓ WebSocket server initialized`);
    }).on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n✗ Port ${PORT} is already in use.`);
        console.error(`  Please either:`);
        console.error(`  1. Stop the process using port ${PORT}`);
        console.error(`  2. Or set a different PORT in your .env file\n`);
        process.exit(1);
      } else {
        console.error('Failed to start server:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received, shutting down gracefully...`);
  try {
    await closeRedisConnection();
  } catch (e) {
    console.error('Failed to close Redis connection:', e);
  }
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  } catch (e) {
    console.error('Failed to close DB connection:', e);
  }
  httpServer.close(() => process.exit(0));
  // If server doesn't close quickly, force exit.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

