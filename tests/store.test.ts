import { describe, it, expect, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import {
  saveCertificateRecord,
  getCertificateRecord,
  listCertificateRecords,
  updateCertificateStatus,
  saveUserProfileToLocal,
  getUserProfileFromLocal,
} from "../lib/db/certificateStore";
import { CertificateRecord } from "../lib/types/certificate";

describe("Certificate Database Store", () => {
  const dataDir = path.join(process.cwd(), "data");
  const certsFile = path.join(dataDir, "certificates.json");
  const usersFile = path.join(dataDir, "users.json");
  const testCertId = "MC-TEST-STORE-001";

  afterAll(() => {
    // Clean up test records
    if (fs.existsSync(certsFile)) {
      try {
        const certs = JSON.parse(fs.readFileSync(certsFile, "utf8"));
        delete certs[testCertId];
        fs.writeFileSync(certsFile, JSON.stringify(certs, null, 2), "utf8");
      } catch {}
    }
    if (fs.existsSync(usersFile)) {
      try {
        const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
        delete users["user-test-456"];
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf8");
      } catch {}
    }
  });

  const sampleRecord: CertificateRecord = {
    certificateId: testCertId,
    studentName: "Ada Lovelace",
    studentIdRef: "STU-1843-001",
    course: "Computer Science",
    award: "Bachelor of Science",
    issueDate: "2026-10-14",
    pdfHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    issuerUid: "test-issuer-123",
    institutionId: "institution-main",
    institutionName: "University of Science",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("stores and retrieves a certificate record", async () => {
    const saveResult = await saveCertificateRecord(sampleRecord);
    expect(saveResult.success).toBe(true);
    expect(saveResult.savedToLocal).toBe(true);

    const retrieved = await getCertificateRecord(testCertId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.certificateId).toBe(testCertId);
    expect(retrieved?.studentName).toBe("Ada Lovelace");
  });

  it("lists certificate records with filtering", async () => {
    const list = await listCertificateRecords("institution-main", "Ada");
    expect(list.certificates.some((c) => c.certificateId === testCertId)).toBe(true);

    const filteredOut = await listCertificateRecords("institution-main", "NonExistentStudentName");
    expect(filteredOut.certificates.some((c) => c.certificateId === testCertId)).toBe(false);
  });

  it("updates certificate status to REVOKED", async () => {
    const updateRes = await updateCertificateStatus(testCertId, {
      status: "REVOKED",
      revocationReason: "Administrative Test Revocation",
      revokedAt: new Date().toISOString(),
    });

    expect(updateRes.success).toBe(true);

    const retrieved = await getCertificateRecord(testCertId);
    expect(retrieved?.status).toBe("REVOKED");
    expect(retrieved?.revocationReason).toBe("Administrative Test Revocation");
  });

  it("stores and retrieves local user profile", () => {
    const testProfile = {
      uid: "user-test-456",
      email: "test@university.edu",
      role: "university_admin",
      institutionId: "institution-main",
    };

    saveUserProfileToLocal(testProfile);
    const loaded = getUserProfileFromLocal("user-test-456");
    expect(loaded).not.toBeNull();
    expect(loaded.email).toBe("test@university.edu");
    expect(loaded.role).toBe("university_admin");
  });
});
