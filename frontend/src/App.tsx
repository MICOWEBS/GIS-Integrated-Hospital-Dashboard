import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { hospitalApi, ambulanceApi, routingApi, healthCheck } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { Loader2, AlertCircle } from 'lucide-react';

function App() {
  const {
    hospitals,
    ambulances,
    selectedHospital,
    nearestAmbulance,
    route,
    dbStatus,
    cacheStatus,
    isLoading,
    error,
    setHospitals,
    setAmbulances,
    selectHospital,
    setNearestAmbulance,
    setRoute,
    setDbStatus,
    setCacheStatus,
    setLoading,
    setError,
  } = useStore();

  // Initialize WebSocket connection
  useWebSocket();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check health
        const isHealthy = await healthCheck();
        setDbStatus(isHealthy ? 'connected' : 'disconnected');
        setCacheStatus(isHealthy ? 'connected' : 'disconnected');

        // Load hospitals and ambulances
        const [hospitalsData, ambulancesData] = await Promise.all([
          hospitalApi.getAll(),
          ambulanceApi.getAll(),
        ]);

        setHospitals(hospitalsData);
        setAmbulances(ambulancesData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data. Please check if the backend is running.');
        setDbStatus('disconnected');
        setCacheStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setHospitals, setAmbulances, setDbStatus, setCacheStatus, setLoading, setError]);

  // Handle hospital selection
  const handleSelectHospital = async (hospital: typeof selectedHospital) => {
    if (!hospital) {
      selectHospital(null);
      setNearestAmbulance(null);
      setRoute(null);
      return;
    }

    selectHospital(hospital);
    setLoading(true);
    setError(null);
    setRoute(null);

    try {
      const result = await hospitalApi.getNearestAmbulance(hospital.id);
      setNearestAmbulance(result);

      // Fetch route and ETA
      if (result) {
        const [hospitalLng, hospitalLat] = hospital.location.coordinates;
        const [ambulanceLng, ambulanceLat] = result.ambulance.location.coordinates;
        
        try {
          const routeData = await routingApi.getRoute(
            ambulanceLng,
            ambulanceLat,
            hospitalLng,
            hospitalLat
          );
          setRoute(routeData);
        } catch (routeErr) {
          console.error('Failed to fetch route:', routeErr);
          // Continue without route - straight line will be shown
        }
      }
    } catch (err) {
      console.error('Failed to find nearest ambulance:', err);
      setError('Failed to find nearest ambulance.');
      setNearestAmbulance(null);
      setRoute(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <TopBar dbStatus={dbStatus} cacheStatus={cacheStatus} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          hospitals={hospitals}
          selectedHospital={selectedHospital}
          nearestAmbulance={nearestAmbulance}
          route={route}
          onSelectHospital={handleSelectHospital}
        />
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-xl shadow-xl border border-slate-200/50">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" strokeWidth={2.5} />
                <div className="text-sm font-medium text-slate-700">Loading...</div>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-red-50 to-orange-50 backdrop-blur-sm px-5 py-3 rounded-xl shadow-xl border border-red-200/50">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-500" strokeWidth={2.5} />
                <div className="text-sm font-medium text-red-700">{error}</div>
              </div>
            </div>
          )}
          <MapView
            hospitals={hospitals}
            ambulances={ambulances}
            selectedHospital={selectedHospital}
            nearestAmbulance={nearestAmbulance}
            route={route}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

