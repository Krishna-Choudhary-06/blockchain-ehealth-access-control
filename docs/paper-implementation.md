# Paper Implementation Guide

This repository implements the paper's adaptive blockchain-enabled e-health access-control framework with Hyperledger Fabric, IPFS, and BGW broadcast encryption.

## Implemented Phases

### Phase 1: Registration and Authentication

- Chaincode records users in `USER_<userId>`.
- Registration value follows the paper:
  - `RV = Hash(publicKey || registrationData)`
  - `RCSV` is stored as the Fabric RA binding for the registration value.
- Certificate metadata is stored with the user record.
- Backend endpoint:
  - `POST /api/register`

### Phase 2: Data Classification and Privacy Assignment

- Privacy levels follow the paper:
  - `L0`: doctor/admin only, most restrictive
  - `L1`: laboratory/authorized providers
  - `L2`: authorized staff
  - `L3`: public
- Chaincode stores access levels in `ACL_<userId>`.
- Data categories map to paper levels:
  - prescriptions -> `L0`
  - laboratory -> `L1`
  - medical history -> `L2`
  - billing/public -> `L3`
- Backend endpoint:
  - `POST /api/assign-level`

### Phase 3: Broadcast Encryption

- BGW is implemented with `mcl-wasm` on BLS12-381 in `app/services/broadcast`.
- Setup publishes the exponent ladder and omits `g_{n+1}`.
- Key generation issues `d_i = g_i^gamma`.
- Encryption builds:
  - `C0 = h^t`
  - `C1 = (v * product g_{n+1-j})^t`
  - `K = e(g_n, h_1)^t`
- Payloads are encrypted with AES-256-GCM under `HKDF(K)`.
- Backend endpoints:
  - `GET /api/bgw/state`
  - `POST /api/bgw/setup`
  - `POST /api/bgw/keygen`

### Phase 4: Secure Data Sharing

- Encrypted BGW envelopes are stored in IPFS.
- Fabric stores only:
  - IPFS CID
  - BGW header
  - payload hash
  - privacy level
  - authorized Fabric user IDs
  - metadata
- Access requests first execute Fabric policy checks, then the backend verifies IPFS payload hash, then BGW decrypts.
- Backend endpoints:
  - `POST /api/upload`
  - `POST /api/access`
  - `POST /api/access/decrypt`
  - `GET /api/logs`
  - `GET /api/data`

## Run Checks

From `app/`:

```bash
npm run smoke:paper
```

This verifies:

- BGW setup/keygen/encrypt/decrypt
- Fabric user registration
- privacy-level assignment
- on-chain data metadata storage
- Fabric access authorization

With IPFS running on `127.0.0.1:5001`, run:

```bash
npm run smoke:full
```

This additionally verifies:

- encrypted BGW envelope upload to IPFS
- CID retrieval from IPFS
- SHA-256 payload-hash verification
- BGW decryption after Fabric authorization

From `frontend/`:

```bash
npm run build
```

## Redeploy Chaincode

The current deployed chaincode is:

- channel: `mychannel`
- name: `ehr-registration-v3`
- version: `2.1`
- sequence: `6`

To redeploy after future chaincode edits, increment `CC_VERSION` and `CC_SEQUENCE`:

```bash
CC_VERSION=2.2 CC_SEQUENCE=7 ./network/scripts/redeploy-chaincode.sh
```

## Production Notes

- Do not return `masterSecret` from `/api/bgw/setup` in production.
- Store `app/data/bgw-state.json` in a secure server-side secret store for production.
- Never expose BGW private keys to users who are not the intended recipients.
- Revocation is forward-looking: update the BGW recipient set/header for future access. Historical plaintext already accessed cannot be cryptographically retracted.
