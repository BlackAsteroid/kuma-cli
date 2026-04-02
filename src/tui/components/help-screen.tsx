import React from "react";
import { Box, Text, useInput } from "ink";

export interface HelpScreenProps {
  onClose: () => void;
}

export function HelpScreen({ onClose }: HelpScreenProps): React.ReactElement {
  useInput((_input, key) => {
    if (key.escape || _input === "h" || _input === "q") {
      onClose();
    }
  });

  const LOGO = [
    " _  ___   _ __  __    _      ___ _    ___ ",
    "| |/ / | | |  \\/  |  /_\\    / __| |  |_ _|",
    "| ' <| |_| | |\\/| | / _ \\  | (__| |__ | | ",
    "|_|\\_\\\\___/|_|  |_|/_/ \\_\\  \\___|____|___|",
  ];

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box flexDirection="column">
        {LOGO.map((line, i) => (
          <Text key={i} color="#db2777" bold>{line}</Text>
        ))}
      </Box>
      <Box marginTop={1}><Text dimColor>Run these from your terminal (outside the dashboard)</Text></Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Authentication</Text>
        <Text>  <Text color="cyan">kuma login {"<url>"}</Text>              Authenticate with an instance</Text>
        <Text>  <Text color="cyan">kuma logout</Text>                    Clear saved session</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Monitors</Text>
        <Text>  <Text color="cyan">kuma monitors list</Text>             List all monitors</Text>
        <Text>  <Text color="cyan">kuma monitors add</Text>              Add a monitor interactively</Text>
        <Text>  <Text color="cyan">kuma monitors create</Text>           Create a monitor (non-interactive)</Text>
        <Text>  <Text color="cyan">kuma monitors pause {"<id>"}</Text>       Pause a monitor</Text>
        <Text>  <Text color="cyan">kuma monitors resume {"<id>"}</Text>      Resume a monitor</Text>
        <Text>  <Text color="cyan">kuma monitors delete {"<id>"}</Text>      Delete a monitor</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Other</Text>
        <Text>  <Text color="cyan">kuma heartbeat view {"<id>"}</Text>       View heartbeat history</Text>
        <Text>  <Text color="cyan">kuma notifications list</Text>        List notification channels</Text>
        <Text>  <Text color="cyan">kuma status-pages list</Text>         List status pages</Text>
        <Text>  <Text color="cyan">kuma config export</Text>             Export monitors to YAML/JSON</Text>
        <Text>  <Text color="cyan">kuma config import {"<file>"}</Text>      Import monitors from file</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Multi-Instance</Text>
        <Text>  <Text color="cyan">kuma instances list</Text>            List saved instances</Text>
        <Text>  <Text color="cyan">kuma use {"<name>"}</Text>               Switch active instance</Text>
        <Text>  <Text color="cyan">kuma cluster create {"<name>"}</Text>     Create a cluster</Text>
        <Text>  <Text color="cyan">kuma cluster sync {"<name>"}</Text>       Sync cluster monitors</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Dashboard Shortcuts</Text>
        <Text>  <Text color="cyan">q</Text>=quit  <Text color="cyan">j/k</Text>=navigate  <Text color="cyan">Enter</Text>=detail  <Text color="cyan">Esc</Text>=back</Text>
        <Text>  <Text color="cyan">r</Text>=refresh  <Text color="cyan">/</Text>=search  <Text color="cyan">f</Text>=filter  <Text color="cyan">p</Text>=pause  <Text color="cyan">u</Text>=resume</Text>
        <Text>  <Text color="cyan">d</Text>=delete  <Text color="cyan">i</Text>=instances  <Text color="cyan">c</Text>=clusters  <Text color="cyan">h</Text>=this help</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press h, Esc, or q to close</Text>
      </Box>
    </Box>
  );
}
