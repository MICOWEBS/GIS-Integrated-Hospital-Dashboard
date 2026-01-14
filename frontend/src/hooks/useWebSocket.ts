import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';
import { Ambulance, Incident } from '../services/api';

export const useWebSocket = () => {
  const { updateAmbulance, updateIncident, setError } = useStore();

  useEffect(() => {
    // WebSocket server URL:
    // - Default: current origin (works if API is proxied behind same domain)
    // - Override: set VITE_WS_URL (e.g. "https://your-backend.onrender.com")
    const WS_URL = (import.meta as any).env?.VITE_WS_URL || window.location.origin;

    const socket: Socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ WebSocket connected');
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('⚡ WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setError('WebSocket connection failed');
    });

    // Listen for ambulance location updates
    socket.on('ambulance:location-updated', (ambulance: Ambulance) => {
      console.log('📍 Ambulance location updated:', ambulance.id);
      updateAmbulance(ambulance);
    });

    // Listen for ambulance status updates
    socket.on('ambulance:status-updated', (ambulance: Ambulance) => {
      console.log('🔄 Ambulance status updated:', ambulance.id);
      updateAmbulance(ambulance);
    });

    // Listen for incident updates
    socket.on('incident:created', (incident: Incident) => {
      console.log('🚨 Incident created:', incident.id);
      updateIncident(incident);
    });

    socket.on('incident:dispatched', (data: any) => {
      console.log('🚑 Incident dispatched:', data.incident.id);
      updateIncident(data.incident);
      if (data.assignedAmbulance) {
        updateAmbulance(data.assignedAmbulance);
      }
    });

    socket.on('incident:status-updated', (incident: Incident) => {
      console.log('📝 Incident status updated:', incident.id);
      updateIncident(incident);
    });

    return () => {
      socket.disconnect();
    };
  }, [updateAmbulance, updateIncident, setError]);
};

