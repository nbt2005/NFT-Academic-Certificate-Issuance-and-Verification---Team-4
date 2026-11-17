# Ten-minute demonstration

Thien explains the contract, permissions, tests, and gas. Thinh operates the web app, MetaMask, metadata, and verification.

| Minute | Action and evidence |
| --- | --- |
| 0–1 | Introduce the architecture and show the selected Ganache RPC and chain ID. Use GUI mode if transactions must appear in the desktop workspace. |
| 1–2 | Connect admin and grant the issuer role using docs/demo-accounts.json. Show the confirmed transaction. |
| 2–4 | Switch to issuer, enter the student address, use the sample JSON/default URI, and issue. Obtain the token ID from the receipt. |
| 4–5 | Look up the token: check recipient, issuer, and matching hash. Explain that reading creates no transaction. |
| 5–6 | Look up the student wallet and show its certificate list. |
| 6–7 | Select frontend/public/metadata/cert-tampered.json and look up again. Show the mismatch, then clear the file selection. |
| 7–8 | Revoke as issuer/admin. Look up again: revoked and invalid; the student still owns the NFT. Show the revocation transaction. |
| 8–9 | Switch to the outsider: issuance is disabled. Show permission and mined-failure tests in docs/test-results.txt. |
| 9–10 | Show docs/GAS.md and the report. Explain optimizer results and local metadata limits. |

Prepare terminals for the selected chain, Vite, and tests. Import only Ganache demo keys. Do not run CLI and GUI on the same port, reset the chain, or run verify midway through the demo. Redeploy and reload after switching blockchains. Rehearse the sequence twice; real MetaMask extension behavior requires manual verification.

Use `npm.cmd run transactions` to inspect the configured RPC and saved gas receipts. Hardhat tests use a temporary network; only Ganache-targeted tests create transactions on Ganache.
