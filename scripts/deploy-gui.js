// Older Ganache GUI releases do not support Shanghai's PUSH0 instruction.
// Compile for Paris without changing the Shanghai benchmark configuration.
const {spawnSync}=require('child_process');
const result=spawnSync(process.execPath,['scripts/tool.js','hardhat','run','scripts/deploy.js','--network','ganache'],{
  stdio:'inherit',env:{...process.env,EVM_VERSION:'paris'}
});
if(result.error)throw result.error;
process.exitCode=result.status??1;
