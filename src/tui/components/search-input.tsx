import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({
  value,
  onChange,
}: SearchInputProps): React.ReactElement {
  return (
    <Box>
      <Text bold color="yellow">/</Text>
      <Text> </Text>
      <TextInput value={value} onChange={onChange} placeholder="type to filter by name..." />
    </Box>
  );
}
