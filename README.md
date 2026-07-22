# Blockchain E-Health Access Control Platform

> Implementation of the research paper:  
> **"An Adaptive Blockchain-Enabled Access Control Framework for Secure and Privacy-Preserving E-Health Data Sharing"**  
> *by Notash, Jamali, Fotohi (2026)*

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Core Architecture & Technology Roles](#-core-architecture--technology-roles)
3. [Environment Setup Documentation](#-environment-setup-documentation)
4. [Installation & Deployment Guide](#-installation--deployment-guide)
5. [Authentication & Cryptographic Flow](#-authentication--cryptographic-flow)
6. [API Reference & Testing Documentation](#-api-reference--testing-documentation)
7. [Testing & Verification](#-testing--verification)
8. [Live Demonstration Guide](#-live-demonstration-guide)
9. [Academic & Project Information](#-academic--project-information)

---

## 🌟 Project Overview

Electronic Health Record (EHR) sharing across healthcare institutions requires stringent data privacy, fine-grained access control, scalable encryption, and immutable auditability. This platform implements a decentralized eHealth data sharing ecosystem leveraging **Hyperledger Fabric**, **IPFS**, **Attribute-Based Access Control (ABAC)**, and **BGW (Boneh-Gohi-Waters) Broadcast Encryption** with **AES-256-GCM**.

### Core Objectives
- **Data Privacy & Confidentiality**: Medical records are encrypted client-side using AES-256-GCM and stored off-chain on IPFS.
- **Access Control Enforcement**: Multi-level privacy policies (L0 to L3) enforced by smart contracts on Hyperledger Fabric.
- **Dynamic Access & Revocation**: BGW Broadcast Encryption enables key distribution and instant user revocation without requiring full file re-encryption.
- **Immutable Audit Trail**: All data access requests, grants, denials, and policy updates are recorded on the blockchain ledger.

---

## 🏗️ Core Architecture & Technology Roles

| Technology Component | Role & Functionality |
| :--- | :--- |
| **Hyperledger Fabric** | Enterprise permissioned blockchain ledger maintaining user access permissions, data records index, privacy policies (L0–L3), and immutable access audit logs. |
| **Smart Contracts (Chaincode)** | Executable chaincode (`healthcontract`) deployed on `healthchannel`. Contains `UserRegistry`, `PrivacyLevel`, `DataStorage`, and `DataAccess` smart contract modules. |
| **IPFS (InterPlanetary File System)** | Decentralized content-addressed storage for storing encrypted medical file payloads off-chain while maintaining reference hashes on the blockchain ledger. |
| **Encryption Subsystem** | **BGW Broadcast Encryption + AES-256-GCM**: Files are encrypted with a symmetric AES key, while BGW encrypts the key header for a dynamically authorized set of users. |
| **Access Control System** | **ABAC (Attribute-Based Access Control)**: Restricts data visibility based on user role (*Patient*, *Doctor*, *Nurse*, *Accountant*, *Admin*) and dataset privacy levels (*L0*: Doctor-Only, *L1*: Laboratory, *L2*: Nurses & Accountants, *L3*: Public Access). |

---

## 🛠️ Environment Setup Documentation

### Operating System Requirements
- **Windows 10 / 11** with **WSL2 (Ubuntu 24.04 / 22.04 LTS)** or native **Linux (Ubuntu 22.04 / 24.04)**
- **RAM**: Minimum 8 GB (16 GB Recommended for running Hyperledger Fabric containers smoothly)
- **Disk Space**: At least 15 GB free space

### Required Software & Prerequisites

| Software | Required Version | Verification Command |
| :--- | :--- | :--- |
| **Git** | `v2.34+` | `git --version` |
| **Node.js** | `v18.x` or `v20.x` (LTS) | `node -v` |
| **npm** | `v9.x+` | `npm -v` |
| **Docker Engine** | `v20.10+` | `docker --version` |
| **Docker Compose** | `v2.x+` | `docker compose version` |
| **Hyperledger Fabric** | `v2.4+` / `v2.5+` | `peer version` |

> [!NOTE]
> For Windows users: Docker Desktop must have **WSL 2 Integration** enabled for your installed Ubuntu distribution.

---

## 🚀 Installation & Deployment Guide

Follow these step-by-step instructions to set up and run the complete project from scratch:

### Step 1: Clone the Repository
```bash
git clone https://github.com/krishna-choudhary-06/blockchain-eHealth-access-control.git
cd blockchain-eHealth-access-control
```

### Step 2: Start Hyperledger Fabric Network & IPFS
1. Open your WSL2 / Ubuntu terminal and navigate to your `fabric-samples/test-network` directory:
   ```bash
   cd ~/fabric-samples/test-network
   ```
2. Start the test network with a channel (`healthchannel`) and Fabric CA enabled:
   ```bash
   ./network.sh down
   ./network.sh up createChannel -c healthchannel -ca
   ```
3. Ensure the local IPFS node/daemon is running:
   ```bash
   ipfs daemon
   # Alternatively via Docker:
   # docker run -d --name ipfs_host -p 5001:5001 -p 8080:8080 ipfs/go-ipfs:latest
   ```

### Step 3: Deploy Chaincode (Smart Contract)
1. Deploy the `healthcontract` smart contract to `healthchannel`:
   ```bash
   ./network.sh deployCC -ccn healthcontract -ccp <PATH_TO_REPO>/chaincode -ccl javascript -ccv 1.0
   ```
2. Verify that peer containers and chaincode containers are active:
   ```bash
   docker ps
   ```

### Step 4: Install Backend Dependencies & Enroll Identities
1. Navigate to the backend application directory:
   ```bash
   cd <PATH_TO_REPO>/app
   npm install
   ```
2. Register and enroll the Admin and Application User (`appUser`) in the local wallet:
   ```bash
   node enrollAdmin.js
   ```
   *Expected Output*: `✅ Admin enrolled` followed by `✅ appUser enrolled`.

### Step 5: Install Frontend Dependencies
1. Navigate to the frontend directory:
   ```bash
   cd <PATH_TO_REPO>/frontend
   npm install
   ```

### Step 6: Start Frontend and Backend Servers
1. **Start Backend Server** (Port `3000`):
   ```bash
   cd <PATH_TO_REPO>/app
   node server.js
   ```
2. **Start Frontend Server** (Port `5173`):
   ```bash
   cd <PATH_TO_REPO>/frontend
   npm run dev
   ```
3. Open your browser and visit: `http://localhost:5173`

---

## 🔐 Authentication & Cryptographic Flow

The authentication and transaction signing flow bridges Fabric CA X.509 credentials with BGW broadcast encryption keys.

```
+-----------------------+
|   User Registration   |
+-----------------------+
            |
            v
+-----------------------+
|  Fabric CA Enrollment |
+-----------------------+
            |
            v
+---------------------------------------+
| X.509 Certificate + BGW Private Key   |
+---------------------------------------+
            |
            v
+-----------------------+
|  Transaction Signing  |
+-----------------------+
            |
            v
+---------------------------------------+
| Hyperledger Fabric Ledger Verification|
+---------------------------------------+
```

### Flow Breakdown:
1. **User Registration**: The application submits user registration details (`userId`, `role`) to the backend API (`/api/register`).
2. **Fabric CA Enrollment**: The Fabric CA verifies administrative authority and registers the identity under `Org1MSP`.
3. **X.509 Certificate Generation**: Fabric CA issues an X.509 digital certificate and private key stored inside `./app/wallet`.
4. **Private Key Generation (BGW)**: The BGW Key Generation Center (KGC) computes a user-specific broadcast decryption key linked to their numeric ID.
5. **Transaction Signing**: Every state modification (uploading record, changing privacy clearance, revoking user) is signed using the client's wallet certificate via the Fabric Gateway SDK.
6. **Hyperledger Fabric Verification**: Endorsing peer nodes validate transaction signatures, verify ABAC policy rules in smart contract chaincode, and record state transitions permanently on the ledger.

---

## 📡 API Reference & Testing Documentation

The backend REST API runs at `http://localhost:3000`. Use the following sample cURL requests for testing.

### 1. User Registration API
- **Endpoint**: `POST /api/register`
- **Description**: Registers a user on the blockchain network and generates BGW keys.
- **cURL Request**:
  ```bash
  curl -X POST http://localhost:3000/api/register \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "doc001",
      "role": "doctor"
    }'
  ```
- **Sample Response**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "doc001",
      "role": "doctor"
    },
    "privateKey": { "sk": "..." }
  }
  ```

---

### 2. Login / Privacy Level Assignment API
- **Endpoint**: `POST /api/assign-level`
- **Description**: Assigns a privacy clearance level (`L0`, `L1`, `L2`, or `L3`) to a registered user.
- **cURL Request**:
  ```bash
  curl -X POST http://localhost:3000/api/assign-level \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "doc001",
      "level": "L2"
    }'
  ```
- **Sample Response**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "doc001",
      "level": "L2"
    }
  }
  ```

---

### 3. Medical Record Upload API
- **Endpoint**: `POST /api/upload`
- **Description**: Encrypts file with BGW + AES-256-GCM, uploads to IPFS, and stores metadata on Hyperledger Fabric.
- **cURL Request**:
  ```bash
  curl -X POST http://localhost:3000/api/upload \
    -F "medicalFile=@sample.pdf" \
    -F "patientId=pat001" \
    -F "dataId=REC_1001" \
    -F "level=L2" \
    -F 'authorizedUsers=["pat001","doc001"]'
  ```
- **Sample Response**:
  ```json
  {
    "success": true,
    "data": {
      "dataId": "REC_1001",
      "patientId": "pat001",
      "ipfsHash": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      "level": "L2"
    },
    "authorizedSet": ["pat001", "doc001"],
    "message": "File encrypted with BGW, uploaded to IPFS, and header stored on chain."
  }
  ```

---

### 4. Access Request API
- **Endpoint**: `POST /api/access`
- **Description**: Verifies requester attributes against chaincode policies. Returns IPFS hash and BGW broadcast header if access is granted.
- **cURL Request**:
  ```bash
  curl -X POST http://localhost:3000/api/access \
    -H "Content-Type: application/json" \
    -d '{
      "requesterId": "doc001",
      "dataId": "REC_1001"
    }'
  ```
- **Sample Response (Access Granted)**:
  ```json
  {
    "success": true,
    "data": {
      "status": "ACCESS_GRANTED",
      "ipfsHash": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      "iv": "a1b2c3d4e5f6...",
      "broadcastHeader": { "hdr": "..." }
    }
  }
  ```

---

### 5. Record Retrieval & Download API
- **Endpoint**: `GET /api/download/:hash`
- **Description**: Downloads encrypted record payload from IPFS using hash.
- **cURL Request**:
  ```bash
  curl -X GET http://localhost:3000/api/download/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
  ```

---

### 6. Audit Logs API
- **Endpoint**: `GET /api/logs`
- **Description**: Retrieves immutable access log trail recorded on Hyperledger Fabric.
- **cURL Request**:
  ```bash
  curl -X GET http://localhost:3000/api/logs
  ```
- **Sample Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "logId": "LOG_001",
        "requesterId": "doc001",
        "dataId": "REC_1001",
        "status": "GRANTED",
        "timestamp": "2026-07-21T18:00:00.000Z"
      }
    ]
  }
  ```

---

## 🧪 Testing & Verification

To run the automated Vitest test suite for frontend and cryptographic modules:

```bash
cd frontend
npm run test
```

The test suite validates:
- File upload validation (extension check for `.pdf`, `.png`, `.jpg`, `.jpeg`).
- AES-256-GCM cipher encryption/decryption routines.
- Role navigation & access controls (Patient, Doctor, Nurse, Accountant, Admin).
- IPFS Hash generation and API responses.
- Audit logging dashboard visualization.

---

---

## 💻 Live Demonstration Guide

This guide details the live demonstration flow for presentations and reviews.

### Step 1: User Registration
1. Navigate to `/register` in the browser.
2. Select the **Patient** or **Doctor** or **Accountant** card. Note that the **Admin** role is excluded here for security clearance.
3. Fill out the registration form. For Patients, this includes DOB, Blood Group, and Gender.
4. Review the dynamic attribute map (JSON schema) showing live ledger attribute mapping parameters (msp_id, role, attributes, consensus).
5. Click **Enroll Identity** to trigger key generation:
   - Browser generates a 2048-bit RSA-OAEP key pair.
   - The public key is registered on the blockchain network ledger under a unique fingerprint `UID-xxxxxx`.
   - The private key is returned to the user; click **Download .PEM File** to save it locally.

### Step 2: Session Login
1. Navigate to `/login` and select **Sign In as User**.
2. Lookup your identity by certificate UID, email, or username (e.g. `Patient Alex Carter` or the user you registered).
3. Verify your organizational MSP attribute details are successfully parsed on the screen.
4. Input your account password.
5. Upload your downloaded cryptographic `.pem` private key. This key is used to sign requests locally.
6. Click **Authenticate Identity** to complete block validation check and open the secure workspace.
7. Note: For **Admins**, select **Sign In as Admin** at the selection menu and enter the default administrative console credentials.

### Step 3: Medical Record Upload
1. From the Patient or Doctor dashboard, click **Upload File / Upload Diagnosis** in the sidebar.
2. Select a PDF or image medical report.
3. Choose the target **Sensitivity Level**:
   - `L0`: Restricted to Doctors only.
   - `L1`: Lab & Doctor clearance.
   - `L2`: Nurses, Accountants, Labs & Doctors clearance.
   - `L3`: Public access.
4. Set the authorized doctors/users list (if L0-L2).
5. Click **Upload and Encrypt**.
   - The file is encrypted client-side using AES-256-GCM.
   - The encrypted payload is uploaded to IPFS, generating a unique Content Identifier (CID) hash.
   - The metadata, IPFS hash, and encrypted AES key header are permanently stored on-chain using a smart contract write transaction.

### Step 4: Access Control Enforcement
1. Log in as a Doctor whose ID was not listed as authorized (or a Nurse/Accountant depending on sensitivity level).
2. Go to Patient files and click **Request Access** for the uploaded record.
3. If the sensitivity rules deny direct access (e.g. L0/L1 and doctor not pre-authorized), a request will log as `Denied`.
4. Log back in as the **Patient** who owns the record.
5. Navigate to **My Records** / **Who Accessed My Data** dashboard view.
6. Observe the access attempts log. Grant consent permission to the Doctor's UID.
7. Log back in as the **Doctor**.
8. Go to Patient files. Click **Decrypt & Download**. The browser downloads the encrypted payload from IPFS, retrieves the authorization header from the ledger, decrypts the AES key using the doctor's private `.pem` key, and decrypts the file payload locally in the browser.

---

## 🎓 Academic & Project Information

- **Lead Developers**: eHealth Blockchain Team
- **Advisor / Professor**: Mr. Dinesh Kumar
- **Institution**: NIT JAMSHEDPUR
- **Research Reference**: *"An Adaptive Blockchain-Enabled Access Control Framework for Secure and Privacy-Preserving E-Health Data Sharing"* by Notash, Jamali, Fotohi (2026)