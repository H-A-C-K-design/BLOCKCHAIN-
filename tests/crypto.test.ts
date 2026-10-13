import { describe, it, expect } from "vitest";
import { calculateSha256Server, areHashesEqual } from "../lib/crypto/sha256";

describe("Cryptographic SHA-256 File Hashing", () => {
  it("calculates exact SHA-256 hash for given bytes", () => {
    const content = Buffer.from("MEMOCHECK Academic Certificate 2026 Test Content");
    const hash = calculateSha256Server(content);

    expect(hash).toHaveLength(66);
    expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("produces deterministic output for identical input bytes", () => {
    const bytesA = Buffer.from("Student: Alex Chen, Degree: B.Sc. Computer Science");
    const bytesB = Buffer.from("Student: Alex Chen, Degree: B.Sc. Computer Science");

    const hashA = calculateSha256Server(bytesA);
    const hashB = calculateSha256Server(bytesB);

    expect(hashA).toBe(hashB);
    expect(areHashesEqual(hashA, hashB)).toBe(true);
  });

  it("produces completely different hashes for single byte changes", () => {
    const original = Buffer.from("%PDF-1.4 Grade A");
    const tampered = Buffer.from("%PDF-1.4 Grade B");

    const hashOriginal = calculateSha256Server(original);
    const hashTampered = calculateSha256Server(tampered);

    expect(hashOriginal).not.toBe(hashTampered);
    expect(areHashesEqual(hashOriginal, hashTampered)).toBe(false);
  });

  it("handles case-insensitive comparison and 0x prefix", () => {
    const sampleHex = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const upperHex = sampleHex.toUpperCase();
    const prefixedHex = `0x${sampleHex}`;

    expect(areHashesEqual(sampleHex, upperHex)).toBe(true);
    expect(areHashesEqual(sampleHex, prefixedHex)).toBe(true);
    expect(areHashesEqual(prefixedHex, upperHex)).toBe(true);
  });

  it("correctly identifies mismatched hashes", () => {
    const hash1 = "1111111111111111111111111111111111111111111111111111111111111111";
    const hash2 = "2222222222222222222222222222222222222222222222222222222222222222";

    expect(areHashesEqual(hash1, hash2)).toBe(false);
  });
});
