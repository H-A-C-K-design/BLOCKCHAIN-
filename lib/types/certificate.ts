export type CertificateStatus = "VALID" | "INVALID" | "REVOKED" | "UNABLE_TO_VERIFY";

export type UserRole = "university_admin" | "issuer" | "verifier" | "none";

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  role: UserRole;
  institutionId?: string;
  institutionName?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  institutionId?: string;
  institutionName?: string;
  createdAt: string;
}

export interface CertificateRecord {
  certificateId: string;
  studentName: string;
  studentIdRef: string;
  course: string;
  award: string;
  issueDate: string;
  expiryDate?: string | null;
  pdfHash: string;
  ipfsCid?: string | null;
  ipfsGatewayUrl?: string | null;
  transactionHash?: string | null;
  contractAddress?: string | null;
  chainId?: number | null;
  issuerAddress?: string | null;
  issuerUid: string;
  issuerEmail?: string | null;
  institutionId: string;
  institutionName?: string | null;
  status: "ACTIVE" | "REVOKED";
  revokedAt?: string | null;
  revocationReason?: string | null;
  revokedByUid?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationEvidence {
  status: CertificateStatus;
  message: string;
  certificateId: string;
  recordFound: boolean;
  chainChecked: boolean;
  onChainRecord?: {
    exists: boolean;
    pdfHash: string;
    issuer: string;
    issuedAt: number;
    revoked: boolean;
    revokedAt: number;
    ipfsCid: string;
  } | null;
  pdfUploaded: boolean;
  pdfHashMatch?: boolean;
  computedHash?: string | null;
  onChainHash?: string | null;
  metadata?: {
    course?: string;
    award?: string;
    issueDate?: string;
    institutionName?: string;
  } | null;
  revocationDetails?: {
    isRevoked: boolean;
    revokedAt?: string | null;
    reason?: string | null;
  };
  blockExplorerUrl?: string | null;
  checkedAt: string;
  configurationIssues?: string[];
}

export interface SystemServiceStatus {
  firebaseClient: { configured: boolean; message: string };
  firebaseAdmin: { configured: boolean; message: string };
  ipfs: { configured: boolean; provider: string; message: string };
  blockchain: { configured: boolean; chainId?: number; rpcUrl?: string; contractAddress?: string; message: string };
  issuerSigner: { configured: boolean; address?: string; message: string };
}
