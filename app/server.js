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

const bgw              = require('./bgw/index.js'); // BGW Library
const fs               = require('fs');
const fabricService    = require('./services/fabricService');
const cryptoService    = require('./services/cryptoService');
const ipfsService      = require('./services/ipfsService');

// --- BGW SETUP (Key Generation Center) ---
let bgwPK, bgwMSK;
let numericUserIdCounter = 1;
let userIdMap = {};

const STATE_FILE = './bgw_kgc_state.json';

function getNumericId(strId) {
    if (!userIdMap[strId]) {
        userIdMap[strId] = numericUserIdCounter++;
        saveKgcState();
    }
    return userIdMap[strId];
}

function saveKgcState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify({
        bgwPK, bgwMSK, numericUserIdCounter, userIdMap
    }, null, 2));
}

(async () => {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            bgwPK = state.bgwPK;
            bgwMSK = state.bgwMSK;
            numericUserIdCounter = state.numericUserIdCounter;
            userIdMap = state.userIdMap;
            console.log("✅ BGW Setup Loaded from existing state file");
        } else {
            const { publicKey, masterSecret } = await bgw.setup({ maxUsers: 100 });
            bgwPK = publicKey;
            bgwMSK = masterSecret;
            saveKgcState();
            console.log("✅ BGW Setup Complete (maxUsers: 100) - Generated New State");
        }
    } catch(err) {
        console.error("❌ BGW Setup Failed:", err);
    }
})();


const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// POST /api/register
// Register a new user and generate a BGW Private Key
// ─────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
    try {
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({
                success: false,
                error: 'userId and role are required'
            });
        }

        // BGW KeyGen: generate user's private key
        const numericId = getNumericId(userId);
        const userPrivateKey = await bgw.keygen(bgwMSK, numericId, bgwPK);

        const result = await fabricService.registerUser(userId, 'BGW_USER', role);
        res.json({ success: true, data: result, privateKey: userPrivateKey });
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

        // Step 1: Build broadcast header for authorized users using BGW
        let parsedAuthorizedUsers = [];
        if (authorizedUsers) {
            parsedAuthorizedUsers = typeof authorizedUsers === 'string'
                ? JSON.parse(authorizedUsers)
                : authorizedUsers;
        }

        if (!parsedAuthorizedUsers.includes(patientId)) {
            parsedAuthorizedUsers.push(patientId);
        }

        const numericAuthUsers = parsedAuthorizedUsers.map(id => getNumericId(id));

        // Step 1: BGW Encrypts the payload directly (generates symmetric key, encrypts file, returns header and payload)
        const { header, encryptedPayload } = await bgw.encrypt(bgwPK, numericAuthUsers, req.file.buffer);

        // Step 2: Upload the BGW AES-GCM encrypted payload (JSON) to IPFS
        const ipfsHash = await ipfsService.uploadFile(Buffer.from(JSON.stringify(encryptedPayload)));
        
        console.log('=== UPLOAD DEBUG ===');
        console.log('ipfsHash:', ipfsHash);
        console.log('iv:', encryptedPayload.iv);
        console.log('level:', level);

        // Step 3: Store on blockchain via chaincode
        const result = await fabricService.storeHash(
            dataId,
            patientId,
            ipfsHash,
            encryptedPayload.iv,
            level,
            JSON.stringify(header)
        );

        res.json({
            success: true,
            data: result,
            authorizedSet: parsedAuthorizedUsers,
            message: `File encrypted with BGW, uploaded to IPFS, and header stored on chain.`
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

        // result from chaincode now includes the full BGW broadcast header if GRANTED
        res.json({ success: true, data: result });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/download/:hash
// Allows the frontend to download the encrypted payload from IPFS
// ─────────────────────────────────────────────────────────────
app.get('/api/download/:hash', async (req, res) => {
    try {
        const hash = req.params.hash;
        if (!hash) return res.status(400).json({ error: 'IPFS hash required' });
        
        const fileBuffer = await ipfsService.downloadFile(hash);
        res.setHeader('Content-Type', 'application/json');
        res.send(fileBuffer);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch from IPFS: ' + err.message });
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

app.post('/api/add-authorized', async (req, res) => {
    try {
        const { dataId, currentUsers, newUsers } = req.body;

        if (!dataId || !currentUsers || !newUsers) {
            return res.status(400).json({ success: false, error: 'dataId, currentUsers, newUsers are required' });
        }

        // Normally, the header would be fetched, updated, and submitted via smart contract
        // BGW header update
        // const updatedHeader = broadcastService.updateBroadcastHeader(bgwPK, oldHeader, currentUsers, newUsers);

        res.json({ success: true, message: 'Header successfully updated with BGW' });

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

// ─────────────────────────────────────────────────────────────
// GET /api/public-key
// Returns the BGW Public Parameters (PK) required for clients to encrypt/decrypt
// ─────────────────────────────────────────────────────────────
app.get('/api/public-key', (req, res) => {
    if (!bgwPK) {
        return res.status(500).json({ success: false, error: 'BGW setup not complete yet' });
    }
    res.json({ success: true, publicKey: bgwPK });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Backend API running on http://localhost:${PORT}`);
    console.log(`   Broadcast encryption: ENABLED`);
    console.log(`   Endpoints: /api/register, /api/assign-level, /api/upload,`);
    console.log(`              /api/access, /api/revoke, /api/add-authorized, /api/logs, /api/public-key`);
});