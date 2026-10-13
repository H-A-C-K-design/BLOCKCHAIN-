import { parseAbiItem } from "viem";
import { getPublicClient, getWalletClient, getContractAddress, isBlockchainConfigured, isSignerConfigured } from "./client";

export const MEMOCHECK_ABI = [
  {
    type: "function",
    name: "issueCertificate",
    stateMutability: "nonpayable",
    inputs: [
      { name: "certificateId", type: "string" },
      { name: "pdfHash", type: "bytes32" },
      { name: "ipfsCid", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeCertificate",
    stateMutability: "nonpayable",
    inputs: [
      { name: "certificateId", type: "string" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getCertificate",
    stateMutability: "view",
    inputs: [{ name: "certificateId", type: "string" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "pdfHash", type: "bytes32" },
      { name: "issuer", type: "address" },
      { name: "issuedAt", type: "uint64" },
      { name: "revoked", type: "bool" },
      { name: "revokedAt", type: "uint64" },
      { name: "ipfsCid", type: "string" },
    ],
  },
  {
    type: "function",
    name: "verifyCertificate",
    stateMutability: "view",
    inputs: [
      { name: "certificateId", type: "string" },
      { name: "suppliedHash", type: "bytes32" },
    ],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "hashMatches", type: "bool" },
      { name: "isRevoked", type: "bool" },
      { name: "issuedAt", type: "uint64" },
      { name: "issuer", type: "address" },
    ],
  },
  {
    type: "function",
    name: "authorizedIssuers",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "totalIssued",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalRevoked",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export interface OnChainCertificateRecord {
  exists: boolean;
  pdfHash: string;
  issuer: string;
  issuedAt: number;
  revoked: boolean;
  revokedAt: number;
  ipfsCid: string;
}

/**
 * Reads certificate record directly from smart contract.
 */
export async function readOnChainCertificate(
  certificateId: string
): Promise<{ record: OnChainCertificateRecord | null; error: string | null }> {
  if (!isBlockchainConfigured()) {
    return {
      record: null,
      error: "Blockchain is not configured. Please supply RPC_URL and CONTRACT_ADDRESS in environment variables.",
    };
  }

  const client = getPublicClient();
  const contractAddress = getContractAddress();

  if (!client || !contractAddress) {
    return { record: null, error: "Public client or contract address is unavailable." };
  }

  try {
    const result = await client.readContract({
      address: contractAddress,
      abi: MEMOCHECK_ABI,
      functionName: "getCertificate",
      args: [certificateId],
    });

    const [exists, pdfHash, issuer, issuedAt, revoked, revokedAt, ipfsCid] = result as [
      boolean,
      `0x${string}`,
      `0x${string}`,
      bigint,
      boolean,
      bigint,
      string,
    ];

    if (!exists) {
      return { record: null, error: null };
    }

    return {
      record: {
        exists: true,
        pdfHash: pdfHash,
        issuer: issuer,
        issuedAt: Number(issuedAt),
        revoked: revoked,
        revokedAt: Number(revokedAt),
        ipfsCid: ipfsCid,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error reading smart contract";
    return { record: null, error: `Smart contract query error: ${message}` };
  }
}

/**
 * Submits an on-chain transaction to register a certificate.
 */
export async function submitIssueCertificateTx(
  certificateId: string,
  pdfHash: `0x${string}`,
  ipfsCid: string = ""
): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
  if (!isBlockchainConfigured()) {
    return { success: false, error: "Blockchain is not configured (RPC_URL or CONTRACT_ADDRESS missing)." };
  }
  if (!isSignerConfigured()) {
    return { success: false, error: "Issuer signer is not configured (ISSUER_SIGNER_PRIVATE_KEY missing)." };
  }

  const wallet = getWalletClient();
  const publicClient = getPublicClient();
  const contractAddress = getContractAddress();

  if (!wallet || !publicClient || !contractAddress) {
    return { success: false, error: "Blockchain wallet, client, or contract address is unavailable." };
  }

  try {
    const hash = await wallet.walletClient.writeContract({
      address: contractAddress,
      abi: MEMOCHECK_ABI,
      functionName: "issueCertificate",
      args: [certificateId, pdfHash, ipfsCid],
      account: wallet.walletClient.account!,
      chain: wallet.walletClient.chain,
    });

    // Wait for transaction receipt to confirm execution on chain
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "reverted") {
      return { success: false, error: "Smart contract transaction reverted." };
    }

    return { success: true, txHash: hash };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Contract write failed";
    return { success: false, error: `Transaction failed: ${message}` };
  }
}

/**
 * Submits an on-chain transaction to revoke a certificate.
 */
export async function submitRevokeCertificateTx(
  certificateId: string,
  reason: string
): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
  if (!isBlockchainConfigured()) {
    return { success: false, error: "Blockchain is not configured." };
  }
  if (!isSignerConfigured()) {
    return { success: false, error: "Issuer signer is not configured." };
  }

  const wallet = getWalletClient();
  const publicClient = getPublicClient();
  const contractAddress = getContractAddress();

  if (!wallet || !publicClient || !contractAddress) {
    return { success: false, error: "Blockchain clients unavailable." };
  }

  try {
    const hash = await wallet.walletClient.writeContract({
      address: contractAddress,
      abi: MEMOCHECK_ABI,
      functionName: "revokeCertificate",
      args: [certificateId, reason],
      account: wallet.walletClient.account!,
      chain: wallet.walletClient.chain,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "reverted") {
      return { success: false, error: "Smart contract revocation transaction reverted." };
    }

    return { success: true, txHash: hash };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Revocation transaction failed";
    return { success: false, error: `Revocation failed: ${message}` };
  }
}
