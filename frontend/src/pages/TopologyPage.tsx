import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { topologyApi, type TopologyGraph } from '@/api/topology.api';
import { UniversalTopologyCanvas } from '@/features/topology/UniversalTopologyCanvas';
import { RefreshCw, Layers, Info } from 'lucide-react';

export function TopologyPage() {
  const { id } = useParams<{ id: string }>();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: definitions } = useQuery({
    queryKey: ['topologies'],
    queryFn:  topologyApi.listDefinitions,
  });

  const [selectedId, setSelectedId] = useState<string>(id ?? '');

  // Sync if navigated to a specific topology URL
  useEffect(() => {
    if (id) setSelectedId(id);
  }, [id]);

  // Auto-select first topology if none selected yet
  useEffect(() => {
    if (!selectedId && definitions && definitions.length > 0) {
      setSelectedId(definitions[0].id);
    }
  }, [selectedId, definitions]);

  const currentDef = definitions?.find(d => d.id === selectedId);

  const { data: graph, isLoading, refetch, dataUpdatedAt } = useQuery<TopologyGraph>({
    queryKey:       ['topology-graph', selectedId],
    queryFn:        () => topologyApi.getGraph(selectedId),
    enabled:        !!selectedId,
    refetchInterval: autoRefresh ? (currentDef?.autoRefreshSeconds ?? 30) * 1000 : false,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-axilog-primary dark:text-axilog-primary-light">
            {currentDef?.name ?? 'Network Topology'}
          </h1>
          {currentDef && (
            <p className="text-xs text-gray-500 dark:text-dark-muted mt-0.5">
              Type: {currentDef.type} · Auto-refresh every {currentDef.autoRefreshSeconds}s
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Topology selector */}
          {definitions && definitions.length > 0 && (
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-dark-border
                         bg-white dark:bg-dark-elevated text-gray-700 dark:text-dark-text
                         focus:outline-none focus:ring-2 focus:ring-axilog-primary"
            >
              <option value="">— Select topology —</option>
              {definitions.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}

          {/* Auto refresh toggle */}
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-axilog-secondary text-white'
                : 'bg-gray-100 dark:bg-dark-elevated text-gray-600 dark:text-dark-muted'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </button>

          {/* Manual refresh */}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                       bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border
                       text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-elevated
                       transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Canvas area */}
      {!selectedId ? (
        <div className="flex-1 flex flex-col items-center justify-center
                        bg-white dark:bg-dark-surface rounded-xl shadow-sm
                        border border-gray-100 dark:border-dark-border text-gray-400 dark:text-dark-muted">
          <Layers className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-base font-medium">Select a topology to view</p>
          <p className="text-sm mt-1 opacity-70">Choose from the dropdown above</p>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center
                        bg-dark-base rounded-xl overflow-hidden">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-axilog-primary" />
        </div>
      ) : graph ? (
        <div className="flex-1 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-dark-border">
          <UniversalTopologyCanvas
            graph={graph}
            layoutAlgorithm={currentDef?.layoutAlgorithm ?? 'ELK_LAYERED'}
            onRebuild={() => void refetch()}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center
                        bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border
                        text-gray-400 dark:text-dark-muted">
          <Info className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">No graph data available for this topology</p>
        </div>
      )}

      {/* Last updated */}
      {dataUpdatedAt > 0 && (
        <p className="text-[11px] text-gray-400 dark:text-dark-muted mt-2 text-right">
          Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
