# Actual Application Workflow (Discovered Flow)

This document details the exact, inspected workflow of the E-Health blockchain application deployed at `~/internship-blockchain-health`.

---

## 1. System Components
1. **Node.js Express Backend** (`app/server.js`, port 3000):
   - Manages REST endpoints, interacts with IPFS via `ipfs-http-client`, and invokes smart contracts via Fabric Network Gateway SDK.
2. **Hyperledger Fabric 2.x** (`healthchannel`, `healthcontract`):
   - Chaincode as a Service (CCAAS) exporting four smart contract classes: `UserRegistry`, `PrivacyLevel`, `DataStorage`, `DataAccess`.
3. **Local IPFS Daemon** (port 5001 API, 8080 Gateway):
   - Stores encrypted medical files off-chain, returning immutable CID hashes.
4. **BGW Broadcast Encryption Library** (`app/bgw/`):
   - Asymmetric pairing-based broadcast encryption on the BLS12-381 elliptic curve via `mcl-wasm`.
5. **Conventional Baseline Cryptography** (`app/services/cryptoService.js`):
   - Standard AES-256-CBC file encryption combined with per-user RSA-2048 key encapsulation.

---

## 2. Phase 1: User Registration & Key Generation
1. Client sends `POST /api/register` with `{ userId, role }`.
2. Backend assigns a numeric BGW ID ($i \in [1, 100]$) using `userIdMap` in `bgw_kgc_state.json`.
3. Backend invokes BGW KeyGen: $d_i = g_i^\gamma = g^{\gamma \cdot \alpha^i}$ using Master Secret Key (MSK).
4. Backend invokes Fabric chaincode `UserRegistry:registerUser(userId, publicKey, role)` storing `USER_<userId>`.
5. Response returns the user's BGW private key and on-chain transaction receipt.

---

## 3. Phase 2: Privacy Tier Classification
1. Client sends `POST /api/assign-level` with `{ userId, level }`.
2. Permitted levels:
   - `L0`: Doctor / Admin (Highest privilege)
   - `L1`: Nurse / Laboratory / Provider
   - `L2`: Medical Staff / Caregiver
   - `L3`: Patient / Public Record
3. Chaincode `PrivacyLevel:assignLevel(userId, level)` commits `LEVEL_<userId>` to state.

---

## 4. Phase 3: Medical File Upload & Storage
1. Client sends `POST /api/upload` as `multipart/form-data`:
   - `medicalFile`: Raw document/image buffer
   - `patientId`: Owner ID
   - `dataId`: Unique identifier (e.g., `rec_12345`)
   - `level`: Privacy classification (`L0` to `L3`)
   - `authorizedUsers`: Initial authorized recipient list (e.g., `["patient1", "doc1"]`)
2. Backend stores the file buffer on IPFS via `ipfs.add()`, obtaining CID $H_{\text{IPFS}}$.
3. Backend builds BGW broadcast header $(C_0, C_1)$ for recipient set $S$, encapsulating symmetric key $K$.
4. Backend invokes Fabric chaincode `DataStorage:storeHash(dataId, patientId, ipfsHash, iv, level, broadcastHeader)`.
5. Chaincode commits `DATA_<dataId>` containing on-chain policy and BGW header. Record is recorded in local `records_registry.json`.

---

## 5. Phase 4: Access Evaluation & Decryption
1. Requester sends `POST /api/access` with `{ requesterId, dataId }`.
2. Backend invokes smart contract `DataAccess:requestAccess(requesterId, dataId)`:
   - Fetches requester's level from `LEVEL_<requesterId>` and data level from `DATA_<dataId>`.
   - Hierarchy rule: Access is granted if $\text{Level}_{requester} \le \text{Level}_{data}$ (where `L0` can access all, `L1` accesses `L1`-`L3`, etc.) OR requester is explicitly listed in `authorizedUsers`.
   - Ledger automatically commits an immutable audit log entry in `DataAccess:getLogs`.
3. If granted:
   - Backend retrieves file from IPFS by CID.
   - For BGW: Requester recovers $K$ from $(C_0, C_1)$ using their private key $d_i$ via single pairing quotient, then decrypts payload with AES-GCM.
   - For Baseline: Requester unwraps AES key using their RSA private key, then decrypts with AES-CBC.

---

## 6. Phase 5: Sharing with Additional Doctor (Research Core)
- **Baseline Sharing (Repeated Encryption)**:
  - Patient must fetch or possess original file, decrypt it, generate new key $K_2$, re-encrypt the file, upload the new ciphertext to IPFS (new CID), encrypt $K_2$ individually for all $N+1$ doctors using RSA, and update Fabric ledger.
  - Cost: Re-encryption $O(|File|)$ + $N+1$ RSA encryptions $O(N)$ + IPFS re-upload $O(|File|)$ + Fabric latency.
- **Proposed Sharing (BGW Broadcast Header Update)**:
  - The file on IPFS is **NEVER downloaded or re-encrypted**.
  - Backend/Patient updates header $H \rightarrow H'$ for $S' = S \cup \{D_{new}\}$ using `updateHeader()`.
  - Re-encryption time = **0 ms** | IPFS re-upload time = **0 ms**.
  - New header is committed to Fabric via `POST /api/add-authorized`.
