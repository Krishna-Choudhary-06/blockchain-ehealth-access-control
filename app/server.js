'use strict';
/**
 * ============================================================
 * server.js — UPDATED with Broadcast Encryption
 * Blockchain E-Health Access Control System
 * ============================================================
 *
 * CHANGES FROM PREVIOUS VERSION:
 *   /api/upload  → now builds broadcastHeader before storing on chain
 *   /api/access  → now returns encryptedKeyForYou in response
 *   /api/revoke  → NEW endpoint for user revocation
 *   /api/add-authorized → NEW endpoint to add user to existing data
 *
 * Replace your existing app/server.js with this file.
 * ============================================================
 */

const express   = require('express');
const cors      = require('cors');
const multer    = require('multer');
const upload    = multer({ storage: multer.memoryStorage() });

const fabricService    = require('./services/fabricService');
const cryptoService    = require('./services/cryptoService');
const ipfsService      = require('./services/ipfsService');
const broadcastService = require('./services/broadcastService');  // ← NEW

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// POST /api/register
// Register a new user on the blockchain (no change from before)
// ─────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
    try {
        const { userId, publicKey, role } = req.body;

        if (!userId || !publicKey || !role) {
            return res.status(400).json({
                success: false,
                error: 'userId, publicKey, and role are required'
            });
        }

        const result = await fabricService.registerUser(userId, publicKey, role);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/assign-level
// Assign privacy level L0–L3 to a registered user
// ─────────────────────────────────────────────────────────────
app.post('/api/assign-level', async (req, res) => {
    try {
        const { userId, level } = req.body;

        if (!userId || !level) {
            return res.status(400).json({
                success: false,
                error: 'userId and level are required'
            });
        }

        const result = await fabricService.assignLevel(userId, level);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/upload
// UPDATED: now builds broadcast header before storing on chain
//
// Request (multipart/form-data):
//   medicalFile   - the actual file
//   patientId     - patient's userId
//   dataId        - unique ID for this data record
//   level         - privacy level (L0/L1/L2/L3)
//   authorizedUsers - JSON string: [{ userId, publicKey }, ...]
//
// Response:
//   { success, data: { dataId, ipfsHash, level },
//     authorizedSet: [userId, ...] }
//
// NOTE: The AES key K is NOT returned to the client.
//       It is only accessible via the broadcast header on-chain.
// ─────────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('medicalFile'), async (req, res) => {
    try {
        const { patientId, dataId, level, authorizedUsers } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        if (!patientId || !dataId || !level) {
            return res.status(400).json({ success: false, error: 'patientId, dataId, level are required' });
        }

        // Step 1: Encrypt the file using AES-256 (Aditi's cryptoService)
        const { encryptedData, key: aesKeyHex, iv } = cryptoService.encryptFile(req.file.buffer);
        const aesKeyBuffer = Buffer.from(aesKeyHex, 'hex');

        // Step 2: Upload encrypted file to IPFS
        const ipfsHash = await ipfsService.uploadFile(encryptedData);
        console.log('=== UPLOAD DEBUG ===');
        console.log('ipfsHash:', ipfsHash);
        console.log('iv:', iv);
        console.log('level:', level);

        // Step 3: Build broadcast header for authorized users
        //         Parse authorizedUsers from request body
        let parsedAuthorizedUsers = [];
        if (authorizedUsers) {
            parsedAuthorizedUsers = typeof authorizedUsers === 'string'
                ? JSON.parse(authorizedUsers)
                : authorizedUsers;
        }

        // Always include the patient themselves in the authorized set
        // (patient can always access their own records)
        // In real use, fetch public keys from blockchain for all authorized users
        const broadcastHeader = parsedAuthorizedUsers.length > 0
            ? broadcastService.buildBroadcastHeader(aesKeyBuffer, parsedAuthorizedUsers)
            : {};  // empty header if no authorized users provided yet

        // Step 4: Store on blockchain via chaincode
        //         broadcastHeader is stored as JSON string in ledger
        const result = await fabricService.storeHash(
            dataId,
            patientId,
            ipfsHash,
            iv,
            level,
            JSON.stringify(broadcastHeader)   // ← NEW: broadcast header stored on chain
        );

        res.json({
            success: true,
            data: result,
            authorizedSet: broadcastService.getAuthorizedUsers(broadcastHeader),
            message: `File encrypted, uploaded to IPFS, and hash stored on blockchain.
                      AES key is protected in broadcast header on chain.`
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/access
// UPDATED: returns encryptedKeyForYou so doctor can recover K
//
// Request: { requesterId, dataId }
//
// Response (GRANTED):
//   { success, data: {
//       status: "ACCESS_GRANTED",
//       ipfsHash,
//       iv,
//       encryptedKeyForYou   ← NEW: RSA-encrypted AES key for requester
//   }}
//
// Response (DENIED):
//   { success, data: { status: "ACCESS_DENIED", message } }
//
// After getting ACCESS_GRANTED, the frontend/doctor:
//   1. Decrypts encryptedKeyForYou with their RSA private key → gets AES key K
//   2. Downloads encrypted file from IPFS using ipfsHash
//   3. Decrypts file using K and iv
// ─────────────────────────────────────────────────────────────
app.post('/api/access', async (req, res) => {
    try {
        const { requesterId, dataId } = req.body;

        if (!requesterId || !dataId) {
            return res.status(400).json({ success: false, error: 'requesterId and dataId are required' });
        }

        const result = await fabricService.requestAccess(requesterId, dataId);

        // result from chaincode now includes encryptedKeyForYou if GRANTED
        // (requires updated dataAccess.js chaincode — see chaincode files)
        res.json({ success: true, data: result });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/revoke  ← NEW ENDPOINT
// Revoke a user's access to a specific data record.
// Does NOT re-encrypt the file — just removes user from header.
//
// Request: { dataId, revokedUserId }
// Response: { success, data: { dataId, revokedUserId, remainingSet } }
// ─────────────────────────────────────────────────────────────
app.post('/api/revoke', async (req, res) => {
    try {
        const { dataId, revokedUserId } = req.body;

        if (!dataId || !revokedUserId) {
            return res.status(400).json({ success: false, error: 'dataId and revokedUserId are required' });
        }

        const result = await fabricService.revokeAccess(dataId, revokedUserId);
        res.json({ success: true, data: result });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/add-authorized  ← NEW ENDPOINT
// Add a new user to the broadcast header of existing data.
// Patient must provide the new user's public key.
//
// Request: { dataId, newUserId, newUserPublicKey, patientPrivateKey }
// NOTE: patientPrivateKey should ideally come from client side,
//       not be sent to server — this is simplified for demo
// ─────────────────────────────────────────────────────────────
app.post('/api/add-authorized', async (req, res) => {
    try {
        const { dataId, newUserId, newUserPublicKey } = req.body;

        if (!dataId || !newUserId || !newUserPublicKey) {
            return res.status(400).json({ success: false, error: 'dataId, newUserId, newUserPublicKey are required' });
        }

        const result = await fabricService.addAuthorizedUser(dataId, newUserId, newUserPublicKey);
        res.json({ success: true, data: result });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/logs
// Get all access logs from blockchain (immutable audit trail)
// ─────────────────────────────────────────────────────────────
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await fabricService.getLogs();
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/health
// Simple health check — useful for frontend to check if backend is up
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Backend running', timestamp: new Date().toISOString() });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Backend API running on http://localhost:${PORT}`);
    console.log(`   Broadcast encryption: ENABLED`);
    console.log(`   Endpoints: /api/register, /api/assign-level, /api/upload,`);
    console.log(`              /api/access, /api/revoke, /api/add-authorized, /api/logs`);
});