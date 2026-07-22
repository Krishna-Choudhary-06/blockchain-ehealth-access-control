# Final Live Demo & Presentation Guide

This guide is prepared for presenting the **Blockchain E-Health Access Control Platform** to **Mr. Dinesh Kumar** (Advisor/Professor) at **NIT JAMSHEDPUR**.

---

## 📺 Presentation Slide Outline & Cues

### Slide 1: Title & Overview
- **Title**: An Adaptive Blockchain-Enabled Access Control Framework for Secure E-Health Data Sharing.
- **Presenter**: eHealth Blockchain Team
- **Dialogue Cues**: 
  > "Good morning, Professor. Today we present our decentralized eHealth system implementation. Our platform addresses patient privacy, medical record fragmentation, and immediate access revocation, utilizing a combination of Hyperledger Fabric blockchain, IPFS content storage, Attribute-Based Access Control, and BGW broadcast encryption."

### Slide 2: Technical Architecture
- **Topics**: Fabric Blockchain Ledger + IPFS Content-Addressable Storage.
- **Dialogue Cues**:
  > "To ensure scalability, we separate metadata storage from actual record storage. Large, sensitive files are encrypted client-side and saved off-chain on IPFS. The resulting IPFS CID (Content Identifier) is recorded on the Hyperledger Fabric ledger along with ABAC access policies (levels L0 through L3)."

### Slide 3: Cryptographic Protocols
- **Topics**: AES-256-GCM + BGW Broadcast Encryption.
- **Dialogue Cues**:
  > "Standard PKI architectures suffer from high overhead when re-encrypting files during access revocation. We implement BGW Broadcast Encryption. This allows us to revoke access for any user dynamically by updating the on-chain broadcast header in the transaction metadata, without needing to re-encrypt the file payload on IPFS."

---

## 💻 Live Demo Steps & System Dialogue

### Step 1: User Registration
- **Action**: Go to `/register`, select **Patient** role, fill out details, review the dynamic attribute mapping schema, and click **Enroll Identity**.
- **Dialogue Cues**:
  > "First, we register a patient on the network. Notice that Admin is excluded from registration; administrators can only log in through system credentials. When we click 'Enroll Identity', the browser generates a 2048-bit RSA-OAEP key pair. The public key is mapped as an identity attribute on Hyperledger Fabric, while the private key is downloaded as a `.pem` file to sign future transactions."

### Step 2: Certificate Authentication
- **Action**: Navigate to `/login`, input patient's identifier (certificate UID or email), and load the downloaded `.pem` private key.
- **Dialogue Cues**:
  > "To log in, we don't rely on simple passwords alone. We perform cryptographic verification. The system checks the user's certificate on the blockchain ledger, and they must upload their private `.pem` key to prove identity. Once validated, a secure session is established for the patient."

### Step 3: Medical Record Encryption & Upload
- **Action**: Log in as a Doctor or Patient, choose **Upload**, select a file, set sensitivity to `L2` (Authorized Accountant/Nurse clearance), and upload.
- **Dialogue Cues**:
  > "Now, we will upload a medical record. The file is encrypted client-side using AES-256-GCM. The encrypted payload is uploaded to IPFS. The IPFS hash along with the access matrix policy parameters is committed to Hyperledger Fabric in a single transaction block."

### Step 4: Access Control Enforcements & Log Auditing
- **Action**: Log in as an unauthorized doctor and request access (will be blocked and log recorded). Log back in as the patient, approve access, and log back in as the doctor to successfully decrypt the record.
- **Dialogue Cues**:
  > "If an unauthorized practitioner attempts to access this record, the smart contract immediately rejects it, writing an immutable denial audit trail to the ledger. When the patient views their dashboard under 'Who Accessed My Data', they can view this request and grant approval. Once approval is granted, the authorized doctor can fetch the IPFS payload, retrieve the encrypted key, decrypt it using their private key PEM, and view the decrypted medical record directly in the browser."
