import { type NodeProps, Handle, Position } from 'reactflow';

const STATUS_COLOR: Record<string, string> = {
  UP:          '#22c55e',
  DOWN:        '#ef4444',
  DEGRADED:    '#f59e0b',
  MAINTENANCE: '#3b82f6',
  UNKNOWN:     '#6b7280',
};

const STATUS_BG: Record<string, string> = {
  UP:          'rgba(34,197,94,0.12)',
  DOWN:        'rgba(239,68,68,0.15)',
  DEGRADED:    'rgba(245,158,11,0.15)',
  MAINTENANCE: 'rgba(59,130,246,0.12)',
  UNKNOWN:     'rgba(107,114,128,0.12)',
};

interface NodeData {
  label: string;
  status?: string;
  ipAddress?: string;
  vendor?: string;
  type?: string;
  utilizationPct?: number;
  onClick?: (data: NodeData) => void;
}

// ── Base node shell ────────────────────────────────────────────────────────────
function BaseNode({ data, icon, shape = 'rounded' }: {
  data: NodeData;
  icon: React.ReactNode;
  shape?: 'rounded' | 'circle' | 'diamond';
}) {
  const status = data.status ?? 'UNKNOWN';
  const ring   = STATUS_COLOR[status] ?? '#6b7280';
  const bg     = STATUS_BG[status]    ?? 'rgba(107,114,128,0.1)';

  const shapeClass = shape === 'circle'
    ? 'rounded-full w-16 h-16'
    : shape === 'diamond'
    ? 'rotate-45 rounded-lg w-14 h-14'
    : 'rounded-xl w-20 h-auto min-h-[72px]';

  return (
    <div
      className={`relative flex flex-col items-center cursor-pointer select-none`}
      onClick={() => data.onClick?.(data)}
    >
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, top: -4 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, bottom: -4 }} />
      <Handle type="target" position={Position.Left}   style={{ opacity: 0, left: -4 }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0, right: -4 }} />

      {/* Node body */}
      <div
        className={`${shapeClass} flex flex-col items-center justify-center gap-1 p-2
                    border-2 transition-all hover:scale-105`}
        style={{ borderColor: ring, background: bg, backdropFilter: 'blur(4px)' }}
      >
        {shape === 'diamond' ? (
          <div className="-rotate-45 flex flex-col items-center">
            {icon}
          </div>
        ) : (
          icon
        )}

        {shape !== 'diamond' && (
          <span className="text-[10px] font-bold text-white/90 text-center leading-tight px-1 truncate max-w-[72px]">
            {data.label}
          </span>
        )}
      </div>

      {/* Label below (for diamond) */}
      {shape === 'diamond' && (
        <span className="mt-1 text-[10px] font-bold text-white/90 text-center leading-tight max-w-[80px] truncate">
          {data.label}
        </span>
      )}

      {/* IP address */}
      {data.ipAddress && (
        <span className="text-[9px] text-gray-400 font-mono mt-0.5">{data.ipAddress}</span>
      )}

      {/* Status dot */}
      <span
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0e14]"
        style={{ background: ring }}
        title={status}
      />
    </div>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────────
export function RouterNode({ data }: NodeProps<NodeData>) {
  return (
    <BaseNode data={data} icon={
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none stroke-white stroke-[1.5]">
        <rect x="2" y="8" width="20" height="8" rx="2"/>
        <circle cx="7" cy="12" r="1.5" className="fill-white"/>
        <circle cx="12" cy="12" r="1.5" className="fill-white"/>
        <circle cx="17" cy="12" r="1.5" className="fill-white"/>
        <line x1="7" y1="8" x2="7" y2="5"/>
        <line x1="12" y1="8" x2="12" y2="5"/>
        <line x1="17" y1="8" x2="17" y2="5"/>
      </svg>
    } />
  );
}

// ── Switch ─────────────────────────────────────────────────────────────────────
export function SwitchNode({ data }: NodeProps<NodeData>) {
  return (
    <BaseNode data={data} icon={
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none stroke-white stroke-[1.5]">
        <rect x="2" y="9" width="20" height="6" rx="1"/>
        <line x1="5" y1="12" x2="5" y2="7"/>
        <line x1="9" y1="12" x2="9" y2="7"/>
        <line x1="13" y1="12" x2="13" y2="7"/>
        <line x1="17" y1="12" x2="17" y2="7"/>
        <line x1="19" y1="12" x2="19" y2="17"/>
        <polygon points="5,5 3,7 7,7" className="fill-white"/>
        <polygon points="9,5 7,7 11,7" className="fill-white"/>
        <polygon points="13,7 11,5 15,5" className="fill-white stroke-none"/>
        <polygon points="19,19 17,17 21,17" className="fill-white stroke-none"/>
      </svg>
    } />
  );
}

// ── 5G Core NF ────────────────────────────────────────────────────────────────
export function CoreNfNode({ data }: NodeProps<NodeData>) {
  const nfType = (data as NodeData & { nfType?: string }).nfType
    ?? data.label.split('-')[0];
  return (
    <BaseNode data={data} shape="circle" icon={
      <div className="flex flex-col items-center justify-center">
        <span className="text-[11px] font-black text-white tracking-tight">{nfType}</span>
        <svg viewBox="0 0 16 16" className="w-4 h-4 mt-0.5">
          <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
        </svg>
      </div>
    } />
  );
}

// ── gNB (base station) ────────────────────────────────────────────────────────
export function GnbNode({ data }: NodeProps<NodeData>) {
  return (
    <BaseNode data={data} icon={
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none stroke-white stroke-[1.5]">
        {/* Tower */}
        <line x1="12" y1="20" x2="12" y2="8"/>
        <line x1="8" y1="20" x2="16" y2="20"/>
        {/* Antenna arcs */}
        <path d="M8 14 Q12 10 16 14" strokeLinecap="round"/>
        <path d="M6 17 Q12 11 18 17" strokeLinecap="round"/>
        {/* Signal dot */}
        <circle cx="12" cy="7" r="1.5" className="fill-white"/>
      </svg>
    } />
  );
}

// ── Datacenter / Cloud ────────────────────────────────────────────────────────
export function DatacenterNode({ data }: NodeProps<NodeData>) {
  return (
    <BaseNode data={data} icon={
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none stroke-white stroke-[1.5]">
        <rect x="2" y="4"  width="20" height="4" rx="1"/>
        <rect x="2" y="10" width="20" height="4" rx="1"/>
        <rect x="2" y="16" width="20" height="4" rx="1"/>
        <circle cx="18" cy="6"  r="1" className="fill-white"/>
        <circle cx="18" cy="12" r="1" className="fill-white"/>
        <circle cx="18" cy="18" r="1" className="fill-white"/>
      </svg>
    } />
  );
}

