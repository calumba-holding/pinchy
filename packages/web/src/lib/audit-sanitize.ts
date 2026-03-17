const REDACTED = "[REDACTED]";
const MAX_DEPTH = 10;

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "secret",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "credential",
  "private_key",
  "privatekey",
  "passphrase",
  "access_key",
  "accesskey",
  "client_secret",
  "clientsecret",
];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => lower.includes(pattern));
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(key) && val !== null && val !== undefined) {
        result[key] = REDACTED;
      } else {
        result[key] = sanitizeValue(val, depth + 1);
      }
    }
    return result;
  }

  return value;
}

export function sanitizeDetail<T>(detail: T): T {
  if (detail === null || detail === undefined) return detail;
  return sanitizeValue(detail, 0) as T;
}
