# Academic certificate contract diagrams

These editable diagrams correspond to Section 3 of the six-page report. The PDF draws the same relationships using native vector shapes.

## Inheritance and storage

```mermaid
classDiagram
    ERC721 <|-- AcademicCertificate
    AccessControl <|-- AcademicCertificate
    class AcademicCertificate {
        bytes32 ISSUER_ROLE
        uint256 totalIssued
        mapping certificates
        mapping metadataURIs
        mapping studentTokenIds
        issueCertificate(student, uri, hash) uint256
        revokeCertificate(tokenId)
        getCertificate(tokenId)
        getCertificatesByStudent(student) uint256[]
        verifyCertificate(tokenId, hash)
        tokenURI(tokenId) string
        _update(to, tokenId, auth) address
    }
    class Certificate {
        address student
        address issuer
        bytes32 metadataHash
        uint64 issuedAt
        bool revoked
    }
    AcademicCertificate *-- Certificate
```

## Persistent lifecycle

```mermaid
stateDiagram-v2
    [*] --> NotIssued
    NotIssued --> Active: authorized issueCertificate
    Active --> Revoked: authorized revokeCertificate
    note right of Revoked
        NFT ownership and metadata remain.
        No burn or un-revoke API.
    end note
```

Hash mismatch and unavailable metadata are verification outcomes; they do not change this on-chain lifecycle. Approvals cannot bypass non-transferability.

## Issuance and public verification

```mermaid
sequenceDiagram
    actor User as Issuer or verifier
    participant Web as Web and local JSON storage
    participant Wallet as MetaMask
    participant Chain as Contract and RPC
    User->>Web: Enter student and metadata
    Web->>Web: Save local JSON; fill URI; fetch exact bytes and hash
    Web->>Wallet: Request issueCertificate signature
    Wallet->>Chain: Submit signed transaction
    Chain->>Chain: Check role and inputs; write record/index; safeMint
    Chain-->>Web: Receipt with CertificateIssued tokenId
    User->>Web: Look up token or choose comparison JSON
    Web->>Chain: eth_call getCertificate and verifyCertificate
    Chain-->>Web: revoked and hash comparison
    Note over User,Chain: Public reads require no signature and create no transaction.
```
