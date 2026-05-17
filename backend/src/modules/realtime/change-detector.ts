/**
 * Dirty-flag change detector.
 *
 * Polls the DB every POLL_INTERVAL_MS for topology_nodes / topology_links
 * whose updated_at has advanced since last check, then pushes diffs to
 * connected Socket.IO subscribers.
 *
 * In production this is complemented by SNMP trap / gNMI push / Zabbix
 * webhooks that directly call emitNodeUpdate / emitLinkUpdate.
 */
import { getDb }                              from '../../db/connection.js';
import { emitNodeUpdate, emitLinkUpdate, emitAlarmEvent, emitAlarmCounts } from './websocket.gateway.js';

const POLL_INTERVAL_MS = 3_000;

// Last-seen timestamps per topology
const lastNodePoll = new Map<string, Date>();
const lastLinkPoll = new Map<string, Date>();
let   alarmLastPoll = new Date(0);

// Track active subscriptions so we only poll needed topologies
const subscribedTopologies = new Set<string>();

export function trackTopologySubscription(topologyId: string, subscribed: boolean) {
  if (subscribed) subscribedTopologies.add(topologyId);
  else            subscribedTopologies.delete(topologyId);
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startChangeDetector() {
  if (timer) return;

  timer = setInterval(async () => {
    const db = getDb();

    // ── Poll node changes ──────────────────────────────────────────────────
    for (const topologyId of subscribedTopologies) {
      const since = lastNodePoll.get(topologyId) ?? new Date(0);
      const now   = new Date();

      try {
        const changed = await db
          .selectFrom('topology_nodes')
          .select(['id', 'status', 'custom_icon', 'utilization_pct' as never,
                   'label', 'ip_address', 'updated_at'])
          .where('topology_id', '=', topologyId)
          .where('updated_at',  '>', since)
          .execute() as Array<{
            id: string; status: string; custom_icon: string | null;
            label: string; ip_address: string | null; updated_at: Date;
          }>;

        if (changed.length) {
          changed.forEach(n => emitNodeUpdate(topologyId, {
            id:         n.id,
            status:     n.status,
            customIcon: n.custom_icon ?? undefined,
          }));
          lastNodePoll.set(topologyId, now);
        } else {
          lastNodePoll.set(topologyId, now);
        }
      } catch { /* DB may not be ready on first tick */ }

      // ── Poll link utilization changes ──────────────────────────────────
      const sinceLnk = lastLinkPoll.get(topologyId) ?? new Date(0);
      try {
        const changedLinks = await db
          .selectFrom('topology_links')
          .select(['id', 'status', 'utilization_pct', 'updated_at'])
          .where('topology_id', '=', topologyId)
          .where('updated_at',  '>',  sinceLnk)
          .execute();

        if (changedLinks.length) {
          changedLinks.forEach(l => emitLinkUpdate(topologyId, {
            id:             l.id,
            status:         l.status,
            utilizationPct: l.utilization_pct ?? undefined,
          }));
          lastLinkPoll.set(topologyId, now);
        } else {
          lastLinkPoll.set(topologyId, now);
        }
      } catch { /* ignore */ }
    }

    // ── Poll new / cleared alarms ─────────────────────────────────────────
    try {
      const newAlarms = await db
        .selectFrom('alarms')
        .selectAll()
        .where('created_at', '>', alarmLastPoll)
        .execute();

      if (newAlarms.length) {
        newAlarms.forEach(a => emitAlarmEvent('alarm:new', {
          id:         a.id,
          severity:   a.severity,
          title:      a.title,
          source:     a.source,
          topologyId: a.topology_id,
          nodeId:     a.node_id,
          createdAt:  a.created_at,
        }));
        alarmLastPoll = new Date();

        // Re-emit fresh counts after new alarms
        const rows = await db
          .selectFrom('alarms')
          .select(['severity', db.fn.count<number>('id').as('count')])
          .where('is_cleared', '=', 0)
          .groupBy('severity')
          .execute();

        const counts = { CRITICAL: 0, MAJOR: 0, MINOR: 0, WARNING: 0 };
        rows.forEach(r => { counts[r.severity as keyof typeof counts] = Number(r.count); });
        emitAlarmCounts(counts);
      }
    } catch { /* ignore */ }

  }, POLL_INTERVAL_MS);

  console.log(`[ChangeDetector] polling every ${POLL_INTERVAL_MS / 1000}s`);
}

export function stopChangeDetector() {
  if (timer) { clearInterval(timer); timer = null; }
}
