import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { topologyApi, type TopologyDefinition } from '@/api/topology.api';
import { Network, Radio, Layers, Wifi, Box, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  IP_MPLS:   { label: 'IP / MPLS',   icon: <Network className="w-5 h-5" />,  color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/30' },
  '5G_CORE': { label: '5G Core',     icon: <Radio className="w-5 h-5" />,    color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  '5G_RAN':  { label: '5G RAN',      icon: <Wifi className="w-5 h-5" />,     color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  TRANSPORT: { label: 'Transport',   icon: <Layers className="w-5 h-5" />,   color: 'text-teal-600 dark:text-teal-400',    bg: 'bg-teal-50 dark:bg-teal-900/30' },
  ACCESS:    { label: 'Access',      icon: <Box className="w-5 h-5" />,      color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  CUSTOM:    { label: 'Custom',      icon: <Network className="w-5 h-5" />,  color: 'text-gray-600 dark:text-gray-400',    bg: 'bg-gray-50 dark:bg-dark-elevated' },
};

function TopologyCard({ topo }: { topo: TopologyDefinition }) {
  const navigate = useNavigate();
  const meta = TYPE_META[topo.type] ?? TYPE_META.CUSTOM;

  return (
    <div
      onClick={() => navigate(`/topologies/${topo.id}`)}
      className="group bg-white dark:bg-dark-surface rounded-xl shadow-sm
                 border border-gray-100 dark:border-dark-border
                 hover:shadow-md hover:border-axilog-primary/30 dark:hover:border-axilog-primary-light/30
                 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Card header — coloured top strip */}
      <div className={`h-1.5 w-full bg-axilog-primary`} />

      <div className="p-5">
        {/* Type badge + refresh interval */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
            {meta.icon}
            {meta.label}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-dark-muted">
            ↻ {topo.autoRefreshSeconds}s
          </span>
        </div>

        {/* Name */}
        <h3 className="text-base font-bold text-gray-900 dark:text-dark-text
                       group-hover:text-axilog-primary dark:group-hover:text-axilog-primary-light
                       transition-colors mb-1 leading-snug">
          {topo.name}
        </h3>

        {/* Description */}
        {topo.description && (
          <p className="text-xs text-gray-500 dark:text-dark-muted line-clamp-2 mb-4">
            {topo.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-dark-border">
          <span className="flex items-center gap-1.5 text-xs text-axilog-secondary font-semibold">
            <span className="w-2 h-2 rounded-full bg-axilog-secondary animate-pulse" />
            Live
          </span>
          <span className="text-xs text-axilog-primary dark:text-axilog-primary-light font-medium
                           opacity-0 group-hover:opacity-100 transition-opacity">
            Open topology →
          </span>
        </div>
      </div>
    </div>
  );
}

export function TopologiesListPage() {
  const { canEdit } = useAuth();
  const { data: topologies, isLoading, refetch } = useQuery({
    queryKey: ['topologies'],
    queryFn:  topologyApi.listDefinitions,
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-axilog-primary dark:text-axilog-primary-light">
            Network Topologies
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
            {topologies ? `${topologies.length} topology view${topologies.length !== 1 ? 's' : ''} configured` : 'Loading…'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                       bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border
                       text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-elevated
                       transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {canEdit() && (
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
                         bg-axilog-primary hover:bg-axilog-primary-dark text-white transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New topology
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-white dark:bg-dark-surface rounded-xl
                                    border border-gray-100 dark:border-dark-border animate-pulse" />
          ))}
        </div>
      ) : topologies && topologies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {topologies.map(t => <TopologyCard key={t.id} topo={t} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20
                        bg-white dark:bg-dark-surface rounded-xl
                        border border-dashed border-gray-200 dark:border-dark-border">
          <Network className="w-12 h-12 text-gray-200 dark:text-dark-elevated mb-3" />
          <p className="text-base font-semibold text-gray-400 dark:text-dark-muted">No topologies yet</p>
          <p className="text-sm text-gray-400 dark:text-dark-muted mt-1">Run the demo seed to get started</p>
          <code className="mt-3 text-xs bg-gray-50 dark:bg-dark-elevated px-3 py-1.5 rounded font-mono
                           text-gray-600 dark:text-dark-text border border-gray-200 dark:border-dark-border">
            mysql -u root netsuite &lt; backend/src/db/seeds/demo.sql
          </code>
        </div>
      )}
    </div>
  );
}
