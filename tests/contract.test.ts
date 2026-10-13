import { describe, it, expect } from "vitest";
import { encodeFunctionData, decodeFunctionResult } from "viem";
import contractArtifact from "../lib/blockchain/MemoCheckCertificates.json";
import { MEMOCHECK_ABI } from "../lib/blockchain/contract";

describe("Smart Contract ABI & Specification Invariants", () => {
  it("compiled artifact contains valid bytecode and ABI", () => {
    expect(contractArtifact.contractName).toBe("MemoCheckCertificates");
    expect(contractArtifact.abi).toBeDefined();
    expect(Array.isArray(contractArtifact.abi)).toBe(true);
    expect(contractArtifact.bytecode).toBeDefined();
    expect(contractArtifact.bytecode.startsWith("0x")).toBe(true);
    expect(contractArtifact.bytecode.length).toBeGreaterThan(100);
  });

  it("ABI contains all required methods from specification", () => {
    const functionNames = MEMOCHECK_ABI.filter((item) => item.type === "function").map(
      (item) => (item as any).name
    );

    expect(functionNames).toContain("issueCertificate");
    expect(functionNames).toContain("revokeCertificate");
    expect(functionNames).toContain("getCertificate");
    expect(functionNames).toContain("verifyCertificate");
    expect(functionNames).toContain("authorizedIssuers");
    expect(functionNames).toContain("totalIssued");
    expect(functionNames).toContain("totalRevoked");
  });

  it("encodes issueCertificate function call with valid types", () => {
    const encoded = encodeFunctionData({
      abi: MEMOCHECK_ABI,
      functionName: "issueCertificate",
      args: [
        "MC-2026-TEST01",
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "QmTestCid123",
      ],
    });

    expect(encoded).toBeDefined();
    expect(encoded.startsWith("0x")).toBe(true);
  });

  it("encodes revokeCertificate function call with valid types", () => {
    const encoded = encodeFunctionData({
      abi: MEMOCHECK_ABI,
      functionName: "revokeCertificate",
      args: ["MC-2026-TEST01", "Administrative error during student grading"],
    });

    expect(encoded).toBeDefined();
    expect(encoded.startsWith("0x")).toBe(true);
  });

  /**
   * Smart contract specification test simulating the state machine invariants
   * required in Section 9 of the Implementation Spec.
   */
  describe("Specification State Machine Invariants (Section 9)", () => {
    interface CertificateRecord {
      pdfHash: `0x${string}`;
      issuer: `0x${string}`;
      issuedAt: number;
      revoked: boolean;
      revokedAt: number;
      ipfsCid: string;
    }

    class MemoCheckContractSimulator {
      owner: `0x${string}`;
      authorizedIssuers: Map<`0x${string}`, boolean> = new Map();
      certificates: Map<string, CertificateRecord> = new Map();
      totalIssued: number = 0;
      totalRevoked: number = 0;

      constructor(ownerAddress: `0x${string}`) {
        this.owner = ownerAddress.toLowerCase() as `0x${string}`;
        this.authorizedIssuers.set(this.owner, true);
      }

      setAuthorizedIssuer(caller: `0x${string}`, issuer: `0x${string}`, authorized: boolean) {
        if (caller.toLowerCase() !== this.owner) {
          throw new Error("MemoCheck: caller is not the owner");
        }
        this.authorizedIssuers.set(issuer.toLowerCase() as `0x${string}`, authorized);
      }

      issueCertificate(
        caller: `0x${string}`,
        certificateId: string,
        pdfHash: `0x${string}`,
        ipfsCid: string
      ) {
        const isAuth =
          caller.toLowerCase() === this.owner ||
          this.authorizedIssuers.get(caller.toLowerCase() as `0x${string}`);
        if (!isAuth) {
          throw new Error("MemoCheck: caller is not an authorized issuer");
        }
        if (!certificateId || certificateId.length > 128) {
          throw new Error("MemoCheck: invalid certificate ID length");
        }
        if (pdfHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
          throw new Error("MemoCheck: hash cannot be zero");
        }
        if (this.certificates.has(certificateId)) {
          throw new Error("MemoCheck: duplicate certificate ID");
        }

        const now = Math.floor(Date.now() / 1000);
        this.certificates.set(certificateId, {
          pdfHash,
          issuer: caller,
          issuedAt: now,
          revoked: false,
          revokedAt: 0,
          ipfsCid,
        });
        this.totalIssued += 1;
      }

      revokeCertificate(caller: `0x${string}`, certificateId: string, reason: string) {
        const isAuth =
          caller.toLowerCase() === this.owner ||
          this.authorizedIssuers.get(caller.toLowerCase() as `0x${string}`);
        if (!isAuth) {
          throw new Error("MemoCheck: caller is not an authorized issuer");
        }

        const cert = this.certificates.get(certificateId);
        if (!cert) {
          throw new Error("MemoCheck: certificate does not exist");
        }
        if (cert.revoked) {
          throw new Error("MemoCheck: certificate already revoked");
        }

        cert.revoked = true;
        cert.revokedAt = Math.floor(Date.now() / 1000);
        this.totalRevoked += 1;
      }

      getCertificate(certificateId: string) {
        const cert = this.certificates.get(certificateId);
        if (!cert) {
          return { exists: false, pdfHash: "0x0", issuer: "0x0", issuedAt: 0, revoked: false, revokedAt: 0, ipfsCid: "" };
        }
        return { exists: true, ...cert };
      }

      verifyCertificate(certificateId: string, suppliedHash: `0x${string}`) {
        const cert = this.certificates.get(certificateId);
        if (!cert) {
          return { exists: false, hashMatches: false, isRevoked: false, issuedAt: 0, issuer: "0x0" };
        }
        const matches = suppliedHash.toLowerCase() === cert.pdfHash.toLowerCase();
        return {
          exists: true,
          hashMatches: matches,
          isRevoked: cert.revoked,
          issuedAt: cert.issuedAt,
          issuer: cert.issuer,
        };
      }
    }

    const OWNER: `0x${string}` = "0x1111111111111111111111111111111111111111";
    const ISSUER: `0x${string}` = "0x2222222222222222222222222222222222222222";
    const UNAUTHORIZED: `0x${string}` = "0x9999999999999999999999999999999999999999";
    const DUMMY_HASH: `0x${string}` = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

    it("1. Successful issuance by an authorized issuer", () => {
      const contract = new MemoCheckContractSimulator(OWNER);
      contract.setAuthorizedIssuer(OWNER, ISSUER, true);

      expect(contract.totalIssued).toBe(0);
      contract.issueCertificate(ISSUER, "MC-2026-CERT01", DUMMY_HASH, "QmTest");

      expect(contract.totalIssued).toBe(1);
      const record = contract.getCertificate("MC-2026-CERT01");
      expect(record.exists).toBe(true);
      expect(record.pdfHash).toBe(DUMMY_HASH);
      expect(record.issuer).toBe(ISSUER);
      expect(record.revoked).toBe(false);
    });

    it("2. Rejection of unauthorized issuance", () => {
      const contract = new MemoCheckContractSimulator(OWNER);

      expect(() => {
        contract.issueCertificate(UNAUTHORIZED, "MC-2026-HACK01", DUMMY_HASH, "");
      }).toThrow("MemoCheck: caller is not an authorized issuer");

      expect(contract.totalIssued).toBe(0);
    });

    it("3. Duplicate ID rejection", () => {
      const contract = new MemoCheckContractSimulator(OWNER);
      contract.issueCertificate(OWNER, "MC-2026-UNIQUE", DUMMY_HASH, "");

      expect(() => {
        contract.issueCertificate(OWNER, "MC-2026-UNIQUE", DUMMY_HASH, "");
      }).toThrow("MemoCheck: duplicate certificate ID");

      expect(contract.totalIssued).toBe(1);
    });

    it("4. Successful revocation by an authorized account", () => {
      const contract = new MemoCheckContractSimulator(OWNER);
      contract.setAuthorizedIssuer(OWNER, ISSUER, true);
      contract.issueCertificate(ISSUER, "MC-2026-REVOKE_ME", DUMMY_HASH, "");

      expect(contract.totalRevoked).toBe(0);
      contract.revokeCertificate(ISSUER, "MC-2026-REVOKE_ME", "Official cancellation");

      expect(contract.totalRevoked).toBe(1);
      const record = contract.getCertificate("MC-2026-REVOKE_ME");
      expect(record.revoked).toBe(true);
      expect(record.revokedAt).toBeGreaterThan(0);
    });

    it("5. Rejection of unauthorized revocation", () => {
      const contract = new MemoCheckContractSimulator(OWNER);
      contract.issueCertificate(OWNER, "MC-2026-TARGET", DUMMY_HASH, "");

      expect(() => {
        contract.revokeCertificate(UNAUTHORIZED, "MC-2026-TARGET", "Malicious revocation attempt");
      }).toThrow("MemoCheck: caller is not an authorized issuer");

      const record = contract.getCertificate("MC-2026-TARGET");
      expect(record.revoked).toBe(false);
    });

    it("6. Revoked status returned during verification", () => {
      const contract = new MemoCheckContractSimulator(OWNER);
      contract.issueCertificate(OWNER, "MC-2026-STATUS_TEST", DUMMY_HASH, "");

      // Verify active
      const beforeRevoke = contract.verifyCertificate("MC-2026-STATUS_TEST", DUMMY_HASH);
      expect(beforeRevoke.exists).toBe(true);
      expect(beforeRevoke.hashMatches).toBe(true);
      expect(beforeRevoke.isRevoked).toBe(false);

      // Revoke
      contract.revokeCertificate(OWNER, "MC-2026-STATUS_TEST", "Test revocation");

      // Verify revoked
      const afterRevoke = contract.verifyCertificate("MC-2026-STATUS_TEST", DUMMY_HASH);
      expect(afterRevoke.exists).toBe(true);
      expect(afterRevoke.hashMatches).toBe(true);
      expect(afterRevoke.isRevoked).toBe(true);
    });
  });
});
