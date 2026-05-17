import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Network, Activity, Server, CheckCircle } from 'lucide-react';
import { http } from '@/api/http';

interface AlarmCounts { CRITICAL: number; MAJOR: number; MINOR: number; WARNING: number; }

function StatCard({ label, value, icon, color }: {
  label: string; value: number | string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-white dark:bg-dark-surface p-5 rounded-xl shadow-sm
                    border border-gray-100 dark:border-dark-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-dark-muted font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-dark-text">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const { data: alarmCounts } = useQuery<AlarmCounts>({
    queryKey: ['alarm-counts'],
    queryFn: async () => (await http.get<AlarmCounts>('/api/v1/alarms/counts')).data,
    refetchInterval: 15_000,
  });

  const { data: topologies } = useQuery({
    queryKey: ['topologies'],
    queryFn: async () => (await http.get<{ data: unknown[] }>('/api/v1/topologies')).data.data,
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-axilog-primary dark:text-axilog-primary-light">
          Network Operations Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
          Real-time overview of your network health and service status
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Critical Alarms"
          value={alarmCounts?.CRITICAL ?? 0}
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
          color={(alarmCounts?.CRITICAL ?? 0) > 0 ? 'bg-red-500' : 'bg-green-500'}
        />
        <StatCard
          label="Topologies"
          value={topologies?.length ?? 0}
          icon={<Network className="w-5 h-5 text-white" />}
          color="bg-axilog-primary"
        />
        <StatCard
          label="Major Alarms"
          value={alarmCounts?.MAJOR ?? 0}
          icon={<Activity className="w-5 h-5 text-white" />}
          color={(alarmCounts?.MAJOR ?? 0) > 0 ? 'bg-orange-500' : 'bg-green-500'}
        />
        <StatCard
          label="Minor / Warning"
          value={(alarmCounts?.MINOR ?? 0) + (alarmCounts?.WARNING ?? 0)}
          icon={<Server className="w-5 h-5 text-white" />}
          color="bg-axilog-secondary"
        />
      </div>

      {/* System status placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-sm
                        border border-gray-100 dark:border-dark-border">
          <h2 className="text-base font-semibold text-axilog-primary dark:text-axilog-primary-light mb-4">
            Active Topologies
          </h2>
          {topologies && topologies.length > 0 ? (
            <ul className="space-y-2">
              {(topologies as { id: string; name: string; type: string }[]).map(t => (
                <li key={t.id} className="flex items-center justify-between py-2
                                           border-b border-gray-50 dark:border-dark-border last:border-0">
                  <span className="text-sm text-gray-700 dark:text-dark-text font-medium">{t.name}</span>
                  <span className="text-xs bg-axilog-primary/10 dark:bg-axilog-primary-light/20
                                   text-axilog-primary dark:text-axilog-primary-light
                                   px-2 py-0.5 rounded-full font-semibold">
                    {t.type}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-dark-muted">
              <Network className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No topologies configured yet</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-sm
                        border border-gray-100 dark:border-dark-border">
          <h2 className="text-base font-semibold text-axilog-primary dark:text-axilog-primary-light mb-4">
            System Health
          </h2>
          <div className="space-y-3">
            {[
              { label: 'API Server',    ok: true },
              { label: 'MySQL Database', ok: true },
              { label: 'WebSocket',     ok: true },
              { label: 'MCP Server',    ok: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-dark-text">{item.label}</span>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${item.ok ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className={`w-3.5 h-3.5 ${item.ok ? 'text-green-500' : 'text-gray-300'}`} />
                  {item.ok ? 'Online' : 'Not configured'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
