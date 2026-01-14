import { Hospital, NearestAmbulanceResult, RouteResult } from '../services/api';
import { Building2, MapPin, Ambulance, Navigation, Clock } from 'lucide-react';

interface HospitalDetailsProps {
  hospital: Hospital | null;
  nearestAmbulance: NearestAmbulanceResult | null;
  route: RouteResult | null;
}

export const HospitalDetails = ({
  hospital,
  nearestAmbulance,
  route,
}: HospitalDetailsProps) => {
  if (!hospital) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-slate-500" strokeWidth={2} />
        </div>
        <p className="text-slate-500 font-medium">Select a hospital to view details</p>
        <p className="text-xs text-slate-400 mt-1">Click on any hospital from the list above</p>
      </div>
    );
  }

  const distanceKm = nearestAmbulance
    ? (nearestAmbulance.distance / 1000).toFixed(2)
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
          Hospital Details
        </h3>
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 border border-slate-200/50 shadow-lg shadow-slate-200/20">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Building2 className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-lg text-slate-900 mb-2 tracking-tight">{hospital.name}</div>
              <div className="text-sm text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" strokeWidth={2} />
                <span className="font-medium">Coordinates:</span>
                <span className="font-mono text-xs">
                  {hospital.location.coordinates[1].toFixed(6)}, {hospital.location.coordinates[0].toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {nearestAmbulance && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2 tracking-tight">
            <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
            Nearest Ambulance
          </h3>
          <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-xl p-5 border border-emerald-200/50 shadow-lg shadow-emerald-200/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Ambulance className="w-4 h-4" strokeWidth={2} />
                  Status
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    nearestAmbulance.ambulance.status === 'available'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300/50'
                      : nearestAmbulance.ambulance.status === 'dispatched'
                      ? 'bg-red-100 text-red-700 border border-red-300/50'
                      : 'bg-amber-100 text-amber-700 border border-amber-300/50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    nearestAmbulance.ambulance.status === 'available' 
                      ? 'bg-emerald-500' 
                      : nearestAmbulance.ambulance.status === 'dispatched'
                      ? 'bg-red-500'
                      : 'bg-amber-500'
                  }`}></div>
                  {nearestAmbulance.ambulance.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200/50">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4" strokeWidth={2} />
                  Distance
                </span>
                <span className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  {distanceKm} km
                </span>
              </div>
              {route && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200/50">
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" strokeWidth={2} />
                    ETA (Route)
                  </span>
                  <span className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">
                    {Math.round(route.duration / 60)} min
                  </span>
                </div>
              )}
              {route && (
                <div className="text-xs text-slate-500 pt-1">
                  Route distance: {(route.distance / 1000).toFixed(2)} km
                  {distanceKm && (
                    <span className="ml-2">
                      (vs {distanceKm} km straight-line)
                    </span>
                  )}
                </div>
              )}
              <div className="text-sm text-slate-600 pt-2 border-t border-slate-200/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-4 h-4" strokeWidth={2} />
                  <span className="font-medium">Location:</span>
                </div>
                <span className="font-mono text-xs text-slate-500 ml-5">
                  {nearestAmbulance.ambulance.location.coordinates[1].toFixed(6)}, {nearestAmbulance.ambulance.location.coordinates[0].toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

