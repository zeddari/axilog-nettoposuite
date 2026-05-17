import { type EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';

interface TrafficData {
  status?: string;
  utilizationPct?: number;
  bandwidthMbps?: number;
  label?: string;
  protocol?: string;
}

function utilColor(pct: number, status: string): string {
  if (status === 'DOWN')        return '#ef4444';
  if (status === 'DEGRADED')    return '#f59e0b';
  if (pct > 80)                 return '#f97316';
  if (pct > 50)                 return '#f59e0b';
  return '#22c55e';
}

export function TrafficEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: EdgeProps<TrafficData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const status  = data?.status ?? 'UP';
  const pct     = data?.utilizationPct ?? 0;
  const color   = utilColor(pct, status);
  const animate = status === 'UP' && pct > 5;
  const width   = pct > 70 ? 3 : pct > 30 ? 2 : 1.5;
  const dashed  = status === 'DOWN' ? '6 4' : undefined;

  return (
    <>
      {/* Glow layer for high-utilization links */}
      {pct > 60 && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={width + 4}
          strokeOpacity={0.15}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Base edge */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed}
        style={{ pointerEvents: 'none' }}
      />

      {/* Animated traffic flow overlay */}
      {animate && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={width + 1}
          strokeDasharray="8 16"
          strokeLinecap="round"
          style={{
            pointerEvents: 'none',
            animation: `flowDash ${pct > 70 ? '0.8s' : '1.5s'} linear infinite`,
          }}
        />
      )}

      {/* Utilization label */}
      {pct > 0 && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            className="absolute pointer-events-none"
          >
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: 'rgba(13,17,23,0.85)',
                color,
                border: `1px solid ${color}44`,
              }}
            >
              {pct.toFixed(0)}%
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const EDGE_TYPES = { traffic: TrafficEdge };
