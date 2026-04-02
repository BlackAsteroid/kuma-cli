import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { StatusBadge } from "./status-badge.js";
import type { MonitorRow } from "../hooks/use-monitors.js";

export interface MonitorTableProps {
  monitors: MonitorRow[];
  selectedIndex: number;
  loadingMonitorId?: number | null;
  changedMonitorIds?: Set<number>;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "\u2026";
}

function pad(str: string, width: number): string {
  const truncated = truncate(str, width);
  return truncated + " ".repeat(Math.max(0, width - truncated.length));
}

const COL_STATUS = 11;
const COL_NAME = 30;
const COL_TYPE = 8;
const COL_URL = 30;
const COL_UPTIME = 9;
const COL_PING = 9;
const COL_CHECKED = 12;

// Header: logo(4) + marginTop(1) + instance(1) + counts(1) + marginBottom(1) = 8
// Table column header: 1
// Footer: marginTop(1) + text(1) = 2
// Scroll indicator: 1 (when needed)
const CHROME_LINES = 12;

export function MonitorTable({
  monitors,
  selectedIndex,
  loadingMonitorId,
  changedMonitorIds,
}: MonitorTableProps): React.ReactElement {
  const [scrollOffset, setScrollOffset] = useState(0);

  const termRows = process.stdout.rows ?? 40;
  const termWidth = process.stdout.columns ?? 120;
  const maxVisible = Math.max(1, termRows - CHROME_LINES);

  // Keep selected row in view
  useEffect(() => {
    setScrollOffset((prev) => {
      if (selectedIndex < prev) return selectedIndex;
      if (selectedIndex >= prev + maxVisible) return selectedIndex - maxVisible + 1;
      return prev;
    });
  }, [selectedIndex, maxVisible]);

  if (monitors.length === 0) {
    return (
      <Box>
        <Text dimColor>No monitors match the current filters.</Text>
      </Box>
    );
  }

  const showUrl = termWidth >= 90;
  const showPing = termWidth >= 75;
  const showChecked = termWidth >= 100;

  const visibleMonitors = monitors.slice(scrollOffset, scrollOffset + maxVisible);
  const hasScrollUp = scrollOffset > 0;
  const hasScrollDown = scrollOffset + maxVisible < monitors.length;

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold dimColor>
          {pad("STATUS", COL_STATUS)}
          {pad("NAME", COL_NAME)}
          {pad("TYPE", COL_TYPE)}
          {showUrl ? pad("URL", COL_URL) : ""}
          {pad("UPTIME", COL_UPTIME)}
          {showPing ? pad("PING", COL_PING) : ""}
          {showChecked ? pad("CHECKED", COL_CHECKED) : ""}
        </Text>
      </Box>

      {hasScrollUp && (
        <Text dimColor>  {"\u25b2"} {scrollOffset} more above</Text>
      )}

      {visibleMonitors.map((m, vi) => {
        const i = vi + scrollOffset;
        const isSelected = i === selectedIndex;
        const isLoading = loadingMonitorId === m.id;
        const isChanged = changedMonitorIds?.has(m.id) ?? false;
        const indent = "  ".repeat(m.depth);
        const displayName = indent + m.name;

        const uptimeNum = parseFloat(m.uptime);
        let uptimeColor: string | undefined;
        if (!isNaN(uptimeNum)) {
          if (uptimeNum >= 99) uptimeColor = "green";
          else if (uptimeNum >= 95) uptimeColor = "yellow";
          else uptimeColor = "red";
        }

        const pingNum = parseInt(m.ping, 10);
        let pingColor: string | undefined;
        if (!isNaN(pingNum)) {
          if (pingNum < 200) pingColor = "green";
          else if (pingNum < 500) pingColor = "yellow";
          else pingColor = "red";
        }

        return (
          <Box key={m.id}>
            <Text inverse={isSelected} bold={isChanged} color={isChanged ? "yellow" : undefined}>
              <StatusBadge status={m.status} />
              {"  "}
              {isLoading ? (
                <Text color="yellow">{pad("[...]", COL_NAME)}</Text>
              ) : (
                <Text>{pad(displayName, COL_NAME)}</Text>
              )}
              <Text dimColor>{pad(m.type, COL_TYPE)}</Text>
              {showUrl && <Text dimColor>{pad(m.url, COL_URL)}</Text>}
              <Text color={uptimeColor}>{pad(m.uptime, COL_UPTIME)}</Text>
              {showPing && (
                <Text color={pingColor}>{pad(m.ping, COL_PING)}</Text>
              )}
              {showChecked && <Text dimColor>{pad(m.lastChecked, COL_CHECKED)}</Text>}
            </Text>
          </Box>
        );
      })}

      {hasScrollDown && (
        <Text dimColor>  {"\u25bc"} {monitors.length - scrollOffset - maxVisible} more below</Text>
      )}
    </Box>
  );
}
