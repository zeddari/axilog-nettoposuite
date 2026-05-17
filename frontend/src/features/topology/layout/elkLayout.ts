import type { Node, Edge } from 'reactflow';

interface ElkNode { id: string; width?: number; height?: number; }
interface ElkEdge { id: string; sources: string[]; targets: string[]; }
interface ElkGraph {
  id: string;
  layoutOptions: Record<string, string>;
  children: ElkNode[];
  edges: ElkEdge[];
}
interface ElkResult {
  children?: Array<ElkNode & { x?: number; y?: number }>;
}

const NODE_WIDTH  = 90;
const NODE_HEIGHT = 90;

export const ELK_ALGORITHMS: Record<string, Record<string, string>> = {
  ELK_LAYERED: {
    'elk.algorithm':                  'layered',
    'elk.direction':                  'DOWN',
    'elk.layered.spacing.nodeNodeBetweenLayers': '80',
    'elk.spacing.nodeNode':           '60',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.edgeRouting':                'ORTHOGONAL',
  },
  RADIAL: {
    'elk.algorithm':  'radial',
    'elk.spacing.nodeNode': '80',
  },
  FORCE: {
    'elk.algorithm':                'force',
    'elk.force.iterations':         '300',
    'elk.spacing.nodeNode':         '70',
  },
  TREE: {
    'elk.algorithm':  'mrtree',
    'elk.direction':  'DOWN',
    'elk.spacing.nodeNode': '60',
  },
};

/** Run ELK layout and return nodes with updated positions */
export async function applyElkLayout(
  nodes: Node[],
  edges: Edge[],
  algorithm: string = 'ELK_LAYERED',
): Promise<Node[]> {
  const ELK = (await import('elkjs/lib/elk.bundled.js')).default;
  const elk = new ELK();

  const opts = ELK_ALGORITHMS[algorithm] ?? ELK_ALGORITHMS.ELK_LAYERED;

  const graph: ElkGraph = {
    id:            'root',
    layoutOptions: opts,
    children: nodes.map(n => ({
      id:     n.id,
      width:  NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: edges.map(e => ({
      id:      e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const result = await elk.layout(graph) as ElkResult;

  return nodes.map(n => {
    const laid = result.children?.find(c => c.id === n.id);
    if (!laid || laid.x == null || laid.y == null) return n;
    return { ...n, position: { x: laid.x, y: laid.y } };
  });
}
