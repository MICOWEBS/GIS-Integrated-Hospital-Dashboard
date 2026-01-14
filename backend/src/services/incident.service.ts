import { AppDataSource } from '../db/data-source';
import { IncidentStatus, IncidentPriority } from '../entities/Incident';
import { AmbulanceStatus } from '../entities/Ambulance';
import { SpatialService } from './spatial.service';
import { RoutingService } from './routing.service';

export interface IncidentWithGeoJSON {
  id: string;
  address: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  priority: IncidentPriority;
  notes?: string;
  status: IncidentStatus;
  assigned_ambulance_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DispatchResult {
  incident: IncidentWithGeoJSON;
  assignedAmbulance: {
    id: string;
    status: AmbulanceStatus;
    location: {
      type: string;
      coordinates: [number, number];
    };
  };
  distance: number;
  eta: number; // in seconds
}

export class IncidentService {
  private spatialService: SpatialService;
  private routingService: RoutingService;

  constructor() {
    this.spatialService = new SpatialService();
    this.routingService = new RoutingService();
  }

  async getAllIncidents(): Promise<IncidentWithGeoJSON[]> {
    const results = await AppDataSource.query(`
      SELECT 
        id,
        address,
        priority,
        notes,
        status,
        assigned_ambulance_id,
        created_at,
        updated_at,
        ST_AsGeoJSON(location)::json as location
      FROM incidents
      ORDER BY created_at DESC
    `);

    return results.map((row: any) => ({
      id: row.id,
      address: row.address,
      priority: row.priority,
      notes: row.notes,
      status: row.status,
      assigned_ambulance_id: row.assigned_ambulance_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      location: {
        type: row.location.type,
        coordinates: row.location.coordinates,
      },
    }));
  }

  async getIncidentById(id: string): Promise<IncidentWithGeoJSON | null> {
    const result = await AppDataSource.query(
      `
      SELECT 
        id,
        address,
        priority,
        notes,
        status,
        assigned_ambulance_id,
        created_at,
        updated_at,
        ST_AsGeoJSON(location)::json as location
      FROM incidents
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
      address: row.address,
      priority: row.priority,
      notes: row.notes,
      status: row.status,
      assigned_ambulance_id: row.assigned_ambulance_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      location: {
        type: row.location.type,
        coordinates: row.location.coordinates,
      },
    };
  }

  async createIncident(
    address: string,
    longitude: number,
    latitude: number,
    priority: IncidentPriority = IncidentPriority.MEDIUM,
    notes?: string
  ): Promise<IncidentWithGeoJSON> {
    const result = await AppDataSource.query(
      `
      INSERT INTO incidents (address, location, priority, notes, status)
      VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6)
      RETURNING id, address, priority, notes, status, assigned_ambulance_id, created_at, updated_at
    `,
      [address, longitude, latitude, priority, notes || null, IncidentStatus.PENDING]
    );

    const incidentId = result[0].id;
    const incident = await this.getIncidentById(incidentId);
    if (!incident) {
      throw new Error('Failed to load created incident');
    }
    return incident;
  }

  /**
   * Auto-dispatch: Find optimal ambulance and assign to incident
   */
  async autoDispatch(incidentId: string): Promise<DispatchResult> {
    const incident = await this.getIncidentById(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    if (incident.status !== IncidentStatus.PENDING) {
      throw new Error('Incident already dispatched');
    }

    const [incidentLng, incidentLat] = incident.location.coordinates;

    // Find nearest available ambulance
    const nearestResult = await this.spatialService.findNearestAmbulance(
      incidentLng,
      incidentLat
    );

    if (!nearestResult || nearestResult.ambulance.status !== AmbulanceStatus.AVAILABLE) {
      throw new Error('No available ambulance found');
    }

    const ambulance = nearestResult.ambulance;
    const [ambulanceLng, ambulanceLat] = ambulance.location.coordinates;

    // Get route and ETA
    const route = await this.routingService.getRoute(
      ambulanceLng,
      ambulanceLat,
      incidentLng,
      incidentLat
    );

    // Assign ambulance to incident
    await AppDataSource.query(
      `
      UPDATE incidents
      SET 
        assigned_ambulance_id = $1,
        status = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
      [ambulance.id, IncidentStatus.DISPATCHED, incidentId]
    );

    // Update ambulance status
    await AppDataSource.query(
      `
      UPDATE ambulances
      SET 
        status = $1,
        last_updated = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [AmbulanceStatus.DISPATCHED, ambulance.id]
    );

    const updatedIncident = await this.getIncidentById(incidentId);

    return {
      incident: updatedIncident!,
      assignedAmbulance: {
        id: ambulance.id,
        status: AmbulanceStatus.DISPATCHED,
        location: ambulance.location,
      },
      distance: route.distance,
      eta: route.duration,
    };
  }

  async updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus
  ): Promise<IncidentWithGeoJSON | null> {
    await AppDataSource.query(
      `
      UPDATE incidents
      SET 
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [status, incidentId]
    );

    // If resolved, free up the ambulance
    if (status === IncidentStatus.RESOLVED || status === IncidentStatus.CANCELLED) {
      const incident = await this.getIncidentById(incidentId);
      if (incident?.assigned_ambulance_id) {
        await AppDataSource.query(
          `
          UPDATE ambulances
          SET 
            status = $1,
            last_updated = CURRENT_TIMESTAMP
          WHERE id = $2
        `,
          [AmbulanceStatus.AVAILABLE, incident.assigned_ambulance_id]
        );
      }
    }

    return await this.getIncidentById(incidentId);
  }
}

