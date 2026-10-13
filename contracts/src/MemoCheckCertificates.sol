// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MemoCheckCertificates
 * @notice Decentralized, tamper-evident verification registry for academic certificates.
 * Records SHA-256 hashes of certificate documents, issuer identities, and revocation state.
 * Student personal data is NEVER stored on-chain.
 */
contract MemoCheckCertificates {
    struct Certificate {
        bytes32 pdfHash;        // SHA-256 hash of certificate PDF bytes
        address issuer;         // Address of university staff/system that issued
        uint64 issuedAt;        // Unix timestamp of issuance
        bool revoked;           // Revocation status flag
        uint64 revokedAt;       // Unix timestamp of revocation (0 if active)
        string ipfsCid;         // Optional IPFS Content Identifier for file reference
    }

    // Owner / Administrator of the institution registry
    address public owner;

    // Authorized university issuer accounts
    mapping(address => bool) public authorizedIssuers;

    // Certificate ID to Certificate record mapping
    mapping(string => Certificate) private _certificates;

    // Total certificate counters
    uint256 public totalIssued;
    uint256 public totalRevoked;

    // Events
    event IssuerAuthorized(address indexed issuer, address indexed authorizedBy);
    event IssuerDeauthorized(address indexed issuer, address indexed deauthorizedBy);
    event CertificateIssued(
        string indexed certificateId,
        bytes32 indexed pdfHash,
        address indexed issuer,
        uint64 issuedAt,
        string ipfsCid
    );
    event CertificateRevoked(
        string indexed certificateId,
        address indexed revokedBy,
        uint64 revokedAt,
        string reason
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "MemoCheck: caller is not the owner");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(
            msg.sender == owner || authorizedIssuers[msg.sender],
            "MemoCheck: caller is not an authorized issuer"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorized(msg.sender, msg.sender);
    }

    /**
     * @notice Transfer ownership of the registry.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MemoCheck: invalid new owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Authorize or deauthorize an issuer address.
     */
    function setAuthorizedIssuer(address issuer, bool authorized) external onlyOwner {
        require(issuer != address(0), "MemoCheck: zero address");
        authorizedIssuers[issuer] = authorized;
        if (authorized) {
            emit IssuerAuthorized(issuer, msg.sender);
        } else {
            emit IssuerDeauthorized(issuer, msg.sender);
        }
    }

    /**
     * @notice Issue a new certificate on-chain.
     * @param certificateId Unique institutional certificate identifier (e.g. MC-2026-94819).
     * @param pdfHash SHA-256 hash of the exact PDF file bytes (32 bytes).
     * @param ipfsCid IPFS CID if the file was anchored to IPFS (or empty string).
     */
    function issueCertificate(
        string calldata certificateId,
        bytes32 pdfHash,
        string calldata ipfsCid
    ) external onlyAuthorizedIssuer {
        bytes memory idBytes = bytes(certificateId);
        require(idBytes.length > 0 && idBytes.length <= 128, "MemoCheck: invalid certificate ID length");
        require(pdfHash != bytes32(0), "MemoCheck: hash cannot be zero");
        require(_certificates[certificateId].issuedAt == 0, "MemoCheck: duplicate certificate ID");

        uint64 currentTimestamp = uint64(block.timestamp);

        _certificates[certificateId] = Certificate({
            pdfHash: pdfHash,
            issuer: msg.sender,
            issuedAt: currentTimestamp,
            revoked: false,
            revokedAt: 0,
            ipfsCid: ipfsCid
        });

        totalIssued += 1;

        emit CertificateIssued(certificateId, pdfHash, msg.sender, currentTimestamp, ipfsCid);
    }

    /**
     * @notice Revoke an existing certificate with an audit reason.
     * @param certificateId The certificate identifier to revoke.
     * @param reason Human-readable administrative reason for revocation.
     */
    function revokeCertificate(
        string calldata certificateId,
        string calldata reason
    ) external onlyAuthorizedIssuer {
        Certificate storage cert = _certificates[certificateId];
        require(cert.issuedAt > 0, "MemoCheck: certificate does not exist");
        require(!cert.revoked, "MemoCheck: certificate already revoked");

        cert.revoked = true;
        cert.revokedAt = uint64(block.timestamp);
        totalRevoked += 1;

        emit CertificateRevoked(certificateId, msg.sender, cert.revokedAt, reason);
    }

    /**
     * @notice Read verification details for a certificate ID.
     */
    function getCertificate(string calldata certificateId)
        external
        view
        returns (
            bool exists,
            bytes32 pdfHash,
            address issuer,
            uint64 issuedAt,
            bool revoked,
            uint64 revokedAt,
            string memory ipfsCid
        )
    {
        Certificate storage cert = _certificates[certificateId];
        if (cert.issuedAt == 0) {
            return (false, bytes32(0), address(0), 0, false, 0, "");
        }
        return (
            true,
            cert.pdfHash,
            cert.issuer,
            cert.issuedAt,
            cert.revoked,
            cert.revokedAt,
            cert.ipfsCid
        );
    }

    /**
     * @notice Quick on-chain verification helper checking existence, revocation, and hash match.
     */
    function verifyCertificate(string calldata certificateId, bytes32 suppliedHash)
        external
        view
        returns (
            bool exists,
            bool hashMatches,
            bool isRevoked,
            uint64 issuedAt,
            address issuer
        )
    {
        Certificate storage cert = _certificates[certificateId];
        if (cert.issuedAt == 0) {
            return (false, false, false, 0, address(0));
        }

        bool matchResult = (suppliedHash == bytes32(0)) ? false : (cert.pdfHash == suppliedHash);
        return (true, matchResult, cert.revoked, cert.issuedAt, cert.issuer);
    }
}
