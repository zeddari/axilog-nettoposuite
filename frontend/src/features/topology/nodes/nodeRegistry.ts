import { RouterNode, SwitchNode, CoreNfNode, GnbNode, DatacenterNode } from './NodeTypes';

/** Map of node type string → React Flow custom node component */
export const NODE_TYPES_MAP = {
  ROUTER:     RouterNode,
  PE:         RouterNode,
  P:          RouterNode,
  RR:         RouterNode,
  SWITCH:     SwitchNode,
  CORE_NF:    CoreNfNode,
  NF:         CoreNfNode,
  GNB:        GnbNode,
  DATACENTER: DatacenterNode,
} as const;

export type NodeTypeName = keyof typeof NODE_TYPES_MAP;

export function getNodeComponent(type: string) {
  return NODE_TYPES_MAP[type as NodeTypeName] ?? RouterNode;
}
