import { describe, it, expect } from "vitest";
import { isAuthorizedIssuer, isUniversityAdmin } from "../lib/auth/authorization";
import { AuthenticatedUser } from "../lib/types/certificate";

describe("Role-Based Access Control & Authorization", () => {
  it("authorizes university_admin for issuance and revocation", () => {
    const adminUser: AuthenticatedUser = {
      uid: "admin-uid-123",
      email: "registrar@university.edu",
      role: "university_admin",
    };

    expect(isAuthorizedIssuer(adminUser)).toBe(true);
    expect(isUniversityAdmin(adminUser)).toBe(true);
  });

  it("authorizes issuer for issuance and revocation", () => {
    const issuerUser: AuthenticatedUser = {
      uid: "issuer-uid-456",
      email: "staff@university.edu",
      role: "issuer",
    };

    expect(isAuthorizedIssuer(issuerUser)).toBe(true);
    expect(isUniversityAdmin(issuerUser)).toBe(false);
  });

  it("denies verifier from issuing or revoking", () => {
    const verifierUser: AuthenticatedUser = {
      uid: "verifier-uid-789",
      email: "employer@company.com",
      role: "verifier",
    };

    expect(isAuthorizedIssuer(verifierUser)).toBe(false);
    expect(isUniversityAdmin(verifierUser)).toBe(false);
  });

  it("denies unassigned / none users from issuing or revoking", () => {
    const regularUser: AuthenticatedUser = {
      uid: "user-uid-000",
      email: "student@gmail.com",
      role: "none",
    };

    expect(isAuthorizedIssuer(regularUser)).toBe(false);
    expect(isUniversityAdmin(regularUser)).toBe(false);
  });

  it("denies null or undefined user objects", () => {
    expect(isAuthorizedIssuer(null)).toBe(false);
    expect(isAuthorizedIssuer(undefined)).toBe(false);
    expect(isUniversityAdmin(null)).toBe(false);
    expect(isUniversityAdmin(undefined)).toBe(false);
  });
});
