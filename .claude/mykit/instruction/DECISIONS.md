# DECISIONS

## 2026-11-16 — Hạ trọng số bộ kit web: bỏ/gộp document cho dự án Blockchain
- **Bối cảnh:** Bộ kit (`AGENTS.md`, `.claude/rules/*`, `.claude/skills/*`) thiết kế cho dự án web thông thường (backend + database + deploy + vận hành). Dự án này là bài môn Blockchain: smart contract Solidity 0.8.x (ERC-721), Ganache + Hardhat/Truffle, front end HTML/JS hoặc React với ethers.js + MetaMask. Deliverable: repo + README, test results, báo cáo 4-6 trang, demo 10 phút. Không có server, không có database, không có production.
- **Quyết định:**
  1. Giữ nguyên quy trình `AGENTS.md` (setup 4 bước, 5 file trạng thái, cổng hoàn thành task). Chỉ hạ trọng số bộ 11 loại document:

     | # | Loại (kit web) | Xử lý | Diễn giải cho Blockchain |
     |---|---|---|---|
     | 1 | Kiến trúc tổng thể | **Giữ** | Gộp cả loại 3 và 5: sơ đồ contract, vai trò (owner/issuer/student/employer), layout lưu on-chain, schema metadata JSON + hash |
     | 2 | User workflow | **Giữ, ngắn** | Luồng cấp / thu hồi / xác minh chứng chỉ |
     | 3 | Hợp đồng tích hợp | **Gộp vào 1** | ABI, events, schema metadata giữa front end và contract |
     | 4 | Thuộc tính chất lượng | **Bỏ** | Phần gas đã nằm trong loại 9 |
     | 5 | Database | **Bỏ** | Không có DB; trạng thái ở storage contract, nêu trong loại 1 |
     | 6 | Backend | **Giữ, đổi nghĩa** | Đặc tả smart contract: hàm, modifier, event, custom error |
     | 7 | Bảo mật và dữ liệu | **Giữ, ngắn** | Gộp với loại 6 nếu ngắn; access control, revert, reentrancy, quyền riêng tư metadata. Báo cáo yêu cầu mục security |
     | 8 | Triển khai và hạ tầng | **Gộp vào 11/README** | Chỉ còn bước setup Ganache, deploy, cấu hình MetaMask |
     | 9 | Testing và nghiệm thu | **Giữ, file riêng** | Test tự động, tối thiểu 3 ca revert, bảng gas và 1 tối ưu hóa |
     | 10 | Maintenance | **Bỏ** | Không vận hành thật; không có backup/SLA/runbook |
     | 11 | Hướng dẫn sử dụng | **Giữ, gộp setup (8)** | README setup + kịch bản demo 10 phút; viết sau khi có chức năng |
  2. Còn lại ~5 file document trong `docs/`: kiến trúc (1+3+5), workflow (2), đặc tả contract + bảo mật (6+7), testing + gas (9), hướng dẫn setup + demo (8+11). Mỗi file ngắn; nội dung nào kit đòi mà dự án không có thì ghi "N/A", không bịa.
  3. Các rule/skill thuần web trong `.claude/` (payment, shopify, mobile, backend DB, deploy, devops...) không áp dụng. Không xóa, chỉ không kích hoạt.
  4. Loại 4, 5, 10 ghi vào `docs/doc-map.md` ở bước 2 với nhãn "Không làm (đã quyết định)" thay vì "Chưa có", để khỏi bị coi là thiếu.
- **Lý do:** YAGNI/KISS. Dự án học thuật có deadline; viết đủ 11 loại document web thì tốn công mà không tạo giá trị chấm điểm. Phần bắt buộc của đề (contract, test, gas, báo cáo, demo) đã được các loại giữ lại phủ.
- **Hệ quả:** Bước 2 (review-docs) dùng danh sách rút gọn này thay vì 11 loại; user vẫn là người chốt cuối ở bước 3. Muốn khôi phục loại nào thì thêm quyết định mới ở cuối file này.

## 2026-11-16 — Chốt công cụ: Hardhat + React
- **Quyết định:** Dùng Hardhat (không dùng Truffle) để biên dịch, test, deploy lên Ganache; front end dùng React với ethers.js và MetaMask.
- **Lý do:** User chọn. Hardhat có test JS/TS, `hardhat-gas-reporter` phục vụ yêu cầu đo gas.
- **Hệ quả:** Document và code theo Hardhat + React; không hỗ trợ Truffle.

## 2026-11-16 — Thiết kế cốt lõi của chứng chỉ NFT
- **Quyết định:** (1) Soulbound: chặn transfer sau khi mint. (2) Phân quyền bằng OpenZeppelin `AccessControl`: `DEFAULT_ADMIN_ROLE` (owner) cấp/thu hồi `ISSUER_ROLE` cho nhiều ví; issuer mint và revoke. (3) Metadata JSON (name, course, grade, date) giữ ngoài chuỗi (file do app tạo), on-chain chỉ lưu hash. (4) Một sinh viên có thể có nhiều chứng chỉ; verify theo địa chỉ trả về danh sách token ID kèm trạng thái.
- **Lý do:** User chọn các phương án khuyến nghị; khớp đề ("authorized issuers", "revoked", "JSON with a hash on chain"), không cần dịch vụ ngoài Ganache.
- **Hệ quả:** Revoke chỉ đặt cờ `revoked`, không burn, để verify còn hiện trạng thái thu hồi. Hash là `keccak256` trên JSON chuẩn hóa (chi tiết ở `docs/architecture.md`).

## 2026-11-17 — Document kiến trúc viết lại từ code thật
- **Quyết định:** `docs/architecture.md` viết lại từ code (`AcademicCertificate.sol`, `frontend/`, `scripts/`); bản nháp 2026-11-16 (thiết kế trước khi có code) bị thay.
- **Lý do:** Code đã được thêm; code là source of truth.
- **Hệ quả:** Front end hiện là Vite + JS thuần, không React, lệch quyết định "React" ngày 2026-11-16. Chờ user chốt: giữ code hiện tại hay chuyển React. Chưa đổi quyết định cũ.

## 2026-11-17 — Giữ front end Vite + JS thuần, bỏ React
- **Quyết định:** Giữ nguyên `frontend/` hiện tại (Vite 5 + JS thuần + ethers 6). Thay quyết định "React" ngày 2026-11-16.
- **Lý do:** User chọn giữ code hiện có; đề cho phép HTML/JS.
- **Hệ quả:** Không migrate sang React; document và code mới theo JS thuần.
## 2026-11-21: Retain automatic metadata storage and the user's report

The user requested retaining the local automatic JSON save/URI workflow and detailed report when publishing to the NFT repository. Keep the Paris-compatible Ganache GUI configuration rather than copying an address from a different deployment. Preserve non-conflicting remote additions. Generated metadata and Vietnamese PDF companions remain local, as documented in README.md.
