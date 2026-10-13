import crypto from "crypto";

/**
 * Calculates SHA-256 hash of exact bytes using Node.js crypto module (server-side).
 * @param buffer Uint8Array or Buffer of file bytes
 * @returns 0x-prefixed 64-character hex string (32 bytes)
 */
export function calculateSha256Server(buffer: Buffer | Uint8Array): `0x${string}` {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  return `0x${hash}` as `0x${string}`;
}

/**
 * Calculates SHA-256 hash in browser using Web Crypto API.
 * @param file File or ArrayBuffer
 * @returns 0x-prefixed 64-character hex string (32 bytes)
 */
export async function calculateSha256Browser(fileOrBuffer: File | ArrayBuffer): Promise<`0x${string}`> {
  let arrayBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex}` as `0x${string}`;
}

/**
 * Compares two 32-byte hashes (case-insensitive, strips 0x prefixes).
 */
export function areHashesEqual(hashA: string, hashB: string): boolean {
  if (!hashA || !hashB) return false;
  const cleanA = hashA.toLowerCase().replace(/^0x/, "");
  const cleanB = hashB.toLowerCase().replace(/^0x/, "");
  return cleanA === cleanB;
}
