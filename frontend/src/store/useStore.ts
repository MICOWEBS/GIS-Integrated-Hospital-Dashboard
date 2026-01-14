import { create } from 'zustand';
import { Hospital, Ambulance, NearestAmbulanceResult, Incident, RouteResult } from '../services/api';

interface AppState {
  hospitals: Hospital[];
  ambulances: Ambulance[];
  incidents: Incident[];
  selectedHospital: Hospital | null;
  selectedIncident: Incident | null;
  nearestAmbulance: NearestAmbulanceResult | null;
  route: RouteResult | null;
  dbStatus: 'checking' | 'connected' | 'disconnected';
  cacheStatus: 'checking' | 'connected' | 'disconnected';
  isLoading: boolean;
  error: string | null;

  // Actions
  setHospitals: (hospitals: Hospital[]) => void;
  setAmbulances: (ambulances: Ambulance[]) => void;
  setIncidents: (incidents: Incident[]) => void;
  selectHospital: (hospital: Hospital | null) => void;
  selectIncident: (incident: Incident | null) => void;
  setNearestAmbulance: (result: NearestAmbulanceResult | null) => void;
  setRoute: (route: RouteResult | null) => void;
  updateAmbulance: (ambulance: Ambulance) => void;
  updateIncident: (incident: Incident) => void;
  setDbStatus: (status: 'checking' | 'connected' | 'disconnected') => void;
  setCacheStatus: (status: 'checking' | 'connected' | 'disconnected') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  hospitals: [],
  ambulances: [],
  incidents: [],
  selectedHospital: null,
  selectedIncident: null,
  nearestAmbulance: null,
  route: null,
  dbStatus: 'checking',
  cacheStatus: 'checking',
  isLoading: false,
  error: null,

  setHospitals: (hospitals) => set({ hospitals }),
  setAmbulances: (ambulances) => set({ ambulances }),
  setIncidents: (incidents) => set({ incidents }),
  selectHospital: (hospital) => set({ selectedHospital: hospital, nearestAmbulance: null, route: null }),
  selectIncident: (incident) => set({ selectedIncident: incident }),
  setNearestAmbulance: (result) => set({ nearestAmbulance: result }),
  setRoute: (route) => set({ route }),
  updateAmbulance: (ambulance) =>
    set((state) => ({
      ambulances: state.ambulances.map((a) =>
        a.id === ambulance.id ? ambulance : a
      ),
    })),
  updateIncident: (incident) =>
    set((state) => ({
      incidents: state.incidents.map((i) =>
        i.id === incident.id ? incident : i
      ),
    })),
  setDbStatus: (status) => set({ dbStatus: status }),
  setCacheStatus: (status) => set({ cacheStatus: status }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

