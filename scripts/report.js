const PDFDocument=require('pdfkit');
const fs=require('fs');
if(!fs.existsSync('docs/gas-optimized.json')||!fs.existsSync('docs/test-results.txt'))throw Error('Run npm run verify before generating the report.');
const optimized=JSON.parse(fs.readFileSync('docs/gas-optimized.json'));
const baseline=JSON.parse(fs.readFileSync('docs/gas-unoptimized.json'));
const env=JSON.parse(fs.readFileSync('docs/environment.json'));
const tests=fs.readFileSync('docs/test-results.txt','utf8').replace(/\u001b\[[0-9;]*m/g,'');
const count=tests.match(/(\d+) passing/)?.[1]||'see test log';
const doc=new PDFDocument({size:'A4',margin:48,bufferPages:true,autoFirstPage:false,info:{Title:'NFT Academic Certificate Issuance and Verification',Author:'Team 4'}});
doc.pipe(fs.createWriteStream('docs/report.pdf'));
const fonts=process.platform==='win32'?['C:/Windows/Fonts/arial.ttf','C:/Windows/Fonts/arialbd.ttf']:['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'];
doc.registerFont('Body',fonts[0]);doc.registerFont('Bold',fonts[1]);
function p(text){doc.font('Body').fontSize(10.5).fillColor('#243b36').text(text,48,doc.y,{width:499,lineGap:4});doc.moveDown(.6);}
function h(text){doc.font('Bold').fontSize(13).fillColor('#163f35').text(text,48,doc.y,{width:499});doc.moveDown(.5);}
function page(title){doc.addPage();doc.font('Bold').fontSize(9).fillColor('#54776b').text('TEAM 4     /     PROJECT 3     /     2026');doc.moveDown(1);doc.font('Bold').fontSize(24).fillColor('#152e29').text(title);doc.moveDown(.8);}
page('NFT Academic Certificate Issuance and Verification');
p('Nguyen Ba Thien • 29211164940\nNguyen Dang Thinh • 29210258195');
h('Problem and outcome');
p('The application binds academic certificates to student wallet addresses. Authorized institutions issue certificates, and anyone can check metadata integrity. Revocation invalidates a certificate while preserving the NFT and its history. The implementation combines one ERC-721 contract on Ganache with a Vite frontend and public JSON-RPC reads.');
h('Implemented scope');
p('Grant and remove issuer permissions; issue non-transferable NFTs; look up a token or student wallet; store an immutable URI and bytes32 hash; verify JSON from a URI or local file; revoke according to role; emit events; run automated tests; and compare compiler optimizer gas measurements. There is no backend, database, IPFS, marketplace, or cloud deployment.');
h('Team handover and presentation');
p('Thien explains the contract, access control, tests, and gas evidence. Thinh demonstrates the UI, MetaMask workflow, metadata, setup, and verification. Both members should reproduce the README workflow and explain the complete issue-to-revocation sequence. These are presentation responsibilities, not claims about authorship of individual lines.');
h('Reproducible environment');
p(`Node ${env.node}; Hardhat ${env.hardhat}; ethers ${env.ethers}; Ganache ${env.ganache}. Solidity 0.8.24, Shanghai EVM, chain ID 1337, and RPC localhost:7545. Dependency versions are pinned in package-lock.json. Each gas configuration uses a fresh contract deployment.`);
page('Architecture and access control');
h('Components');
p('Vite browser → ethers v6 → JSON-RPC → Ganache → AcademicCertificate. Public reads do not need a wallet. Writes use MetaMask through EIP-1193 and wait for a transaction receipt. Deployment exports only the ABI, address, RPC, and chain ID to the frontend, never private keys.');
h('Contract and storage');
p('AcademicCertificate inherits OpenZeppelin 5.0.2 ERC721 and AccessControl. Records contain student, issuer, metadataHash, uint64 issuedAt, and revoked. The URI is stored separately and has no update function. Only the hash is stored instead of the complete JSON. Student token lists retain revoked certificates for historical lookup.');
h('Permissions');
p('The deploying wallet receives DEFAULT_ADMIN_ROLE. Admins manage ISSUER_ROLE and can revoke any certificate. Minting requires ISSUER_ROLE, even for the admin. An issuer can revoke only its own certificates while it still holds the role. Removing the role disables both new issuance and issuer-based revocation.');
h('Non-transferability and receiver callbacks');
p('The OpenZeppelin 5 _update override rejects transfers when both the previous and next owner are nonzero. transferFrom and both safeTransferFrom overloads remain blocked after approve or setApprovalForAll. No burn function is exposed. Mint writes record state and student indexes before _safeMint; a rejecting receiver rolls back the complete transaction.');
h('Events and inheritance');
p('CertificateIssued includes tokenId, student, issuer, hash, and URI; CertificateRevoked includes tokenId and actor. RoleGranted, RoleRevoked, and Transfer are inherited. The frontend obtains token IDs from receipt events instead of predicting the counter.');
const cy=doc.y;
for(const [x,w,label,y]of [[48,225,'ERC721',cy],[322,225,'AccessControl',cy],[168,260,'AcademicCertificate',cy+65]]){doc.roundedRect(x,y,w,32,5).fillAndStroke('#eef3ed','#c4d5cb');doc.font('Bold').fontSize(10).fillColor('#254f43').text(label,x,y+10,{width:w,align:'center'});}
doc.moveTo(160.5,cy+32).lineTo(298,cy+65).moveTo(434.5,cy+32).lineTo(298,cy+65).strokeColor('#6c8d7e').stroke();doc.y=cy+110;doc.x=48;
page('Metadata and user workflow');
h('JSON → hash → issue');
p('The form serializes string fields in name, course, grade, date order, with date formatted YYYY-MM-DD. The issuer downloads UTF-8 JSON, copies it into public/metadata, and supplies an HTTP URI. The frontend fetches that file, checks its fields against the form, and hashes the exact text with keccak256 before issuing. A sample file may contain a trailing newline; its actual bytes are always hashed.');
h('Verification and revocation');
p('Token lookup reads the record and fetches metadata, or reads a selected comparison file. Full validity requires an existing, unrevoked token, valid JSON, and a matching hash. Unavailable metadata remains unverified. Changing a grade, whitespace, or key order can change the hash. Revocation preserves ownerOf and the student index.');
if(fs.existsSync('docs/ui-overview.png')){const y=doc.y;doc.image('docs/ui-overview.png',48,y,{fit:[499,245],align:'left'});doc.y=y+255;p('Figure 1. English frontend after automated integration testing. Full desktop and mobile screenshots are retained in docs/ui-desktop.png and docs/ui-mobile.png.');}
p('The page provides wallet/network status, public verification, issuance, and administration/revocation. Write buttons follow wallet roles and network state; the contract remains the authority for access control.');
page('Verification results and limitations');
h('Recorded execution');
p(`The Ganache suite recorded ${count} passing tests in docs/test-results.txt. The separate Hardhat log is docs/test-hardhat.txt. Each test deploys independently using local accounts; the Ganache suite does not rely on hardhat_reset, setBalance, or Hardhat-only fixtures.`);
h('Coverage');
p('Successful paths cover admin and interfaces, issuance, ownership, URI, hash, timestamp, events, multiple student certificates, empty lists, correct and incorrect hashes, and revocation with NFT retention. Revert cases cover unauthorized minting/role grants, unrelated issuer or student revocation, missing tokens, repeated revocation, zero address/hash, empty URI, transfers, approvals/operators, and rejecting receivers. Three mined failed transactions also prove status 0 and state rollback.');
const ui=fs.existsSync('docs/ui-results.txt')?fs.readFileSync('docs/ui-results.txt','utf8'):'';
p(ui.includes('1 passed')?'The browser integration scenario passed: public lookup, role grants, wallet changes, minting, wallet lookup, tampered/invalid JSON, unavailable metadata, revocation, wrong network, rejected signing, and mobile layout. It uses a simulated EIP-1193 wallet while submitting real transactions to local Ganache.':'No passing browser integration result is currently recorded. Contract tests alone do not verify extension behavior.');
h('Manual verification boundary');
p('Real MetaMask key import, extension network switching, signing rejection, and presentation rehearsal remain manual checks in docs/UI-CHECKLIST.md. docs/DEMO.md contains a ten-minute two-person script. Automated wallet tests do not claim that the actual extension or two full rehearsals have been verified.');
h('Trust and local-chain visibility');
p('A hash proves unchanged data, not truthful academic claims. Authorized issuers can submit false data; a compromised admin can change roles. Local metadata depends on the server and CORS; student lists are not paginated. CLI and GUI workspaces normally have independent histories. Writes appear only on the RPC receiving them; eth_call lookups do not create transactions. This pinned academic toolchain is not a production deployment.');
page('Measured gas and handover');
h('Method');
p('Both runs use Solidity 0.8.24, Shanghai, and Ganache chain 1337. Compile with optimizer disabled and enabled at runs=200, deploy fresh contracts, and use identical JSON/URI inputs. Record deployment, grantRole, first mint, subsequent mint for the same student, revoke, and revokeRole. CSV evidence retains gasUsed, gasPrice, fee in wei, transaction hash, block, and compiler.');
const y=doc.y,xs=[48,203,308,413],widths=[155,105,105,130];
function row(values,i){const yy=y+i*29;doc.rect(48,yy,499,29).fill(i===0?'#254f43':i%2?'#eef3ed':'#ffffff');values.forEach((v,k)=>doc.font(i===0?'Bold':'Body').fontSize(9).fillColor(i===0?'white':'#233c34').text(String(v),xs[k]+7,yy+9,{width:widths[k]-12,lineBreak:false}));}
row(['Operation','Disabled','Enabled','Reduction (%)'],0);
optimized.forEach((r,i)=>{const b=baseline.find(x=>x.operation===r.operation);row([r.operation,Number(b.gasUsed).toLocaleString('en-US'),Number(r.gasUsed).toLocaleString('en-US'),((Number(b.gasUsed)-Number(r.gasUsed))/Number(b.gasUsed)*100).toFixed(2)],i+1);});doc.y=y+7*29+16;
p('Reduction = (disabled gas − enabled gas) / disabled gas × 100. Negative values mean increased gas. Local measurements are not a fee guarantee for other networks. eth_call charges no transaction fee but still consumes node computation.');
h('Run and inspect');
p('npm ci → npm run chain → npm run verify → npm run dev. Verify leaves a fresh demo contract; grant issuer permission before minting. Build with npm run build and regenerate this report with npm run report. npm run transactions inspects current-chain history and checks saved receipts. Use the GUI workflow in README when presentation transactions must appear in the desktop workspace.');
h('References');
doc.font('Body').fontSize(8.5).fillColor('#244c3f');for(const url of ['https://v2.hardhat.org/hardhat-runner/docs/config','https://docs.openzeppelin.com/contracts/5.x/api/token/erc721','https://docs.openzeppelin.com/contracts/5.x/access-control','https://archive.trufflesuite.com/docs/ganache/reference/cli-options/'])doc.text(url,48,doc.y,{width:499,link:url,lineGap:5});
const range=doc.bufferedPageRange();if(range.count!==5)throw Error(`Report overflow: ${range.count} pages`);
for(let i=0;i<range.count;i++){doc.switchToPage(i);doc.font('Body').fontSize(8).fillColor('#6f8278').text(`Academic Certificate • Team 4                                            ${i+1} / ${range.count}`,48,795,{lineBreak:false});}
doc.end();console.log('Generated docs/report.pdf (5 pages, English).');
