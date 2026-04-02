import React from "react";
import { Box, Text } from "ink";

export interface FooterProps {
  view: "list" | "detail";
  mode: "normal" | "search" | "filter-menu";
  selectedStatus?: number;
}

export function Footer({ view, mode, selectedStatus }: FooterProps): React.ReactElement {
  if (view === "detail") {
    return (
      <Box marginTop={1}>
        <Text dimColor>Esc=back  r=refresh  i=instances  c=clusters  q=quit</Text>
      </Box>
    );
  }

  if (mode === "search") {
    return (
      <Box marginTop={1}>
        <Text dimColor>Enter=confirm  Esc=clear and close</Text>
      </Box>
    );
  }

  if (mode === "filter-menu") {
    return (
      <Box marginTop={1}>
        <Text dimColor>j/k=navigate  Enter=select  Esc=cancel</Text>
      </Box>
    );
  }

  const isPaused = selectedStatus === 3;

  return (
    <Box marginTop={1}>
      <Text dimColor>
        q=quit  j/k=navigate  Enter=detail  r=refresh  /=search  f=filter
        {isPaused ? "  u=resume" : "  p=pause"}
        {"  d=delete  i=instances  c=clusters  h=help  Esc=clear"}
      </Text>
    </Box>
  );
}
