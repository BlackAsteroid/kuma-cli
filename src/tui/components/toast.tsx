import React from "react";
import { Box, Text } from "ink";

export interface ToastProps {
  message: string;
  color?: string;
}

export function Toast({
  message,
  color = "green",
}: ToastProps): React.ReactElement {
  return (
    <Box marginTop={1}>
      <Text color={color as any} bold>
        {message}
      </Text>
    </Box>
  );
}
