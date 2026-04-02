import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

export interface InstanceSwitcherProps {
  instances: Record<string, { url: string; token: string }>;
  currentInstance: string;
  onSelect: (name: string) => void;
  onCancel: () => void;
}

export function InstanceSwitcher({
  instances,
  currentInstance,
  onSelect,
  onCancel,
}: InstanceSwitcherProps): React.ReactElement {
  const names = Object.keys(instances).sort();
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = names.indexOf(currentInstance);
    return idx >= 0 ? idx : 0;
  });

  useInput((input, key) => {
    if (key.escape) { onCancel(); return; }
    if (key.return) { if (names.length > 0) onSelect(names[selectedIndex]); return; }
    if (input === "k" || key.upArrow) { setSelectedIndex((prev) => Math.max(0, prev - 1)); return; }
    if (input === "j" || key.downArrow) { setSelectedIndex((prev) => Math.min(names.length - 1, prev + 1)); return; }
  });

  if (names.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text bold color="cyan">Switch Instance</Text>
        <Text dimColor>No instances configured. Run: kuma login {"<url>"}</Text>
        <Box marginTop={1}><Text dimColor>Esc=cancel</Text></Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Text bold color="cyan">Switch Instance</Text>
      <Box flexDirection="column" marginTop={1}>
        {names.map((name, idx) => {
          const inst = instances[name];
          const isSelected = idx === selectedIndex;
          const isCurrent = name === currentInstance;
          return (
            <Box key={name}>
              <Text color={isSelected ? "cyan" : undefined} bold={isSelected}>
                {isSelected ? "> " : "  "}{name}
              </Text>
              <Text dimColor> {inst.url}</Text>
              {isCurrent && <Text color="green"> (active)</Text>}
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}><Text dimColor>j/k=navigate  Enter=select  Esc=cancel</Text></Box>
    </Box>
  );
}
