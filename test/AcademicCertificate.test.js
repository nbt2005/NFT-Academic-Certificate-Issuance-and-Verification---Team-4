const {expect}=require('chai');
const {ethers}=require('hardhat');
describe('AcademicCertificate', function(){
  let c,admin,issuer,student,other,role;
  const uri='http://localhost:5173/metadata/cert-001.json';
  const hash=ethers.keccak256(ethers.toUtf8Bytes('{"grade":"A"}'));
  beforeEach(async()=>{
    [admin,issuer,student,other]=await ethers.getSigners();
    c=await (await ethers.getContractFactory('AcademicCertificate')).deploy(); await c.waitForDeployment();
    role=await c.ISSUER_ROLE(); await (await c.grantRole(role,issuer.address)).wait();
  });
  async function mint(){await (await c.connect(issuer).issueCertificate(student.address,uri,hash)).wait();}
  // eth_call preserves custom-error data consistently across Ganache and Hardhat.
  // Separate mined failures below prove rejection and rollback on real transactions.
  async function minedFailure(txPromise){
    const tx=await txPromise;
    let receipt;try{receipt=await tx.wait();}catch(e){receipt=e.receipt;}
    expect(receipt,'failed transaction receipt').to.not.eq(undefined);
    expect(receipt.status).eq(0);
  }
  it('mined unauthorized mint reverts without creating record',async()=>{
    await minedFailure(c.connect(other).issueCertificate(student.address,uri,hash,{gasLimit:500000}));expect(await c.totalIssued()).eq(0);
  });
  it('mined unauthorized revocation keeps certificate active',async()=>{
    await mint();await minedFailure(c.connect(other).revokeCertificate(1,{gasLimit:200000}));expect((await c.getCertificate(1)).revoked).eq(false);
  });
  it('mined transfer reverts and keeps original ownership',async()=>{
    await mint();await minedFailure(c.connect(student).transferFrom(student.address,other.address,1,{gasLimit:200000}));expect(await c.ownerOf(1)).eq(student.address);
  });
  it('admin role and ERC721/AccessControl interfaces',async()=>{
    expect(await c.hasRole(ethers.ZeroHash,admin.address)).eq(true);
    expect(await c.supportsInterface('0x80ac58cd')).eq(true); expect(await c.supportsInterface('0x7965db0b')).eq(true);
  });
  it('issues immutable record and indexed event',async()=>{
    await expect(c.connect(issuer).issueCertificate(student.address,uri,hash)).to.emit(c,'CertificateIssued').withArgs(1,student.address,issuer.address,hash,uri);
    expect(await c.ownerOf(1)).eq(student.address); expect(await c.tokenURI(1)).eq(uri);
    const r=await c.getCertificate(1); expect(r.student).eq(student.address); expect(r.issuer).eq(issuer.address); expect(r.metadataHash).eq(hash); expect(r.issuedAt).gt(0); expect(r.revoked).eq(false);
  });
  it('indexes multiple records, including revoked records',async()=>{await mint();await mint();await (await c.revokeCertificate(1)).wait();expect(await c.getCertificatesByStudent(student.address)).deep.eq([1n,2n]);expect(await c.totalIssued()).eq(2);});
  it('empty student list',async()=>{expect(await c.getCertificatesByStudent(other.address)).deep.eq([]);});
  it('verifies exact hash and detects changed JSON',async()=>{await mint();expect(await c.verifyCertificate(1,hash)).deep.eq([true,false,true]);expect(await c.verifyCertificate(1,ethers.keccak256(ethers.toUtf8Bytes('{"grade":"B"}')))).deep.eq([false,false,false]);});
  it('missing token verification is invalid',async()=>{expect(await c.verifyCertificate(999,hash)).deep.eq([false,false,false]);});
  it('missing token reads revert clearly',async()=>{await expect(c.getCertificate(99)).revertedWithCustomError(c,'ERC721NonexistentToken');await expect(c.tokenURI(99)).revertedWithCustomError(c,'ERC721NonexistentToken');});
  it('original issuer revokes and preserves NFT',async()=>{await mint();await expect(c.connect(issuer).revokeCertificate(1)).emit(c,'CertificateRevoked').withArgs(1,issuer.address);expect(await c.ownerOf(1)).eq(student.address);expect(await c.verifyCertificate(1,hash)).deep.eq([false,true,true]);});
  it('admin revokes',async()=>{await mint();await expect(c.revokeCertificate(1)).emit(c,'CertificateRevoked').withArgs(1,admin.address);});
  it('ordinary wallet cannot mint',async()=>{await expect(c.connect(other).issueCertificate.staticCall(student.address,uri,hash)).revertedWithCustomError(c,'AccessControlUnauthorizedAccount');});
  it('admin must also obtain issuer role to mint',async()=>{await expect(c.issueCertificate.staticCall(student.address,uri,hash)).revertedWithCustomError(c,'AccessControlUnauthorizedAccount');});
  it('ordinary wallet cannot grant role',async()=>{await expect(c.connect(other).grantRole.staticCall(role,other.address)).revertedWithCustomError(c,'AccessControlUnauthorizedAccount');});
  it('grant/revoke events and removed issuer loses both permissions',async()=>{
    await mint();await expect(c.grantRole(role,other.address)).emit(c,'RoleGranted').withArgs(role,other.address,admin.address);
    await expect(c.revokeRole(role,issuer.address)).emit(c,'RoleRevoked').withArgs(role,issuer.address,admin.address);
    await expect(c.connect(issuer).issueCertificate.staticCall(student.address,uri,hash)).revertedWithCustomError(c,'AccessControlUnauthorizedAccount');
    await expect(c.connect(issuer).revokeCertificate.staticCall(1)).revertedWithCustomError(c,'UnauthorizedRevocation');await (await c.revokeCertificate(1)).wait();
  });
  it('other issuer cannot revoke original issuer record',async()=>{await mint();await (await c.grantRole(role,other.address)).wait();await expect(c.connect(other).revokeCertificate.staticCall(1)).revertedWithCustomError(c,'UnauthorizedRevocation');});
  it('student cannot revoke',async()=>{await mint();await expect(c.connect(student).revokeCertificate.staticCall(1)).revertedWithCustomError(c,'UnauthorizedRevocation');});
  it('cannot revoke nonexistent token',async()=>{await expect(c.revokeCertificate.staticCall(99)).revertedWithCustomError(c,'ERC721NonexistentToken');});
  it('cannot revoke twice',async()=>{await mint();await (await c.revokeCertificate(1)).wait();await expect(c.revokeCertificate.staticCall(1)).revertedWithCustomError(c,'AlreadyRevoked');});
  for(const [label,address,u,h,error] of [['zero address',ethers.ZeroAddress,uri,hash,'InvalidStudent'],['empty URI',null,'',hash,'EmptyURI'],['empty hash',null,uri,ethers.ZeroHash,'EmptyHash']]){
    it(`rejects ${label}`,async()=>{await expect(c.connect(issuer).issueCertificate.staticCall(address||student.address,u,h)).revertedWithCustomError(c,error);expect(await c.totalIssued()).eq(0);});
  }
  for(const method of ['transferFrom','safeTransferFrom(address,address,uint256)','safeTransferFrom(address,address,uint256,bytes)']){
    it(`blocks ${method}`,async()=>{await mint();const args=[student.address,other.address,1];if(method.includes('bytes')) args.push('0x');await expect(c.connect(student)[method].staticCall(...args)).revertedWithCustomError(c,'NonTransferable');expect(await c.ownerOf(1)).eq(student.address);});
  }
  it('approval cannot bypass transfer restriction',async()=>{await mint();await (await c.connect(student).approve(other.address,1)).wait();await expect(c.connect(other).transferFrom.staticCall(student.address,other.address,1)).revertedWithCustomError(c,'NonTransferable');});
  it('operator approval cannot bypass transfer restriction',async()=>{await mint();await (await c.connect(student).setApprovalForAll(other.address,true)).wait();await expect(c.connect(other)['safeTransferFrom(address,address,uint256)'].staticCall(student.address,other.address,1)).revertedWithCustomError(c,'NonTransferable');});
  it('rejecting receiver rolls back record and student index',async()=>{await expect(c.connect(issuer).issueCertificate.staticCall(await c.getAddress(),uri,hash)).revertedWithCustomError(c,'ERC721InvalidReceiver');expect(await c.totalIssued()).eq(0);expect(await c.getCertificatesByStudent(await c.getAddress())).deep.eq([]);});
});
