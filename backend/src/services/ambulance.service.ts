import { AppDataSource } from '../db/data-source';
import { AmbulanceStatus } from '../entities/Ambulance';
import { getSocketServer } from '../websocket/socket';
import { getRedisClient } from '../cache/redis-client';

export interface AmbulanceWithGeoJSON {
  id: string;
  status: AmbulanceStatus;
  location: {
    type: string;
    coordinates: [number, number];
  };
  last_updated: Date;
}

type AmbulanceRow = {
  id: string;
  status: AmbulanceStatus;
  last_updated: Date;
  location: {
    type: string;
    coordinates: [number, number];
  };
};

export class AmbulanceService {
  async getAllAmbulances(): Promise<AmbulanceWithGeoJSON[]> {
    // Query with ST_AsGeoJSON to get location in GeoJSON format
    const results = await AppDataSource.query<AmbulanceRow[]>(`
      SELECT 
        id,
        status,
        last_updated,
        ST_AsGeoJSON(location)::json as location
      FROM ambulances
      ORDER BY last_updated DESC
    `);

    return results.map((row: AmbulanceRow) => ({
      id: row.id,
      status: row.status,
      last_updated: row.last_updated,
      location: {
        type: row.location.type,
        coordinates: row.location.coordinates,
      },
    }));
  }

  async getAmbulanceById(id: string): Promise<AmbulanceWithGeoJSON | null> {
    const result = await AppDataSource.query<AmbulanceRow[]>(
      `
      SELECT 
        id,
        status,
        last_updated,
        ST_AsGeoJSON(location)::json as location
      FROM ambulances
      WHERE id = $1
    `,
      [id]
    );

    if (!result || result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      status: row.status,
      last_updated: row.last_updated,
      location: {
        type: row.location.type,
        coordinates: row.location.coordinates,
      },
    };
  }

  async updateAmbulanceLocation(
    id: string,
    longitude: number,
    latitude: number
  ): Promise<AmbulanceWithGeoJSON | null> {
    // Update location using PostGIS POINT
    await AppDataSource.query(
      `
      UPDATE ambulances
      SET 
        location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
        last_updated = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
      [longitude, latitude, id]
    );

    const updated = await this.getAmbulanceById(id);

    // Emit WebSocket event for real-time updates
    try {
      const io = getSocketServer();
      io.emit('ambulance:location-updated', updated);
    } catch (error) {
      // Socket server might not be initialized, ignore
    }

    // Invalidate cache for this ambulance
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys(`nearest:*:${id}*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      // Cache might not be available, ignore
    }

    return updated;
  }

  async updateAmbulanceStatus(
    id: string,
    status: AmbulanceStatus
  ): Promise<AmbulanceWithGeoJSON | null> {
    await AppDataSource.query(
      `
      UPDATE ambulances
      SET 
        status = $1,
        last_updated = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [status, id]
    );

    const updated = await this.getAmbulanceById(id);

    // Emit WebSocket event for real-time updates
    try {
      const io = getSocketServer();
      io.emit('ambulance:status-updated', updated);
    } catch (error) {
      // Socket server might not be initialized, ignore
    }

    return updated;
  }
}

