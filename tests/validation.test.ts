import { describe, it, expect } from "vitest";
import {
  IssueCertificateSchema,
  RevokeCertificateSchema,
  VerifyParamsSchema,
} from "../lib/validation/certificate";

describe("Input Validation & Schemas", () => {
  describe("IssueCertificateSchema", () => {
    it("accepts valid issuance input", () => {
      const validData = {
        studentName: "Elena Rostova",
        studentIdRef: "STU-2024-9912",
        course: "Software Engineering",
        award: "Master of Science",
        issueDate: "2024-06-15",
        expiryDate: "2029-06-15",
        privacyConfirmation: true,
      };

      const result = IssueCertificateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects empty student name", () => {
      const invalidData = {
        studentName: " ",
        studentIdRef: "STU-2024-9912",
        course: "Software Engineering",
        award: "Master of Science",
        issueDate: "2024-06-15",
        privacyConfirmation: true,
      };

      const result = IssueCertificateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects invalid date format", () => {
      const invalidData = {
        studentName: "Elena Rostova",
        studentIdRef: "STU-2024-9912",
        course: "Software Engineering",
        award: "Master of Science",
        issueDate: "15-06-2024", // Not YYYY-MM-DD
        privacyConfirmation: true,
      };

      const result = IssueCertificateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects when privacy confirmation is false", () => {
      const invalidData = {
        studentName: "Elena Rostova",
        studentIdRef: "STU-2024-9912",
        course: "Software Engineering",
        award: "Master of Science",
        issueDate: "2024-06-15",
        privacyConfirmation: false,
      };

      const result = IssueCertificateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("RevokeCertificateSchema", () => {
    it("accepts valid revocation reason", () => {
      const validData = { reason: "Credential issued under incorrect degree classification." };
      const result = RevokeCertificateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects empty or whitespace-only reason", () => {
      const invalidData = { reason: "   " };
      const result = RevokeCertificateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("VerifyParamsSchema", () => {
    it("accepts valid certificate IDs", () => {
      expect(VerifyParamsSchema.safeParse({ certificateId: "MC-2026-9A12B" }).success).toBe(true);
      expect(VerifyParamsSchema.safeParse({ certificateId: "CERT_100_TEST" }).success).toBe(true);
    });

    it("rejects unsafe or empty certificate IDs", () => {
      expect(VerifyParamsSchema.safeParse({ certificateId: "" }).success).toBe(false);
      expect(VerifyParamsSchema.safeParse({ certificateId: "<script>alert(1)</script>" }).success).toBe(false);
      expect(VerifyParamsSchema.safeParse({ certificateId: "../../../etc/passwd" }).success).toBe(false);
    });
  });
});
