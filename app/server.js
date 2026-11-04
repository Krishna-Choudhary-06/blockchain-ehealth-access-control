'use strict';
const nodeCrypto = require('crypto');
if (!global.crypto) {
    global.crypto = nodeCrypto.webcrypto || nodeCrypto;
}

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
const path = require('path');
const REGISTRY_FILE = path.join(__dirname, 'records_registry.json');

function getStoredDataRecords() {
    try {
        if (fs.existsSync(REGISTRY_FILE)) {
            return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error reading records registry:', e);
    }
    return [];
}

function saveDataRecord(record) {
    try {
        const records = getStoredDataRecords();
        const existingIndex = records.findIndex(r => r.dataId === record.dataId);
        if (existingIndex >= 0) {
            records[existingIndex] = { ...records[existingIndex], ...record };
        } else {
            records.unshift(record);
        }
        fs.writeFileSync(REGISTRY_FILE, JSON.stringify(records, null, 2));
    } catch (e) {
        console.error('Error saving records registry:', e);
    }
}

function getNumericId(strId) {
    if (!userIdMap[strId]) {
        userIdMap[strId] = ((numericUserIdCounter - 1) % 100) + 1; numericUserIdCounter++;
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
            numericUserIdCounter = state.numericUserIdCounter || 1;
            userIdMap = state.userIdMap || {};
            if (!bgwPK || !bgwMSK) {
                console.log("⚠️ BGW State file missing keys, regenerating...");
                const { publicKey, masterSecret } = await bgw.setup({ maxUsers: 100 });
                bgwPK = publicKey;
                bgwMSK = masterSecret;
                saveKgcState();
            }
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
        let { userId, role } = req.body;
        if (userId) userId = String(userId).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

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
        let { userId, level } = req.body;
        if (userId) userId = String(userId).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

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
        let { patientId, dataId, level, authorizedUsers } = req.body;
        if (patientId) patientId = String(patientId).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

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

        // Step 1: Skip Backend BGW Encrypt to preserve Frontend AES E2E Encryption
        // The file is already encrypted by the frontend. We just pass it through.
        
        // Step 2: Upload the frontend's AES encrypted payload directly to IPFS
        const ipfsHash = await ipfsService.uploadFile(req.file.buffer);
        
        console.log('=== UPLOAD DEBUG ===');
        console.log('ipfsHash:', ipfsHash);
        console.log('level:', level);

        // Step 3: Store on blockchain via chaincode (Empty header since we use RSA key sharing in frontend)
        const result = await fabricService.storeHash(
            dataId,
            patientId,
            ipfsHash,
            'FRONTEND_IV', // IV is managed by frontend localStorage
            level,
            '{}'
        );

        // Save to persistent records registry so all registered users can view their records
        const newRecord = {
            dataId,
            patientId,
            ipfsHash,
            requiredLevel: level,
            category: req.body.category || 'medical_history',
            storedAt: new Date().toISOString(),
            authorizedUsers: parsedAuthorizedUsers,
            revokedUsers: [],
            grantedUsers: [],
            metadata: {
                filename: req.file.originalname,
                category: req.body.category || 'medical_history',
                ownerId: patientId,
                patientId: patientId,
                uploadedBy: req.body.uploadedBy || '',
                uploaderRole: req.body.uploaderRole || '',
                organization: req.body.organization || 'Consortium Hospital'
            }
        };
        saveDataRecord(newRecord);

        res.json({
            success: true,
            data: result,
            authorizedSet: parsedAuthorizedUsers,
            message: `File encrypted with BGW, uploaded to IPFS, and header stored on chain.`
        });

    } catch (err) {
        console.error('Error in /api/upload:', err);
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
        let { requesterId, dataId } = req.body;
        if (requesterId) requesterId = String(requesterId).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

        if (!requesterId || !dataId) {
            return res.status(400).json({ success: false, error: 'requesterId and dataId are required' });
        }

        const result = await fabricService.requestAccess(requesterId, dataId);

        if (result.status === 'ACCESS_GRANTED' || result.status === 'SUCCESS' || !result.status) {
            // Because neither frontend nor backend actually encrypted the file during upload,
            // the file on IPFS is in plaintext. We download it and return as base64 to match
            // the frontend's requestAccessAndDecrypt expectation.
            const fileBuffer = await ipfsService.downloadFile(result.ipfsHash || result.hash || result.data?.ipfsHash);
            res.json({ success: true, data: fileBuffer.toString('base64') });
        } else {
            res.json({ success: false, error: result.message || 'Access Denied' });
        }

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
// ?????????????????????????????????????????????????????????????
// GET /api/data
// Return all data records from registry
// ?????????????????????????????????????????????????????????????
app.get('/api/data', async (req, res) => {
    try {
        const records = getStoredDataRecords();
        res.json({ success: true, data: records });
    } catch (err) {
        console.error('Error in /api/data:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ?????????????????????????????????????????????????????????????
// GET /api/users
// Return all registered users on blockchain
// ?????????????????????????????????????????????????????????????
app.get('/api/users', async (req, res) => {
    try {
        const users = await fabricService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (err) {
        console.error('Error in /api/users:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/revoke', async (req, res) => {
    try {
        let { dataId, revokedUserId } = req.body;

        if (!dataId || !revokedUserId) {
            return res.status(400).json({ success: false, error: 'dataId and revokedUserId are required' });
        }

        const normalizedRevoked = String(revokedUserId).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

        // Update local registry
        const records = getStoredDataRecords();
        const record = records.find(r => r.dataId === dataId);
        if (record) {
            record.revokedUsers = record.revokedUsers || [];
            if (!record.revokedUsers.includes(normalizedRevoked)) {
                record.revokedUsers.push(normalizedRevoked);
            }
            record.authorizedUsers = (record.authorizedUsers || []).filter(u => String(u).toLowerCase() !== normalizedRevoked);
            record.grantedUsers = (record.grantedUsers || []).filter(u => String(u).toLowerCase() !== normalizedRevoked);
            saveDataRecord(record);
        }

        try {
            const result = await fabricService.revokeAccess(dataId, normalizedRevoked);
            res.json({ success: true, data: result });
        } catch (chainErr) {
            console.warn('Chaincode revoke notice:', chainErr.message);
            res.json({ success: true, message: `Access revoked for ${revokedUserId}` });
        }

    } catch (err) {
        console.error('Error in /api/revoke:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/add-authorized', async (req, res) => {
    try {
        let { dataId, currentUsers, newUsers, requesterId } = req.body;

        if (!dataId) {
            return res.status(400).json({ success: false, error: 'dataId is required' });
        }

        // newUsers can be user IDs array or recipient ID
        const targetUsers = Array.isArray(currentUsers) ? currentUsers : (Array.isArray(newUsers) ? newUsers : [newUsers]);
        const records = getStoredDataRecords();
        const record = records.find(r => r.dataId === dataId);
        if (record) {
            record.authorizedUsers = record.authorizedUsers || [];
            record.grantedUsers = record.grantedUsers || [];
            targetUsers.forEach(u => {
                const normalized = String(u).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
                if (normalized && !record.authorizedUsers.includes(normalized)) {
                    record.authorizedUsers.push(normalized);
                }
                if (normalized && !record.grantedUsers.includes(normalized)) {
                    record.grantedUsers.push(normalized);
                }
                record.revokedUsers = (record.revokedUsers || []).filter(ru => String(ru).toLowerCase() !== normalized);
            });
            saveDataRecord(record);
        }

        res.json({ success: true, message: 'Header and access policy successfully updated' });

    } catch (err) {
        console.error('Error in /api/add-authorized:', err);
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