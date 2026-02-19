import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("encryption", () => {
  const TEST_KEY = "a".repeat(64); // 32 bytes in hex

  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should encrypt and decrypt a value roundtrip", async () => {
    const { encrypt, decrypt } = await import("@/lib/encryption");
    const plaintext = "sk-ant-api03-secret-key";

    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toContain(":"); // format: iv:authTag:ciphertext

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertext for same plaintext", async () => {
    const { encrypt } = await import("@/lib/encryption");
    const plaintext = "sk-ant-api03-secret-key";

    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should throw on invalid ciphertext", async () => {
    const { decrypt } = await import("@/lib/encryption");
    expect(() => decrypt("not-valid-ciphertext")).toThrow();
  });

  it("should throw if ENCRYPTION_KEY is not set and no key file exists", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("ENCRYPTION_KEY", "");

    // Re-import to pick up new env
    vi.resetModules();
    const mod = await import("@/lib/encryption");
    expect(() => mod.getEncryptionKey()).toThrow("ENCRYPTION_KEY");
  });
});
