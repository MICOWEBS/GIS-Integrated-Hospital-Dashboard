import axios from 'axios';
import { getRedisClient } from '../cache/redis-client';
import { env } from '../config/env';

export interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export class RoutingService {
  private readonly osrmBaseUrl = env.OSRM_BASE_URL;

  /**
   * Get route and ETA between two points using OSRM
   * Caches results in Redis with 5-minute TTL
   */
  async getRoute(
    fromLng: number,
    fromLat: number,
    toLng: number,
    toLat: number
  ): Promise<RouteResult> {
    const cacheKey = `route:${fromLng}:${fromLat}:${toLng}:${toLat}`;

    try {
      // Check cache first
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch route from OSRM
      const response = await axios.get(
        `${this.osrmBaseUrl}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
        { timeout: 5000 }
      );

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = response.data.routes[0];
      const result: RouteResult = {
        distance: route.distance,
        duration: route.duration,
        geometry: response.data.waypoints[0].geometry || {
          type: 'LineString',
          coordinates: [[fromLng, fromLat], [toLng, toLat]],
        },
      };

      // Cache for 5 minutes
      await redis.setEx(cacheKey, 300, JSON.stringify(result));

      return result;
    } catch (error) {
      console.error('Routing error:', error);
      // Fallback: return straight-line distance
      const straightDistance = this.calculateStraightLineDistance(
        fromLng,
        fromLat,
        toLng,
        toLat
      );
      return {
        distance: straightDistance,
        duration: straightDistance / 15, // Assume 15 m/s average speed
        geometry: {
          type: 'LineString',
          coordinates: [[fromLng, fromLat], [toLng, toLat]],
        },
      };
    }
  }

  /**
   * Calculate straight-line distance using Haversine formula
   */
  private calculateStraightLineDistance(
    lng1: number,
    lat1: number,
    lng2: number,
    lat2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Invalidate route cache for a specific ambulance
   */
  async invalidateAmbulanceRoutes(ambulanceId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys(`route:*:${ambulanceId}*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

