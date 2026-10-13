import * as admin from "firebase-admin";

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  // Handle literal escaped newlines common in Vercel or .env files
  let formatted = key.replace(/\\n/g, "\n");
  // Ensure begins with -----BEGIN and ends with -----END
  if (!formatted.includes("-----BEGIN PRIVATE KEY-----")) {
    formatted = `-----BEGIN PRIVATE KEY-----\n${formatted}\n-----END PRIVATE KEY-----`;
  }
  return formatted;
}

let adminApp: admin.app.App | null = null;
let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;

if (isFirebaseAdminConfigured()) {
  try {
    if (admin.apps.length > 0) {
      adminApp = admin.apps[0]!;
    } else {
      const privateKey = formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }

    adminAuth = admin.auth(adminApp);
    adminDb = admin.firestore(adminApp);
  } catch (err) {
    console.error("Failed to initialize Firebase Admin SDK:", err);
  }
}

export { adminApp, adminAuth, adminDb };
