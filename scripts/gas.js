const {ethers,config} = require('hardhat');
const fs = require('fs');
async function main() {
  if(config.solidity.compilers[0].settings.evmVersion !== 'shanghai') throw Error('Gas evidence requires EVM Shanghai. Use npm run verify on the documented Ganache CLI.');
  if ((await ethers.provider.getNetwork()).chainId !== 1337n) throw Error('Gas evidence requires Ganache chain 1337');
  const [admin, issuer, student] = await ethers.getSigners();
  const rows=[];
  async function record(operation, tx) {
    const r=await tx.wait();
    rows.push({optimizer:process.env.OPTIMIZER !== 'false',compiler:require('solc').version(),evm:'shanghai',operation,gasUsed:r.gasUsed.toString(),gasPrice:r.gasPrice.toString(),feeWei:r.fee.toString(),txHash:r.hash,block:r.blockNumber});
  }
  const c=await (await ethers.getContractFactory('AcademicCertificate')).deploy();
  await record('deploy', c.deploymentTransaction());
  const role=await c.ISSUER_ROLE();
  await record('grantRole',await c.grantRole(role,issuer.address));
  const uri='http://localhost:5173/metadata/cert-001.json';
  const raw=fs.readFileSync('frontend/public/metadata/cert-001.json','utf8');
  for (const operation of ['mintFirst','mintNext']) await record(operation,await c.connect(issuer).issueCertificate(student.address,uri,ethers.keccak256(ethers.toUtf8Bytes(raw))));
  await record('revoke',await c.connect(issuer).revokeCertificate(1));
  await record('revokeRole',await c.revokeRole(role,issuer.address));
  fs.mkdirSync('docs',{recursive:true});
  const file=`docs/gas-${process.env.OPTIMIZER === 'false' ? 'unoptimized':'optimized'}.json`;
  fs.writeFileSync(file,JSON.stringify(rows,null,2));
  const all=['unoptimized','optimized'].flatMap(x=>fs.existsSync(`docs/gas-${x}.json`)?JSON.parse(fs.readFileSync(`docs/gas-${x}.json`)):[]);
  fs.writeFileSync('docs/gas-results.csv',Object.keys(rows[0]).join(',')+'\n'+all.map(r=>Object.values(r).join(',')).join('\n')+'\n');
  console.table(rows);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
