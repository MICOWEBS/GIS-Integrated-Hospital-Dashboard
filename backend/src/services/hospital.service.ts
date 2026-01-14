import { AppDataSource } from '../db/data-source';

export interface HospitalWithGeoJSON {
  id: string;
  name: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  created_at: Date;
}

export class HospitalService {
  constructor() {}

  async getAllHospitals(): Promise<HospitalWithGeoJSON[]> {
    // Query with ST_AsGeoJSON to get location in GeoJSON format
    const results = await AppDataSource.query(`
      SELECT 
        id,
        name,
        created_at,
        ST_AsGeoJSON(location)::json as location
      FROM hospitals
      ORDER BY created_at ASC
    `);

    return results.map(
      (row: {
        id: string;
        name: string;
        created_at: Date;
        location: { type: string; coordinates: [number, number] };
      }) => ({
        id: row.id,
        name: row.name,
        created_at: row.created_at,
        location: {
          type: row.location.type,
          coordinates: row.location.coordinates,
        },
      })
    );
  }

  async getHospitalById(id: string): Promise<HospitalWithGeoJSON | null> {
    const result = await AppDataSource.query(
      `
      SELECT 
        id,
        name,
        created_at,
        ST_AsGeoJSON(location)::json as location
      FROM hospitals
      WHERE id = $1
    `,
      [id]
    );

    if (!result || result.length === 0) {
      return null;
    }

    const row = result[0] as {
      id: string;
      name: string;
      created_at: Date;
      location: { type: string; coordinates: [number, number] };
    };
    return {
      id: row.id,
      name: row.name,
      created_at: row.created_at,
      location: {
        type: row.location.type,
        coordinates: row.location.coordinates,
      },
    };
  }
}

