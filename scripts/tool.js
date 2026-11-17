// Run pinned Node 20 for Hardhat, Ganache and Vite, regardless of host Node.
const {spawnSync}=require('child_process');
const path=require('path');
const node=path.resolve('node_modules/node/bin/node.exe');
const exe=require('fs').existsSync(node)?node:path.resolve('node_modules/node/bin/node');
const commands={hardhat:'node_modules/hardhat/internal/cli/cli.js',ganache:'node_modules/ganache/dist/node/cli.js',vite:'node_modules/vite/bin/vite.js'};
const [tool,...args]=process.argv.slice(2);if(!commands[tool])throw Error('Unknown tool');
const result=spawnSync(exe,[commands[tool],...args],{stdio:'inherit',env:process.env});if(result.error)throw result.error;process.exitCode=result.status||0;
