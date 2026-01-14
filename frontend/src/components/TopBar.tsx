import { StatusIndicator } from './StatusIndicator';
import { Building2 } from 'lucide-react';

interface TopBarProps {
  dbStatus: 'checking' | 'connected' | 'disconnected';
  cacheStatus: 'checking' | 'connected' | 'disconnected';
}

export const TopBar = ({ dbStatus, cacheStatus }: TopBarProps) => {
  return (
    <div className="h-18 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-8 shadow-lg shadow-slate-200/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
            GIS Hospital Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium">Emergency Response System</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <StatusIndicator label="Database" status={dbStatus} />
        <StatusIndicator label="Cache" status={cacheStatus} />
      </div>
    </div>
  );
};

