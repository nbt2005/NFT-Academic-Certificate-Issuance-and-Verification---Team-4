const {spawnSync}=require('child_process');
const fs=require('fs');
fs.mkdirSync('docs',{recursive:true});
function run(args,file,extra={}){
  const r=spawnSync(process.execPath,['scripts/tool.js','hardhat',...args],{encoding:'utf8',env:{...process.env,EVM_VERSION:'shanghai',...extra}});
  const output=(r.stdout||'')+(r.stderr||'');if(file)fs.writeFileSync(file,output);process.stdout.write(output);if(r.status!==0)throw Error(`Failed: ${args.join(' ')}`);
}
run(['test'],'docs/test-hardhat.txt');
run(['test','--network','ganache'],'docs/test-results.txt');
run(['clean']);
run(['compile','--force'],null,{OPTIMIZER:'false'});
run(['run','scripts/gas.js','--network','ganache'],null,{OPTIMIZER:'false'});
run(['clean']);
run(['compile','--force'],null,{OPTIMIZER:'true'});
run(['run','scripts/gas.js','--network','ganache'],null,{OPTIMIZER:'true'});
run(['run','scripts/deploy.js','--network','ganache']);
fs.writeFileSync('docs/environment.json',JSON.stringify({date:new Date().toISOString(),hostNode:process.version,node:require('node/package.json').version,hardhat:require('hardhat/package.json').version,ethers:require('ethers').version,solc:require('solc').version(),ganache:require('ganache/package.json').version,chainId:1337,hardfork:'shanghai'},null,2));
const before=JSON.parse(fs.readFileSync('docs/gas-unoptimized.json'));
const after=JSON.parse(fs.readFileSync('docs/gas-optimized.json'));
fs.writeFileSync('docs/GAS.md','# Measured gas comparison\n\nSolidity 0.8.24, EVM Shanghai, Ganache chain 1337. Identical URI and JSON inputs, with a fresh deployment for each configuration. Optimizer enabled with runs=200. Receipt details are in gas-results.csv.\n\n| Operation | Optimizer disabled | Optimizer enabled | Reduction (%) |\n| --- | ---: | ---: | ---: |\n'+after.map(r=>{const b=before.find(x=>x.operation===r.operation);return `| ${r.operation} | ${b.gasUsed} | ${r.gasUsed} | ${((Number(b.gasUsed)-Number(r.gasUsed))/Number(b.gasUsed)*100).toFixed(2)} |`;}).join('\n')+'\n\nNegative values indicate increased gas. Reads through eth_call do not charge transaction fees. Fees are recorded in wei from receipts, not estimates.\n');
