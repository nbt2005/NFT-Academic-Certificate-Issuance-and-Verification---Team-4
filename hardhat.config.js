require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-chai-matchers');
const { subtask } = require('hardhat/config');
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require('hardhat/builtin-tasks/task-names');
// Pinned npm solc avoids an external compiler download during demo setup.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(async ({solcVersion}, hre, next) => {
  if (solcVersion === '0.8.24') return { compilerPath: require.resolve('solc/soljson.js'), isSolcJs: true, version: solcVersion, longVersion: require('solc').version() };
  return next();
});
module.exports = {
  solidity: { version: '0.8.24', settings: { evmVersion: process.env.EVM_VERSION || 'shanghai', optimizer: { enabled: process.env.OPTIMIZER !== 'false', runs: 200 } } },
  networks: { hardhat: { throwOnTransactionFailures: false }, ganache: { url: process.env.GANACHE_RPC || 'http://127.0.0.1:7545', chainId: Number(process.env.GANACHE_CHAIN_ID || 1337), accounts: 'remote' } },
  mocha: { timeout: 40000 }
};
