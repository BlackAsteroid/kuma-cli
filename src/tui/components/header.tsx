import React from "react";
import { Box, Text } from "ink";
import type { MonitorRow } from "../hooks/use-monitors.js";

const LOGO = [
  " _  ___   _ __  __    _      ___ _    ___ ",
  "| |/ / | | |  \\/  |  /_\\    / __| |  |_ _|",
  "| ' <| |_| | |\\/| | / _ \\  | (__| |__ | | ",
  "|_|\\_\\\\___/|_|  |_|/_/ \\_\\  \\___|____|___|",
];

const STATUS_NAMES: Record<number, string> = {
  0: "DOWN",
  1: "UP",
  2: "PENDING",
  3: "MAINTENANCE",
};

export interface HeaderProps {
  instanceName: string;
  connected: boolean;
  monitors: MonitorRow[];
  searchQuery?: string;
  statusFilter?: number | null;
  filteredCount?: number;
}

export function Header({
  instanceName,
  connected,
  monitors,
  searchQuery,
  statusFilter,
  filteredCount,
}: HeaderProps): React.ReactElement {
  const total = monitors.length;
  const up = monitors.filter((m) => m.status === 1).length;
  const down = monitors.filter((m) => m.status === 0).length;
  const pending = monitors.filter((m) => m.status === 2).length;
  const maint = monitors.filter((m) => m.status === 3).length;

  const hasFilters =
    (searchQuery !== undefined && searchQuery !== "") ||
    (statusFilter !== undefined && statusFilter !== null);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="column">
        {LOGO.map((line, i) => (
          <Text key={i} color="#db2777" bold>{line}</Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text bold>{instanceName}</Text>
        <Text> </Text>
        {connected ? (
          <Text color="green">[connected]</Text>
        ) : (
          <Text color="red">[disconnected]</Text>
        )}
      </Box>
      <Box>
        {hasFilters && filteredCount !== undefined ? (
          <Text>
            {filteredCount} of {total} monitors (filtered)
          </Text>
        ) : (
          <>
            <Text>{total} monitors: </Text>
            <Text color="green">{up} up</Text>
            <Text>, </Text>
            <Text color="red">{down} down</Text>
            {pending > 0 && (
              <>
                <Text>, </Text>
                <Text color="yellow">{pending} pending</Text>
              </>
            )}
            {maint > 0 && (
              <>
                <Text>, </Text>
                <Text color="gray">{maint} maintenance</Text>
              </>
            )}
          </>
        )}
      </Box>
      {hasFilters && (
        <Box>
          <Text dimColor>Active filters: </Text>
          {searchQuery && (
            <Text color="yellow">search="{searchQuery}" </Text>
          )}
          {statusFilter !== null && statusFilter !== undefined && (
            <Text color="yellow">
              status={STATUS_NAMES[statusFilter] ?? "UNKNOWN"}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}
