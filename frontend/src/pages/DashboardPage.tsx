import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Network, Activity, Server, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { http } from '@/api/http';
import { topologyApi, type TopologyDefinition } from '@/api/topology.api';

interface AlarmCounts { CRITICAL: number; MAJOR: number; MINOR: number; WARNING: number }
interface Alarm {
  id: string; severity: string; title: string; source: string;
  topologyId: string | null; nodeId: string | null; createdAt: string;
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  MAJOR:    'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  MINOR:    'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  WARNING:  'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

const SEV_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  MAJOR:    'bg-orange-500',
  MINOR:    'bg-yellow-500',
  WARNING:  'bg-blue-500',
};

const TYPE_COLOR: Record<string, string> = {
  IP_MPLS:   'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  '5G_CORE': 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  ACCESS:    'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  TRANSPORT: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
};

function StatCard({ label, value, icon, color, pulse }: {
  label: string; value: number | string;
  icon: React.ReactNode; color: string; pulse?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-dark-surface p-5 rounded-xl shadow-sm
                    border border-gray-100 dark:border-dark-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-dark-muted font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center relative ${color}`}>
          {icon}
          {pulse && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-dark-surface animate-pulse" />
          )}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-dark-text">{value}</p>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: alarmCounts } = useQuery<AlarmCounts>({
    queryKey: ['alarm-counts'],
    queryFn: async () => (await http.get<AlarmCounts>('/api/v1/alarms/counts')).data,
    refetchInterval: 15_000,
  });

  const { data: recentAlarms } = useQuery<Alarm[]>({
    queryKey: ['recent-alarms'],
    queryFn: async () => (await http.get<{ data: Alarm[] }>('/api/v1/alarms?limit=6')).data.data,
    refetchInterval: 20_000,
  });

  const { data: topologies } = useQuery<TopologyDefinition[]>({
    queryKey: ['topologies'],
    queryFn: topologyApi.listDefinitions,
    refetchInterval: 60_000,
  });

  const critCount  = alarmCounts?.CRITICAL ?? 0;
  const majorCount = alarmCounts?.MAJOR ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-axilog-primary dark:text-axilog-primary-light">
            Network Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
            Real-time overview of your network health and service status
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-dark-muted">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live updates active
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Critical Alarms"
          value={critCount}
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
          color={critCount > 0 ? 'bg-red-500' : 'bg-green-500'}
          pulse={critCount > 0}
        />
        <StatCard
          label="Topologies"
          value={topologies?.length ?? '—'}
          icon={<Network className="w-5 h-5 text-white" />}
          color="bg-axilog-primary"
        />
        <StatCard
          label="Major Alarms"
          value={majorCount}
          icon={<Activity className="w-5 h-5 text-white" />}
          color={majorCount > 0 ? 'bg-orange-500' : 'bg-green-500'}
        />
        <StatCard
          label="Minor / Warning"
          value={(alarmCounts?.MINOR ?? 0) + (alarmCounts?.WARNING ?? 0)}
          icon={<Server className="w-5 h-5 text-white" />}
          color="bg-axilog-secondary"
        />
      </div>

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent alarms */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm
                        border border-gray-100 dark:border-dark-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4
                          border-b border-gray-50 dark:border-dark-border">
            <h2 className="text-sm font-bold text-axilog-primary dark:text-axilog-primary-light">
              Recent Alarms
            </h2>
            <button
              onClick={() => navigate('/alarms')}
              className="text-xs font-medium text-axilog-primary/70 dark:text-axilog-primary-light/70
                         hover:text-axilog-primary dark:hover:text-axilog-primary-light
                         flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-dark-border">
            {recentAlarms && recentAlarms.length > 0 ? (
              recentAlarms.map(a => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <span className={`mt-0.5 flex-shrink-0 w-2.5 h-2.5 rounded-full ${SEV_DOT[a.severity] ?? 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-dark-text leading-snug line-clamp-2">
                      {a.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEV_COLOR[a.severity]}`}>
                        {a.severity}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-dark-muted">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(a.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-dark-muted">
                <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
                <p className="text-sm font-medium text-green-600 dark:text-green-400">All clear — no active alarms</p>
              </div>
            )}
          </div>
        </div>

        {/* Active topologies */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm
                        border border-gray-100 dark:border-dark-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4
                          border-b border-gray-50 dark:border-dark-border">
            <h2 className="text-sm font-bold text-axilog-primary dark:text-axilog-primary-light">
              Active Topologies
            </h2>
            <button
              onClick={() => navigate('/topologies')}
              className="text-xs font-medium text-axilog-primary/70 dark:text-axilog-primary-light/70
                         hover:text-axilog-primary dark:hover:text-axilog-primary-light
                         flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-dark-border">
            {topologies && topologies.length > 0 ? (
              topologies.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/topologies/${t.id}`)}
                  className="w-full flex items-center justify-between px-5 py-3.5
                             text-left hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-axilog-secondary flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800 dark:text-dark-text truncate">
                      {t.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      TYPE_COLOR[t.type] ?? 'bg-gray-50 text-gray-600 dark:bg-dark-elevated dark:text-dark-muted'
                    }`}>
                      {t.type.replace('_', ' ')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-dark-muted
                                          group-hover:text-axilog-primary dark:group-hover:text-axilog-primary-light
                                          transition-colors" />
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-dark-muted">
                <Network className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No topologies configured</p>
                <p className="text-xs mt-1">Run the demo seed to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* System health */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-surface rounded-xl shadow-sm
                        border border-gray-100 dark:border-dark-border">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border">
            <h2 className="text-sm font-bold text-axilog-primary dark:text-axilog-primary-light">
              System Health
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-50 dark:divide-dark-border">
            {[
              { label: 'API Server',      ok: true  },
              { label: 'MySQL Database',  ok: true  },
              { label: 'WebSocket',       ok: true  },
              { label: 'MCP Server',      ok: false },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center justify-center py-5 gap-2">
                <CheckCircle className={`w-6 h-6 ${item.ok ? 'text-green-500' : 'text-gray-300 dark:text-dark-elevated'}`} />
                <span className="text-xs font-semibold text-gray-700 dark:text-dark-text">{item.label}</span>
                <span className={`text-[10px] font-medium ${item.ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-dark-muted'}`}>
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
