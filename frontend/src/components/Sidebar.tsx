import { HospitalList } from './HospitalList';
import { HospitalDetails } from './HospitalDetails';
import { IncidentForm } from './IncidentForm';
import { Hospital, NearestAmbulanceResult, RouteResult } from '../services/api';

interface SidebarProps {
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  nearestAmbulance: NearestAmbulanceResult | null;
  route: RouteResult | null;
  onSelectHospital: (hospital: Hospital) => void;
}

export const Sidebar = ({
  hospitals,
  selectedHospital,
  nearestAmbulance,
  route,
  onSelectHospital,
}: SidebarProps) => {
  return (
    <div className="w-96 bg-white/70 backdrop-blur-xl border-r border-slate-200/50 flex flex-col h-full overflow-hidden shadow-xl shadow-slate-200/20">
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        <IncidentForm />
        <div className="border-t border-slate-200/50 pt-6">
          <HospitalList
            hospitals={hospitals}
            selectedHospital={selectedHospital}
            onSelectHospital={onSelectHospital}
          />
        </div>
        <div className="border-t border-slate-200/50 pt-6">
          <HospitalDetails
            hospital={selectedHospital}
            nearestAmbulance={nearestAmbulance}
            route={route}
          />
        </div>
      </div>
    </div>
  );
};

