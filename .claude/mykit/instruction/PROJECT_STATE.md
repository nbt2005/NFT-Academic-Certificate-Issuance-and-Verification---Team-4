## Current implementation (2026-11-21)

Local academic ERC-721 demo with Vite, ethers, Hardhat, and Ganache. Metadata is automatically saved by loopback-only Vite middleware; generated files remain local and ignored by Git. The English six-page report, editable report source, and evidence are retained. Vietnamese PDF companions remain local.

Deployment configuration targets the user's Ganache GUI (Paris EVM, chain 1337). RPC port 7545 was unavailable during the merge, so the stored contract address has not been revalidated or redeployed. The helper requires `npm run dev`; static builds do not expose its write API. Existing recorded Ganache/browser evidence is retained; current checks are listed in TASK_STATE.md.
