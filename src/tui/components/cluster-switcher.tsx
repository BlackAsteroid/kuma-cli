import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

export interface ClusterSwitcherProps {
  clusters: Record<string, { instances: string[]; primary: string }>;
  currentCluster: string | null;
  onSelect: (name: string) => void;
  onCancel: () => void;
}

export function ClusterSwitcher({
  clusters,
  currentCluster,
  onSelect,
  onCancel,
}: ClusterSwitcherProps): React.ReactElement {
  const names = Object.keys(clusters).sort();
  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (!currentCluster) return 0;
    const idx = names.indexOf(currentCluster);
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
        <Text bold color="cyan">Switch Cluster</Text>
        <Text dimColor>No clusters configured. Run: kuma cluster create {"<name>"}</Text>
        <Box marginTop={1}><Text dimColor>Esc=cancel</Text></Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Text bold color="cyan">Switch Cluster</Text>
      <Box flexDirection="column" marginTop={1}>
        {names.map((name, idx) => {
          const cluster = clusters[name];
          const isSelected = idx === selectedIndex;
          const isCurrent = name === currentCluster;
          return (
            <Box key={name} flexDirection="column">
              <Box>
                <Text color={isSelected ? "cyan" : undefined} bold={isSelected}>
                  {isSelected ? "> " : "  "}{name}
                </Text>
                {isCurrent && <Text color="green"> (active)</Text>}
              </Box>
              <Box marginLeft={4}>
                <Text dimColor>
                  primary: {cluster.primary} | instances: {cluster.instances.join(", ")}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}><Text dimColor>j/k=navigate  Enter=select  Esc=cancel</Text></Box>
    </Box>
  );
}
