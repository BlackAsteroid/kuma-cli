import React from "react";
import { Text } from "ink";

export interface StatusBadgeProps {
  status: number;
}

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "DOWN", color: "red" },
  1: { label: "UP", color: "green" },
  2: { label: "PENDING", color: "yellow" },
  3: { label: "MAINT", color: "gray" },
};

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const info = STATUS_MAP[status] ?? { label: "UNKNOWN", color: "gray" };
  return <Text color={info.color}>{"● " + info.label}</Text>;
}
