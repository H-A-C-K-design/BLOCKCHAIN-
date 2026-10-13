# MEMOCHECK System Architecture & Workflow Specification

This document outlines the complete end-to-end architectural workflows for **MEMOCHECK**: Credential Issuance, Verification, and Revocation.

---

## 1. High-Level System Architecture

```mermaid
graph TD
    subgraph Users ["Actors & Clients"]
        Staff["University Registrar / Issuer"]
        Student["Graduate / Credential Holder"]
        Verifier["Employer / Academic Verifier"]
    end

    subgraph App ["MEMOCHECK Application (Next.js 14)"]
        UI["Web Interface (Tailwind CSS)"]
        API["Serverless API Routes (/api/...)"]
        Hasher["SHA-256 Cryptographic Engine"]
    end

    subgraph Storage ["Distributed Infrastructure"]
        Auth["Firebase Authentication (Google)"]
        DB["Cloud Firestore (Metadata & Audit)"]
        IPFS["Pinata IPFS (Decentralized Storage)"]
        Chain["EVM Smart Contract (Optional Ledger)"]
    end

    Staff -->|1. Authenticates & Uploads PDF| UI
    UI -->|2. FormData (PDF + Metadata)| API
    API -->|3. Reads Raw Bytes| Hasher
    API -->|4. Uploads Document| IPFS
    API -->|5. Stores Record & Hash| DB
    API -.->|6. (Optional) Registers Hash| Chain
    API -->|7. Generates QR Code| UI

    Student -->|Presents PDF & QR Code| Verifier
    Verifier -->|Scans QR or Enters ID| UI
    Verifier -->|Uploads PDF for Byte Check| UI
    UI -->|Queries Verification API| API
    API -->|Compares Hashes| DB
    API -->|Returns Evidence & Status| UI
```

---

## 2. Certificate Issuance Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Staff as University Staff
    participant Client as Next.js Client (/dashboard/issue)
    participant Server as Server API (/api/certificates)
    participant Hasher as Node.js Crypto (SHA-256)
    participant Pinata as Pinata IPFS Service
    participant Firestore as Cloud Firestore
    participant QR as QR Generator

    Staff->>Client: Selects Certificate PDF & Fills Student Reference
    Client->>Client: Calculates SHA-256 preview in browser (Web Crypto API)
    Staff->>Client: Confirms Privacy Disclosure & Clicks "Issue Certificate"
    Client->>Server: POST /api/certificates (multipart/form-data + Bearer Token)
    Server->>Server: Verifies Firebase Token & checks Role (issuer/university_admin)
    Server->>Server: Validates PDF Magic Bytes (%PDF-) & file size (<10MB)
    Server->>Hasher: calculateSha256Server(pdfBuffer)
    Hasher-->>Server: Returns 32-byte hash (0x...)
    Server->>Pinata: uploadPdfToIpfs(pdfBuffer, fileName)
    Pinata-->>Server: Returns permanent IPFS CID (Qm...) & Gateway URL
    Server->>Firestore: Writes CertificateRecord & Audit Log Event
    Server->>QR: Generates verification QR pointing to /verify/{certificateId}
    Server-->>Client: Returns 200 OK (Certificate ID, SHA-256 Hash, IPFS CID, QR)
    Client-->>Staff: Displays Success Card with QR Code and verification link
```

### Detailed Issuance Steps
1. **Authentication & Authorization**: University staff signs in via Google OAuth. The server verifies that the caller has been granted the `university_admin` or `issuer` role.
2. **Byte-Level Fingerprinting**: The server reads the raw binary buffer of the uploaded PDF and computes its cryptographic SHA-256 digest (`crypto.createHash("sha256")`).
3. **Decentralized Anchoring**: The exact PDF bytes are uploaded to IPFS through Pinata's API, yielding a permanent, content-addressed Content Identifier (CID).
4. **Audit Trail**: Metadata (student ID ref, course, award, issue date), the SHA-256 hash, and the IPFS CID are persisted in Firestore along with an immutable audit event.
5. **QR Code Delivery**: A high-resolution QR code is generated for placement onto the official diploma or digital certificate.

---

## 3. Public Verification Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Verifier as Employer / Verifier
    participant Portal as Verification Portal (/verify)
    participant VerifyAPI as API (/api/verify/{certificateId})
    participant Hasher as SHA-256 Engine
    participant Registry as Firestore Registry / Smart Contract

    Verifier->>Portal: Scans QR Code or enters Certificate ID
    opt Optional: Verifier supplies candidate's PDF
        Verifier->>Portal: Drops certificate PDF into file zone
    end
    Portal->>VerifyAPI: GET or POST /api/verify/{certificateId}
    VerifyAPI->>Registry: Queries stored record by Certificate ID

    alt Record does NOT exist
        Registry-->>VerifyAPI: Not Found
        VerifyAPI-->>Portal: Status: INVALID ("No record found")
    else Record exists & is marked Revoked
        Registry-->>VerifyAPI: Found (Revoked = true)
        VerifyAPI-->>Portal: Status: REVOKED ("Formally revoked with reason")
    else Record exists & Active
        alt No PDF supplied
            VerifyAPI-->>Portal: Status: VALID ("Record confirmed, PDF not compared")
        else PDF supplied
            VerifyAPI->>Hasher: Computes SHA-256 of supplied PDF bytes
            alt Uploaded Hash == Stored Hash
                VerifyAPI-->>Portal: Status: VALID ("100% Cryptographic Match")
            else Uploaded Hash != Stored Hash
                VerifyAPI-->>Portal: Status: INVALID ("File altered or tampered")
            end
        end
    end

    Portal-->>Verifier: Displays Comprehensive Cryptographic Evidence Card
```

### Verification Determination States

| Status | Color | Condition | Meaning |
| :--- | :--- | :--- | :--- |
| **`VALID`** | **Green** | Record found, Active, and PDF bytes match 100% | The certificate is authentic, untouched, and issued by the university. |
| **`INVALID`** | **Red** | Record not found OR PDF hash mismatches | The credential does not exist or the document was altered/forged. |
| **`REVOKED`** | **Amber** | Record found, but marked revoked | The degree was officially cancelled or superseded by the university. |
| **`UNABLE_TO_VERIFY`** | **Amber** | Network or database dependency unreachable | Verification could not complete. Never falsified as valid. |

---

## 4. Administrative Revocation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Authorized Staff
    participant UI as Revocations Dashboard (/dashboard/revocations)
    participant RevokeAPI as API (/api/certificates/{id}/revoke)
    participant DB as Cloud Firestore

    Admin->>UI: Enters Certificate ID, Reason, and checks Confirmation
    UI->>RevokeAPI: POST /api/certificates/{certificateId}/revoke
    RevokeAPI->>RevokeAPI: Verifies Firebase ID Token & Staff Role
    RevokeAPI->>DB: Updates status: "REVOKED", records revokedAt & reason
    RevokeAPI->>DB: Writes immutable audit event to auditEvents collection
    RevokeAPI-->>UI: Returns confirmation
    UI-->>Admin: Displays success & appends to Revoked Audit Log
    Note over UI,DB: Subsequent public verifications now immediately report REVOKED
```

---

## 5. Security & Privacy Model

1. **Student Privacy Protection:**
   * Student Personal Identifiable Information (PII) such as personal emails, phone numbers, and home addresses are never published to public verification records.
   * Public verifiers see only institutional award information and cryptographic proof of authenticity.
2. **Avalanche Effect for Tamper Prevention:**
   * Any modification to a single character in the certificate changes the entire 64-character SHA-256 hash, causing instant detection during verification.
3. **Role-Based Server Authorization:**
   * Issuance and revocation APIs are secured server-side using Firebase Admin token verification. Client-side state alone can never authorize an issuance.
