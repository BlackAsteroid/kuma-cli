import React from "react";
import { Box, Text } from "ink";
import type { MonitorRow } from "../hooks/use-monitors.js";
import type { Heartbeat } from "../../client.js";
import { StatusBadge } from "./status-badge.js";

interface MonitorDetailProps {
  monitor: MonitorRow;
  heartbeats: Heartbeat[];
  loading: boolean;
  error: string | null;
}

function formatTime(timeStr: string): string {
  try {
    const d = new Date(timeStr);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return timeStr;
  }
}

function statusText(status: number): { label: string; color: string } {
  if (status === 1) return { label: "UP", color: "green" };
  if (status === 0) return { label: "DOWN", color: "red" };
  if (status === 2) return { label: "PENDING", color: "yellow" };
  if (status === 3) return { label: "MAINT", color: "gray" };
  return { label: "UNKNOWN", color: "gray" };
}

function uptimeColor(pct: number): string {
  if (pct >= 99) return "green";
  if (pct >= 95) return "yellow";
  return "red";
}

export function MonitorDetail({ monitor, heartbeats, loading, error }: MonitorDetailProps): React.ReactElement {
  const recentBeats = heartbeats.slice(-20);
  const totalBeats = heartbeats.length;
  const upBeats = heartbeats.filter((h) => h.status === 1).length;
  const uptimePct = totalBeats > 0 ? (upBeats / totalBeats) * 100 : 0;

  const pingsWithValues = heartbeats.filter((h) => h.ping != null && h.ping > 0);
  const avgPing =
    pingsWithValues.length > 0
      ? Math.round(pingsWithValues.reduce((sum, h) => sum + (h.ping ?? 0), 0) / pingsWithValues.length)
      : null;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">Monitor Detail</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Box width={16}><Text bold>Name:</Text></Box>
          <Text>{monitor.name}</Text>
        </Box>
        <Box>
          <Box width={16}><Text bold>ID:</Text></Box>
          <Text>{String(monitor.id)}</Text>
        </Box>
        <Box>
          <Box width={16}><Text bold>Type:</Text></Box>
          <Text>{monitor.type}</Text>
        </Box>
        {monitor.url ? (
          <Box>
            <Box width={16}><Text bold>URL:</Text></Box>
            <Text>{monitor.url}</Text>
          </Box>
        ) : null}
      </Box>

      <Box marginBottom={1}>
        <Box width={16}><Text bold>Status:</Text></Box>
        <StatusBadge status={monitor.status} />
      </Box>

      <Box marginBottom={1} gap={4}>
        <Box>
          <Text bold>Uptime: </Text>
          <Text color={uptimeColor(uptimePct)}>{uptimePct.toFixed(1)}%</Text>
          <Text dimColor> ({upBeats}/{totalBeats} beats)</Text>
        </Box>
        <Box>
          <Text bold>Avg Response: </Text>
          {avgPing != null ? (
            <Text color={avgPing < 200 ? "green" : avgPing < 500 ? "yellow" : "red"}>{avgPing}ms</Text>
          ) : (
            <Text dimColor>--</Text>
          )}
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold>Recent Heartbeats</Text>
        {loading ? (
          <Text dimColor>Loading heartbeats...</Text>
        ) : error ? (
          <Text color="red">Error: {error}</Text>
        ) : recentBeats.length === 0 ? (
          <Text dimColor>No heartbeat data available</Text>
        ) : (
          <Box flexDirection="column" marginTop={0}>
            <Box>
              <Box width={14}><Text bold dimColor>Time</Text></Box>
              <Box width={12}><Text bold dimColor>Status</Text></Box>
              <Box width={12}><Text bold dimColor>Response</Text></Box>
              <Box width={40}><Text bold dimColor>Message</Text></Box>
            </Box>
            {[...recentBeats].reverse().map((hb) => {
              const st = statusText(hb.status);
              return (
                <Box key={hb.id}>
                  <Box width={14}><Text dimColor>{formatTime(hb.time)}</Text></Box>
                  <Box width={12}><Text color={st.color}>{st.label}</Text></Box>
                  <Box width={12}>
                    {hb.ping != null ? (
                      <Text>{hb.ping}ms</Text>
                    ) : (
                      <Text dimColor>--</Text>
                    )}
                  </Box>
                  <Box width={40}>
                    <Text dimColor wrap="truncate">{hb.msg ?? ""}</Text>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
