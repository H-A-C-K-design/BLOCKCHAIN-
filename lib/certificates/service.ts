import { adminDb, isFirebaseAdminConfigured } from "../firebase/admin";
import {
  saveCertificateRecord,
  getCertificateRecord,
  updateCertificateStatus,
  logAuditEvent,
} from "../db/certificateStore";
import { calculateSha256Server, areHashesEqual } from "../crypto/sha256";
import { uploadPdfToIpfs, isIpfsConfigured } from "../ipfs/provider";
import {
  readOnChainCertificate,
  submitIssueCertificateTx,
  submitRevokeCertificateTx,
} from "../blockchain/contract";
import {
  isBlockchainConfigured,
  isSignerConfigured,
  getBlockExplorerTxUrl,
  getChainId,
  getContractAddress,
} from "../blockchain/client";
import {
  CertificateRecord,
  VerificationEvidence,
  CertificateStatus,
  AuthenticatedUser,
} from "../types/certificate";

/**
 * Generates an institutional certificate ID.
 * Format: MC-YYYY-<alphanumeric>
 */
export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestampPart = Date.now().toString(36).substring(4).toUpperCase();
  return `MC-${year}-${randomPart}${timestampPart}`;
}

export interface IssueCertificateInput {
  studentName: string;
  studentIdRef: string;
  course: string;
  award: string;
  issueDate: string;
  expiryDate?: string | null;
  institutionName?: string;
  pdfBuffer: Buffer;
  pdfFileName: string;
}

export interface IssueCertificateResult {
  success: boolean;
  certificateId?: string;
  record?: CertificateRecord;
  transactionHash?: string;
  ipfsCid?: string;
  warnings?: string[];
  error?: string;
}

/**
 * Executes certificate issuance workflow:
 * 1. Hashes exact PDF bytes with SHA-256
 * 2. Uploads to IPFS (if configured)
 * 3. Submits on-chain transaction (if configured)
 * 4. Stores metadata record in Firestore and local persistent store
 */
export async function issueCertificateWorkflow(
  input: IssueCertificateInput,
  user: AuthenticatedUser
): Promise<IssueCertificateResult> {
  const warnings: string[] = [];
  const certificateId = generateCertificateId();

  // 1. Calculate SHA-256 over exact uploaded bytes
  const pdfHash = calculateSha256Server(input.pdfBuffer);

  // 2. Upload to IPFS if configured
  let ipfsCid: string | null = null;
  let ipfsGatewayUrl: string | null = null;
  if (isIpfsConfigured()) {
    const ipfsRes = await uploadPdfToIpfs(input.pdfBuffer, `${certificateId}.pdf`, {
      certificateId,
      course: input.course,
      award: input.award,
    });
    if (ipfsRes.success && ipfsRes.cid) {
      ipfsCid = ipfsRes.cid;
      ipfsGatewayUrl = ipfsRes.gatewayUrl || null;
    } else {
      warnings.push(`IPFS upload incomplete: ${ipfsRes.error}`);
    }
  } else {
    warnings.push("IPFS provider not configured in environment; file was not uploaded to IPFS.");
  }

  // 3. Submit transaction to Smart Contract if configured
  let transactionHash: string | null = null;
  let contractAddress: string | null = null;
  let chainId: number | null = null;

  if (isBlockchainConfigured() && isSignerConfigured()) {
    const txRes = await submitIssueCertificateTx(certificateId, pdfHash, ipfsCid || "");
    if (!txRes.success) {
      return {
        success: false,
        error: `Blockchain transaction failed: ${txRes.error}`,
      };
    }
    transactionHash = txRes.txHash || null;
    contractAddress = getContractAddress();
    chainId = getChainId();
  } else {
    if (!isBlockchainConfigured()) {
      warnings.push("Blockchain is not configured; smart contract registration was skipped.");
    } else if (!isSignerConfigured()) {
      warnings.push("Signer key is not configured; unable to sign blockchain transaction.");
    }
  }

  const now = new Date().toISOString();
  const record: CertificateRecord = {
    certificateId,
    studentName: input.studentName,
    studentIdRef: input.studentIdRef,
    course: input.course,
    award: input.award,
    issueDate: input.issueDate,
    expiryDate: input.expiryDate || null,
    pdfHash,
    ipfsCid,
    ipfsGatewayUrl,
    transactionHash,
    contractAddress,
    chainId,
    issuerAddress: null,
    issuerUid: user.uid,
    issuerEmail: user.email,
    institutionId: user.institutionId || "institution-main",
    institutionName: input.institutionName || user.institutionName || "University Registry",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  // 4. Save record in database (Firestore with local persistent fallback)
  const saveResult = await saveCertificateRecord(record);
  await logAuditEvent({
    type: "CERTIFICATE_ISSUED",
    certificateId,
    issuerUid: user.uid,
    issuerEmail: user.email,
    institutionId: record.institutionId,
    pdfHash,
    transactionHash,
    timestamp: now,
  });

  if (saveResult.notice) {
    warnings.push(saveResult.notice);
  }

  return {
    success: true,
    certificateId,
    record,
    transactionHash: transactionHash || undefined,
    ipfsCid: ipfsCid || undefined,
    warnings,
  };
}

/**
 * Revokes a certificate by writing revocation to the contract and updating database.
 */
export async function revokeCertificateWorkflow(
  certificateId: string,
  reason: string,
  user: AuthenticatedUser
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  let txHash: string | undefined = undefined;

  // 1. Submit on-chain revocation if blockchain is configured
  if (isBlockchainConfigured() && isSignerConfigured()) {
    const txRes = await submitRevokeCertificateTx(certificateId, reason);
    if (!txRes.success) {
      return { success: false, error: txRes.error };
    }
    txHash = txRes.txHash;
  }

  const now = new Date().toISOString();

  // 2. Update database record (Firestore + persistent store)
  await updateCertificateStatus(certificateId, {
    status: "REVOKED",
    revokedAt: now,
    revocationReason: reason,
    revokedByUid: user.uid,
    updatedAt: now,
  });

  await logAuditEvent({
    type: "CERTIFICATE_REVOKED",
    certificateId,
    revokedByUid: user.uid,
    revokedByEmail: user.email,
    reason,
    txHash: txHash || null,
    timestamp: now,
  });

  return { success: true, txHash };
}

/**
 * Public Certificate Verification
 * Source of truth: Smart Contract when configured, backed by database metadata
 */
export async function verifyCertificateWorkflow(
  certificateId: string,
  suppliedPdfBuffer?: Buffer | null
): Promise<VerificationEvidence> {
  const checkedAt = new Date().toISOString();
  const configIssues: string[] = [];

  // Check blockchain configuration
  const chainConfigured = isBlockchainConfigured();
  if (!chainConfigured) {
    configIssues.push("Blockchain network or contract address is not configured.");
  }

  // 1. Query Smart Contract
  let onChainRecord = null;
  let chainQueryError: string | null = null;

  if (chainConfigured) {
    const chainRes = await readOnChainCertificate(certificateId);
    if (chainRes.error) {
      chainQueryError = chainRes.error;
    } else {
      onChainRecord = chainRes.record;
    }
  }

  // 2. Query certificate record from database for metadata
  let dbRecord: CertificateRecord | null = null;
  try {
    dbRecord = await getCertificateRecord(certificateId);
  } catch (err) {
    console.error("Database read error:", err);
  }

  // If blockchain error occurred and we couldn't query chain
  if (chainConfigured && chainQueryError) {
    return {
      status: "UNABLE_TO_VERIFY",
      message: `Unable to verify certificate on-chain: ${chainQueryError}`,
      certificateId,
      recordFound: Boolean(dbRecord),
      chainChecked: false,
      pdfUploaded: Boolean(suppliedPdfBuffer),
      checkedAt,
      configurationIssues: [chainQueryError],
    };
  }

  // If neither blockchain nor database is configured
  if (!chainConfigured && !isFirebaseAdminConfigured()) {
    return {
      status: "UNABLE_TO_VERIFY",
      message: "Verification system dependencies are not configured. Set up RPC_URL, CONTRACT_ADDRESS, and Firebase.",
      certificateId,
      recordFound: false,
      chainChecked: false,
      pdfUploaded: Boolean(suppliedPdfBuffer),
      checkedAt,
      configurationIssues: ["Blockchain not configured", "Firebase not configured"],
    };
  }

  // Determine existence:
  const existsOnChain = Boolean(onChainRecord?.exists);
  const existsInDb = Boolean(dbRecord);
  const recordFound = existsOnChain || existsInDb;

  if (!recordFound) {
    return {
      status: "INVALID",
      message: "No certificate record found for the provided Certificate ID.",
      certificateId,
      recordFound: false,
      chainChecked: chainConfigured,
      pdfUploaded: Boolean(suppliedPdfBuffer),
      checkedAt,
      configurationIssues: configIssues.length > 0 ? configIssues : undefined,
    };
  }

  // Determine revocation status
  const isRevoked = Boolean(onChainRecord?.revoked || dbRecord?.status === "REVOKED");
  const revocationReason = dbRecord?.revocationReason || null;
  const revokedAt = onChainRecord?.revokedAt
    ? new Date(onChainRecord.revokedAt * 1000).toISOString()
    : dbRecord?.revokedAt || null;

  if (isRevoked) {
    return {
      status: "REVOKED",
      message: "This certificate was officially REVOKED by the issuing institution.",
      certificateId,
      recordFound: true,
      chainChecked: chainConfigured,
      onChainRecord,
      pdfUploaded: Boolean(suppliedPdfBuffer),
      revocationDetails: {
        isRevoked: true,
        revokedAt,
        reason: revocationReason,
      },
      metadata: dbRecord
        ? {
            course: dbRecord.course,
            award: dbRecord.award,
            issueDate: dbRecord.issueDate,
            institutionName: dbRecord.institutionName || undefined,
          }
        : undefined,
      blockExplorerUrl: dbRecord?.transactionHash ? getBlockExplorerTxUrl(dbRecord.transactionHash) : null,
      checkedAt,
    };
  }

  // Determine target hash from chain or database
  const targetHash = onChainRecord?.pdfHash || dbRecord?.pdfHash || null;

  // If a PDF was supplied, calculate its hash and compare
  let pdfHashMatch: boolean | undefined = undefined;
  let computedHash: string | null = null;

  if (suppliedPdfBuffer) {
    computedHash = calculateSha256Server(suppliedPdfBuffer);
    if (targetHash) {
      pdfHashMatch = areHashesEqual(computedHash, targetHash);
      if (!pdfHashMatch) {
        return {
          status: "INVALID",
          message: "The uploaded PDF does not match the tamper-evident hash recorded for this certificate.",
          certificateId,
          recordFound: true,
          chainChecked: chainConfigured,
          onChainRecord,
          pdfUploaded: true,
          pdfHashMatch: false,
          computedHash,
          onChainHash: targetHash,
          checkedAt,
        };
      }
    }
  }

  // If we reach here, record exists, not revoked, and PDF (if supplied) matches!
  const blockExplorerUrl = dbRecord?.transactionHash ? getBlockExplorerTxUrl(dbRecord.transactionHash) : null;

  return {
    status: "VALID",
    message: suppliedPdfBuffer
      ? "Certificate is authentic. Blockchain record confirmed and file bytes match the recorded SHA-256 hash."
      : "Certificate record confirmed on the blockchain. (Upload the official PDF to verify byte-level file integrity.)",
    certificateId,
    recordFound: true,
    chainChecked: chainConfigured,
    onChainRecord,
    pdfUploaded: Boolean(suppliedPdfBuffer),
    pdfHashMatch,
    computedHash,
    onChainHash: targetHash,
    metadata: dbRecord
      ? {
          course: dbRecord.course,
          award: dbRecord.award,
          issueDate: dbRecord.issueDate,
          institutionName: dbRecord.institutionName || undefined,
        }
      : undefined,
    blockExplorerUrl,
    checkedAt,
    configurationIssues: configIssues.length > 0 ? configIssues : undefined,
  };
}
