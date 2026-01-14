interface StatusIndicatorProps {
  label: string;
  status: 'checking' | 'connected' | 'disconnected';
}

export const StatusIndicator = ({ label, status }: StatusIndicatorProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'connected':
        return {
          dot: 'bg-emerald-500 shadow-lg shadow-emerald-500/50',
          text: 'text-emerald-700',
          bg: 'bg-emerald-50',
        };
      case 'disconnected':
        return {
          dot: 'bg-red-500 shadow-lg shadow-red-500/50',
          text: 'text-red-700',
          bg: 'bg-red-50',
        };
      case 'checking':
        return {
          dot: 'bg-amber-500 shadow-lg shadow-amber-500/50 animate-pulse',
          text: 'text-amber-700',
          bg: 'bg-amber-50',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg ${styles.bg} border border-slate-200/50`}>
      <div className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
      <span className={`text-xs font-semibold ${styles.text}`}>{label}</span>
    </div>
  );
};

