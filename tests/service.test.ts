import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCertificateId, verifyCertificateWorkflow } from "../lib/certificates/service";
import * as contractModule from "../lib/blockchain/contract";
import * as clientModule from "../lib/blockchain/client";
import * as adminModule from "../lib/firebase/admin";

describe("Certificate Service & Verification Decision Tree", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateCertificateId", () => {
    it("generates institutional ID with year and alphanumeric entropy", () => {
      const year = new Date().getFullYear();
      const id = generateCertificateId();

      expect(id).toMatch(new RegExp(`^MC-${year}-[A-Z0-9]+$`));
    });

    it("generates distinct unique IDs on subsequent invocations", () => {
      const id1 = generateCertificateId();
      const id2 = generateCertificateId();

      expect(id1).not.toBe(id2);
    });
  });

  describe("verifyCertificateWorkflow status mapping", () => {
    it("returns UNABLE_TO_VERIFY when system services are completely unconfigured", async () => {
      vi.spyOn(clientModule, "isBlockchainConfigured").mockReturnValue(false);
      vi.spyOn(adminModule, "isFirebaseAdminConfigured").mockReturnValue(false);

      const result = await verifyCertificateWorkflow("MC-2026-TEST01", null);

      expect(result.status).toBe("UNABLE_TO_VERIFY");
      expect(result.recordFound).toBe(false);
      expect(result.message).toContain("dependencies are not configured");
    });

    it("returns INVALID when record is not found on chain or database", async () => {
      vi.spyOn(clientModule, "isBlockchainConfigured").mockReturnValue(true);
      vi.spyOn(contractModule, "readOnChainCertificate").mockResolvedValue({
        record: null,
        error: null,
      });

      const result = await verifyCertificateWorkflow("MC-2026-NONEXISTENT", null);

      expect(result.status).toBe("INVALID");
      expect(result.recordFound).toBe(false);
      expect(result.message).toContain("No certificate record found");
    });

    it("returns REVOKED when on-chain record is marked revoked", async () => {
      vi.spyOn(clientModule, "isBlockchainConfigured").mockReturnValue(true);
      vi.spyOn(contractModule, "readOnChainCertificate").mockResolvedValue({
        record: {
          exists: true,
          pdfHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          issuer: "0x1111111111111111111111111111111111111111",
          issuedAt: 1700000000,
          revoked: true,
          revokedAt: 1705000000,
          ipfsCid: "QmTest123",
        },
        error: null,
      });

      const result = await verifyCertificateWorkflow("MC-2026-REVOKED", null);

      expect(result.status).toBe("REVOKED");
      expect(result.recordFound).toBe(true);
      expect(result.revocationDetails?.isRevoked).toBe(true);
    });

    it("returns INVALID when uploaded PDF hash mismatches on-chain hash", async () => {
      const originalPdfBytes = Buffer.from("%PDF-1.4 Official Certificate Content");
      const tamperedPdfBytes = Buffer.from("%PDF-1.4 Tampered Content Modified");

      vi.spyOn(clientModule, "isBlockchainConfigured").mockReturnValue(true);
      vi.spyOn(contractModule, "readOnChainCertificate").mockResolvedValue({
        record: {
          exists: true,
          pdfHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          issuer: "0x1111111111111111111111111111111111111111",
          issuedAt: 1700000000,
          revoked: false,
          revokedAt: 0,
          ipfsCid: "QmTest123",
        },
        error: null,
      });

      const result = await verifyCertificateWorkflow("MC-2026-VALID-RECORD", tamperedPdfBytes);

      expect(result.status).toBe("INVALID");
      expect(result.pdfHashMatch).toBe(false);
      expect(result.message).toContain("does not match");
    });

    it("returns VALID when on-chain record exists and uploaded PDF hash matches", async () => {
      const pdfBytes = Buffer.from("%PDF-1.4 Real Certificate Bytes");
      // Calculate real hash of bytes
      const { calculateSha256Server } = await import("../lib/crypto/sha256");
      const realHash = calculateSha256Server(pdfBytes);

      vi.spyOn(clientModule, "isBlockchainConfigured").mockReturnValue(true);
      vi.spyOn(contractModule, "readOnChainCertificate").mockResolvedValue({
        record: {
          exists: true,
          pdfHash: realHash,
          issuer: "0x1111111111111111111111111111111111111111",
          issuedAt: 1700000000,
          revoked: false,
          revokedAt: 0,
          ipfsCid: "QmTest123",
        },
        error: null,
      });

      const result = await verifyCertificateWorkflow("MC-2026-VALID-MATCH", pdfBytes);

      expect(result.status).toBe("VALID");
      expect(result.pdfHashMatch).toBe(true);
      expect(result.pdfUploaded).toBe(true);
    });

    it("returns VALID when on-chain record exists even without PDF uploaded", async () => {
      vi.spyOn(clientModule, "isBlockchainConfigured").mockReturnValue(true);
      vi.spyOn(contractModule, "readOnChainCertificate").mockResolvedValue({
        record: {
          exists: true,
          pdfHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          issuer: "0x1111111111111111111111111111111111111111",
          issuedAt: 1700000000,
          revoked: false,
          revokedAt: 0,
          ipfsCid: "QmTest123",
        },
        error: null,
      });

      const result = await verifyCertificateWorkflow("MC-2026-RECORD-ONLY", null);

      expect(result.status).toBe("VALID");
      expect(result.pdfUploaded).toBe(false);
      expect(result.message).toContain("Certificate record confirmed on the blockchain");
    });
  });
});
