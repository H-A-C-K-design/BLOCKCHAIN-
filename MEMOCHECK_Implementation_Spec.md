# MEMOCHECK — Blockchain Certificate Verification Platform
## Implementation Specification for Antigravity

Build a complete, locally runnable web application named **MEMOCHECK** for issuing and verifying academic certificates using SHA-256, IPFS, and a smart contract. The interface must feel like a carefully designed real product—not a generic AI landing page.

## 1. Product goal

MEMOCHECK helps universities issue tamper-evident certificates and lets students, employers, and other authorized verifiers check whether a certificate is authentic, invalid, or revoked.

### Required workflow
1. University staff signs in.
2. Authorized staff uploads a student certificate PDF.
3. The server calculates a SHA-256 hash of the exact PDF bytes.
4. The PDF is uploaded to IPFS through a server-side integration.
5. A smart contract records the certificate ID, PDF hash, issuer, issue timestamp, IPFS CID (only if the privacy model permits it), and revocation state.
6. The application creates a certificate ID and QR code for verification.
7. An employer scans the QR code or enters the certificate ID.
8. The verification page reads the blockchain record.
9. If a verifier supplies a PDF, the app calculates its SHA-256 hash and compares it with the on-chain hash.
10. The result is **VALID**, **INVALID**, **REVOKED**, or **UNABLE TO VERIFY** if a dependency is unavailable. Never label a certificate valid when verification failed or could not run.

## 2. Non-negotiable requirements

- Do not create mock data, fake certificates, demo users, fake activity, placeholder metrics, fabricated blockchain transactions, or hard-coded verification results.
- Empty states must be genuine and clearly explain how to add the first real record.
- Use real Firebase configuration supplied through environment variables. Do not invent Firebase credentials.
- Use Google sign-in through Firebase Authentication.
- Restrict issuing and revoking certificates to authorized university staff. A Google login alone must not grant issuer privileges.
- Keep secrets and privileged operations on the server. Never expose Firebase Admin credentials, private keys, IPFS write tokens, or blockchain signer keys in browser code.
- Use actual blockchain reads/writes and actual IPFS uploads when configured. If a service is not configured, show a clear setup/error state; do not silently substitute simulated behavior.
- Make the project run locally and be deployable to Vercel.
- Use accessible, responsive design and meaningful loading, success, empty, and error states.
- Do not claim that a certificate is blockchain-verified unless the on-chain transaction and record were successfully checked.

## 3. Visual design

Create a clean, calm, professional visual system using **green + white + grey**. No neon, cyberpunk, excessive gradients, or glowing effects.

Suggested tokens (adjust if needed while preserving the visual direction):
- Primary green: `#2F6B4F`
- Deep green: `#214B39`
- Soft green: `#EAF3ED`
- White: `#FFFFFF`
- Page background: `#F6F8F6`
- Main text: `#202923`
- Secondary text: `#66716A`
- Borders: `#E0E6E1`
- Error: accessible dark red; warning: amber with sufficient contrast.

Use a readable sans-serif font, generous whitespace, subtle borders, restrained shadows, rounded corners, and small purposeful transitions. Buttons may have a short hover/press transition, but avoid distracting motion. Respect `prefers-reduced-motion`.

### Create a separate logo
Create an original MEMOCHECK logo as a local SVG asset (for example, `public/memocheck-logo.svg`) and use it consistently in the navbar, login screen, dashboard, and favicon. Logo direction: a simple document/checkmark or certificate/shield symbol with green and grey, paired with the word MEMOCHECK. It must remain legible at small sizes. Do not use a third-party logo or emoji as the final logo.

## 4. Recommended stack

Use a current, stable Next.js App Router project with TypeScript and Tailwind CSS, suitable for Vercel deployment.

- Frontend: Next.js, TypeScript, Tailwind CSS
- Authentication: Firebase Authentication, Google provider
- Application data: Cloud Firestore
- Server-side Firebase access: Firebase Admin SDK
- PDF hashing: Web Crypto API or Node.js `crypto` SHA-256 over the exact uploaded bytes
- PDF upload: IPFS provider through a server-side adapter (use a configurable provider, such as Pinata or another compatible service)
- Smart contract: Solidity contract deployed to a configurable EVM-compatible network
- Blockchain integration: a maintained EVM library such as `viem`
- QR generation: a maintained QR-code library
- Validation: Zod or equivalent
- Tests: unit tests for hashing/status logic and integration tests for configured service adapters.

Use package versions compatible with one another and commit a lockfile. Do not add unnecessary dependencies.

## 5. Public homepage

Create a complete, responsive homepage at `/` with these sections:

### Navbar
- MEMOCHECK logo
- How it works
- Features
- For universities
- Verify certificate
- Log in button
- Mobile menu with working links

### Hero
Headline: **Academic certificates you can verify with confidence.**
Supporting copy explaining that MEMOCHECK helps institutions issue tamper-evident digital certificate records and enables employers to check authenticity.
Primary CTA: **Verify a certificate**
Secondary CTA: **University login**
Use a simple, tasteful visual illustrating a certificate and verification status. It must not display fake personal information or pretend to be a real record. Mark any purely decorative illustration as illustrative.

### How it works
Explain the actual workflow in plain language:
1. University signs in and uploads a PDF.
2. MEMOCHECK hashes the PDF and stores it through the configured IPFS service.
3. An authorized transaction records verification data on the blockchain.
4. A QR code and certificate ID are generated.
5. A verifier checks the record and, optionally, the PDF hash.

### Features
- SHA-256 file integrity checks
- Blockchain-backed issuance records
- QR code and certificate ID verification
- Revocation status checks
- Role-based university access
- Auditable issue/revoke events
- Responsive verification page

### For universities
Explain that staff must be approved as issuers, and that blockchain transactions may incur network fees. Do not promise legal compliance or absolute fraud prevention.

### Verification section
Provide a functional form for a certificate ID. It must query the real backend/blockchain and show real status or a clear not-configured/not-found/error state. Never return a hard-coded success result.

### Footer
Include navigation, concise privacy/security note, and project identity.

## 6. Authentication and authorization

Implement `/login` with Firebase Google sign-in:
- Use Firebase Authentication Google provider.
- Show clear loading and authentication error states.
- Handle sign-in and sign-out properly.
- Protect dashboard routes.
- Verify Firebase ID tokens on the server for protected API requests.
- Store user profile metadata in Firestore only as needed.
- Enforce roles such as `university_admin`, `issuer`, and `verifier` using trusted server-managed custom claims or a similarly secure authorization system.
- Never allow a user to grant themselves issuer/admin status from the client.
- Provide a documented, secure admin bootstrap procedure using a server-side script or Firebase Admin SDK. Do not expose an open “make me admin” endpoint.
- Google login is authentication, not proof that a person represents a university.

If a user is signed in but has no issuing role, show a helpful “Access not granted” page with a safe contact/approval explanation. Do not show university controls to unauthorized users.

## 7. Dashboard

Create a protected dashboard at `/dashboard` with a clean left sidebar on desktop and a usable mobile navigation drawer.

Navigation:
- Overview
- Issue certificate
- Certificates
- Verify certificate
- Revocations
- Settings
- Sign out

### Overview
Show only real Firestore/blockchain-backed values:
- Total issued certificates
- Valid certificates
- Revoked certificates
- Recent issuance/revocation events

If there are no records, show a genuine empty state such as “No certificates have been issued yet.” Never populate statistics with sample values.

### Issue certificate
Create a working form for authorized issuers:
- Student full name
- Student ID or institutional reference
- Course/program
- Award/qualification
- Issue date
- Optional expiry date
- PDF file input with PDF validation and sensible size limit
- Clear privacy notice and confirmation before submitting

On submit:
1. Validate user role and input on the server.
2. Validate PDF type and size on the server; do not trust the browser MIME type alone.
3. Read the uploaded file bytes and calculate SHA-256 on the server.
4. Upload the PDF to IPFS using a server-side credential.
5. Submit the certificate hash and minimum required metadata to the smart contract.
6. Wait for the transaction receipt and verify successful execution.
7. Persist an application record in Firestore with the transaction hash, chain ID, contract address, IPFS CID if applicable, certificate ID, and timestamps.
8. Generate a QR code linking to the public verification route.
9. Return success only when the required issuance steps have succeeded.

Implement a transaction state machine and clear errors. Handle partial failures carefully: if IPFS succeeds but the transaction fails, record an operational failure for authorized administrators, avoid claiming issuance succeeded, and provide a safe retry/reconciliation path. Do not blindly submit duplicate transactions on retry.

Do not put student personal information or the raw PDF on a public blockchain. Store only the minimum necessary fields on-chain. Assess whether even a PDF hash or metadata could expose sensitive information. The IPFS PDF should be encrypted or access-controlled if certificates are not intended to be public; IPFS CIDs alone are not access control. Explain this design in the README and make the privacy choice configurable.

### Certificates
- Server-paginated list of actual records for the authorized institution
- Search by certificate ID or institutional reference
- Status, issue date, transaction link where the explorer URL is configured
- Detail view with QR code and certificate ID
- No mock rows

### Revocations
- Authorized issuer/admin only
- Require a reason and explicit confirmation
- Write a revocation transaction to the smart contract
- Verify transaction receipt
- Update Firestore after chain confirmation
- Public verification must read the contract’s revocation status as the source of truth
- Preserve an audit trail; do not delete the original certificate record

### Settings
- Show configured institution profile details only if present
- Display service configuration status without revealing secrets
- Do not show private keys or tokens

## 8. Public verification page

Implement `/verify` and `/verify/[certificateId]` (or an equivalent safe route).

Support:
- Enter certificate ID
- Scan QR code using the device camera where permission is granted; provide manual ID entry as fallback
- Optionally upload the presented PDF for hash comparison
- Query the configured blockchain network and contract
- Compare the uploaded PDF SHA-256 with the on-chain hash
- Check revocation status
- Show concise result and evidence

Statuses:
- **VALID**: record exists, chain response is verified, PDF hash matches when a PDF was supplied, and record is not revoked.
- **INVALID**: no matching record exists or supplied PDF hash does not match.
- **REVOKED**: a matching record exists and the on-chain record is revoked.
- **UNABLE TO VERIFY**: RPC/network/configuration failure or inconclusive response. Explain that this is not the same as invalid.

Show the certificate ID, issuer/institution label if public, issue date if public, chain/network, transaction reference, and last checked time where available. Do not reveal student data beyond the deliberate public disclosure policy. If no PDF is supplied, explain that the record was found but the file itself was not compared.

## 9. Blockchain contract requirements

Implement and test a Solidity contract with:
- A unique certificate ID
- A stored SHA-256 hash (32 bytes)
- Issuer identity
- Issued timestamp
- Revocation state
- Issuance and revocation events
- Authorized issuer roles and revocation permissions
- Duplicate certificate ID prevention
- Access control with least privilege

Do not store full PDFs or unnecessary personal details on-chain. Use a configurable chain and contract address. Include deployment scripts and a contract ABI/address configuration workflow. Never fabricate a deployed contract address or transaction hash.

Write tests for:
- Successful issuance by an authorized issuer
- Rejection of unauthorized issuance
- Duplicate ID rejection
- Successful revocation by an authorized account
- Rejection of unauthorized revocation
- Revoked status returned during verification

If the contract has not yet been deployed, the application must show “Blockchain not configured” and document the deployment steps. Do not create a fake local chain record that is presented as real.

## 10. Firebase and data model

Use Firestore for application metadata and operational indexing, but treat the smart contract as the source of truth for certificate existence and revocation.

Suggested collections:
- `users/{uid}` — profile and institution association, no client-controlled roles
- `institutions/{institutionId}` — institution profile and issuer membership
- `certificates/{certificateId}` — metadata, hash, transaction details, chain ID, contract address, IPFS CID or protected content reference, timestamps, institution ID
- `auditEvents/{eventId}` — issuance/revocation/administrative events
- `issuanceJobs/{jobId}` — server-side workflow state and reconciliation information; restrict access to authorized staff

Use Firestore Security Rules that deny by default and enforce access. Client-side checks are for user experience only; the server must independently enforce every privileged operation. Never allow the client to write certificate issuance status, transaction hashes, hashes, or roles directly.

Keep public verification APIs read-only and return only approved public fields.

## 11. Local development and Vercel

Provide:
- `.env.example` containing names only, with no real secrets
- Clear README setup instructions
- Firebase project setup instructions
- Google provider enablement instructions
- Firestore rules and index files
- Firebase Admin setup instructions
- IPFS provider configuration instructions
- Smart contract compile/test/deploy instructions
- Local development scripts
- Vercel deployment steps
- A production configuration checklist

Suggested environment variables (use only those the implementation actually needs):
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

IPFS_PROVIDER=
IPFS_API_URL=
IPFS_API_TOKEN=

CHAIN_ID=
RPC_URL=
CONTRACT_ADDRESS=
ISSUER_SIGNER_PRIVATE_KEY=

BLOCK_EXPLORER_TX_URL_TEMPLATE=
MAX_PDF_SIZE_MB=10
```

Important:
- Only `NEXT_PUBLIC_*` variables may be used in client-side code.
- Keep Firebase Admin, IPFS write tokens, RPC secrets if any, and issuer signer private key server-side.
- For Firebase Admin private keys, correctly handle newline formatting from Vercel environment variables.
- Prefer a managed signer/KMS or relayer over a raw private key in production. If a raw key is used for development, document the risk and use a dedicated test account with no valuable funds.
- Never commit `.env.local` or secrets.
- Add `.env*` to `.gitignore` except `.env.example`.
- Use Vercel-compatible serverless routes; do not depend on a persistent local server or filesystem for durable state.
- Use a temporary directory only when safe and supported; otherwise process uploaded files in memory with a strict size limit or use signed upload workflows.
- Add request size limits, rate limiting for public verification endpoints, secure headers, and clear error handling.

## 12. Suggested project structure

```text
memocheck/
├── app/
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── dashboard/page.tsx
│   ├── dashboard/certificates/page.tsx
│   ├── dashboard/issue/page.tsx
│   ├── dashboard/revocations/page.tsx
│   ├── verify/page.tsx
│   ├── verify/[certificateId]/page.tsx
│   └── api/
│       ├── auth/session/route.ts
│       ├── certificates/route.ts
│       ├── certificates/[certificateId]/route.ts
│       ├── certificates/[certificateId]/revoke/route.ts
│       └── verify/[certificateId]/route.ts
├── components/
├── lib/
│   ├── firebase/client.ts
│   ├── firebase/admin.ts
│   ├── auth/authorization.ts
│   ├── crypto/sha256.ts
│   ├── ipfs/provider.ts
│   ├── blockchain/client.ts
│   ├── blockchain/contract.ts
│   ├── certificates/service.ts
│   └── validation/
├── contracts/
│   ├── src/
│   ├── test/
│   └── scripts/
├── public/
│   ├── memocheck-logo.svg
│   └── favicon.svg
├── firestore.rules
├── firestore.indexes.json
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

Adjust the structure if needed, but keep responsibilities separated and easy to maintain.

## 13. Security and privacy

- Never expose secret environment variables to the client.
- Validate all inputs on the server.
- Verify Firebase ID tokens for protected APIs.
- Enforce issuer authorization on every issuance and revocation request.
- Use HTTPS in production.
- Do not log raw PDFs, tokens, private keys, or unnecessary student data.
- Set upload limits and reject malformed PDFs.
- Add rate limits to public verification endpoints.
- Use least-privilege Firestore rules and contract roles.
- Consider data protection, consent, retention, and university policy before publishing any certificate data.
- Avoid putting personal information, student IDs, or names on a public blockchain.
- IPFS is content-addressed storage, not inherently private or deletable. Do not upload confidential PDFs unencrypted.
- A hash match proves byte-level file integrity against a stored hash; it does not by itself prove the issuer was legitimate. Issuer authorization and on-chain record validity must also be checked.

## 14. Testing and acceptance criteria

Do not mark the task complete until:
- Homepage, login, dashboard, issuance, listing, revocation, and verification pages exist and are responsive.
- Google sign-in works with real Firebase configuration.
- Unauthorized users cannot issue or revoke certificates through direct API calls.
- SHA-256 is calculated from the actual uploaded PDF bytes.
- IPFS integration uploads to the configured provider, or shows a clear configuration error.
- Smart-contract issuance and revocation use actual configured contract calls.
- Verification checks the real contract and compares the supplied PDF hash when a file is provided.
- No mock data or fake success states exist anywhere in the UI or API.
- Empty states render correctly with a clean database.
- Service outages show “Unable to verify” rather than falsely returning invalid or valid.
- The separate SVG logo is used throughout.
- Automated tests cover hashing, access control, contract logic, and status mapping.
- `npm run lint`, `npm run typecheck`, and relevant tests pass.
- `npm run build` succeeds with documented environment configuration.
- The README clearly distinguishes implemented functionality from integrations that require external credentials or a deployed contract.

## 15. Build process

1. Inspect the existing workspace before changing files; preserve useful existing code.
2. Implement the actual application, not only a static mockup.
3. Create the logo as a separate SVG file.
4. Configure Firebase client/admin modules and secure Google authentication.
5. Implement the smart contract, tests, and deployment instructions.
6. Implement IPFS and blockchain adapters with explicit configuration checks.
7. Build the homepage and protected dashboard using the green/white/grey design system.
8. Implement the issuance and verification flows end to end.
9. Add real empty/loading/error/success states—never seeded demo records.
10. Run lint, typecheck, tests, and production build; fix errors.
11. Finish with a concise report listing what works, required environment variables, deployment steps, and any integrations that remain unconfigured. Never claim an integration works unless it has been tested with real credentials and a real configured service.

**Final instruction:** Build MEMOCHECK as a functional, secure, deployable product. If external credentials, an IPFS provider, or a deployed smart contract are not available in the workspace, finish the integration code and setup documentation, clearly show the missing configuration in the UI, and never fake the result.
