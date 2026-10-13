import { adminAuth, adminDb, isFirebaseAdminConfigured } from "../firebase/admin";
import { UserRole } from "../types/certificate";

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  role: UserRole;
  institutionId?: string;
  institutionName?: string;
}

/**
 * Extracts and verifies Firebase Bearer token from Request authorization header.
 */
export async function authenticateRequest(
  authHeader: string | null
): Promise<{ user: AuthenticatedUser | null; error: string | null; status: number }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid Authorization header", status: 401 };
  }

  if (!isFirebaseAdminConfigured() || !adminAuth) {
    return {
      user: null,
      error: "Firebase Admin is not configured on the server. Please provide server environment credentials.",
      status: 503,
    };
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    // Retrieve role from custom claims or firestore user profile
    let role: UserRole = "none";
    let institutionId = "institution-main";
    let institutionName = "University Registry";

    if (decoded.role === "university_admin" || decoded.role === "issuer" || decoded.role === "verifier") {
      role = decoded.role as UserRole;
    } else if (adminDb) {
      // Check user document in Firestore as fallback
      const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        if (data?.role) {
          role = data.role as UserRole;
          institutionId = data.institutionId || institutionId;
          institutionName = data.institutionName || institutionName;
        }
      }
    }

    return {
      user: {
        uid: decoded.uid,
        email: decoded.email || null,
        role,
        institutionId: (decoded.institutionId as string) || institutionId,
        institutionName: (decoded.institutionName as string) || institutionName,
      },
      error: null,
      status: 200,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Token verification failed";
    return { user: null, error: `Authentication failed: ${message}`, status: 401 };
  }
}

/**
 * Validates that authenticated user has university_admin or issuer privileges.
 */
export function isAuthorizedIssuer(user: AuthenticatedUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "university_admin" || user.role === "issuer";
}

/**
 * Validates that authenticated user has university_admin privileges.
 */
export function isUniversityAdmin(user: AuthenticatedUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "university_admin";
}

