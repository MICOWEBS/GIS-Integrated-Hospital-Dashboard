import { useMap } from '../hooks/useMap';
import { Hospital, Ambulance, NearestAmbulanceResult, RouteResult } from '../services/api';

interface MapViewProps {
  hospitals: Hospital[];
  ambulances: Ambulance[];
  selectedHospital: Hospital | null;
  nearestAmbulance: NearestAmbulanceResult | null;
  route: RouteResult | null;
}

export const MapView = ({
  hospitals,
  ambulances,
  selectedHospital,
  nearestAmbulance,
  route,
}: MapViewProps) => {
  const { mapContainer } = useMap(
    hospitals,
    ambulances,
    selectedHospital,
    nearestAmbulance,
    route
  );

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapContainer} 
        className="w-full h-full min-h-[400px]" 
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

