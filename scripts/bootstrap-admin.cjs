/**
 * MEMOCHECK Administrative Role Bootstrap Script
 * Securely assigns university_admin or issuer role to a Firebase user.
 *
 * Usage:
 *   node scripts/bootstrap-admin.cjs <email-or-uid> [role] [institutionId]
 * Example:
 *   node scripts/bootstrap-admin.cjs registrar@university.edu university_admin institution-main
 */
const admin = require('firebase-admin');

// Load environment variables if not already loaded
if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envFile = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...rest] = trimmed.split('=');
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      });
    }
  } catch (e) {
    // ignore
  }
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('Error: Firebase Admin credentials not found in environment.');
  console.error('Please configure FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.');
  process.exit(1);
}

privateKey = privateKey.replace(/\\n/g, '\n');
if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
  privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function main() {
  const args = process.argv.slice(2);
  const identifier = args[0];
  const role = args[1] || 'university_admin';
  const institutionId = args[2] || 'institution-main';
  const institutionName = args[3] || 'University of Science & Technology';

  if (!identifier) {
    console.log('Usage: node scripts/bootstrap-admin.cjs <email-or-uid> [role] [institutionId]');
    console.log('Roles: university_admin, issuer, verifier');
    process.exit(1);
  }

  const validRoles = ['university_admin', 'issuer', 'verifier'];
  if (!validRoles.includes(role)) {
    console.error(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  let userRecord;
  try {
    if (identifier.includes('@')) {
      userRecord = await auth.getUserByEmail(identifier);
    } else {
      userRecord = await auth.getUser(identifier);
    }
  } catch (err) {
    console.error(`User not found: ${err.message}`);
    process.exit(1);
  }

  console.log(`Setting custom claims for user ${userRecord.email} (${userRecord.uid})...`);
  await auth.setCustomUserClaims(userRecord.uid, {
    role,
    institutionId,
    institutionName,
  });

  console.log(`Updating Firestore users/${userRecord.uid} document...`);
  await db.collection('users').doc(userRecord.uid).set(
    {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || null,
      photoURL: userRecord.photoURL || null,
      role,
      institutionId,
      institutionName,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  console.log(`\nSuccessfully granted role '${role}' to ${userRecord.email}!`);
  console.log(`Institution: ${institutionName} (${institutionId})`);
  console.log(`The user can now sign in and access the authorized MemoCheck dashboard.`);
}

main().catch(err => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
