import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map, Marker, LngLatBounds } from 'maplibre-gl';
import { Hospital, Ambulance, NearestAmbulanceResult, RouteResult } from '../services/api';

export const useMap = (
  hospitals: Hospital[],
  ambulances: Ambulance[],
  selectedHospital: Hospital | null,
  nearestAmbulance: NearestAmbulanceResult | null,
  route: RouteResult | null
) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const hospitalMarkers = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const ambulanceMarkers = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const routeLineExists = useRef<boolean>(false);

  useEffect(() => {
    const container = mapContainer.current;
    if (!container || map.current) return;
    
    // Ensure the container is actually an HTMLElement
    if (!(container instanceof HTMLElement)) {
      console.error('Map container is not a valid HTMLElement');
      return;
    }

    // Function to initialize the map
    const initializeMap = () => {
      if (map.current || !container) return;

      // Initialize map
      map.current = new maplibregl.Map({
        container: container,
        style: {
          version: 8,
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution:
                '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          },
          layers: [
            {
              id: 'simple-tiles',
              type: 'raster',
              source: 'raster-tiles',
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
        center: [3.3480, 6.6010], // Ikeja, Lagos
        zoom: 12,
      });

      map.current.on('load', () => {
        setIsMapLoaded(true);
      });
    };

    // Ensure container has dimensions before initializing
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      // Wait for the container to get dimensions
      const timer = setTimeout(() => {
        if (container.offsetWidth > 0 && container.offsetHeight > 0 && !map.current) {
          initializeMap();
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    initializeMap();

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update hospital markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove old markers
    hospitalMarkers.current.forEach((marker: Marker) => marker.remove());
    hospitalMarkers.current.clear();

    // Add new markers
    hospitals.forEach((hospital) => {
      const [lng, lat] = hospital.location.coordinates;
      const el = document.createElement('div');
      el.className = 'hospital-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      if (selectedHospital?.id === hospital.id) {
        el.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
        el.style.border = '4px solid white';
        el.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.5), 0 0 0 2px rgba(99, 102, 241, 0.2)';
      } else {
        el.style.background = 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 3px 8px rgba(59, 130, 246, 0.4)';
      }
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.3s ease';

      const marker = new maplibregl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current!);

      hospitalMarkers.current.set(hospital.id, marker);
    });
  }, [hospitals, selectedHospital, isMapLoaded]);

  // Update ambulance markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove old markers
    ambulanceMarkers.current.forEach((marker: Marker) => marker.remove());
    ambulanceMarkers.current.clear();

    // Add new markers
    ambulances.forEach((ambulance) => {
      const [lng, lat] = ambulance.location.coordinates;
      const el = document.createElement('div');
      el.className = 'ambulance-marker';
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '6px';
      if (ambulance.status === 'available') {
        el.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        el.style.boxShadow = '0 3px 8px rgba(16, 185, 129, 0.4)';
      } else if (ambulance.status === 'dispatched') {
        el.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        el.style.boxShadow = '0 3px 8px rgba(239, 68, 68, 0.4)';
      } else {
        el.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        el.style.boxShadow = '0 3px 8px rgba(245, 158, 11, 0.4)';
      }
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.transform = 'rotate(45deg)';
      el.style.transition = 'all 0.3s ease';

      const marker = new maplibregl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current!);

      ambulanceMarkers.current.set(ambulance.id, marker);
    });
  }, [ambulances, isMapLoaded]);

  // Draw route line - use route geometry if available, otherwise straight line
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      if (routeLineExists.current && map.current && map.current.getLayer('route-line')) {
        map.current.removeLayer('route-line');
        map.current.removeSource('route-line');
        routeLineExists.current = false;
      }
      return;
    }

    // Remove existing route line
    if (map.current.getLayer('route-line')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route-line');
      routeLineExists.current = false;
    }

    // Draw route if we have route data or nearest ambulance
    if (route && route.geometry) {
      // Use actual route geometry
      map.current.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route.geometry,
        },
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#10b981',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });
      routeLineExists.current = true;

      // Fit map to route bounds
      const bounds = new LngLatBounds();
      route.geometry.coordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
      map.current.fitBounds(bounds, {
        padding: 100,
        duration: 1000,
      });
    } else if (selectedHospital && nearestAmbulance) {
      // Fallback to straight line
      const [hospitalLng, hospitalLat] = selectedHospital.location.coordinates;
      const [ambulanceLng, ambulanceLat] = nearestAmbulance.ambulance.location.coordinates;

      map.current.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [hospitalLng, hospitalLat],
              [ambulanceLng, ambulanceLat],
            ],
          },
        },
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#6366f1',
          'line-width': 4,
          'line-opacity': 0.8,
          'line-dasharray': [3, 3],
        },
      });
      routeLineExists.current = true;

      // Fit map to show both points
      const bounds = new LngLatBounds()
        .extend([hospitalLng, hospitalLat])
        .extend([ambulanceLng, ambulanceLat]);

      map.current.fitBounds(bounds, {
        padding: 100,
        duration: 1000,
      });
    }
  }, [selectedHospital, nearestAmbulance, route, isMapLoaded]);

  return { mapContainer, map: map.current };
};

