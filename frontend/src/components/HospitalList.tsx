import { Hospital } from '../services/api';
import { Building2, MapPin } from 'lucide-react';

interface HospitalListProps {
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  onSelectHospital: (hospital: Hospital) => void;
}

export const HospitalList = ({
  hospitals,
  selectedHospital,
  onSelectHospital,
}: HospitalListProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Building2 className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 tracking-tight">Hospitals</h3>
        <span className="ml-auto px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
          {hospitals.length}
        </span>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {hospitals.map((hospital) => (
          <button
            key={hospital.id}
            onClick={() => onSelectHospital(hospital)}
            className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 ${
              selectedHospital?.id === hospital.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 transform scale-[1.02]'
                : 'bg-white/80 backdrop-blur-sm border border-slate-200/50 hover:bg-white hover:shadow-md hover:border-indigo-300/50 hover:transform hover:scale-[1.01]'
            }`}
          >
            <div className={`font-medium ${selectedHospital?.id === hospital.id ? 'text-white' : 'text-slate-800'}`}>
              {hospital.name}
            </div>
            <div className={`text-xs mt-1.5 flex items-center gap-1.5 ${
              selectedHospital?.id === hospital.id ? 'text-indigo-100' : 'text-slate-500'
            }`}>
              <MapPin className="w-3 h-3" strokeWidth={2} />
              {hospital.location.coordinates[1].toFixed(4)}, {hospital.location.coordinates[0].toFixed(4)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

