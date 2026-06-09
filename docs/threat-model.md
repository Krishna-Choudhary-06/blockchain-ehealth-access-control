# Threat Model

## Overview

This project secures electronic health records using Hyperledger Fabric, AES encryption, RSA key management, and decentralized storage. The following threats were identified and analyzed.

---

## Threat 1: Unauthorized Doctor Access

### Description

An unauthorized doctor attempts to access a patient's medical records.

### Impact

* Privacy violation
* Exposure of sensitive health information

### Mitigation

* Blockchain-based user registration
* Role-based access control
* RSA-encrypted key sharing
* Access verification through smart contracts

---

## Threat 2: Credential Theft

### Description

An attacker obtains a user's login credentials.

### Impact

* Unauthorized record access
* Data misuse

### Mitigation

* Public/private key cryptography
* Blockchain identity verification
* Audit logs for all transactions

---

## Threat 3: Insider Data Leakage

### Description

An authorized user intentionally shares patient data outside the system.

### Impact

* Privacy breach
* Regulatory violations

### Mitigation

* Access logging on blockchain
* Traceable user identities
* Revocation of user access rights

---

## Threat 4: Compromised IPFS Node

### Description

An attacker gains access to an IPFS storage node.

### Impact

* Exposure of stored files

### Mitigation

* Files are encrypted using AES-256 before storage
* Encryption keys are never stored with the files
* RSA protects key distribution

---

## Threat 5: Blockchain Tampering Attempt

### Description

An attacker attempts to modify transaction history.

### Impact

* Loss of trust
* Manipulated records

### Mitigation

* Hyperledger Fabric consensus mechanism
* Immutable ledger structure
* Multi-organization validation

---

## Threat 6: Encryption Key Leakage

### Description

A symmetric encryption key becomes exposed.

### Impact

* Unauthorized data decryption

### Mitigation

* RSA encryption of AES keys
* Key sharing only with authorized users
* Access revocation support

---

## Threat 7: Replay Attacks

### Description

An attacker resends a previously valid request.

### Impact

* Repeated unauthorized operations

### Mitigation

* Transaction timestamps
* Blockchain transaction IDs
* Smart contract validation
