import {JsonRpcProvider,BrowserProvider,Contract,keccak256,toUtf8Bytes,getAddress,ZeroHash} from 'ethers';
import deployment from './deployment.json';
import './style.css';
const $=id=>document.getElementById(id);
const rpc=new JsonRpcProvider(deployment.rpcUrl, deployment.chainId,{staticNetwork:true});
const read=new Contract(deployment.address||'0x0000000000000000000000000000000000000000',deployment.abi,rpc);
let signer, account, correctNetwork=false, admin=false, issuer=false, ready=false, busy=false, epoch=0;
const role=keccak256(toUtf8Bytes('ISSUER_ROLE'));
const chainHex=`0x${deployment.chainId.toString(16)}`;
function notice(message,error=false){$('notice').textContent=message;$('notice').className=error?'error':'';}
function errorMessage(e){
  if(e.code===4001||e.code==='ACTION_REJECTED')return 'You rejected the wallet request.';
  if(e.code==='INSUFFICIENT_FUNDS')return 'The wallet does not have enough demo ETH to pay the transaction fee.';
  if(['NETWORK_ERROR','SERVER_ERROR','TIMEOUT'].includes(e.code)||e instanceof TypeError&&e.message.includes('fetch'))return 'Unable to connect to the RPC or URI. Check Ganache, the web server, and the configured addresses.';
  const messages={AccessControlUnauthorizedAccount:'This wallet is not authorized to perform this action.',UnauthorizedRevocation:'Only an admin or the original issuer with an active role can revoke this certificate.',AlreadyRevoked:'This certificate has already been revoked.',ERC721NonexistentToken:'The token does not exist.',InvalidStudent:'The student address must not be the zero address.',EmptyURI:'The URI must not be empty.',EmptyHash:'The hash must not be empty.',NonTransferable:'Certificates cannot be transferred.',ERC721InvalidReceiver:'The recipient contract does not support ERC-721.'};
  let name=e.revert?.name;
  for(const data of [e.data,e.info?.error?.data?.result,e.info?.error?.data])if(typeof data==='string'){try{name=read.interface.parseError(data)?.name||name;}catch{}}
  return messages[name]||e.reason||name||e.shortMessage||e.message||'Unable to complete the action.';
}
function buttons(){document.querySelectorAll('[data-write]').forEach(b=>{const kind=b.dataset.write;b.disabled=busy||!ready||!correctNetwork||!signer||!(kind==='admin'?admin:kind==='issuer'?issuer:admin||issuer);});$('connect').disabled=busy;}
async function guard(fn){try{await fn();}catch(e){notice(errorMessage(e),true);}}
function positive(id){const raw=$(id).value.trim();if(!/^[1-9]\d*$/.test(raw))throw Error('Token ID must be a positive integer.');return BigInt(raw);}
function metadata(){const obj={name:$('name').value.trim(),course:$('course').value.trim(),grade:$('grade').value.trim(),date:$('date').value};if(Object.values(obj).some(x=>!x))throw Error('Complete all certificate fields.');return JSON.stringify(obj);}
function parseMetadata(text){const obj=JSON.parse(text);if(!obj||Array.isArray(obj)||['name','course','grade','date'].some(k=>typeof obj[k]!=='string'||!obj[k].trim())||!/^\d{4}-\d{2}-\d{2}$/.test(obj.date))throw Error('Metadata JSON must contain valid name, course, grade, and date fields.');return obj;}
async function fetchText(uri){const url=new URL(uri);if(!['http:','https:'].includes(url.protocol))throw Error('The URI must use HTTP or HTTPS.');const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error(`Unable to load metadata (HTTP ${response.status}).`);return response.text();}
function node(tag,text,className){const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;}
async function checkRPC(){
  ready=false;buttons();
  const id=Number(await rpc.send('eth_chainId',[]));if(id!==deployment.chainId)throw Error('The RPC chain does not match the configured chain.');
  if(!deployment.address||await rpc.getCode(deployment.address)==='0x')throw Error('Contract not found. Run npm run deploy and reload the page.');
  ready=true;$('network').textContent=`Connected · Chain ${id}`;$('contractAddress').textContent=deployment.address;buttons();
}
async function refreshWallet(request=false){
  const version=++epoch;signer=null;admin=false;issuer=false;correctNetwork=false;buttons();
  if(!window.ethereum){if(request)throw Error('Install MetaMask to sign transactions. Public lookup remains available.');return;}
  const accounts=await window.ethereum.request({method:request?'eth_requestAccounts':'eth_accounts'});
  const chain=Number(await window.ethereum.request({method:'eth_chainId'}));
  if(version!==epoch)return;
  correctNetwork=chain===deployment.chainId;account=accounts[0];
  $('wallet').textContent=account?`Wallet: ${account} · Chain ${chain}`:'Public lookup does not require a wallet';
  if(!correctNetwork&&account){notice(`Wrong network (${chain}). Select Ganache chain ${deployment.chainId}.`,true);buttons();return;}
  if(account&&ready){
    const provider=new BrowserProvider(window.ethereum);const s=await provider.getSigner();
    const roles=await Promise.all([read.hasRole(ZeroHash,account),read.hasRole(role,account)]);
    if(version!==epoch)return;signer=s;[admin,issuer]=roles;
    $('wallet').textContent=`${account} · ${admin?'Admin ':''}${issuer?'Issuer':''}${!admin&&!issuer?'Standard wallet':''}`;
    notice('Wallet connected. Permissions are checked by the contract.');
  }
  buttons();
}
async function write(action){
  if(busy)throw Error('A transaction is already pending.');
  await checkRPC();await refreshWallet();if(!signer||!correctNetwork)throw Error(`Connect MetaMask to Ganache chain ${deployment.chainId} before submitting a transaction.`);
  busy=true;buttons();
  try{notice('Confirm the transaction in MetaMask…');const tx=await action(read.connect(signer));notice(`Waiting for confirmation: ${tx.hash}`);const receipt=await tx.wait();if(receipt.status!==1)throw Error('The transaction failed.');notice(`Transaction confirmed: ${receipt.hash}`);return receipt;}
  finally{busy=false;await refreshWallet().catch(()=>{});buttons();}
}
async function showToken(id,append=false){
  if(!append)$('results').replaceChildren();
  let c;try{c=await read.getCertificate(id);}catch(e){if(e.code==='CALL_EXCEPTION'){$('results').append(node('p',`Token #${id} does not exist.`, 'badge bad'));return;}throw e;}
  const card=node('article','','record');card.append(node('h3',`Certificate #${id}`));
  let state='',kind='pending',raw='',obj;
  try{
    const file=$('verifyFile').files[0];raw=file?await file.text():await fetchText(c.uri);obj=parseMetadata(raw);
    const hash=keccak256(toUtf8Bytes(raw));const result=await read.verifyCertificate(id,hash);
    if(result.revoked){state=`Revoked · ${result.hashMatches?'hash match':'hash mismatch'} · Invalid`;kind='bad';}
    else if(!result.hashMatches){state='Hash mismatch · Data has changed';kind='bad';}
    else{state='Valid · Not revoked · Hash match';kind='';}
    if(file)state+=' (checked against the selected file)';
  }catch(e){state=`${c.revoked?'Revoked · Invalid. ':''}Integrity not verified: ${errorMessage(e)}`;kind=c.revoked?'bad':'pending';}
  card.append(node('p',state,`badge ${kind}`));const dl=document.createElement('dl');
  const fields=[['Recipient',c.student],['Issuer',c.issuer],['Recorded on-chain',new Date(Number(c.issuedAt)*1000).toLocaleString('en-US')],['URI',c.uri],['On-chain hash',c.metadataHash],['Status',c.revoked?'Revoked':'Not revoked']];
  if(raw)fields.push(['Computed hash',keccak256(toUtf8Bytes(raw))]);if(obj)fields.push(['JSON contents',JSON.stringify(obj,null,2)]);
  for(const [key,value]of fields)dl.append(node('dt',key),node('dd',value));card.append(dl);$('results').append(card);
}
$('connect').onclick=()=>guard(async()=>{if(!window.ethereum)throw Error('MetaMask is not installed. Install the extension to sign transactions.');await checkRPC();await refreshWallet(true);if(!correctNetwork){try{await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:chainHex}]});}catch(e){if(e.code!==4902)throw e;await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:chainHex,chainName:'Ganache Local',rpcUrls:[deployment.rpcUrl],nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18}}]});}await refreshWallet();}});
$('download').onclick=()=>guard(async()=>{const text=metadata();$('hash').textContent=keccak256(toUtf8Bytes(text));const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='certificate.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('JSON created. Place this exact file in the metadata folder and update the URI.');});
$('issueForm').onsubmit=e=>{e.preventDefault();guard(async()=>{
  const student=getAddress($('student').value.trim()),uri=$('uri').value.trim(),expected=metadata();
  const raw=await fetchText(uri);parseMetadata(raw);
  // Accept original file bytes (including a trailing newline), but require identical form data.
  if(JSON.stringify(parseMetadata(raw))!==expected)throw Error('The URI contents do not match the form. Check the values and the name, course, grade, date field order.');
  const hash=keccak256(toUtf8Bytes(raw));$('hash').textContent=hash;
  const receipt=await write(c=>c.issueCertificate(student,uri,hash));
  const event=receipt.logs.map(log=>{try{return read.interface.parseLog(log);}catch{return null;}}).find(x=>x?.name==='CertificateIssued');
  if(!event)throw Error('The receipt does not contain a CertificateIssued event.');$('tokenId').value=event.args.tokenId.toString();notice(`Issued certificate #${event.args.tokenId} · Tx ${receipt.hash}`);await showToken(event.args.tokenId);
});};
$('roleForm').onsubmit=e=>{e.preventDefault();guard(async()=>{const address=getAddress($('issuer').value.trim());await write(c=>c.grantRole(role,address));notice(`Granted issuer role to ${address}`);});};
$('remove').onclick=()=>guard(async()=>{const address=getAddress($('issuer').value.trim());await write(c=>c.revokeRole(role,address));notice(`Removed issuer role from ${address}`);});
$('revokeForm').onsubmit=e=>{e.preventDefault();guard(async()=>{const id=positive('revokeId');await write(c=>c.revokeCertificate(id));notice(`Revoked certificate #${id}`);await showToken(id);});};
$('tokenForm').onsubmit=e=>{e.preventDefault();guard(async()=>{await checkRPC();await showToken(positive('tokenId'));});};
$('studentForm').onsubmit=e=>{e.preventDefault();guard(async()=>{await checkRPC();const address=getAddress($('searchStudent').value.trim());const ids=await read.getCertificatesByStudent(address);$('results').replaceChildren(node('p',`Found ${ids.length} certificates for ${address}`));for(const id of ids)await showToken(id,true);});};
window.ethereum?.on('accountsChanged',()=>guard(()=>refreshWallet()));window.ethereum?.on('chainChanged',()=>guard(()=>refreshWallet()));
guard(async()=>{await checkRPC();notice('RPC ready. Use public lookup or connect MetaMask.');await refreshWallet();});
