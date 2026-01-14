import { useState } from 'react';
import { incidentApi, routingApi } from '../services/api';
import { useStore } from '../store/useStore';
import { MapPin, FileText, Zap, Siren, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const IncidentForm = () => {
  const { setLoading, setError, setRoute } = useStore();
  const [address, setAddress] = useState('');
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleGeocode = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      toast.error('Please enter an address before geocoding');
      return;
    }

    setLoading(true);
    try {
      // Simple geocoding using Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setLongitude(parseFloat(data[0].lon));
        setLatitude(parseFloat(data[0].lat));
        setError(null);
      } else {
        const msg = 'Address not found. Please try a more specific address.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      const msg = 'Failed to geocode address';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async () => {
    if (!address || longitude === null || latitude === null) {
      const msg = 'Please geocode an address first';
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsCreating(true);
    setLoading(true);
    setError(null);

    try {
      const incident = await incidentApi.create(address, longitude, latitude, priority, notes);
      
      // Auto-dispatch
      const dispatchResult = await incidentApi.dispatch(incident.id);
      
      // Fetch route for visualization
      if (dispatchResult.assignedAmbulance) {
        const [ambulanceLng, ambulanceLat] = dispatchResult.assignedAmbulance.location.coordinates;
        const routeData = await routingApi.getRoute(
          ambulanceLng,
          ambulanceLat,
          longitude,
          latitude
        );
        setRoute(routeData);
      }

      // Reset form
      setAddress('');
      setLongitude(null);
      setLatitude(null);
      setPriority('medium');
      setNotes('');
      setIsOpen(false);

      toast.success(
        `Incident created and dispatched. Ambulance ${dispatchResult.assignedAmbulance.id.slice(0, 8)}… assigned · ETA ${Math.round(dispatchResult.eta / 60)} min`
      );
    } catch (err: any) {
      console.error('Failed to create incident:', err);
      const msg = err?.response?.data?.error || 'Failed to create incident';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsCreating(false);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/60">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-500/90 via-orange-500/90 to-amber-400/90 text-white shadow-md hover:shadow-lg hover:brightness-105 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
            <Siren className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold tracking-tight">Create Incident</div>
            <div className="text-[11px] opacity-80">
              Log an emergency and auto-dispatch the best ambulance
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          {isOpen ? 'Hide form' : 'Open form'}
          {isOpen ? (
            <ChevronUp className="w-4 h-4" strokeWidth={2.25} />
          ) : (
            <ChevronDown className="w-4 h-4" strokeWidth={2.25} />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-3 space-y-4 border-t border-white/40 bg-gradient-to-b from-white/90 to-slate-50/90 rounded-b-2xl">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address..."
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm placeholder:text-slate-400"
            />
            <button
              onClick={handleGeocode}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Find
            </button>
          </div>
          {longitude !== null && latitude !== null && (
            <p className="text-[11px] text-slate-500 mt-1">
              Geocoded location: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Zap className="w-4 h-4 inline mr-1" />
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details..."
            rows={3}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm resize-none"
          />
        </div>

        <button
          onClick={handleCreateIncident}
          disabled={isCreating || longitude === null || latitude === null}
          className="w-full px-4 py-3 bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 text-white font-semibold rounded-xl hover:from-red-600 hover:via-orange-600 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200 flex items-center justify-center gap-2 text-sm"
        >
          {isCreating ? 'Creating incident…' : 'Create & Dispatch Incident'}
        </button>
      </div>
      )}
    </div>
  );
};

