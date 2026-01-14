import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Hospital } from '../entities/Hospital';
import { AmbulanceWithGeoJSON } from './ambulance.service';
import { getRedisClient } from '../cache/redis-client';

interface NearestAmbulanceResult {
  ambulance: AmbulanceWithGeoJSON;
  distance: number; // in meters
}

export class SpatialService {
  private hospitalRepository: Repository<Hospital>;
  private readonly CACHE_TTL = 60; // 60 seconds

  constructor() {
    this.hospitalRepository = AppDataSource.getRepository(Hospital);
  }

  /**
   * Find the nearest available ambulance to coordinates using PostGIS spatial query.
   * Implements Redis caching with 60s TTL.
   */
  async findNearestAmbulance(
    longitude: number,
    latitude: number
  ): Promise<NearestAmbulanceResult | null> {
    const cacheKey = `nearest_ambulance:${longitude}:${latitude}`;
    const redis = await getRedisClient();

    // Check cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[CACHE HIT] nearest_ambulance:${longitude}:${latitude}`);
        const parsed = JSON.parse(cached);
        return {
          ambulance: parsed.ambulance,
          distance: parsed.distance,
        };
      }
    } catch (error) {
      console.error('Redis cache read error:', error);
    }

    console.log(`[CACHE MISS] nearest_ambulance:${longitude}:${latitude}`);

    // PostGIS nearest-neighbor query using KNN operator (<->)
    const result = await AppDataSource.query(
      `
      SELECT 
        a.id,
        a.status,
        a.last_updated,
        ST_AsGeoJSON(a.location)::json as location,
        ST_Distance(
          a.location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM ambulances a
      WHERE a.status = $3
      ORDER BY a.location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
      LIMIT 1
    `,
      [longitude, latitude, 'available']
    );

    if (!result || result.length === 0) {
      return null;
    }

    const row = result[0];

    const ambulance: AmbulanceWithGeoJSON = {
      id: row.id,
      status: row.status,
      last_updated: row.last_updated,
      location: {
        type: row.location.type,
        coordinates: row.location.coordinates,
      },
    };

    const nearestResult: NearestAmbulanceResult = {
      ambulance,
      distance: parseFloat(row.distance),
    };

    // Cache the result
    try {
      await redis.setEx(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(nearestResult)
      );
    } catch (error) {
      console.error('Redis cache write error:', error);
    }

    return nearestResult;
  }

  /**
   * Find the nearest available ambulance to a hospital using PostGIS spatial query.
   * Implements Redis caching with 60s TTL.
   */
  async findNearestAmbulanceToHospital(
    hospitalId: string
  ): Promise<NearestAmbulanceResult | null> {
    const cacheKey = `nearest_ambulance:hospital:${hospitalId}`;
    const redis = await getRedisClient();

    // Check cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[CACHE HIT] nearest_ambulance:hospital:${hospitalId}`);
        const parsed = JSON.parse(cached);
        return {
          ambulance: parsed.ambulance,
          distance: parsed.distance,
        };
      }
    } catch (error) {
      console.error('Redis cache read error:', error);
    }

    console.log(`[CACHE MISS] nearest_ambulance:hospital:${hospitalId}`);

    // Get hospital location
    const hospital = await this.hospitalRepository.findOne({
      where: { id: hospitalId },
    });

    if (!hospital) {
      return null;
    }

    // PostGIS nearest-neighbor query using KNN operator (<->)
    // This uses spatial indexing for optimal performance
    // Using raw SQL for reliable PostGIS geography operations
    const result = await AppDataSource.query(
      `
      SELECT 
        a.id,
        a.status,
        a.last_updated,
        ST_AsGeoJSON(a.location)::json as location,
        ST_Distance(
          a.location::geography,
          h.location::geography
        ) as distance
      FROM ambulances a
      CROSS JOIN hospitals h
      WHERE h.id = $1
        AND a.status = $2
      ORDER BY a.location <-> h.location
      LIMIT 1
    `,
      [hospitalId, 'available']
    );

    if (!result || result.length === 0) {
      return null;
    }

    const row = result[0];

    const ambulance: AmbulanceWithGeoJSON = {
      id: row.id,
      status: row.status,
      last_updated: row.last_updated,
      location: {
        type: row.location.type,
        coordinates: row.location.coordinates,
      },
    };

    const nearestResult: NearestAmbulanceResult = {
      ambulance,
      distance: parseFloat(row.distance),
    };

    // Cache the result
    try {
      await redis.setEx(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(nearestResult)
      );
    } catch (error) {
      console.error('Redis cache write error:', error);
    }

    return nearestResult;
  }
}

