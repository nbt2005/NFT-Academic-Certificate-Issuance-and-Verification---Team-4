const {spawnSync}=require('child_process');
const fs=require('fs');
fs.mkdirSync('docs',{recursive:true});
const r=spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test'],{encoding:'utf8',env:process.env});
const output=(r.stdout||'')+(r.stderr||'');fs.writeFileSync('docs/ui-results.txt',output);process.stdout.write(output);if(r.error)throw r.error;process.exitCode=r.status||0;
