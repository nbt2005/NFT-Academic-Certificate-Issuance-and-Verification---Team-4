const {test,expect}=require('@playwright/test');
const {ethers}=require('ethers');
const fs=require('fs');
test('public lookup, role management, mint, tamper, revoke and wallet changes',async({page})=>{
  const provider=new ethers.JsonRpcProvider('http://127.0.0.1:7545');
  const signers=await Promise.all([0,1,2,3].map(i=>provider.getSigner(i)));
  const addresses=await Promise.all(signers.map(s=>s.getAddress()));
  const artifact=JSON.parse(fs.readFileSync('artifacts/contracts/AcademicCertificate.sol/AcademicCertificate.json'));
  const c=await new ethers.ContractFactory(artifact.abi,artifact.bytecode,signers[0]).deploy();await c.waitForDeployment();
  const deployment={address:await c.getAddress(),chainId:1337,rpcUrl:'http://127.0.0.1:7545',abi:artifact.abi};
  await page.route('**/src/deployment.json*',route=>route.fulfill({contentType:'application/javascript',body:`export default ${JSON.stringify(deployment)}`}));
  // Test-only EIP-1193 provider uses unlocked local accounts; no wallet keys in web source.
  await page.addInitScript(({addresses})=>{
    let current=addresses[0],chain='0x539',reject=false;
    const events={};
    window.testWallet={account(i){current=addresses[i];events.accountsChanged?.([current]);},chain(id){chain=id;events.chainChanged?.(id);},rejectNext(){reject=true;}};
    window.ethereum={on(name,fn){events[name]=fn;},async request({method,params=[]}){
      if(method==='eth_accounts'||method==='eth_requestAccounts')return [current];
      if(method==='eth_chainId')return chain;
      if(method==='wallet_switchEthereumChain'){chain=params[0].chainId;events.chainChanged?.(chain);return null;}
      if(method==='eth_sendTransaction'&&reject){reject=false;throw Object.assign(Error('User rejected'),{code:4001});}
      const res=await fetch('http://127.0.0.1:7545',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
      const data=await res.json();if(data.error)throw Object.assign(Error(data.error.message),data.error);return data.result;
    }};
  },{addresses});
  await page.goto('/');await expect(page.locator('#network')).toContainText('Connected');
  await page.locator('#tokenId').fill('99');await page.getByRole('button',{name:'Look up token',exact:true}).click();await expect(page.locator('#results')).toContainText('does not exist');
  await page.locator('#searchStudent').fill(addresses[2]);await page.getByRole('button',{name:'Look up wallet',exact:true}).click();await expect(page.locator('#results')).toContainText('Found 0');
  await page.locator('#issuer').fill(addresses[1]);await page.locator('#grant').click();await expect(page.locator('#notice')).toContainText('Granted issuer role');
  await page.evaluate(()=>window.testWallet.account(1));await expect(page.locator('#mint')).toBeEnabled();
  await page.locator('#student').fill(addresses[2]);await page.locator('#mint').click();await expect(page.locator('#results')).toContainText('Valid · Not revoked · Hash match');
  await page.locator('#searchStudent').fill(addresses[2]);await page.getByRole('button',{name:'Look up wallet',exact:true}).click();await expect(page.locator('#results')).toContainText('Found 1');
  await page.locator('#verifyFile').setInputFiles('frontend/public/metadata/cert-tampered.json');await page.locator('#tokenId').fill('1');await page.getByRole('button',{name:'Look up token',exact:true}).click();await expect(page.locator('#results')).toContainText('Hash mismatch');
  await page.locator('#verifyFile').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await page.getByRole('button',{name:'Look up token',exact:true}).click();await expect(page.locator('#results')).toContainText('Integrity not verified');
  await page.locator('#verifyFile').setInputFiles([]);
  await page.route('**/metadata/cert-001.json',route=>route.fulfill({status:404,body:'not found'}));
  await page.getByRole('button',{name:'Look up token',exact:true}).click();await expect(page.locator('#results')).toContainText('Integrity not verified');
  await page.unroute('**/metadata/cert-001.json');
  await page.locator('#revokeId').fill('1');await page.locator('#revoke').click();await expect(page.locator('#results')).toContainText('Revoked');expect(await c.ownerOf(1)).toBe(addresses[2]);
  await page.evaluate(()=>window.testWallet.account(3));await expect(page.locator('#mint')).toBeDisabled();
  await page.evaluate(()=>window.testWallet.chain('0x1'));await expect(page.locator('#notice')).toContainText('Wrong network');await expect(page.locator('#grant')).toBeDisabled();
  await page.evaluate(()=>{window.testWallet.chain('0x539');});await page.evaluate(()=>window.testWallet.account(0));await expect(page.locator('#grant')).toBeEnabled();
  await page.locator('#issuer').fill(addresses[3]);await page.evaluate(()=>window.testWallet.rejectNext());await page.locator('#grant').click();await expect(page.locator('#notice')).toContainText('rejected');await expect(page.locator('#grant')).toBeEnabled();
  await page.locator('#connect').click();await expect(page.locator('#notice')).toContainText('Wallet connected');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'docs/ui-overview.png'});
  await page.screenshot({path:'docs/ui-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/ui-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
