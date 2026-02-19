import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  const existsSyncMock = vi.fn(() => false);
  const readFileSyncMock = vi.fn();
  const writeFileSyncMock = vi.fn();
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: existsSyncMock,
      readFileSync: readFileSyncMock,
      writeFileSync: writeFileSyncMock,
    },
    existsSync: existsSyncMock,
    readFileSync: readFileSyncMock,
    writeFileSync: writeFileSyncMock,
  };
});

import { existsSync, readFileSync, writeFileSync } from "fs";

const mockedExistsSync = vi.mocked(existsSync);
const mockedReadFileSync = vi.mocked(readFileSync);
const mockedWriteFileSync = vi.mocked(writeFileSync);

describe("encryption", () => {
  const TEST_KEY = "a".repeat(64); // 32 bytes in hex

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("ENCRYPTION_KEY", TEST_KEY);
    mockedExistsSync.mockReturnValue(false);
    mockedReadFileSync.mockReset();
    mockedWriteFileSync.mockReset();
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

  it("should throw on ciphertext with empty parts", async () => {
    const { decrypt } = await import("@/lib/encryption");
    expect(() => decrypt("abc::def")).toThrow("Invalid ciphertext format");
    expect(() => decrypt(":abc:def")).toThrow("Invalid ciphertext format");
    expect(() => decrypt("abc:def:")).toThrow("Invalid ciphertext format");
  });

  it("should throw if ENCRYPTION_KEY is not set and no key file exists", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("ENCRYPTION_KEY", "");

    const mod = await import("@/lib/encryption");
    expect(() => mod.getEncryptionKey()).toThrow("ENCRYPTION_KEY");
  });

  it("should reject ENCRYPTION_KEY with non-hex characters", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("ENCRYPTION_KEY", "g".repeat(64)); // 'g' is not hex

    const mod = await import("@/lib/encryption");
    expect(() => mod.getEncryptionKey()).toThrow("ENCRYPTION_KEY");
  });

  describe("key file fallback", () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
      vi.stubEnv("ENCRYPTION_KEY", "");
    });

    it("should read key from existing file when ENCRYPTION_KEY is not set", async () => {
      const validFileKey = "b".repeat(64);
      mockedExistsSync.mockImplementation((path) => {
        return String(path).endsWith(".encryption_key");
      });
      mockedReadFileSync.mockReturnValue(validFileKey);

      const mod = await import("@/lib/encryption");
      const key = mod.getEncryptionKey();
      expect(key).toEqual(Buffer.from(validFileKey, "hex"));
      expect(mockedReadFileSync).toHaveBeenCalled();
    });

    it("should throw on invalid hex in key file", async () => {
      mockedExistsSync.mockImplementation((path) => {
        return String(path).endsWith(".encryption_key");
      });
      mockedReadFileSync.mockReturnValue("not-hex-at-all!");

      const mod = await import("@/lib/encryption");
      expect(() => mod.getEncryptionKey()).toThrow("expected 64 hex characters");
    });

    it("should auto-generate key when directory exists but no file is present", async () => {
      mockedExistsSync.mockImplementation((path) => {
        // Key file does not exist, but directory does
        return !String(path).endsWith(".encryption_key");
      });

      const mod = await import("@/lib/encryption");
      const key = mod.getEncryptionKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 256-bit key
      expect(mockedWriteFileSync).toHaveBeenCalledOnce();
    });

    it("should write auto-generated key file with mode 0o600", async () => {
      mockedExistsSync.mockImplementation((path) => {
        return !String(path).endsWith(".encryption_key");
      });

      const mod = await import("@/lib/encryption");
      mod.getEncryptionKey();

      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".encryption_key"),
        expect.stringMatching(/^[0-9a-f]{64}$/),
        { mode: 0o600 }
      );
    });
  });
});
