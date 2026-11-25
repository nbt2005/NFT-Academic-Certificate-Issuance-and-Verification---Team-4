// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

/// @notice Immutable academic records. Revocation preserves ownership and history.
contract AcademicCertificate is ERC721, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256('ISSUER_ROLE');
    struct Certificate {
        address student;
        address issuer;
        bytes32 metadataHash;
        uint64 issuedAt;
        bool revoked;
    }
    uint256 public totalIssued;
    mapping(uint256 => Certificate) private certificates;
    mapping(uint256 => string) private metadataURIs;
    mapping(address => uint256[]) private studentTokenIds;

    error InvalidStudent();
    error EmptyURI();
    error EmptyHash();
    error UnauthorizedRevocation();
    error AlreadyRevoked();
    error NonTransferable();
    event CertificateIssued(uint256 indexed tokenId, address indexed student, address indexed issuer, bytes32 metadataHash, string uri);
    event CertificateRevoked(uint256 indexed tokenId, address indexed actor);

    constructor() ERC721('Academic Certificate', 'ACERT') { _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); }

    function issueCertificate(address student, string calldata uri, bytes32 hash) external onlyRole(ISSUER_ROLE) returns (uint256 tokenId) {
        if (student == address(0)) revert InvalidStudent();
        if (bytes(uri).length == 0) revert EmptyURI();
        if (hash == bytes32(0)) revert EmptyHash();
        tokenId = ++totalIssued;
        // All record state is committed before the receiver callback.
        certificates[tokenId] = Certificate(student, msg.sender, hash, uint64(block.timestamp), false);
        metadataURIs[tokenId] = uri;
        studentTokenIds[student].push(tokenId);
        emit CertificateIssued(tokenId, student, msg.sender, hash, uri);
        _safeMint(student, tokenId);
    }

    function revokeCertificate(uint256 tokenId) external {
        _requireOwned(tokenId);
        Certificate storage c = certificates[tokenId];
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && !(hasRole(ISSUER_ROLE, msg.sender) && c.issuer == msg.sender)) revert UnauthorizedRevocation();
        if (c.revoked) revert AlreadyRevoked();
        c.revoked = true;
        emit CertificateRevoked(tokenId, msg.sender);
    }

    function getCertificate(uint256 tokenId) external view returns (address student, address issuer, bytes32 metadataHash, uint64 issuedAt, bool revoked, string memory uri) {
        _requireOwned(tokenId);
        Certificate storage c = certificates[tokenId];
        return (c.student, c.issuer, c.metadataHash, c.issuedAt, c.revoked, metadataURIs[tokenId]);
    }
    function getCertificatesByStudent(address student) external view returns (uint256[] memory) { return studentTokenIds[student]; }
    function tokenURI(uint256 tokenId) public view override returns (string memory) { _requireOwned(tokenId); return metadataURIs[tokenId]; }
    function verifyCertificate(uint256 tokenId, bytes32 hash) external view returns (bool valid, bool revoked, bool hashMatches) {
        if (_ownerOf(tokenId) == address(0)) return (false, false, false);
        Certificate storage c = certificates[tokenId];
        hashMatches = c.metadataHash == hash;
        revoked = c.revoked;
        valid = !revoked && hashMatches;
    }
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (_ownerOf(tokenId) != address(0) && to != address(0)) revert NonTransferable();
        return super._update(to, tokenId, auth);
    }
    function supportsInterface(bytes4 id) public view override(ERC721, AccessControl) returns (bool) { return super.supportsInterface(id); }
}
