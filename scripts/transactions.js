const { ethers } = require('ethers');
const fs = require('fs');
const deployment = require('../frontend/src/deployment.json');
async function main() {
  const rpc = process.env.GANACHE_RPC || deployment.rpcUrl;
  const provider = new ethers.JsonRpcProvider(rpc);
  console.log('RPC:', rpc);
  const network = await provider.getNetwork();
  const height = await provider.getBlockNumber();
  console.log('Chain ID:', network.chainId.toString(), '\nLatest block:', height);
  const rows = [];
  for (let n = Math.max(0, height - 4); n <= height; n++) {
    const block = await provider.getBlock(n);
    for (const hash of block.transactions) {
      const receipt = await provider.getTransactionReceipt(hash);
      rows.push({ block: n, hash, status: receipt.status === 1 ? 'success' : 'reverted', gasUsed: receipt.gasUsed.toString(), contract: receipt.contractAddress || '' });
    }
  }
  console.table(rows);
  const file = 'docs/gas-results.csv';
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
    const header = lines.shift().split(',');
    const saved = [];
    for (const line of lines) {
      const values = line.split(',');
      const hash = values[header.indexOf('txHash')];
      const receipt = await provider.getTransactionReceipt(hash);
      const expectedGas = values[header.indexOf('gasUsed')];
      const matches = receipt && receipt.gasUsed.toString() === expectedGas;
      saved.push({ operation: values[header.indexOf('operation')], optimizer: values[header.indexOf('optimizer')], hash, evidence: receipt ? (matches ? 'receipt matches saved gas' : 'receipt differs') : 'not on this chain' });
    }
    console.log('Saved gas evidence on the currently selected chain:');
    console.table(saved);
  }
  console.log('Reads use eth_call and do not add transactions. A separate GUI workspace does not display this CLI chain automatically.');
  provider.destroy();
}
main().catch(e => { console.error('Unable to inspect the selected RPC:', e.shortMessage || e.message); process.exitCode = 1; });
