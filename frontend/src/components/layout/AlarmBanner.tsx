import { AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/api/http';

interface AlarmCounts { CRITICAL: number; MAJOR: number; MINOR: number; WARNING: number; }

export function AlarmBanner() {
  const { data } = useQuery<AlarmCounts>({
    queryKey: ['alarm-counts'],
    queryFn: async () => {
      const { data } = await http.get<AlarmCounts>('/api/v1/alarms/counts');
      return data;
    },
    refetchInterval: 15_000,
  });

  const total = (data?.CRITICAL ?? 0) + (data?.MAJOR ?? 0) + (data?.MINOR ?? 0);
  if (!total) return null;

  return (
    <div className="bg-red-600 text-white text-xs font-medium px-4 py-1.5 flex items-center gap-6 flex-shrink-0">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />

      {(data?.CRITICAL ?? 0) > 0 && (
        <span className="alarm-critical-pulse">
          ⬤ {data!.CRITICAL} CRITICAL
        </span>
      )}
      {(data?.MAJOR ?? 0) > 0 && (
        <span>⬤ {data!.MAJOR} MAJOR</span>
      )}
      {(data?.MINOR ?? 0) > 0 && (
        <span className="text-yellow-300">⬤ {data!.MINOR} MINOR</span>
      )}
    </div>
  );
}
