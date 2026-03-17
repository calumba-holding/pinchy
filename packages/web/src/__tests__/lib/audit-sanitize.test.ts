import { describe, expect, it } from "vitest";
import { sanitizeDetail } from "@/lib/audit-sanitize";

describe("sanitizeDetail", () => {
  describe("key-name redaction", () => {
    it("redacts values for known sensitive key names", () => {
      const input = {
        password: "my-secret-pass",
        apiKey: "sk-abc123",
        token: "tok-xyz",
        normal: "visible",
      };

      const result = sanitizeDetail(input);

      expect(result).toEqual({
        password: "[REDACTED]",
        apiKey: "[REDACTED]",
        token: "[REDACTED]",
        normal: "visible",
      });
    });

    it("matches key names case-insensitively", () => {
      const input = { PASSWORD: "secret", ApiKey: "key123" };
      const result = sanitizeDetail(input);
      expect(result).toEqual({
        PASSWORD: "[REDACTED]",
        ApiKey: "[REDACTED]",
      });
    });

    it("matches key names as substrings", () => {
      const input = {
        myApiKey: "key123",
        db_password_hash: "hash",
        x_authorization_header: "Bearer xyz",
      };
      const result = sanitizeDetail(input);
      expect(result).toEqual({
        myApiKey: "[REDACTED]",
        db_password_hash: "[REDACTED]",
        x_authorization_header: "[REDACTED]",
      });
    });

    it("redacts all known sensitive key names", () => {
      const keys = [
        "password",
        "secret",
        "token",
        "apiKey",
        "api_key",
        "authorization",
        "credential",
        "private_key",
        "privateKey",
        "passphrase",
        "access_key",
        "accessKey",
        "client_secret",
        "clientSecret",
      ];

      for (const key of keys) {
        const input = { [key]: "sensitive-value" };
        const result = sanitizeDetail(input);
        expect(result[key]).toBe("[REDACTED]");
      }
    });

    it("redacts nested objects recursively", () => {
      const input = {
        toolName: "browser",
        params: {
          headers: { authorization: "Bearer secret-token" },
          url: "https://example.com",
        },
      };

      const result = sanitizeDetail(input) as any;

      expect(result.toolName).toBe("browser");
      expect(result.params.headers.authorization).toBe("[REDACTED]");
      expect(result.params.url).toBe("https://example.com");
    });

    it("redacts values inside arrays", () => {
      const input = {
        items: [
          { name: "safe", token: "secret123" },
          { name: "also-safe", password: "pass" },
        ],
      };

      const result = sanitizeDetail(input) as any;

      expect(result.items[0].token).toBe("[REDACTED]");
      expect(result.items[1].password).toBe("[REDACTED]");
      expect(result.items[0].name).toBe("safe");
    });

    it("does not mutate the original object", () => {
      const input = { password: "secret", nested: { token: "tok" } };
      const original = JSON.parse(JSON.stringify(input));

      sanitizeDetail(input);

      expect(input).toEqual(original);
    });

    it("handles null and undefined gracefully", () => {
      expect(sanitizeDetail(null as any)).toBeNull();
      expect(sanitizeDetail(undefined as any)).toBeUndefined();
    });

    it("passes through non-string primitives unchanged", () => {
      const input = { count: 42, active: true, password: "secret" };
      const result = sanitizeDetail(input);
      expect(result).toEqual({ count: 42, active: true, password: "[REDACTED]" });
    });

    it("stops recursion at max depth", () => {
      // Build a 12-level deep object: depth 0 is outermost, password lives at depth 12
      let obj: any = { password: "deep-secret" };
      for (let i = 0; i < 12; i++) {
        obj = { nested: obj };
      }

      const result = sanitizeDetail(obj) as any;

      // Should not throw. The password key at depth 12 is beyond the limit
      // of 10, so it must NOT be redacted.
      let level = result;
      for (let i = 0; i < 12; i++) {
        level = level.nested;
      }
      expect(level.password).toBe("deep-secret");
    });
  });
});
