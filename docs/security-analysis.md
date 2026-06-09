# Security Analysis

## Overview

The proposed healthcare data-sharing system combines blockchain technology and cryptographic techniques to ensure secure management of electronic health records.

---

## Confidentiality

### Mechanisms

* AES-256 encryption for medical files
* RSA encryption for key sharing

### Implementation

* encryptFile()
* decryptFile()
* encryptKeyForUser()
* decryptKeyForUser()

### Result

Only authorized users can access sensitive patient information.

---

## Integrity

### Mechanisms

* Hyperledger Fabric ledger
* Cryptographic hashing

### Implementation

* Registration verification value (RV)
* Immutable blockchain records

### Result

Medical records cannot be modified without detection.

---

## Availability

### Mechanisms

* Distributed blockchain network
* Decentralized storage architecture

### Result

System remains operational even if individual components fail.

---

## Authentication

### Mechanisms

* Public/private key pairs
* Blockchain identity registration

### Implementation

* generateUserKeyPair()
* registerUser()

### Result

Only registered entities can participate in the system.

---

## Authorization

### Mechanisms

* Role-based access control
* Privacy-level enforcement
* Key-sharing restrictions

### Implementation

* shareKeyWithUsers()
* revokeUserAccess()

### Result

Users receive access only to authorized resources.

---

## Auditability

### Mechanisms

* Immutable blockchain logs
* Transaction history

### Result

All access operations are traceable and verifiable.

---

## Non-Repudiation

### Mechanisms

* Blockchain transactions
* Cryptographic identities

### Result

Users cannot deny actions performed using their registered identities.

---

## Conclusion

The combination of Hyperledger Fabric, AES encryption, RSA-based key management, and decentralized storage provides strong confidentiality, integrity, authentication, authorization, and auditability for healthcare data sharing.
