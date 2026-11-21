## 2026-11-21: Merge and publish the user's version

- Authorized by the user: publish the local implementation to origin/main while retaining non-conflicting remote additions.
- Kept automatic local metadata storage, English report and evidence, and the user's Ganache GUI deployment configuration.
- Retained remote tooling and documents; corrected manual-copy instructions to match automatic saving.
- Validation: frontend build passed; 29 Hardhat contract tests passed; both automatic metadata storage tests passed. Ganache transaction workflow was not rerun because its RPC was unavailable. The temporary Vite server was stopped after testing.
- Publication: merge prepared for origin/main; verify the remote commit after pushing. Initial kit setup remains unchanged; this task does not approve draft documents or complete setup.
