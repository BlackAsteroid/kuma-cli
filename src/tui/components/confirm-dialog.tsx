import React from "react";
import { Box, Text, useInput } from "ink";

export interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactElement {
  useInput((input, key) => {
    if (input === "y" || input === "Y") {
      onConfirm();
      return;
    }
    if (input === "n" || input === "N" || key.escape) {
      onCancel();
      return;
    }
  });

  return (
    <Box marginTop={1} flexDirection="column">
      <Box>
        <Text color="yellow" bold>
          {message}
        </Text>
      </Box>
      <Box>
        <Text dimColor>Press </Text>
        <Text color="green" bold>y</Text>
        <Text dimColor> to confirm, </Text>
        <Text color="red" bold>n</Text>
        <Text dimColor> or Esc to cancel</Text>
      </Box>
    </Box>
  );
}
