const { ethers, artifacts, config: hardhatConfig } = require('hardhat');
const fs = require('fs');
async function main() {
  const [admin, issuer, student, outsider] = await ethers.getSigners();
  const c = await (await ethers.getContractFactory('AcademicCertificate')).deploy();
  await c.waitForDeployment();
  const config = { address: await c.getAddress(), chainId: Number((await ethers.provider.getNetwork()).chainId), rpcUrl: process.env.GANACHE_RPC || 'http://127.0.0.1:7545', evmVersion: hardhatConfig.solidity.compilers[0].settings.evmVersion, abi: (await artifacts.readArtifact('AcademicCertificate')).abi };
  fs.mkdirSync('frontend/src', {recursive:true}); fs.mkdirSync('docs', {recursive:true});
  fs.writeFileSync('frontend/src/deployment.json', JSON.stringify(config, null, 2));
  const accounts = { admin: admin.address, issuer: issuer.address, student: student.address, outsider: outsider.address };
  fs.writeFileSync('docs/demo-accounts.json', JSON.stringify(accounts, null, 2));
  console.log('Fresh demo contract:', config.address, '\nChain:', config.chainId, '\nAccounts (addresses only):', accounts);
  console.log('Admin must grant ISSUER_ROLE in the UI before minting.');
}
main().catch(e => { console.error(e); process.exitCode=1; });
