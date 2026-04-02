import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

export interface LoginScreenProps {
  onLogin: (url: string, username: string, password: string) => void;
  error: string | null;
  loading: boolean;
}

type Field = "url" | "username" | "password";

const FIELDS: Field[] = ["url", "username", "password"];

export function LoginScreen({
  onLogin,
  error,
  loading,
}: LoginScreenProps): React.ReactElement {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeField, setActiveField] = useState<Field>("url");

  useInput((_input, key) => {
    if (loading) return;

    if (key.return) {
      const idx = FIELDS.indexOf(activeField);
      if (idx < FIELDS.length - 1) {
        // Move to next field
        setActiveField(FIELDS[idx + 1]);
      } else {
        // Submit
        if (url && username && password) {
          onLogin(url.replace(/\/$/, ""), username, password);
        }
      }
      return;
    }

    // Tab to move between fields
    if (key.tab) {
      const idx = FIELDS.indexOf(activeField);
      setActiveField(FIELDS[(idx + 1) % FIELDS.length]);
      return;
    }
  });

  const maskedPassword = "*".repeat(password.length);

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
      <Box marginTop={1} marginBottom={1} flexDirection="column">
        <Text dimColor>No instances configured. Log in to get started.</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Box width={12}>
            <Text bold color={activeField === "url" ? "cyan" : undefined}>URL:</Text>
          </Box>
          {activeField === "url" ? (
            <TextInput
              value={url}
              onChange={setUrl}
              placeholder="https://kuma.example.com"
            />
          ) : (
            <Text>{url || <Text dimColor>https://kuma.example.com</Text>}</Text>
          )}
        </Box>

        <Box>
          <Box width={12}>
            <Text bold color={activeField === "username" ? "cyan" : undefined}>Username:</Text>
          </Box>
          {activeField === "username" ? (
            <TextInput
              value={username}
              onChange={setUsername}
              placeholder="admin"
            />
          ) : (
            <Text>{username || <Text dimColor>admin</Text>}</Text>
          )}
        </Box>

        <Box>
          <Box width={12}>
            <Text bold color={activeField === "password" ? "cyan" : undefined}>Password:</Text>
          </Box>
          {activeField === "password" ? (
            <TextInput
              value={password}
              onChange={setPassword}
              placeholder="********"
              mask="*"
            />
          ) : (
            <Text>{maskedPassword || <Text dimColor>********</Text>}</Text>
          )}
        </Box>
      </Box>

      {!url.startsWith("https://") && url.length > 0 && (
        <Box marginBottom={1}>
          <Text color="yellow">Warning: connecting over HTTP. Credentials will be sent in cleartext.</Text>
        </Box>
      )}

      {error && (
        <Box marginBottom={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      {loading ? (
        <Text color="yellow">Connecting...</Text>
      ) : (
        <Text dimColor>Enter=next field/submit  Tab=switch field  Fill all fields to connect</Text>
      )}
    </Box>
  );
}
