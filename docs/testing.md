# Testing và tiêu chí nghiệm thu (nháp, chờ user duyệt)

> Nguồn: `test/AcademicCertificate.test.js`, `e2e/workflow.spec.js`, `docs/test-results.txt`, `docs/test-hardhat.txt`, `docs/ui-results.txt`, `docs/GAS.md`, `docs/UI-CHECKLIST.md`, `docs/environment.json`, `README.md` (mục Verification), `DECISIONS.md`. Số liệu pass lấy từ file kết quả đã lưu; **chưa chạy lại khi viết file này**.

## 1. Tiêu chí phải đạt trước khi demo / nộp
| # | Tiêu chí | Cách kiểm | Bằng chứng hiện có |
|---|---|---|---|
| T1 | Toàn bộ test contract pass trên mạng tạm của Hardhat | `npm.cmd test` | 29 pass (`docs/test-hardhat.txt`) |
| T2 | Cùng bộ test pass trên Ganache (chain 1337, Shanghai) | `npm.cmd run test:ganache` | 29 pass (`docs/test-results.txt`) |
| T3 | Có tối thiểu 3 ca revert; giao dịch bị từ chối không tạo bản ghi | xem mục 2 | 3 ca `mined … reverts` + nhiều ca revert khác |
| T4 | Đo gas có/không optimizer, cùng đầu vào, dựa trên receipt | `npm.cmd run verify` | `docs/GAS.md`, `docs/gas-results.csv` |
| T5 | Front end build được | `npm.cmd run build` | chưa có file bằng chứng riêng |
| T6 | Luồng UI end-to-end (lookup, cấp role, mint, tamper, revoke, đổi ví/chain) | `npm.cmd run test:ui` | 1 pass (`docs/ui-results.txt`) |
| T7 | Kiểm tay với MetaMask thật theo checklist | `docs/UI-CHECKLIST.md` | **chưa tick mục nào** (xem mục 5) |
| T8 | Demo trọn vẹn trong 10 phút | `docs/DEMO.md` | chưa diễn tập hai lần theo checklist |

## 2. Kịch bản bắt buộc (contract, 29 ca)
- **Phân quyền:** ví thường không mint, không cấp role; admin phải tự có `ISSUER_ROLE` mới mint; grant/revoke role phát event và issuer bị gỡ mất cả quyền mint lẫn revoke.
- **Revoke:** issuer gốc revoke được; admin revoke được; issuer khác, sinh viên không revoke được; không revoke token không tồn tại; không revoke hai lần; NFT vẫn thuộc sinh viên.
- **Bất biến:** chặn `transferFrom`, hai dạng `safeTransferFrom`, và cả approval/operator approval.
- **Đầu vào:** từ chối địa chỉ 0, URI rỗng, hash rỗng; receiver từ chối thì rollback bản ghi và index.
- **Xác minh:** hash đúng, JSON bị đổi, token không tồn tại (ba `false`); danh sách theo sinh viên gồm cả chứng chỉ đã revoke; danh sách rỗng.
- **Interface:** ERC-721 và AccessControl.
- **UI (`e2e/workflow.spec.js`):** tra token không tồn tại, tra ví, cấp role, mint, tamper, clear file, revoke, đổi ví và chain. Dùng provider EIP-1193 giả lập nhưng gửi giao dịch thật tới Ganache; không thay thế kiểm tay với MetaMask thật.

## 3. Môi trường và dữ liệu test
- Node 20.19.0, Hardhat 2.22.17, Ganache 7.9.2, solc 0.8.24, ethers 6.13.4, hardfork Shanghai, chain ID 1337 (`docs/environment.json`).
- `npm test` dùng mạng tạm của Hardhat, không tạo giao dịch trên Ganache. `test:ganache`, `verify`, `gas`, `test:ui` tạo giao dịch thật trên Ganache cổng 7545 (tốn một ít ETH test của các ví demo).
- `test:ui` cần Vite (cổng 5173) và Ganache đang chạy; dùng Edge trên Windows (`PLAYWRIGHT_CHANNEL` để đổi). Nó deploy contract riêng, không đổi địa chỉ demo.
- Dữ liệu: ví demo trong `docs/demo-accounts.json`; JSON mẫu `frontend/public/metadata/cert-001.json` (hợp lệ), `cert-tampered.json` (sai hash).
- Không chạy `verify` giữa lúc demo: nó deploy lại contract demo và ghi đè `frontend/src/deployment.json`.

## 4. Kiểm tra trước khi nộp / demo
1. `npm.cmd test` và `npm.cmd run test:ganache` đều pass, ghi lại log.
2. `npm.cmd run build` không lỗi.
3. Deploy mới trên chuỗi dùng để demo, tải lại web, kiểm tra `Connected · Chain 1337`.
4. Chạy tay luồng chính bằng MetaMask thật rồi tick `UI-CHECKLIST.md`.
5. `docs/GAS.md` và `docs/test-results.txt` khớp lần chạy cuối.

## 5. Chưa xác minh
- Người dùng báo (2026-11-17) đã tự chạy tay các luồng cấp role, phát hành, tra cứu và thu hồi với MetaMask thật; chưa ghi từng mục vào `UI-CHECKLIST.md`, nên chưa coi T7 là đạt.
- Phân biệt "tester" và "người dùng thật": chưa có thông tin; dự án không có người dùng ngoài nhóm và người xem demo.
- T5 (build) chưa có bằng chứng lưu lại.
