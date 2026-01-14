import * as dotenv from 'dotenv';

dotenv.config();

type Env = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;

  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  DB_LOGGING: boolean;

  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_USERNAME?: string;
  REDIS_PASSWORD?: string;

  // Comma-separated list of allowed CORS origins (e.g. "https://app.com,https://www.app.com")
  CORS_ORIGIN?: string;

  // Routing
  OSRM_BASE_URL: string;

  // Seeding
  SEED_DATABASE: boolean;
};

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function parseIntEnv(name: string, defaultValue?: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required env var: ${name}`);
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid number for env var ${name}: ${raw}`);
  return n;
}

export const env: Env = {
  NODE_ENV: (process.env.NODE_ENV as Env['NODE_ENV']) || 'development',
  PORT: parseIntEnv('PORT', 3000),

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseIntEnv('DB_PORT', 5432),
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD:
    process.env.DB_PASSWORD ??
    (process.env.NODE_ENV === 'production'
      ? requireEnv('DB_PASSWORD')
      : 'postgres'),
  DB_DATABASE: process.env.DB_DATABASE || 'gis_hospital_db',
  DB_LOGGING: parseBool(process.env.DB_LOGGING, false),

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseIntEnv('REDIS_PORT', 6379),
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  CORS_ORIGIN: process.env.CORS_ORIGIN,

  OSRM_BASE_URL: process.env.OSRM_BASE_URL || 'https://router.project-osrm.org',

  // In production, default to NOT seeding unless explicitly enabled.
  SEED_DATABASE: parseBool(process.env.SEED_DATABASE, process.env.NODE_ENV !== 'production'),
};


