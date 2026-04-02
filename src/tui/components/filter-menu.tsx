import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface FilterOption {
  label: string;
  value: number | null;
  color: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { label: "ALL", value: null, color: "white" },
  { label: "UP", value: 1, color: "green" },
  { label: "DOWN", value: 0, color: "red" },
  { label: "PENDING", value: 2, color: "yellow" },
  { label: "MAINTENANCE", value: 3, color: "gray" },
];

export interface FilterMenuProps {
  onSelect: (status: number | null) => void;
  onCancel: () => void;
  currentFilter: number | null;
}

export function FilterMenu({
  onSelect,
  onCancel,
  currentFilter,
}: FilterMenuProps): React.ReactElement {
  const initialIndex = FILTER_OPTIONS.findIndex(
    (o) => o.value === currentFilter
  );
  const [selectedIndex, setSelectedIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      onSelect(FILTER_OPTIONS[selectedIndex].value);
      return;
    }
    if (input === "k" || key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }
    if (input === "j" || key.downArrow) {
      setSelectedIndex((prev) =>
        Math.min(FILTER_OPTIONS.length - 1, prev + 1)
      );
      return;
    }
  });

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="yellow" paddingX={1}>
      <Text bold color="yellow">Filter by status:</Text>
      {FILTER_OPTIONS.map((option, index) => {
        const isSelected = index === selectedIndex;
        const isCurrent = option.value === currentFilter;
        return (
          <Box key={option.label}>
            <Text>{isSelected ? "> " : "  "}</Text>
            <Text color={option.color} bold={isSelected}>{option.label}</Text>
            {isCurrent && <Text dimColor> (current)</Text>}
          </Box>
        );
      })}
      <Text dimColor>j/k=navigate Enter=select Esc=cancel</Text>
    </Box>
  );
}
