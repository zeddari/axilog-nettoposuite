import { useState } from 'react';
import { X, Wifi, Server, AlertTriangle, Activity, Palette } from 'lucide-react';
import type { TopologyNode } from '@/api/topology.api';
import { useAuth } from '@/hooks/useAuth';
import { IconPickerModal } from './icons/IconPickerModal';
import { BUILTIN_ICON_MAP } from './icons/builtinIcons';

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
  node:     TopologyNode;
  onClose:  () => void;
  onIconChanged?: (nodeId: string, iconKey: string) => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="py-2.5 border-b border-[#30363d] last:border-0">
      <span className="block text-[10px] text-[#8b949e] font-medium uppercase tracking-wide mb-0.5">{label}</span>
      <span className="block text-xs text-[#e6edf3] font-semibold break-words leading-snug">{value}</span>
    </div>
  );
}

function CurrentIconBadge({ iconKey }: { iconKey: string }) {
  const builtin = BUILTIN_ICON_MAP[iconKey];
  if (builtin) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#21262d] border border-[#30363d]">
        <svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          style={{ color: '#8b949e' }}
          dangerouslySetInnerHTML={{ __html: builtin.svg }}
        />
        <span className="text-[10px] text-[#8b949e]">{builtin.label}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#21262d] border border-[#30363d]">
      <img
        src={`/api/v1/icons/file/${iconKey}`}
        alt="custom"
        className="w-3.5 h-3.5 object-contain"
      />
      <span className="text-[10px] text-[#8b949e]">Custom</span>
    </div>
  );
}

export function NodeDetailPanel({ node, onClose, onIconChanged }: Props) {
  const { canEdit }          = useAuth();
  const [iconPicker, setIconPicker] = useState(false);
  const [activeIconKey, setActiveIconKey] = useState(node.customIcon);

  const status = node.status ?? 'UNKNOWN';
  const props  = (node.properties ?? {}) as Record<string, unknown>;

  const handleIconApplied = (iconKey: string) => {
    setActiveIconKey(iconKey);
    onIconChanged?.(node.id, iconKey);
  };

  return (
    <>
      <div className="absolute right-3 top-3 bottom-3 w-80 z-10
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
        <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            status === 'UP'          ? 'bg-green-500'
            : status === 'DOWN'     ? 'bg-red-500'
            : status === 'DEGRADED' ? 'bg-yellow-500 animate-pulse'
            : status === 'MAINTENANCE' ? 'bg-blue-500'
            : 'bg-gray-400'
          }`} />
          <span className={`text-xs font-bold flex-shrink-0 ${STATUS_COLOR[status]}`}>{status}</span>
          <span className="ml-auto text-[10px] font-mono text-[#8b949e] truncate">{node.type}</span>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto px-4 py-3">

          {/* Section: Identity */}
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider font-semibold mb-2">Identity</p>
          <div className="mb-4">
            <Row label="IP Address" value={node.ipAddress && <span className="font-mono">{node.ipAddress}</span>} />
            <Row label="Vendor"     value={node.vendor} />
            <Row label="Model"      value={node.model} />
            <Row label="Node ID"    value={<span className="font-mono text-[9px] break-all">{node.id}</span>} />
          </div>

          {/* Section: Properties */}
          {Object.keys(props).length > 0 && (
            <>
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wider font-semibold mb-2">Properties</p>
              <div className="mb-4">
                {Object.entries(props).map(([k, v]) => (
                  <Row key={k} label={k} value={String(v)} />
                ))}
              </div>
            </>
          )}

          {/* Section: Icon */}
          {canEdit() && (
            <div>
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wider font-semibold mb-2">Icon</p>
              <div className="flex items-center justify-between">
                {activeIconKey
                  ? <CurrentIconBadge iconKey={activeIconKey} />
                  : <span className="text-[11px] text-[#8b949e]">Default (by type)</span>
                }
                <button
                  onClick={() => setIconPicker(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold
                             bg-axilog-primary/20 text-axilog-primary-light border border-axilog-primary/30
                             hover:bg-axilog-primary/30 transition-colors"
                >
                  <Palette className="w-3 h-3" />
                  Change
                </button>
              </div>
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

      {/* Icon picker modal */}
      {iconPicker && (
        <IconPickerModal
          nodeId={node.id}
          nodeLabel={node.label}
          currentIconKey={activeIconKey}
          onClose={() => setIconPicker(false)}
          onApply={handleIconApplied}
        />
      )}
    </>
  );
}
