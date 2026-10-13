# MEMOCHECK — Academic Certificate Verification Platform

MEMOCHECK is a decentralized, tamper-evident academic certificate verification platform built with **Next.js (App Router)**, **Solidity smart contracts (EVM)**, **SHA-256 byte-level file integrity**, and **IPFS content anchoring**.

The platform enables universities to issue tamper-evident credentials while giving students, employers, and verifying institutions confidence that records cannot be altered, forged, or falsely claimed.

---

## Key Principles & Design Guarantees

1. **Zero Hardcoded / Mock Data:** No mock certificates, simulated credentials, fake metrics, or fabricated blockchain hashes exist in the application. When a dependency is unconfigured, the system explicitly displays the missing configuration status.
2. **Byte-Level Cryptographic Integrity:** Certificates are hashed using exact SHA-256 byte digest over uploaded PDFs. Modifying a single byte or character in the PDF alters the hash, failing verification.
3. **Student Privacy Protection:** Student personal identifying details (names, student IDs) are never stored on the public blockchain. The blockchain registry records only the Certificate ID, SHA-256 hash (32 bytes), issuer public address, and timestamp.
4. **Authoritative Revocation Ledger:** The smart contract acts as the decentralized source of truth for revocation. Revocations emit immutable blockchain events and immediately invalidate public verification.
5. **Authentic Verification States:**
   - **`VALID`**: Blockchain record confirmed, not revoked, and PDF bytes match the stored SHA-256 hash.
   - **`INVALID`**: No record exists or uploaded PDF bytes differ from the on-chain hash.
   - **`REVOKED`**: Valid record found, but marked formally revoked by the issuing institution.
   - **`UNABLE TO VERIFY`**: External dependencies (RPC node, contract, or database) are unreachable or unconfigured.

---

## Architecture & Technology Stack

- **Frontend & Server:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Design System:** Custom university registry palette (Forest Green `#2F6B4F`, Deep `#214B39`, Soft `#EAF3ED`, Surface `#FFFFFF`, Background `#F6F8F6`)
- **Authentication:** Firebase Authentication with Google Provider
- **Database & Auditing:** Google Cloud Firestore (Admin SDK server-side)
- **File Hashing:** Node.js `crypto` & Web Crypto API (SHA-256)
- **Decentralized Storage:** IPFS provider adapter (Pinata or compatible S3/IPFS pinning)
- **Smart Contract:** Solidity `^0.8.20` (`MemoCheckCertificates.sol`)
- **Blockchain Client:** `viem` for contract reads, transaction writes, and receipt confirmation
- **Testing:** `vitest` for crypto, schemas, role authorization, contract invariants, and status logic

---

## Directory Structure

```text
memocheck/
├── app/
│   ├── page.tsx                           # Public homepage with hero & quick lookup
│   ├── login/page.tsx                     # University staff Google sign-in
│   ├── dashboard/
│   │   ├── layout.tsx                     # Protected dashboard navigation & role check
│   │   ├── page.tsx                       # Institutional overview & health telemetry
│   │   ├── issue/page.tsx                 # Certificate issuance & hashing form
│   │   ├── certificates/page.tsx          # Registry list, search, filters & QR cards
│   │   ├── revocations/page.tsx           # Formal on-chain revocation workflow & audit
│   │   └── settings/page.tsx              # Infrastructure status & setup instructions
│   ├── verify/
│   │   ├── page.tsx                       # Public verification portal (QR camera scan / PDF upload)
│   │   └── [certificateId]/page.tsx      # Deep-linkable verification route for QR codes
│   └── api/
│       ├── auth/session/route.ts          # Session authentication handler
│       ├── certificates/route.ts          # Issue & query certificates API
│       ├── certificates/[certificateId]/route.ts
│       ├── certificates/[certificateId]/revoke/route.ts
│       ├── health/route.ts                # Infrastructure telemetry endpoint
│       └── verify/[certificateId]/route.ts # Public verification API
├── components/
│   ├── AuthContext.tsx                    # Firebase authentication state provider
│   ├── Navbar.tsx                         # Responsive public navigation
│   ├── Footer.tsx                         # Public footer with security notices
│   └── VerificationView.tsx               # Reusable cryptographic verification component
├── contracts/
│   ├── src/
│   │   └── MemoCheckCertificates.sol      # Solidity verification registry contract
│   ├── scripts/
│   │   ├── compile.cjs                    # Solidity compiler script (solc)
│   │   └── deploy.cjs                     # Contract deployment script
│   └── out/                               # Compiled ABI & EVM bytecode
├── lib/
│   ├── auth/authorization.ts              # Server-side token validation & RBAC
│   ├── blockchain/
│   │   ├── client.ts                      # Viem public client & signer wallet client
│   │   └── contract.ts                    # Contract read/write methods & ABI
│   ├── certificates/service.ts            # Issuance, revocation, & verification workflows
│   ├── crypto/sha256.ts                   # Byte-level SHA-256 calculation utilities
│   ├── firebase/
│   │   ├── client.ts                      # Firebase Client SDK
│   │   └── admin.ts                       # Firebase Admin SDK
│   ├── ipfs/provider.ts                   # IPFS upload adapter
│   └── validation/certificate.ts          # Zod validation schemas
├── tests/
│   ├── crypto.test.ts                     # SHA-256 byte hashing & equality tests
│   ├── validation.test.ts                 # Zod schema validation tests
│   ├── authorization.test.ts              # RBAC role verification tests
│   ├── contract.test.ts                   # Smart contract ABI & state invariants
│   └── service.test.ts                    # Certificate service status mapping tests
├── firestore.rules                        # Least-privilege Firestore security rules
├── firestore.indexes.json                 # Compound queries index definition
└── package.json
```

---

## Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

### Configuration Variables Reference

```env
# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Client-Side Firebase Configuration (Only NEXT_PUBLIC_* variables reach the browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-Side Firebase Admin Configuration (Never exposed to client)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# IPFS Provider (Pinata or compatible API)
IPFS_PROVIDER=pinata
IPFS_API_URL=https://api.pinata.cloud
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
IPFS_API_TOKEN=your_pinata_jwt_or_secret

# EVM Blockchain Integration
CHAIN_ID=11155111
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CONTRACT_ADDRESS=0xYourDeployedContractAddress
ISSUER_SIGNER_PRIVATE_KEY=0xYourIssuerSignerPrivateKey

# Block Explorer & Limits
BLOCK_EXPLORER_TX_URL_TEMPLATE=https://sepolia.etherscan.io/tx/{txHash}
MAX_PDF_SIZE_MB=10
```

> **Security Note:** In production, do not store plain-text private keys in source control. Use secret management (e.g. Vercel Environment Variables, AWS KMS, or a dedicated relayer).

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Smart Contract
```bash
npm run compile:contracts
```
This compiles `contracts/src/MemoCheckCertificates.sol` with `solc` and generates JSON artifacts for both contract deployment and `viem` contract interaction.

### 3. Deploy Smart Contract
To deploy to Sepolia testnet or any EVM-compatible chain:
```bash
# Ensure RPC_URL and ISSUER_SIGNER_PRIVATE_KEY are defined in .env.local
node contracts/scripts/deploy.cjs
```
Copy the printed contract address into `CONTRACT_ADDRESS` in `.env.local`.

### 4. Bootstrap University Administrator
1. Sign in once with Google at `/login` to create your initial Firebase user record.
2. In your terminal, grant the administrator role:
```bash
node scripts/bootstrap-admin.cjs <YOUR_FIREBASE_UID> university_admin "University Registry"
```
3. Sign out and sign in again. You now have full access to `/dashboard`.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Automated Tests

Run the complete Vitest test suite:
```bash
npm test
```

Typecheck the entire TypeScript codebase:
```bash
npm run typecheck
```

Lint code:
```bash
npm run lint
```

---

## Deployment to Vercel

1. Push your repository to GitHub / GitLab.
2. Import the repository in [Vercel](https://vercel.com).
3. In Project Settings > Environment Variables, add all variables defined in `.env.example`.
4. Ensure `FIREBASE_ADMIN_PRIVATE_KEY` has newlines properly escaped (`\n`).
5. Trigger deployment. The Next.js App Router API routes deploy as serverless functions.
