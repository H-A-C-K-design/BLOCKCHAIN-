/**
 * MemoCheck Solidity Contract Compiler
 * Compiles MemoCheckCertificates.sol and generates ABI + bytecode
 */
const fs = require('fs');
const path = require('path');
const solc = require('solc');

function compile() {
  const contractPath = path.resolve(__dirname, '../src/MemoCheckCertificates.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'MemoCheckCertificates.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'],
        },
      },
    },
  };

  console.log('Compiling MemoCheckCertificates.sol with solc...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    for (const err of output.errors) {
      if (err.severity === 'error') {
        hasError = true;
        console.error('Compiler Error:', err.formattedMessage);
      } else {
        console.warn('Compiler Warning:', err.formattedMessage);
      }
    }
    if (hasError) {
      throw new Error('Solidity compilation failed.');
    }
  }

  const contractData = output.contracts['MemoCheckCertificates.sol']['MemoCheckCertificates'];
  const artifact = {
    contractName: 'MemoCheckCertificates',
    abi: contractData.abi,
    bytecode: '0x' + contractData.evm.bytecode.object,
    deployedBytecode: '0x' + contractData.evm.deployedBytecode.object,
    compilerVersion: solc.version(),
    updatedAt: new Date().toISOString(),
  };

  // Write to contracts/out
  const outDir = path.resolve(__dirname, '../out');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'MemoCheckCertificates.json'), JSON.stringify(artifact, null, 2));

  // Also write directly to lib/blockchain for Next.js import
  const libDir = path.resolve(__dirname, '../../lib/blockchain');
  fs.mkdirSync(libDir, { recursive: true });
  fs.writeFileSync(path.join(libDir, 'MemoCheckCertificates.json'), JSON.stringify(artifact, null, 2));

  console.log('Successfully compiled MemoCheckCertificates.sol!');
  console.log('Artifact saved to:');
  console.log(' - ' + path.join(outDir, 'MemoCheckCertificates.json'));
  console.log(' - ' + path.join(libDir, 'MemoCheckCertificates.json'));
}

if (require.main === module) {
  compile();
}

module.exports = { compile };
