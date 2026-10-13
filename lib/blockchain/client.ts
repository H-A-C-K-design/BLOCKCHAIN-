import { createPublicClient, createWalletClient, http, PublicClient, WalletClient, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export function isBlockchainConfigured(): boolean {
  return Boolean(process.env.RPC_URL && process.env.CONTRACT_ADDRESS);
}

export function isSignerConfigured(): boolean {
  return Boolean(process.env.ISSUER_SIGNER_PRIVATE_KEY);
}

export function getContractAddress(): `0x${string}` | null {
  const addr = process.env.CONTRACT_ADDRESS;
  if (!addr || !addr.startsWith("0x")) return null;
  return addr as `0x${string}`;
}

export function getChainId(): number {
  return parseInt(process.env.CHAIN_ID || "11155111", 10);
}

export function getPublicClient(): PublicClient | null {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) return null;

  const chainId = getChainId();
  const customChain = defineChain({
    id: chainId,
    name: "MemoCheck EVM Network",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
    },
  });

  return createPublicClient({
    chain: customChain,
    transport: http(rpcUrl),
  });
}

export function getWalletClient(): { walletClient: WalletClient; accountAddress: `0x${string}` } | null {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.ISSUER_SIGNER_PRIVATE_KEY;
  if (!rpcUrl || !privateKey) return null;

  try {
    const formattedKey = (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as `0x${string}`;
    const account = privateKeyToAccount(formattedKey);
    const chainId = getChainId();

    const customChain = defineChain({
      id: chainId,
      name: "MemoCheck EVM Network",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: {
        default: { http: [rpcUrl] },
      },
    });

    const walletClient = createWalletClient({
      account,
      chain: customChain,
      transport: http(rpcUrl),
    });

    return { walletClient, accountAddress: account.address };
  } catch (err) {
    console.error("Failed to initialize EVM wallet client:", err);
    return null;
  }
}

export function getBlockExplorerTxUrl(txHash: string): string | null {
  if (!txHash) return null;
  const template = process.env.BLOCK_EXPLORER_TX_URL_TEMPLATE || "https://sepolia.etherscan.io/tx/{txHash}";
  return template.replace("{txHash}", txHash);
}
