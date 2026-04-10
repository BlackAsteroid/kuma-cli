import { error, isJsonMode, jsonError } from "./output.js";

/**
 * Exit codes and structured error identifiers as per Issue #12.
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  API_ERROR: 1,
  AUTH_REQUIRED: 2,
  AUTH_EXPIRED: 2,
  CONNECT_FAILED: 3,
  TIMEOUT: 3,
  VALIDATION: 4,
  NOT_FOUND: 5,
} as const;

export type ErrorCodeKey = keyof typeof EXIT_CODES;

/**
 * Determine a meaningful exit code and structured string from an error object.
 * Looks at the message for known patterns; defaults to API_ERROR (1).
 */
function errorDetailsFor(err: unknown): { code: number; stringCode: ErrorCodeKey } {
  if (!(err instanceof Error)) return { code: EXIT_CODES.API_ERROR, stringCode: "API_ERROR" };
  const msg = err.message.toLowerCase();

  if (msg.includes("timeout")) {
    return { code: EXIT_CODES.TIMEOUT, stringCode: "TIMEOUT" };
  }
  if (msg.includes("connection") || msg.includes("refused") || msg.includes("econnrefused")) {
    return { code: EXIT_CODES.CONNECT_FAILED, stringCode: "CONNECT_FAILED" };
  }
  if (msg.includes("not found") || msg.includes("not exist") || msg.includes("404")) {
    return { code: EXIT_CODES.NOT_FOUND, stringCode: "NOT_FOUND" };
  }
  if (msg.includes("validation") || msg.includes("invalid") || msg.includes("required")) {
    return { code: EXIT_CODES.VALIDATION, stringCode: "VALIDATION" };
  }
  if (msg.includes("expired")) {
    return { code: EXIT_CODES.AUTH_EXPIRED, stringCode: "AUTH_EXPIRED" };
  }
  if (msg.includes("auth") || msg.includes("login") || msg.includes("session")) {
    return { code: EXIT_CODES.AUTH_REQUIRED, stringCode: "AUTH_REQUIRED" };
  }

  return { code: EXIT_CODES.API_ERROR, stringCode: "API_ERROR" };
}

/**
 * Central error handler. When JSON mode is active, outputs structured JSON to
 * stdout (so pipes work). Otherwise prints a human-readable message to stderr.
 */
export function handleError(err: unknown, opts?: { json?: boolean }): never {
  const message = err instanceof Error ? err.message : String(err);
  const { code, stringCode } = errorDetailsFor(err);

  if (isJsonMode(opts)) {
    console.log(JSON.stringify({
      ok: false,
      error: message,
      code: stringCode,
      exitCode: code
    }, null, 2));
    process.exit(code);
  }

  error(message);
  process.exit(code);
}

export function requireAuth(opts?: { json?: boolean }): never {
  const message = "Not authenticated. Run: kuma login <url>";
  if (isJsonMode(opts)) {
    console.log(JSON.stringify({
      ok: false,
      error: message,
      code: "AUTH_REQUIRED",
      exitCode: EXIT_CODES.AUTH_REQUIRED
    }, null, 2));
    process.exit(EXIT_CODES.AUTH_REQUIRED);
  }
  error(message);
  process.exit(EXIT_CODES.AUTH_REQUIRED);
}
