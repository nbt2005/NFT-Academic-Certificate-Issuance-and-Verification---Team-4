# NFT Academic Certificate Issuance and Verification

Project 3, Team 4: **Nguyen Ba Thien (29211164940)** and **Nguyen Dang Thinh (29210258195)**. A local ERC-721 application using OpenZeppelin AccessControl, Hardhat 2, Ganache, Vite, and ethers 6. Certificates are non-transferable; metadata is served as static JSON without a backend.

Evidence from the full verification: **29/29 Hardhat tests, 29/29 Ganache tests**, a passing Edge integration scenario, and a successful frontend build. See [Ganache tests](docs/test-results.txt), [browser tests](docs/ui-results.txt), [measured gas](docs/GAS.md), [five-page report](docs/report.pdf), and [demo](docs/DEMO.md). Automated wallet tests simulate EIP-1193 and submit real Ganache transactions. The [real MetaMask checks](docs/UI-CHECKLIST.md) remain manual.

## Language and Git policy

Code, UI text, scripts, and documents using the current filenames are English. Vietnamese companion documents use `.vi.pdf` or `.vi.docx` filenames and are ignored by Git. The original Vietnamese planning document under `deliverables/` is also ignored. English files are ready to commit; this task does not automatically commit or push them.

## Install and start

Install Node/npm and the MetaMask extension. In PowerShell at the repository root:

```powershell
npm.cmd ci
```

The project installs Node **20.19.0** locally. npm scripts use it for Hardhat, Ganache, and Vite. Use `npm.cmd` if PowerShell blocks `npm.ps1`; changing ExecutionPolicy is unnecessary. Installation requires internet access. The pinned npm `solc` compiler avoids a separate compiler download.

Terminal 1, keep running:

```powershell
npm.cmd run chain
```

RPC `http://127.0.0.1:7545`, chain ID **1337**, network ID **5777**, hardfork **Shanghai**. State is stored in `.ganache-db/`. Deterministic wallets keep stable addresses; their keys are public test keys and must never hold real assets. Ganache prints the demo keys for MetaMask in this terminal.

Terminal 2:

```powershell
npm.cmd run deploy
npm.cmd run dev
```

Open **http://127.0.0.1:5173**. Deploy exports ABI, address, chain ID, and RPC to `frontend/src/deployment.json`, and wallet addresses to `docs/demo-accounts.json`. A fresh contract has no issuers or certificates. Reload after redeployment; do not reset a chain while using its old address.

## Ganache GUI and transaction visibility

CLI and GUI normally run **separate blockchains**. Equal chain IDs do not imply identical history. Transactions sent to CLI do not automatically appear in a different GUI workspace. The GUI is not a general explorer attached to the running CLI database.

To show transactions in the desktop GUI, stop the CLI, start a persistent GUI workspace, and read its actual RPC URL and chain ID. Use chain 1337 and Shanghai when available, or configure the actual chain ID explicitly:

```powershell
# Replace these examples with your GUI workspace values.
$env:GANACHE_RPC = 'http://127.0.0.1:7545'
$env:GANACHE_CHAIN_ID = '1337'
npm.cmd run deploy
npm.cmd run dev
```

Import the GUI workspace's own wallets into MetaMask. Match the regenerated `docs/demo-accounts.json`. Never run CLI and GUI on the same port. Switching to GUI requires a new deployment there; old CLI receipts stay on the CLI chain. The gas benchmark requires chain 1337 and Shanghai.

If your Ganache GUI rejects deployment with `invalid opcode`, use `npm.cmd run deploy:gui` instead of `npm.cmd run deploy`. This compiles the same contract for EVM Paris, which avoids Shanghai's PUSH0 opcode. It records `evmVersion` in the exported deployment configuration. Keep using `npm.cmd run deploy` for the Shanghai CLI benchmark. Paris GUI deployment does not reproduce the saved Shanghai gas measurements; use the documented CLI environment to regenerate those measurements.

| Action | Mined transaction? |
| --- | --- |
| Deploy, grant/remove role, issue, revoke | Yes, once submitted and mined |
| Submitted transaction that reverts on-chain | Yes, failed status and gas consumed |
| Token/wallet lookup or verification using eth_call | No |
| JSON download, URI fetch, wallet connection | No |
| Signature rejection or failed gas estimation before submission | No |
| npm test | Only on Hardhat's temporary network, not Ganache |
| npm run test:ganache or npm run verify | Yes, on the configured Ganache RPC |

Inspect the selected RPC, chain, recent transactions, and saved gas receipts without changing state:

```powershell
npm.cmd run transactions
```

## MetaMask walkthrough

1. Add the selected Ganache RPC, chain ID, and ETH currency. Chain ID differs from network ID. Connect supports adding/switching to the deployed network.
2. Import four demo wallets: admin, issuer, student, and outsider. Match `docs/demo-accounts.json`.
3. Connect the admin. Enter the issuer address under **Issuer permissions**, click **Grant role**, and confirm.
4. Switch to the issuer. Enter the student address. Keep the default metadata and URI for the sample, or click **Create and download JSON** for new data.
5. Copy downloaded JSON into `frontend/public/metadata/` and enter its URI, such as `http://localhost:5173/metadata/certificate.json`. A file in Downloads is not automatically served by Vite. URI contents must match the form.
6. Issue, wait for the receipt, and obtain the token ID from its event. Look up the token or student wallet without connecting MetaMask.
7. Select `frontend/public/metadata/cert-tampered.json` to show a hash mismatch. Clear the file selection to verify the URI again.
8. Revoke as the original issuer with an active role, or as admin. Verification becomes invalid while the NFT remains owned by the student. Admin can remove the issuer role.

The UI distinguishes missing tokens, revoked certificates, hash mismatch, invalid JSON, unavailable metadata, and fully valid certificates. Unavailable JSON never produces a fully valid result. Wallet/network changes update permissions and write buttons.

## Verification and gas

```powershell
npm.cmd test
npm.cmd run test:ganache
npm.cmd run verify
npm.cmd run build
npm.cmd run test:ui
npm.cmd run report
```

`verify` requires Ganache. It saves both test logs, cleans/compiles with optimizer disabled and enabled, measures identical operations using receipts, then deploys a **fresh demo contract** and updates the web configuration. Do not run it midway through a demo. Tests deploy independently without Hardhat-only reset, balance, or fixture RPCs on Ganache.

`test:ui` requires Vite and Ganache at port 7545/chain 1337. Windows uses installed Edge; other systems use Playwright Chromium (`npx playwright install chromium`). Override `PLAYWRIGHT_CHANNEL` when needed. It deploys a separate test contract without changing the demo address and uses unlocked local accounts only in test code.

`docs/gas-results.csv` stores gasUsed, gasPrice, fee in wei, transaction hash, block, compiler, and optimizer setting. Both raw runs are in `docs/gas-*.json`. Inputs and Shanghai are identical, with a new deployment for each setting. Reduction is `(disabled gas − enabled gas) / disabled gas × 100`; negative values mean increased gas. eth_call charges no transaction fee but consumes node computation.

## Structure and responsibilities

| Path | Responsibility |
| --- | --- |
| contracts/AcademicCertificate.sol | Thien: ERC721, roles, immutable records, revocation, transfer restrictions |
| test/, scripts/, hardhat.config.js | Thien: tests, deployment, gas, environment |
| frontend/ | Thinh: UI, wallet, JSON, lookup and integrity verification |
| README.md, docs/DEMO.md, docs/UI-CHECKLIST.md | Thinh: instructions and demo; both members cross-check |
| docs/report.pdf | Five-page report based on recorded execution |

These are handover/presentation responsibilities, not claims about individual lines' authorship.

## API and metadata

`issueCertificate(student, uri, hash)` requires ISSUER_ROLE and rejects a zero address, empty URI, and zero hash. `getCertificate(id)` returns student, issuer, metadataHash, issuedAt, revoked, and uri. `getCertificatesByStudent(address)` includes revoked records. `verifyCertificate(id, hash)` returns valid, revoked, hashMatches; a missing token returns three false values. `revokeCertificate(id)` requires admin or the original issuer with an active role. AccessControl supplies grantRole/revokeRole. Admin needs ISSUER_ROLE to mint. Approvals cannot bypass transfer restrictions.

Metadata strings are ordered `name, course, grade, date`; date uses `YYYY-MM-DD`. Hashing uses the **exact UTF-8 JSON text**, including newlines. Whitespace, BOM, and key order affect it. `issuedAt` is block time, independent of the business date.

## Limits and troubleshooting

This is a local academic demo with the planned pinned toolchain. Hashes prove unchanged data, not truthful academic claims. Compromised admin/issuer wallets can misuse roles. Local metadata depends on the server and CORS. Student lists are not paginated. There is no IPFS, backend, login, marketplace, proxy, or cloud deployment.

| Symptom | Check |
| --- | --- |
| RPC refused | Start the selected instance and check its port |
| Contract missing | Deploy on that RPC and reload |
| No transactions in GUI | Compare RPC/workspace; CLI and GUI histories are separate |
| Wrong network | Use chain ID, not network ID |
| Metadata unavailable | Copy JSON into public/metadata; open the URI; check CORS |
| Hash mismatch | Compare exact UTF-8 bytes; avoid reformatting |
| Mint/revoke rejected | Check wallet, role, original issuer, token existence and status |
| Stale nonce after reset | Redeploy and clear activity/nonce data for demo wallets if needed |

## References

- [Hardhat configuration](https://v2.hardhat.org/hardhat-runner/docs/config)
- [OpenZeppelin ERC721](https://docs.openzeppelin.com/contracts/5.x/api/token/erc721)
- [OpenZeppelin AccessControl](https://docs.openzeppelin.com/contracts/5.x/access-control)
- [Ganache CLI options](https://archive.trufflesuite.com/docs/ganache/reference/cli-options/)
