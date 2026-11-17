# Kiến trúc tổng thể (viết lại từ code, chờ user duyệt)

> Gộp 4 loại document: kiến trúc (1), hợp đồng tích hợp (3), dữ liệu on-chain (thay cho Database), bảo mật và dữ liệu (7, mục 10). Nguồn: `contracts/AcademicCertificate.sol`, `frontend/src/main.js`, `scripts/`, `hardhat.config.js`, `package.json`. Code đúng hơn tài liệu. Chưa tự chạy lại test/deploy khi viết file này; số liệu test/gas lấy từ `docs/test-results.txt`, `docs/GAS.md`.

## 1. Mục tiêu và nguyên tắc
- Cấp chứng chỉ học thuật dạng NFT ERC-721 trên Ganache local. Chỉ ví có `ISSUER_ROLE` được mint; chứng chỉ thu hồi được; xác minh theo token ID hoặc địa chỉ sinh viên.
- On-chain giữ hash + URI + trạng thái; nội dung JSON (name, course, grade, date) nằm ngoài chuỗi. Hash chứng minh dữ liệu không đổi, không chứng minh dữ liệu đúng sự thật.
- Không backend, không database, không IPFS, không đăng nhập (`README.md`, mục Limits). Không có production; chỉ demo local.

## 2. Vai trò
| Vai trò | Định danh | Quyền (theo code) |
|---|---|---|
| Admin | ví deploy, `DEFAULT_ADMIN_ROLE` | `grantRole/revokeRole(ISSUER_ROLE)`; revoke mọi chứng chỉ. **Không tự mint** nếu chưa tự cấp `ISSUER_ROLE` |
| Issuer | ví có `ISSUER_ROLE` | `issueCertificate`; `revokeCertificate` chỉ chứng chỉ do chính mình cấp và khi còn role |
| Sinh viên | `student` trong chứng chỉ | nhận NFT, không chuyển được, không tự revoke |
| Người xác minh | bất kỳ | đọc (`eth_call`), không cần ví |

## 3. Thành phần
| Thành phần | File | Trách nhiệm |
|---|---|---|
| Smart contract | `contracts/AcademicCertificate.sol` (Solidity 0.8.24, OpenZeppelin 5.0.2 `ERC721` + `AccessControl`) | lưu bản ghi, phân quyền, revoke, soulbound, event |
| Hardhat 2.22.17 | `hardhat.config.js` | compile (solc npm 0.8.24 ghim sẵn, không tải ngoài), test; optimizer 200 runs mặc định, tắt bằng `OPTIMIZER=false` |
| Ganache 7.9.2 | `npm run chain` (port 7545, chainId 1337, hardfork shanghai) | chuỗi local; `.ganache-db/` |
| Front end | `frontend/` (Vite 5 + JS thuần + ethers 6.13.4, không React) | form, MetaMask, verify |
| Scripts | `scripts/` | deploy, gas, verify, report, ui-test, transactions |
| Test | `test/AcademicCertificate.test.js` (29 ca, ghi nhận pass), `e2e/workflow.spec.js` (Playwright) | |

## 4. Cấu trúc front end (một trang, `frontend/index.html`)
| Khối | Ai dùng | Việc |
|---|---|---|
| Connect MetaMask | mọi người | kết nối, tự chuyển/thêm chain 1337, hiện vai trò; mất mạng/sai chain thì khóa nút ghi |
| Verify a certificate | mọi người | tra theo token ID hoặc địa chỉ sinh viên; tùy chọn chọn file JSON để so hash |
| Issue a new certificate | issuer | nhập student, name/course/grade/date, tải JSON, URI; tính hash; gọi `issueCertificate` |
| Issuer permissions | admin | `grantRole` / `revokeRole` |
| Revoke a certificate | admin / issuer gốc | `revokeCertificate` |

Nút ghi chỉ bật khi đúng vai trò + đúng chain. Đọc luôn qua RPC cấu hình sẵn, không cần MetaMask.

## 5. Dữ liệu và nơi lưu
| Dữ liệu | Nơi lưu | Ghi chú |
|---|---|---|
| `Certificate{student, issuer, metadataHash, issuedAt, revoked}` | storage contract, `mapping(uint256 => Certificate)` | `issuedAt` = block time |
| `metadataURIs[tokenId]` | storage contract | URI JSON, **bắt buộc không rỗng** |
| `studentTokenIds[student]` | storage contract | gồm cả chứng chỉ đã revoke; không phân trang |
| `totalIssued` | storage contract | token ID bắt đầu từ 1, tăng dần |
| JSON `{name, course, grade, date}` | file ngoài chuỗi, mẫu ở `frontend/public/metadata/` (`cert-001.json`, `cert-tampered.json`) | phải do web server phục vụ qua HTTP(S) |
| Địa chỉ contract + ABI | `frontend/src/deployment.json` (sinh bởi `scripts/deploy.js`) | |
| 4 địa chỉ demo (admin, issuer, student, outsider) | `docs/demo-accounts.json` | chỉ địa chỉ, không khóa |

Quy tắc hash: `keccak256(UTF-8 bytes của đúng chuỗi JSON)`, **không chuẩn hóa**: khoảng trắng, BOM, thứ tự key đều đổi hash. Form tạo JSON theo thứ tự `name, course, grade, date`; `date` dạng `YYYY-MM-DD`. Khi mint, app tải URI, kiểm JSON khớp form rồi mới hash.

## 6. Hợp đồng tích hợp (front end ↔ contract)
| Hàm | Ai gọi | Ghi chú |
|---|---|---|
| `issueCertificate(student, uri, hash) → tokenId` | `ISSUER_ROLE` | revert `InvalidStudent`, `EmptyURI`, `EmptyHash`; dùng `_safeMint`, state ghi trước callback; emit `CertificateIssued(tokenId, student, issuer, metadataHash, uri)` |
| `revokeCertificate(tokenId)` | admin hoặc issuer gốc còn role | revert `UnauthorizedRevocation`, `AlreadyRevoked`, token không tồn tại (`ERC721NonexistentToken`); chỉ đặt cờ, NFT vẫn thuộc sinh viên; emit `CertificateRevoked(tokenId, actor)` |
| `getCertificate(tokenId)` | mọi người | `(student, issuer, metadataHash, issuedAt, revoked, uri)`; revert nếu không tồn tại |
| `getCertificatesByStudent(addr)` | mọi người | mảng token ID |
| `verifyCertificate(tokenId, hash)` | mọi người | `(valid, revoked, hashMatches)`; token không tồn tại trả ba `false`; `valid = !revoked && hashMatches` |
| `tokenURI(tokenId)` | mọi người | trả URI JSON |
| `grantRole/revokeRole(ISSUER_ROLE, addr)` | admin | AccessControl, emit `RoleGranted/RoleRevoked` |
| mọi transfer/approve-based transfer | không ai | `_update` revert `NonTransferable` khi token đã có chủ và `to != 0` |

Ranh giới: đổi chữ ký hàm thì chạy lại `npm run deploy` để sinh lại `deployment.json`, và cập nhật tài liệu này. Front end map tên lỗi contract sang thông báo người dùng trong `errorMessage()`.

## 7. Luồng dữ liệu
```text
Admin ──grantRole──► Contract (ISSUER_ROLE)
Issuer: form ─► tạo JSON ─► (đặt file vào frontend/public/metadata/, nhập URI)
        ─► app fetch URI, so với form, hash keccak256(raw)
        ─► MetaMask ký issueCertificate(student, uri, hash) ─► Ganache (chain 1337)
Verifier: token ID / địa chỉ SV ─► getCertificate(+List) ─► fetch URI (hoặc file chọn tay)
        ─► hash ─► verifyCertificate ─► Valid / Revoked / Hash mismatch / chưa xác minh được
```

## 8. Hiện trạng so với đích
| Hạng mục | Hiện trạng |
|---|---|
| Contract, test, gas, front end, e2e, demo, report | có trong repo (chưa tự xác minh khi viết file này) |
| 29 test hardhat pass | theo `docs/test-results.txt`, chưa chạy lại |
| So sánh gas optimizer on/off | `docs/GAS.md`, `docs/gas-results.csv` |
| Kiểm tay với MetaMask thật | chưa làm (`docs/UI-CHECKLIST.md` còn trống) |

## 9. Lệch giữa tài liệu cũ/quyết định và code (cần user xử lý)
1. Front end là Vite + JS thuần, không React. **Đã chốt 2026-11-17: giữ code hiện tại** (xem `DECISIONS.md`).
2. Contract tên `AcademicCertificate`, token `ACERT`, hàm `issueCertificate/revokeCertificate/getCertificate`; bản nháp trước dùng tên khác.
3. URI nằm on-chain và bắt buộc; revoke cho cả admin và issuer gốc.
4. `deployment.json` ghi `evmVersion` theo lần deploy gần nhất: `shanghai` khi dùng `npm run deploy` (hiện tại), `paris` nếu dùng `npm run deploy:gui` cho Ganache GUI (xem `README.md`). Mặc định cấu hình là `shanghai` (`hardhat.config.js`).

## 10. Bảo mật và dữ liệu
Nguồn: `contracts/AcademicCertificate.sol`, `frontend/src/main.js`, `test/AcademicCertificate.test.js`, `.gitignore`, `.env.example`. Dự án là demo local; mục này nêu rủi ro và chỗ xử lý, không phải đánh giá bảo mật độc lập.

**Ranh giới tin cậy.** Tin: logic contract và quyền theo ví ký. Không tin: nội dung JSON ở URI (chỉ so hash), web server phục vụ JSON, dữ liệu người dùng nhập vào form. RPC lấy từ `deployment.json`; front end kiểm `eth_chainId` trước khi đọc/ghi.

| Mối đe dọa | Xử lý trong code | Bằng chứng test |
|---|---|---|
| Ví ngoài mint hoặc cấp role | `onlyRole(ISSUER_ROLE)`; `grantRole` chỉ admin (AccessControl) | `ordinary wallet cannot mint`, `ordinary wallet cannot grant role`, `mined unauthorized mint reverts…` |
| Issuer khác, sinh viên, outsider revoke | `UnauthorizedRevocation` | `other issuer cannot revoke…`, `student cannot revoke` |
| Chuyển/bán chứng chỉ | `_update` revert `NonTransferable`; approval không vượt được | `blocks transferFrom`, 2 ca `safeTransferFrom`, 2 ca approval |
| Reentrancy qua `onERC721Received` | Ghi hết state và emit event trước `_safeMint` | `rejecting receiver rolls back record and student index` |
| Sửa JSON sau khi cấp | Hash on-chain; `verifyCertificate` báo mismatch; thiếu JSON thì "Integrity not verified", không hiện Valid | `verifies exact hash and detects changed JSON`; e2e tamper |
| Dữ liệu từ JSON/URI chèn mã vào trang | `main.js` render bằng `textContent`, không có `innerHTML` (tra bằng grep; chưa có test XSS riêng) | — |
| Sai chain hoặc sai ví | Nút ghi chỉ bật khi đúng role và chain 1337 | e2e: đổi ví/chain |

**Phân quyền.** Xem bảng ở mục 2. Admin không tự mint nếu chưa tự cấp `ISSUER_ROLE`. Gỡ role của issuer làm mất cả quyền mint lẫn revoke chứng chỉ cũ.

**Dữ liệu nhạy cảm và nơi lưu**
- On-chain công khai và không xóa được: địa chỉ sinh viên, địa chỉ issuer, hash, URI, thời điểm cấp, cờ revoked. Không thực hiện được "xóa dữ liệu theo yêu cầu" trên chuỗi.
- Nội dung JSON (tên, môn, điểm, ngày) nằm ở URI, ai biết URI đều đọc được; mẫu nằm trong repo ở `frontend/public/metadata/`. Chỉ dùng dữ liệu giả cho demo.
- Hash của JSON có ít biến thể (tên, môn, điểm, ngày) có thể bị dò bằng cách thử các giá trị khả dĩ. Đây là phân tích, chưa kiểm chứng bằng thực nghiệm; chấp nhận vì là demo.
- Chuỗi local lưu ở `.ganache-db/` (bị `.gitignore`). Reset chuỗi là mất toàn bộ chứng chỉ; không có sao lưu.

**Khóa và secret.** Không có secret trong repo: `.env` bị `.gitignore`, `.env.example` chỉ có RPC và chain ID. Khóa ví demo là khóa Ganache deterministic, công khai, chỉ dùng cho chuỗi test; không import ví thật. Test e2e dùng tài khoản unlocked của Ganache trong code test, không có khóa trong web source.

**Rủi ro chấp nhận.** Admin hoặc issuer bị lộ khóa thì kẻ tấn công mint hoặc revoke được. Không có multisig hay timelock. Mất khóa admin thì không còn ai cấp/gỡ issuer. Hash chỉ chứng minh dữ liệu không đổi, không chứng minh nội dung đúng sự thật (xem `README.md`, Limits).
