/**
 * MemoCheck Smart Contract Deployment Script
 * Deploys MemoCheckCertificates to the network specified by RPC_URL and ISSUER_SIGNER_PRIVATE_KEY
 */
const fs = require('fs');
const path = require('path');
const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.ISSUER_SIGNER_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    console.error('Missing configuration:');
    if (!rpcUrl) console.error(' - RPC_URL environment variable is not set');
    if (!privateKey) console.error(' - ISSUER_SIGNER_PRIVATE_KEY environment variable is not set');
    console.error('\nUsage: RPC_URL=https://... ISSUER_SIGNER_PRIVATE_KEY=0x... node contracts/scripts/deploy.cjs');
    process.exit(1);
  }

  const artifactPath = path.resolve(__dirname, '../out/MemoCheckCertificates.json');
  if (!fs.existsSync(artifactPath)) {
    console.log('Artifact not found. Compiling first...');
    const { compile } = require('./compile.cjs');
    compile();
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedKey);

  console.log(`Deploying from account: ${account.address}`);
  console.log(`Connecting to RPC: ${rpcUrl}`);

  const publicClient = createPublicClient({
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    transport: http(rpcUrl),
  });

  console.log('Sending deployment transaction...');
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [],
  });

  console.log(`Deployment transaction submitted. Tx Hash: ${hash}`);
  console.log('Waiting for transaction receipt...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`\nContract successfully deployed!`);
  console.log(`Contract Address: ${receipt.contractAddress}`);
  console.log(`Block Number: ${receipt.blockNumber}`);
  console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
  console.log(`\nNext steps:`);
  console.log(`Set CONTRACT_ADDRESS=${receipt.contractAddress} in your .env.local file.`);
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
