# NFT Academic Certificate — Team 4

## Current contribution scope

This contribution covers Nguyen Ba Thien's assigned contract, testing, deployment, and gas-analysis portion of the team project.

- `contracts/`: non-transferable ERC-721 certificates, issuer permissions, issuance, revocation, and hash verification.
- `test/`: 29 contract tests, including permission failures, invalid inputs, and transfer restrictions.
- `hardhat.config.js`, `scripts/tool.js`: pinned Solidity compiler and local toolchain.
- `scripts/deploy*.js`, `scripts/gas.js`, `scripts/verify.js`, `scripts/transactions.js`: deployment, gas measurement, and transaction inspection.
- `docs/GAS.md`, gas data, test logs, environment record, and contract diagrams: existing measured evidence and design material. Recorded evidence is historical, not a claim that Ganache was rerun for this publication.

Shared package manifests and environment examples are included so this portion can be installed and tested. Frontend-related dependencies remain pinned for later integration.

Nguyen Dang Thinh's assigned UI, wallet integration, automatic JSON storage, browser tests, demo instructions, and report assembly are not included in this contribution. The complete system remains in the original project repository until those files are integrated here.

## Install and test

```sh
npm ci
npm test
```

The test suite uses Hardhat's temporary chain and requires neither Ganache nor the frontend. It does not create transactions in the Ganache GUI.

## Ganache deployment

For a local CLI chain, run `npm run chain` in one terminal, then `npm run deploy` in another. For an existing Ganache GUI workspace on port 7545 and chain ID 1337, use `npm run deploy:gui` for Paris-compatible bytecode. Do not start the CLI on the same port as an active GUI workspace.

Deployment generates `frontend/src/deployment.json` and `docs/demo-accounts.json` for later frontend integration. These generated integration files are not the UI implementation. Each fresh deployment has a new contract with no issued certificates; the admin must grant the issuer role before issuance.

`npm run transactions` requires a generated deployment configuration and a running Ganache RPC. `npm run verify` requires the documented Shanghai CLI chain and runs tests, gas measurements, and a fresh deployment; avoid it during a demo because it replaces deployment configuration.

## Integration and evidence

See [contract diagrams](docs/DIAGRAMS.md) and [gas analysis](docs/GAS.md). UI images referenced by the full project documentation will become available when the frontend contribution is integrated. Vietnamese companion PDFs, generated metadata, private keys, dependencies, and build output are excluded from Git.
