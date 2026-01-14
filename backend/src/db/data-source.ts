import { DataSource } from 'typeorm';
import { Hospital } from '../entities/Hospital';
import { Ambulance } from '../entities/Ambulance';
import { Incident } from '../entities/Incident';
import { env } from '../config/env';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  entities: [Hospital, Ambulance, Incident],
  // Auto-create tables ONLY in non-production.
  // In production, use migrations (migration:generate / migration:run).
  synchronize: env.NODE_ENV !== 'production',
  // log errors and warnings
  logging: env.DB_LOGGING ? true : ['error', 'warn'],
  ssl:
    env.DB_HOST?.includes('render.com') || env.DB_HOST?.includes('dpg-')
      ? { rejectUnauthorized: false }
      : false,
  extra: {
    // Enable PostGIS extension
    application_name: 'gis-hospital-dashboard',
  },
});

