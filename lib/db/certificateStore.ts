import fs from "fs";
import path from "path";
import { adminDb, isFirebaseAdminConfigured } from "../firebase/admin";
import { CertificateRecord } from "../types/certificate";

const DATA_DIR = path.join(process.cwd(), "data");
const CERTIFICATES_FILE = path.join(DATA_DIR, "certificates.json");
const AUDIT_EVENTS_FILE = path.join(DATA_DIR, "audit-events.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJsonSafe<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (err) {
    console.warn(`[Store] Could not parse ${filePath}, returning default:`, err);
    return defaultValue;
  }
}

function writeJsonSafe(filePath: string, data: any): void {
  ensureDirectoryExists(path.dirname(filePath));
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
    try {
      fs.copyFileSync(tempPath, filePath);
      fs.unlinkSync(tempPath);
    } catch {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  } catch (err) {
    console.error(`[Store] Error writing to ${filePath}:`, err);
  }
}

// Local storage helpers
function getLocalCertificatesMap(): Record<string, CertificateRecord> {
  return readJsonSafe<Record<string, CertificateRecord>>(CERTIFICATES_FILE, {});
}

function saveLocalCertificatesMap(map: Record<string, CertificateRecord>): void {
  writeJsonSafe(CERTIFICATES_FILE, map);
}

export function saveToLocalStore(record: CertificateRecord): boolean {
  try {
    const map = getLocalCertificatesMap();
    map[record.certificateId] = record;
    saveLocalCertificatesMap(map);
    return true;
  } catch (err) {
    console.error("[Store] Failed to save to local store:", err);
    return false;
  }
}

export function getFromLocalStore(certificateId: string): CertificateRecord | null {
  const map = getLocalCertificatesMap();
  return map[certificateId] || null;
}

export function listFromLocalStore(institutionId?: string): CertificateRecord[] {
  const map = getLocalCertificatesMap();
  const list = Object.values(map);
  if (institutionId) {
    return list.filter((c) => !c.institutionId || c.institutionId === institutionId);
  }
  return list;
}

export function updateInLocalStore(
  certificateId: string,
  updates: Partial<CertificateRecord>
): boolean {
  try {
    const map = getLocalCertificatesMap();
    if (!map[certificateId]) return false;
    map[certificateId] = {
      ...map[certificateId],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveLocalCertificatesMap(map);
    return true;
  } catch (err) {
    console.error("[Store] Failed to update in local store:", err);
    return false;
  }
}

export function saveAuditEventToLocal(event: Record<string, any>): void {
  try {
    const events = readJsonSafe<Array<Record<string, any>>>(AUDIT_EVENTS_FILE, []);
    events.push({
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recordedAt: new Date().toISOString(),
    });
    writeJsonSafe(AUDIT_EVENTS_FILE, events);
  } catch (err) {
    console.error("[Store] Failed to save audit event to local store:", err);
  }
}

export function saveUserProfileToLocal(profile: any): void {
  if (!profile || !profile.uid) return;
  try {
    const users = readJsonSafe<Record<string, any>>(USERS_FILE, {});
    users[profile.uid] = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    writeJsonSafe(USERS_FILE, users);
  } catch (err) {
    console.error("[Store] Failed to save user profile to local store:", err);
  }
}

export function getUserProfileFromLocal(uid: string): any | null {
  const users = readJsonSafe<Record<string, any>>(USERS_FILE, {});
  return users[uid] || null;
}

export function getFirestoreSetupUrl(): string {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return "https://console.firebase.google.com";
  return `https://console.firebase.google.com/project/${projectId}/firestore`;
}

export function isFirestoreApiDisabledError(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === "string" ? err : err.message || "";
  const code = err.code;
  return (
    code === 7 ||
    msg.includes("Cloud Firestore API has not been used") ||
    msg.includes("SERVICE_DISABLED") ||
    msg.includes("it is disabled")
  );
}

/**
 * Saves certificate record with dual persistence:
 * 1. Saves to local store (guaranteed immediate persistence)
 * 2. Attempts to sync with Cloud Firestore
 */
export async function saveCertificateRecord(record: CertificateRecord): Promise<{
  success: boolean;
  savedToFirestore: boolean;
  savedToLocal: boolean;
  notice?: string;
}> {
  const savedToLocal = saveToLocalStore(record);
  let savedToFirestore = false;
  let notice: string | undefined = undefined;

  if (isFirebaseAdminConfigured() && adminDb) {
    try {
      await adminDb.collection("certificates").doc(record.certificateId).set(record);
      savedToFirestore = true;
    } catch (err: any) {
      console.warn("[Database] Firestore write warning:", err.message);
      if (isFirestoreApiDisabledError(err)) {
        notice = `Cloud Firestore API is not enabled in Firebase Console for project ${
          process.env.FIREBASE_ADMIN_PROJECT_ID || ""
        }. Certificate securely stored in persistent database.`;
      } else {
        notice = `Firestore sync notice: ${err.message}. Certificate saved in local persistent database.`;
      }
    }
  } else {
    notice = "Firebase Admin not configured. Certificate saved in local persistent database.";
  }

  return {
    success: savedToLocal || savedToFirestore,
    savedToFirestore,
    savedToLocal,
    notice,
  };
}

/**
 * Retrieves certificate record by ID from Firestore or local persistent store.
 */
export async function getCertificateRecord(
  certificateId: string
): Promise<CertificateRecord | null> {
  // 1. Try Firestore if configured
  if (isFirebaseAdminConfigured() && adminDb) {
    try {
      const doc = await adminDb.collection("certificates").doc(certificateId).get();
      if (doc.exists) {
        const data = doc.data() as CertificateRecord;
        // Keep local store synchronized
        saveToLocalStore(data);
        return data;
      }
    } catch (err: any) {
      console.warn("[Database] Firestore read warning (checking local store):", err.message);
    }
  }

  // 2. Fall back to local store
  return getFromLocalStore(certificateId);
}

/**
 * Lists certificates for an institution with optional search filter.
 */
export async function listCertificateRecords(
  institutionId?: string,
  query?: string
): Promise<{
  certificates: CertificateRecord[];
  firestoreActive: boolean;
  notice?: string;
}> {
  let firestoreActive = false;
  let certificates: CertificateRecord[] = [];
  let notice: string | undefined = undefined;

  if (isFirebaseAdminConfigured() && adminDb) {
    try {
      let queryRef: FirebaseFirestore.Query = adminDb.collection("certificates");
      if (institutionId) {
        queryRef = queryRef.where("institutionId", "==", institutionId);
      }
      queryRef = queryRef.orderBy("createdAt", "desc").limit(100);

      const snapshot = await queryRef.get();
      firestoreActive = true;
      certificates = snapshot.docs.map((doc) => doc.data() as CertificateRecord);

      // Synchronize to local persistent cache
      for (const cert of certificates) {
        saveToLocalStore(cert);
      }
    } catch (err: any) {
      console.warn("[Database] Firestore query warning (serving from local store):", err.message);
      if (isFirestoreApiDisabledError(err)) {
        notice = `Cloud Firestore API is not yet enabled for project ${
          process.env.FIREBASE_ADMIN_PROJECT_ID || ""
        }. Serving records from persistent database.`;
      }
    }
  }

  // If Firestore didn't succeed or returned no records, fetch from local persistent store
  if (!firestoreActive || certificates.length === 0) {
    const localRecords = listFromLocalStore(institutionId);
    if (localRecords.length > 0) {
      const existingIds = new Set(certificates.map((c) => c.certificateId));
      for (const rec of localRecords) {
        if (!existingIds.has(rec.certificateId)) {
          certificates.push(rec);
        }
      }
    }
  }

  // Sort descending by createdAt
  certificates.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Apply query filter if provided
  if (query) {
    const q = query.toLowerCase().trim();
    certificates = certificates.filter(
      (c) =>
        c.certificateId.toLowerCase().includes(q) ||
        c.studentIdRef.toLowerCase().includes(q) ||
        c.studentName.toLowerCase().includes(q) ||
        c.course.toLowerCase().includes(q)
    );
  }

  return { certificates, firestoreActive, notice };
}

/**
 * Updates certificate status (e.g. REVOKED) in local store and Firestore.
 */
export async function updateCertificateStatus(
  certificateId: string,
  updates: Partial<CertificateRecord>
): Promise<{ success: boolean; firestoreUpdated: boolean }> {
  const localUpdated = updateInLocalStore(certificateId, updates);
  let firestoreUpdated = false;

  if (isFirebaseAdminConfigured() && adminDb) {
    try {
      await adminDb.collection("certificates").doc(certificateId).update(updates);
      firestoreUpdated = true;
    } catch (err: any) {
      console.warn("[Database] Firestore update warning:", err.message);
    }
  }

  return { success: localUpdated || firestoreUpdated, firestoreUpdated };
}

/**
 * Logs an audit event to local store and Cloud Firestore.
 */
export async function logAuditEvent(event: Record<string, any>): Promise<void> {
  saveAuditEventToLocal(event);

  if (isFirebaseAdminConfigured() && adminDb) {
    try {
      await adminDb.collection("auditEvents").add(event);
    } catch (err: any) {
      console.warn("[Database] Firestore auditEvents write warning:", err.message);
    }
  }
}
