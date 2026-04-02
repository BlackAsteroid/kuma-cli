import { useState, useEffect, useCallback, useRef } from "react";
import type { KumaClient, Monitor } from "../../client.js";

export interface MonitorRow {
  id: number;
  name: string;
  type: string;
  url: string;
  status: number;
  uptime: string;
  ping: string;
  lastChecked: string;
  parent: number | undefined;
  depth: number;
}

/** Status sort priority: DOWN=0 first, PENDING=2, UP=1, MAINTENANCE=3 last */
const STATUS_PRIORITY: Record<number, number> = {
  0: 0, // DOWN first
  2: 1, // PENDING
  1: 2, // UP
  3: 3, // MAINTENANCE
};

function getStatusPriority(status: number): number {
  return STATUS_PRIORITY[status] ?? 99;
}

function formatUptime(uptime?: number): string {
  if (uptime === undefined || uptime === null) return "--";
  return (uptime * 100).toFixed(1) + "%";
}

function formatPing(ping?: number): string {
  if (!ping) return "--";
  return ping + "ms";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleTimeString();
}

function buildRows(monitorMap: Record<string, Monitor>): MonitorRow[] {
  const monitors = Object.values(monitorMap);

  const parentIds = new Set<number>();
  const childrenByParent = new Map<number, Monitor[]>();

  for (const m of monitors) {
    if (m.type === "group") {
      parentIds.add(m.id);
    }
    if (m.parent) {
      const siblings = childrenByParent.get(m.parent) ?? [];
      siblings.push(m);
      childrenByParent.set(m.parent, siblings);
    }
  }

  const topLevel = monitors.filter((m) => !m.parent);

  topLevel.sort((a, b) => {
    const aStatus = a.heartbeat?.status ?? (a.active ? 2 : 3);
    const bStatus = b.heartbeat?.status ?? (b.active ? 2 : 3);
    const sp = getStatusPriority(aStatus) - getStatusPriority(bStatus);
    if (sp !== 0) return sp;
    return a.name.localeCompare(b.name);
  });

  const rows: MonitorRow[] = [];

  function toRow(m: Monitor, depth: number): MonitorRow {
    const status = m.heartbeat?.status ?? (m.active ? 2 : 3);
    return {
      id: m.id,
      name: m.name,
      type: m.type,
      url: m.url ?? m.hostname ?? "",
      status,
      uptime: formatUptime(m.uptime),
      ping: formatPing(m.heartbeat?.ping),
      lastChecked: formatDate(m.heartbeat?.time),
      parent: m.parent ?? undefined,
      depth,
    };
  }

  for (const m of topLevel) {
    rows.push(toRow(m, 0));
    const children = childrenByParent.get(m.id);
    if (children) {
      children.sort((a, b) => {
        const aStatus = a.heartbeat?.status ?? (a.active ? 2 : 3);
        const bStatus = b.heartbeat?.status ?? (b.active ? 2 : 3);
        const sp = getStatusPriority(aStatus) - getStatusPriority(bStatus);
        if (sp !== 0) return sp;
        return a.name.localeCompare(b.name);
      });
      for (const child of children) {
        rows.push(toRow(child, 1));
      }
    }
  }

  return rows;
}

export interface UseMonitorsResult {
  monitors: MonitorRow[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  changedMonitorIds: Set<number>;
  refresh: () => void;
}

export function useMonitors(
  client: KumaClient,
  refreshInterval: number
): UseMonitorsResult {
  const [monitors, setMonitors] = useState<MonitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [changedMonitorIds, setChangedMonitorIds] = useState<Set<number>>(new Set());
  const flashTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const fetchMonitors = useCallback(async () => {
    try {
      const monitorMap = await client.getMonitorList();
      const rows = buildRows(monitorMap);
      setMonitors(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Real-time heartbeat updates
  useEffect(() => {
    const unsubHeartbeat = client.onHeartbeat((monitorId, hb) => {
      setMonitors((prev) => {
        const idx = prev.findIndex((m) => m.id === monitorId);
        if (idx === -1) return prev;
        const old = prev[idx];
        const statusChanged = old.status !== hb.status;
        const updated = {
          ...old,
          status: hb.status,
          ping: hb.ping != null ? hb.ping + "ms" : old.ping,
          lastChecked: hb.time ? new Date(hb.time).toLocaleTimeString() : old.lastChecked,
        };
        const next = [...prev];
        next[idx] = updated;

        // Flash on status change
        if (statusChanged) {
          setChangedMonitorIds((s) => new Set(s).add(monitorId));
          const existing = flashTimers.current.get(monitorId);
          if (existing) clearTimeout(existing);
          flashTimers.current.set(
            monitorId,
            setTimeout(() => {
              setChangedMonitorIds((s) => {
                const ns = new Set(s);
                ns.delete(monitorId);
                return ns;
              });
              flashTimers.current.delete(monitorId);
            }, 2000)
          );
        }

        return next;
      });
    });

    const unsubUptime = client.onUptime((monitorId, period, value) => {
      if (period !== "24") return;
      setMonitors((prev) => {
        const idx = prev.findIndex((m) => m.id === monitorId);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...prev[idx], uptime: (value * 100).toFixed(1) + "%" };
        return next;
      });
    });

    const unsubDisconnect = client.onDisconnect(() => {
      setConnected(false);
    });

    const unsubReconnect = client.onReconnect(() => {
      setConnected(true);
      fetchMonitors(); // Re-fetch on reconnect
    });

    return () => {
      unsubHeartbeat();
      unsubUptime();
      unsubDisconnect();
      unsubReconnect();
      // Clean up flash timers
      for (const timer of flashTimers.current.values()) {
        clearTimeout(timer);
      }
      flashTimers.current.clear();
    };
  }, [client, fetchMonitors]);

  // Initial fetch + fallback polling (60s safety net)
  useEffect(() => {
    fetchMonitors();
    const timer = setInterval(fetchMonitors, Math.max(refreshInterval, 60) * 1000);
    return () => clearInterval(timer);
  }, [fetchMonitors, refreshInterval]);

  return { monitors, loading, error, connected, changedMonitorIds, refresh: fetchMonitors };
}
