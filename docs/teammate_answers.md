# Teammate Q&A: Frontend & Integration Architecture

Here are the answers to the frontend-related implementation questions:

---

### 1. Public & Private Key Generation

*   **How are the keys generated?**  
    Keys are generated client-side directly in the browser using the Web Crypto API (`window.crypto.subtle.generateKey`). The key pair uses **RSA-OAEP** with a `modulusLength` of `2048` and `SHA-256` hashing. They are exported as SPKI (Public Key) and PKCS#8 (Private Key) byte buffers, then wrapped in standard PEM headers (`-----BEGIN PUBLIC KEY-----` and `-----BEGIN PRIVATE KEY-----`).
    
*   **Which role (Doctor/Patient/Admin) receives the keys?**  
    **All roles** generate and receive key pairs upon enrollment:
    *   **Public Key**: Registered on the blockchain network (sent to the `/api/register` backend endpoint). This allows anyone who uploads a file to encrypt the file's AES key specifically for a set of authorized users (e.g. Doctors, Nurses, Admins).
    *   **Private Key**: Saved only in the local client's browser storage (`localStorage` key: `user_keys_${userName}`). It is never sent to the backend. This guarantees zero-knowledge confidentiality so that the backend server/database cannot decrypt patient files.

---

### 2. Alex Carter Redirect Bug

*   **Root Cause**:  
    This was a frontend-only bug. The `login()` method inside `useAuth.jsx` was simulating the authenticated session by returning hardcoded mock profiles (e.g. any patient role login was mapped to "Patient Alex Carter", and any doctor role login was mapped to "Dr. Sarah Miller").
    
*   **Fix**:  
    We updated `login()` in `useAuth.jsx` to dynamically scan `localStorage`'s list of registered users (`registered_users`) and read their profile properties (such as their actual name, email, organization, and certificate ID) matching the logged-in email.

---

### 3. Change Password & OTP

*   **Backend Support**:  
    **No**, there is no password reset or OTP endpoint in the backend (`app/server.js`). The Hyperledger Fabric network does not handle user passwords or OTPs (it manages certificate identities via MSP and CA).
    
*   **UI Status**:  
    The Change Password wizard is a simulated demo placeholder.
    
*   **Action Taken**:  
    We have added a clear visual banner indicating `[SIMULATION ONLY: No backend OTP is sent]` to prevent confusion.

---

### 4. System Admin Creation

*   **Backend Support**:  
    **No**, dynamic System Admin registration is not supported through the patient/doctor-facing REST API.
    
*   **Fabric Architecture**:  
    System Administrators are bootstrapped securely at the network/organization level (MSP) during startup. The backend gateway connects to Fabric using a pre-enrolled admin identity (`appUser` in `enrollAdmin.js`).
    
*   **UI Status**:  
    The Admin login uses preconfigured credentials (`admin.key@ehealth.org` / `password123`) to access the Admin Console. No dynamic Admin registration portal is exposed on the frontend.

---

### 5. Enrolled Identities Count

*   **Backend Support**:  
    The blockchain network does not expose a public `/api/users/count` API.
    
*   **UI Status**:  
    The dashboard was displaying a static hardcoded number (`152` or `156`) that incremented randomly.
    
*   **Action Taken**:  
    We removed the fake incrementing loop and bound the metrics block directly to the real number of registered identities stored in `localStorage` (`registered_users`).

---

### 6. Frontend Integration

*   **Decryption access check**: When a doctor requests file decryption, the frontend calls the backend `/api/access` endpoint. The backend evaluates the Attribute-Based Access Control (ABAC) rules on-chain. If it returns `ACCESS_GRANTED`, the frontend proceeds to decrypt the symmetric key locally using the Doctor's private key.
*   **Dashboard logs**: Connected the dashboard's consensus logs table to load logs from the `/api/logs` backend API.

---

### 7. Broadcast Encryption Integration

*   **Workflow**:  
    Broadcast encryption in our framework is implemented by combining symmetric encryption (AES-256-CBC) and asymmetric encryption (RSA-OAEP):
    1.  **Symmetric Encrypt**: The patient encrypts their medical document locally using a random AES-256 key (`encryptFile()`).
    2.  **Asymmetric Encrypt (Broadcast)**: The patient's client retrieves the public keys of all authorized users (Doctors, Nurses, Admins). It encrypts the AES key multiple times, once for each user's public key, generating a map of `userId -> encryptedSymmetricKey` (`shareKeyWithUsers()`).
    3.  **On-chain / Off-chain Storage**: The encrypted document is uploaded to IPFS. The IPFS hash (`ipfsHash`), IV (`ivHex`), and the map of encrypted symmetric keys (`sharedKeys`) are submitted to the backend and recorded.
    4.  **Decryption**: When a doctor requests the file, they query the record's metadata, look up the encrypted symmetric key matching their `userId`, decrypt it using their client-stored private key (`decryptKeyForUser()`), and use it to decrypt the AES-encrypted IPFS file payload.
    
This demonstrates the complete broadcast encryption feature without complex CLI interactions.
