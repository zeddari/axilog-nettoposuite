import { X, Wifi, Server, AlertTriangle, Activity } from 'lucide-react';
import type { TopologyNode } from '@/api/topology.api';

const STATUS_COLOR: Record<string, string> = {
  UP:          'text-green-500',
  DOWN:        'text-red-500',
  DEGRADED:    'text-yellow-500',
  MAINTENANCE: 'text-blue-500',
  UNKNOWN:     'text-gray-400',
};
const STATUS_BG: Record<string, string> = {
  UP:          'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  DOWN:        'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  DEGRADED:    'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  MAINTENANCE: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  UNKNOWN:     'bg-gray-50 dark:bg-dark-elevated border-gray-200 dark:border-dark-border',
};

interface Props {
  node: TopologyNode;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 dark:border-dark-border last:border-0">
      <span className="text-xs text-gray-500 dark:text-dark-muted font-medium min-w-[90px]">{label}</span>
      <span className="text-xs text-gray-800 dark:text-dark-text font-semibold text-right ml-2 break-all">{value}</span>
    </div>
  );
}

export function NodeDetailPanel({ node, onClose }: Props) {
  const status    = node.status ?? 'UNKNOWN';
  const props = (node.properties ?? {}) as Record<string, unknown>;

  return (
    <div className="absolute right-3 top-3 bottom-3 w-72 z-10
                    bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl
                    flex flex-col overflow-hidden"
         style={{ backdropFilter: 'blur(8px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-[#30363d] bg-[#21262d]">
        <div className="flex items-center gap-2 min-w-0">
          <Server className="w-4 h-4 text-axilog-primary-light flex-shrink-0" />
          <span className="text-sm font-bold text-[#e6edf3] truncate">{node.label}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status banner */}
      <div className={`mx-3 mt-3 px-3 py-2 rounded-lg border flex items-center gap-2 ${STATUS_BG[status]}`}>
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          status === 'UP' ? 'bg-green-500' : status === 'DOWN' ? 'bg-red-500' :
          status === 'DEGRADED' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
        }`} />
        <span className={`text-xs font-bold ${STATUS_COLOR[status]}`}>{status}</span>
        <span className="text-xs text-gray-500 dark:text-[#8b949e] ml-auto">{node.type}</span>
      </div>

      {/* Scrollable details */}
      <div className="flex-1 overflow-y-auto px-4 py-2">

        {/* Identity */}
        <div className="mb-1">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider font-semibold mb-1 pt-2">Identity</p>
          <Row label="IP Address" value={node.ipAddress && (
            <span className="font-mono">{node.ipAddress}</span>
          )} />
          <Row label="Vendor"  value={node.vendor} />
          <Row label="Model"   value={node.model} />
          <Row label="Node ID" value={<span className="font-mono text-[9px]">{node.id}</span>} />
        </div>

        {/* Extra properties from JSON */}
        {Object.keys(props).length > 0 && (
          <div className="mb-1">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wider font-semibold mb-1 pt-2">Properties</p>
            {Object.entries(props).map(([k, v]) => (
              <Row key={k} label={k} value={String(v)} />
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-3 py-3 border-t border-[#30363d] flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold
                           bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors border border-[#30363d]">
          <Wifi className="w-3.5 h-3.5" />
          Ping
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold
                           bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors border border-[#30363d]">
          <Activity className="w-3.5 h-3.5" />
          KPIs
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold
                           bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors border border-[#30363d]">
          <AlertTriangle className="w-3.5 h-3.5" />
          Alarms
        </button>
      </div>
    </div>
  );
}
