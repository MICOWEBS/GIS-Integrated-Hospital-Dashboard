import axios from 'axios';


const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Hospital {
  id: string;
  name: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  created_at: string;
}

export interface Ambulance {
  id: string;
  status: 'available' | 'busy' | 'dispatched';
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  last_updated: string;
}

export interface NearestAmbulanceResult {
  ambulance: Ambulance;
  distance: number; // in meters
}

export const hospitalApi = {
  getAll: async (): Promise<Hospital[]> => {
    const response = await api.get<Hospital[]>('/hospitals');
    return response.data;
  },
  getNearestAmbulance: async (
    hospitalId: string
  ): Promise<NearestAmbulanceResult> => {
    const response = await api.get<NearestAmbulanceResult>(
      `/hospitals/${hospitalId}/nearest-ambulance`
    );
    return response.data;
  },
};

export interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export interface Incident {
  id: string;
  address: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  status: 'pending' | 'dispatched' | 'in_progress' | 'resolved' | 'cancelled';
  assigned_ambulance_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DispatchResult {
  incident: Incident;
  assignedAmbulance: Ambulance;
  distance: number;
  eta: number; // in seconds
}

export const ambulanceApi = {
  getAll: async (): Promise<Ambulance[]> => {
    const response = await api.get<Ambulance[]>('/ambulances');
    return response.data;
  },
  move: async (
    id: string,
    longitude: number,
    latitude: number
  ): Promise<Ambulance> => {
    const response = await api.post<Ambulance>(`/ambulances/${id}/move`, {
      longitude,
      latitude,
    });
    return response.data;
  },
  updateStatus: async (
    id: string,
    status: 'available' | 'busy' | 'dispatched'
  ): Promise<Ambulance> => {
    const response = await api.patch<Ambulance>(`/ambulances/${id}/status`, {
      status,
    });
    return response.data;
  },
};

export const routingApi = {
  getRoute: async (
    fromLng: number,
    fromLat: number,
    toLng: number,
    toLat: number
  ): Promise<RouteResult> => {
    const response = await api.get<RouteResult>('/routing/route', {
      params: { fromLng, fromLat, toLng, toLat },
    });
    return response.data;
  },
};

export const incidentApi = {
  getAll: async (): Promise<Incident[]> => {
    const response = await api.get<Incident[]>('/incidents');
    return response.data;
  },
  getById: async (id: string): Promise<Incident> => {
    const response = await api.get<Incident>(`/incidents/${id}`);
    return response.data;
  },
  create: async (
    address: string,
    longitude: number,
    latitude: number,
    priority?: 'low' | 'medium' | 'high' | 'critical',
    notes?: string
  ): Promise<Incident> => {
    const response = await api.post<Incident>('/incidents', {
      address,
      longitude,
      latitude,
      priority,
      notes,
    });
    return response.data;
  },
  dispatch: async (id: string): Promise<DispatchResult> => {
    const response = await api.post<DispatchResult>(`/incidents/${id}/dispatch`);
    return response.data;
  },
  updateStatus: async (
    id: string,
    status: 'pending' | 'dispatched' | 'in_progress' | 'resolved' | 'cancelled'
  ): Promise<Incident> => {
    const response = await api.patch<Incident>(`/incidents/${id}/status`, {
      status,
    });
    return response.data;
  },
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    // Health check should hit the backend (Render) when frontend is deployed separately (Vercel).
    // If API_BASE_URL is ".../api", then health is one level up at ".../health".
    const base = API_BASE_URL.replace(/\/+$/, '');
    const healthUrl = base.endsWith('/api') ? `${base.slice(0, -4)}/health` : `${base}/health`;
    const response = await axios.get(healthUrl);
    return response.status === 200;
  } catch {
    return false;
  }
};

