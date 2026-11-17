# Manual UI and MetaMask checks

Automated coverage is in e2e/workflow.spec.js and docs/ui-results.txt. It simulates EIP-1193 and submits real Ganache transactions. These real-extension checks remain manual.

- [ ] Import four demo wallets; admin grants the issuer role.
- [ ] Switch admin → issuer → student → outsider: role labels and write buttons update.
- [ ] Switch network: write actions are disabled and Connect offers the configured chain.
- [ ] Reject a MetaMask request: the app explains it and restores the correct button state.
- [ ] Stop Ganache and look up a token: an RPC error appears. Restart and retry successfully.
- [ ] Use a missing URI or blocked CORS: integrity stays unverified, never fully valid.
- [ ] Invalid JSON, changed grades, and whitespace-only changes fail integrity checks.
- [ ] Complete issue → token lookup → wallet lookup → tampered JSON → clear file → revoke.
- [ ] Another issuer cannot revoke the original issuer's certificate.
- [ ] Show writes on the same chain used by the app; explain why reads are not transactions.
- [ ] Rehearse the full two-person demonstration twice in under ten minutes.
