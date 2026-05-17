/**
 * Built-in SVG icon catalog for network equipment.
 * Each entry provides an SVG string rendered inside a 24×24 viewBox.
 * The stroke is always `currentColor` so the parent component controls colour.
 */

export interface BuiltinIcon {
  key:      string;
  label:    string;
  category: string;
  svg:      string; // inner SVG content (no <svg> wrapper)
}

const ROUTER_SVG = `
  <rect x="2" y="7" width="20" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="7" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="17" cy="12" r="1.5" fill="currentColor"/>
  <line x1="7" y1="7" x2="7" y2="4" stroke="currentColor" stroke-width="1.5"/>
  <line x1="12" y1="7" x2="12" y2="4" stroke="currentColor" stroke-width="1.5"/>
  <line x1="17" y1="7" x2="17" y2="4" stroke="currentColor" stroke-width="1.5"/>`;

const SWITCH_SVG = `
  <rect x="2" y="9" width="20" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="5" y1="9" x2="5" y2="5" stroke="currentColor" stroke-width="1.5"/>
  <line x1="9" y1="9" x2="9" y2="5" stroke="currentColor" stroke-width="1.5"/>
  <line x1="13" y1="9" x2="13" y2="5" stroke="currentColor" stroke-width="1.5"/>
  <line x1="17" y1="9" x2="17" y2="5" stroke="currentColor" stroke-width="1.5"/>
  <line x1="19" y1="15" x2="19" y2="19" stroke="currentColor" stroke-width="1.5"/>
  <polyline points="17,19 19,21 21,19" fill="none" stroke="currentColor" stroke-width="1.5"/>`;

const FIREWALL_SVG = `
  <path d="M12 2 L20 6 L20 13 C20 17.4 16.5 21 12 22 C7.5 21 4 17.4 4 13 L4 6 Z"
        fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="8" y1="8" x2="8" y2="16" stroke="currentColor" stroke-width="1.5"/>
  <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" stroke-width="1.5"/>
  <line x1="16" y1="8" x2="16" y2="16" stroke="currentColor" stroke-width="1.5"/>`;

const SERVER_SVG = `
  <rect x="2" y="3" width="20" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="2" y="10" width="20" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="2" y="17" width="20" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="19" cy="5.5" r="1" fill="currentColor"/>
  <circle cx="19" cy="12.5" r="1" fill="currentColor"/>`;

const CLOUD_SVG = `
  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        fill="none" stroke="currentColor" stroke-width="1.5"/>`;

const GNB_SVG = `
  <line x1="12" y1="20" x2="12" y2="8" stroke="currentColor" stroke-width="1.5"/>
  <line x1="8" y1="20" x2="16" y2="20" stroke="currentColor" stroke-width="1.5"/>
  <path d="M8 14 Q12 10 16 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M5 17 Q12 10 19 17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="12" cy="7" r="1.5" fill="currentColor"/>`;

const CORE_NF_SVG = `
  <polygon points="12,2 20,7 20,17 12,22 4,17 4,7"
           fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="12" y="15" text-anchor="middle" font-size="7" font-weight="bold" fill="currentColor">NF</text>`;

const DATACENTER_SVG = `
  <rect x="2" y="4" width="20" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="2" y="10" width="20" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="2" y="16" width="20" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="18" cy="6" r="1" fill="currentColor"/>
  <circle cx="18" cy="12" r="1" fill="currentColor"/>
  <circle cx="18" cy="18" r="1" fill="currentColor"/>`;

const ANTENNA_SVG = `
  <circle cx="12" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M5 5 Q12 0 19 5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M8 8 Q12 4 16 8" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="12" y1="7" x2="12" y2="20" stroke="currentColor" stroke-width="1.5"/>
  <line x1="8" y1="20" x2="16" y2="20" stroke="currentColor" stroke-width="1.5"/>`;

const SATELLITE_SVG = `
  <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="2" y1="12" x2="8" y2="12" stroke="currentColor" stroke-width="1.5"/>
  <line x1="16" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.5"/>
  <line x1="12" y1="2" x2="12" y2="8" stroke="currentColor" stroke-width="1.5"/>
  <line x1="12" y1="16" x2="12" y2="22" stroke="currentColor" stroke-width="1.5"/>
  <line x1="5" y1="5" x2="8.5" y2="8.5" stroke="currentColor" stroke-width="1.5"/>
  <line x1="15.5" y1="15.5" x2="19" y2="19" stroke="currentColor" stroke-width="1.5"/>`;

const LOAD_BALANCER_SVG = `
  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M12 3 C12 3 7 8 7 12" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M12 3 C12 3 17 8 17 12" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.5"/>
  <line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" stroke-width="1.5"/>`;

const OLT_SVG = `
  <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="8" y1="6" x2="8" y2="18" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="5.5" cy="12" r="1" fill="currentColor"/>
  <line x1="8" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1"/>
  <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1"/>
  <line x1="8" y1="15" x2="21" y2="15" stroke="currentColor" stroke-width="1"/>`;

const PE_ROUTER_SVG = `
  <rect x="2" y="7" width="20" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="7" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="17" cy="12" r="1.5" fill="currentColor"/>
  <text x="12" y="6" text-anchor="middle" font-size="5" font-weight="bold" fill="currentColor">PE</text>`;

export const BUILTIN_ICONS: BuiltinIcon[] = [
  { key: 'router',        label: 'Router',           category: 'IP/MPLS', svg: ROUTER_SVG },
  { key: 'pe-router',     label: 'PE Router',        category: 'IP/MPLS', svg: PE_ROUTER_SVG },
  { key: 'switch',        label: 'Switch',           category: 'IP/MPLS', svg: SWITCH_SVG },
  { key: 'firewall',      label: 'Firewall',         category: 'IP/MPLS', svg: FIREWALL_SVG },
  { key: 'load-balancer', label: 'Load Balancer',    category: 'IP/MPLS', svg: LOAD_BALANCER_SVG },
  { key: 'server',        label: 'Server',           category: 'Infrastructure', svg: SERVER_SVG },
  { key: 'datacenter',    label: 'Data Center',      category: 'Infrastructure', svg: DATACENTER_SVG },
  { key: 'cloud',         label: 'Cloud',            category: 'Infrastructure', svg: CLOUD_SVG },
  { key: 'gnb',           label: 'gNB / Base Station', category: '5G', svg: GNB_SVG },
  { key: 'core-nf',       label: 'Core NF (5G)',     category: '5G', svg: CORE_NF_SVG },
  { key: 'antenna',       label: 'Antenna',          category: '5G', svg: ANTENNA_SVG },
  { key: 'satellite',     label: 'Satellite',        category: 'Transport', svg: SATELLITE_SVG },
  { key: 'olt',           label: 'OLT',              category: 'Access',   svg: OLT_SVG },
];

export const BUILTIN_ICON_MAP = Object.fromEntries(
  BUILTIN_ICONS.map(i => [i.key, i])
);

/** Categories with their icons */
export const ICON_CATEGORIES = [...new Set(BUILTIN_ICONS.map(i => i.category))];
