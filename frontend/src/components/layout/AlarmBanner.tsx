import { AlertTriangle, Bell } from 'lucide-react';
import { useQuery }           from '@tanstack/react-query';
import { useNavigate }        from 'react-router-dom';
import { http }               from '@/api/http';

interface AlarmCounts { CRITICAL: number; MAJOR: number; MINOR: number; WARNING: number }

export function AlarmBanner() {
  const navigate = useNavigate();

  // The query cache is kept fresh by useAlarmSocket (mounted in AppShell).
  // HTTP poll is a fallback in case socket is not yet connected.
  const { data } = useQuery<AlarmCounts>({
    queryKey:       ['alarm-counts'],
    queryFn:        async () => (await http.get<AlarmCounts>('/api/v1/alarms/counts')).data,
    refetchInterval: 30_000,   // reduced — socket handles real-time updates
    staleTime:       10_000,
  });

  const critical = data?.CRITICAL ?? 0;
  const major    = data?.MAJOR    ?? 0;
  const minor    = data?.MINOR    ?? 0;
  const warning  = data?.WARNING  ?? 0;
  const total    = critical + major + minor;

  if (!total) return null;

  return (
    <div
      onClick={() => navigate('/alarms')}
      className="flex items-center gap-4 px-4 py-1.5 flex-shrink-0 cursor-pointer
                 select-none transition-opacity hover:opacity-90"
      style={{
        background: critical > 0 ? '#b91c1c' : major > 0 ? '#c2410c' : '#92400e',
      }}
    >
      {/* Icon */}
      <div className="flex items-center gap-1.5 text-white">
        {critical > 0
          ? <AlertTriangle className="w-3.5 h-3.5 alarm-critical-pulse flex-shrink-0" />
          : <Bell className="w-3.5 h-3.5 flex-shrink-0" />
        }
        <span className="text-xs font-bold tracking-wide">ACTIVE ALARMS</span>
      </div>

      {/* Severity pills */}
      <div className="flex items-center gap-3 flex-1">
        {critical > 0 && (
          <span className="flex items-center gap-1 text-xs font-bold text-white alarm-critical-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            {critical} CRITICAL
          </span>
        )}
        {major > 0 && (
          <span className="flex items-center gap-1 text-xs font-semibold text-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-300" />
            {major} MAJOR
          </span>
        )}
        {minor > 0 && (
          <span className="flex items-center gap-1 text-xs font-semibold text-yellow-200">
            <span className="w-2 h-2 rounded-full bg-yellow-300" />
            {minor} MINOR
          </span>
        )}
        {warning > 0 && (
          <span className="flex items-center gap-1 text-xs text-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-300" />
            {warning} WARNING
          </span>
        )}
      </div>

      <span className="text-[10px] text-white/60 flex-shrink-0">Click to view all</span>
    </div>
  );
}
