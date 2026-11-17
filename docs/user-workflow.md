# User workflow (viết từ code, chờ user duyệt)

> Nguồn: `frontend/src/main.js`, `frontend/index.html`, `contracts/AcademicCertificate.sol`, `docs/DEMO.md`. Chức năng ↔ hàm contract xem `docs/architecture.md` mục 6. Không có backend/database nên luồng đi thẳng UI → contract.

## 1. Vai trò
Admin, Issuer, Sinh viên, Người xác minh (định nghĩa ở `architecture.md` mục 2). Ví demo: `docs/demo-accounts.json` (admin, issuer, student, outsider).

## 2. Điều kiện chung
- Ganache chạy (`npm run chain`), contract đã deploy (`npm run deploy`), web chạy (`npm run dev`), MetaMask trỏ chain 1337.
- Thao tác ghi cần MetaMask đúng chain và đúng vai trò; nút ghi bị khóa nếu sai. Thao tác đọc (verify) không cần ví, không tạo giao dịch.

## 3. Luồng chính

### W1. Admin cấp quyền issuer
| | |
|---|---|
| Bắt đầu | Admin kết nối MetaMask |
| Bước | nhập địa chỉ ở khối *Issuer permissions* → *Grant role* → xác nhận MetaMask |
| Kết quả | địa chỉ có `ISSUER_ROLE`; event `RoleGranted` |
| Lỗi | ví không phải admin (`AccessControlUnauthorizedAccount`); địa chỉ sai định dạng; từ chối MetaMask; thiếu ETH demo; sai chain |
| Ghi chú | *Remove role* làm issuer mất cả quyền mint lẫn quyền revoke chứng chỉ cũ của mình |

### W2. Issuer cấp chứng chỉ
| | |
|---|---|
| Bắt đầu | Issuer kết nối MetaMask |
| Bước | 1) nhập student, name, course, grade, date → *Create and download JSON*; 2) đặt đúng file đó vào `frontend/public/metadata/`; 3) nhập URI (HTTP/HTTPS) trỏ tới file; 4) *Issue certificate* → app tải URI, đối chiếu form, tính hash → xác nhận MetaMask |
| Kết quả | token ID mới (đọc từ event `CertificateIssued`), hiển thị chứng chỉ vừa cấp; NFT thuộc sinh viên |
| Lỗi | thiếu trường; URI không tải được/không phải HTTP(S)/CORS; nội dung URI khác form; `InvalidStudent`, `EmptyURI`, `EmptyHash`; ví không có `ISSUER_ROLE`; sinh viên là contract không hỗ trợ ERC-721 (`ERC721InvalidReceiver`) |
| Ghi chú | hash tính trên byte JSON gốc; sửa khoảng trắng/thứ tự key sau khi tạo sẽ đổi hash |

### W3. Xác minh theo token ID
| | |
|---|---|
| Bắt đầu | bất kỳ ai, không cần ví |
| Bước | nhập token ID → tra cứu; (tùy chọn) chọn file JSON để so với hash on-chain thay vì tải từ URI |
| Kết quả | thẻ chứng chỉ: sinh viên, issuer, thời điểm, URI, hash on-chain, hash tính lại, nội dung JSON, và một trạng thái: **Valid** / **Revoked** (kèm khớp hash hay không) / **Hash mismatch** |
| Lỗi | token không tồn tại ("does not exist"); không tải được URI hoặc JSON sai định dạng → "Integrity not verified" (không bao giờ hiện Valid); RPC/Ganache tắt |

### W4. Xác minh theo địa chỉ sinh viên
| | |
|---|---|
| Bắt đầu | bất kỳ ai |
| Bước | nhập địa chỉ ví sinh viên → tra cứu |
| Kết quả | "Found N certificates", rồi từng thẻ như W3; danh sách gồm cả chứng chỉ đã revoke |
| Lỗi | địa chỉ sai định dạng; 0 chứng chỉ thì chỉ hiện số lượng |
| Ghi chú | tùy chọn chọn file JSON chỉ có ý nghĩa với một chứng chỉ; danh sách không phân trang |

### W5. Thu hồi chứng chỉ
| | |
|---|---|
| Bắt đầu | admin, hoặc issuer đã cấp chứng chỉ đó và còn `ISSUER_ROLE` |
| Bước | nhập token ID ở khối *Revoke* → xác nhận MetaMask |
| Kết quả | cờ `revoked = true`; event `CertificateRevoked`; verify báo Revoked/Invalid; sinh viên vẫn sở hữu NFT |
| Lỗi | `UnauthorizedRevocation` (issuer khác, sinh viên, outsider); `AlreadyRevoked`; token không tồn tại; ID không phải số nguyên dương |

### W6. Sinh viên (bị động)
Sinh viên chỉ nhận NFT và tự tra cứu bằng W3/W4. Không có chức năng chuyển, đốt hay tự revoke: mọi transfer revert `NonTransferable`.

## 4. Lỗi chung (mọi luồng ghi)
Từ chối MetaMask (thông báo "You rejected…"); thiếu ETH demo; MetaMask chưa cài; sai chain (nút ghi khóa, *Connect* đề nghị chuyển sang 1337); đang có giao dịch chờ ("A transaction is already pending"); Ganache/RPC tắt ("Unable to connect…"); giao dịch mined nhưng thất bại.

## 5. Liên kết luồng → chức năng
| Luồng | UI (`frontend/index.html`) | Hàm contract |
|---|---|---|
| W1 | `#grant`, `#remove` | `grantRole`, `revokeRole` |
| W2 | `#download`, `#mint` | `issueCertificate` |
| W3 | token form | `getCertificate`, `verifyCertificate` |
| W4 | student form | `getCertificatesByStudent`, rồi như W3 |
| W5 | `#revoke` | `revokeCertificate` |

## 6. Chưa xác minh / chờ user
- Mô tả bám code và `docs/DEMO.md`; chưa chạy UI thật khi viết file này. Kịch bản MetaMask thật còn trong `docs/UI-CHECKLIST.md` (chưa tick).
- Có cần luồng riêng cho "outsider" (ví không có quyền) hay chỉ giữ như ca lỗi trong W1/W2/W5?
