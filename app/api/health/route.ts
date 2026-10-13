import { NextResponse } from "next/server";
import { isFirebaseClientConfigured } from "@/lib/firebase/client";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isIpfsConfigured, getIpfsProviderName } from "@/lib/ipfs/provider";
import {
  isBlockchainConfigured,
  isSignerConfigured,
  getContractAddress,
  getChainId,
} from "@/lib/blockchain/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const contractAddr = getContractAddress();
  const chainId = getChainId();
  const ipfsProvider = getIpfsProviderName();

  const status = {
    firebaseClient: {
      configured: isFirebaseClientConfigured(),
      message: isFirebaseClientConfigured()
        ? "Firebase Web Client is configured."
        : "Missing NEXT_PUBLIC_FIREBASE_* environment variables.",
    },
    firebaseAdmin: {
      configured: isFirebaseAdminConfigured(),
      message: isFirebaseAdminConfigured()
        ? "Firebase Admin SDK is configured."
        : "Missing FIREBASE_ADMIN_* server environment credentials.",
    },
    ipfs: {
      configured: isIpfsConfigured(),
      provider: ipfsProvider,
      message: isIpfsConfigured()
        ? `IPFS integration configured via ${ipfsProvider}.`
        : "Missing IPFS_API_TOKEN environment variable.",
    },
    blockchain: {
      configured: isBlockchainConfigured(),
      chainId: chainId,
      contractAddress: contractAddr || undefined,
      message: isBlockchainConfigured()
        ? `Connected to network chain ID ${chainId} at contract ${contractAddr}.`
        : "Missing RPC_URL or CONTRACT_ADDRESS environment variables.",
    },
    issuerSigner: {
      configured: isSignerConfigured(),
      message: isSignerConfigured()
        ? "Server issuer signer private key is present."
        : "Missing ISSUER_SIGNER_PRIVATE_KEY for signing on-chain transactions.",
    },
  };

  const allOperational =
    status.firebaseClient.configured &&
    status.firebaseAdmin.configured &&
    status.ipfs.configured &&
    status.blockchain.configured &&
    status.issuerSigner.configured;

  return NextResponse.json({
    status: allOperational ? "operational" : "partial_configuration",
    timestamp: new Date().toISOString(),
    services: status,
  });
}
