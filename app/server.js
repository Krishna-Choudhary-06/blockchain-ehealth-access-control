'use strict';

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const upload = multer({ storage: multer.memoryStorage() });

const fabricService = require('./services/fabricService');
const cryptoService = require('./services/cryptoService');
const ipfsService = require('./services/ipfsService');
const bgw = require('./services/broadcast');

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

let broadcastPublicKey = null;
let broadcastMasterSecret = null;
const stateDir = path.join(__dirname, 'data');
const bgwStatePath = path.join(stateDir, 'bgw-state.json');

function parseJsonField(value, fallback) {
    if (value == null || value === '') return fallback;
    if (typeof value !== 'string') return value;
    return JSON.parse(value);
}

function saveBgwState() {
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(
        bgwStatePath,
        JSON.stringify({
            publicKey: broadcastPublicKey,
            masterSecret: broadcastMasterSecret,
            updatedAt: new Date().toISOString()
        }, null, 2)
    );
}

function loadBgwState() {
    if (!fs.existsSync(bgwStatePath)) return false;
    const state = JSON.parse(fs.readFileSync(bgwStatePath, 'utf8'));
    broadcastPublicKey = state.publicKey;
    broadcastMasterSecret = state.masterSecret;
    return Boolean(broadcastPublicKey && broadcastMasterSecret);
}

async function ensureBgwState(maxUsers = 100) {
    if (broadcastPublicKey && broadcastMasterSecret) {
        return { publicKey: broadcastPublicKey, masterSecret: broadcastMasterSecret };
    }
    if (loadBgwState()) {
        return { publicKey: broadcastPublicKey, masterSecret: broadcastMasterSecret };
    }
    const result = await cryptoService.setupBroadcast(maxUsers);
    broadcastPublicKey = result.publicKey;
    broadcastMasterSecret = result.masterSecret;
    saveBgwState();
    return result;
}

bgw.init()
    .then(() => ensureBgwState(100))
    .then(() => console.log('BGW broadcast encryption ready on BLS12-381'))
    .catch(err => console.error('BGW INIT ERROR:', err));

app.get('/api/bgw/state', async (req, res) => {
    try {
        const state = await ensureBgwState();
        res.json({
            success: true,
            data: {
                publicKey: state.publicKey,
                n: state.publicKey.n
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// BGW admin setup. Keep masterSecret server-side in production.
app.post('/api/bgw/setup', async (req, res) => {
    try {
        const { maxUsers = 100 } = req.body;
        const result = await cryptoService.setupBroadcast(maxUsers);
        broadcastPublicKey = result.publicKey;
        broadcastMasterSecret = result.masterSecret;
        saveBgwState();

        res.json({
            success: true,
            data: {
                publicKey: result.publicKey,
                masterSecret: result.masterSecret
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// BGW private key for a registered recipient index i.
app.post('/api/bgw/keygen', async (req, res) => {
    try {
        await ensureBgwState();
        const { recipientId, masterSecret, publicKey } = req.body;
        const privateKey = await cryptoService.generateBroadcastPrivateKey(
            masterSecret || broadcastMasterSecret,
            recipientId,
            publicKey || broadcastPublicKey
        );

        res.json({ success: true, data: privateKey });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 1. Register user on blockchain
app.post('/api/register', async (req, res) => {
    try {
        const { userId, publicKey, role } = req.body;
        const result = await fabricService.registerUser(userId, publicKey, role);
        res.json({ success: true, data: result });
    } catch (err) {
    console.error("REGISTER ERROR:");
    console.error(err);

    res.status(500).json({
        success: false,
        error: err.message,
        stack: err.stack
    });
}
});

// 2. Assign privacy level
app.post('/api/assign-level', async (req, res) => {
    try {
        const { userId, level } = req.body;
        const result = await fabricService.assignLevel(userId, level);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Upload + BGW-encrypt + store medical file in IPFS
app.post('/api/upload', upload.single('medicalFile'), async (req, res) => {
    try {
        const { patientId, level, dataId, category, ownerId, uploadedBy, uploaderRole } = req.body;
        await ensureBgwState();
        const recipientIds = parseJsonField(req.body.recipientIds, []);
        const authorizedUsers = parseJsonField(req.body.authorizedUsers, recipientIds.map(String));
        const publicKey = parseJsonField(req.body.bgwPublicKey, broadcastPublicKey);

        if (!req.file) {
            throw new Error('medicalFile is required.');
        }
        if (!publicKey) {
            throw new Error('BGW public key is required. Call /api/bgw/setup first or send bgwPublicKey.');
        }
        if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
            throw new Error('recipientIds must contain at least one BGW recipient index.');
        }
        if (!Array.isArray(authorizedUsers) || authorizedUsers.length === 0) {
            throw new Error('authorizedUsers must contain at least one registered Fabric user id.');
        }

        const bgwCiphertext = await cryptoService.encryptFileForRecipients(
            req.file.buffer,
            publicKey,
            recipientIds,
            {
                dataId,
                patientId,
                level,
                category,
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                ownerId,
                uploadedBy,
                uploaderRole
            }
        );
        console.log("UPDATE TOKEN:", bgwCiphertext.updateToken);
        console.log("BGW CIPHERTEXT KEYS:", Object.keys(bgwCiphertext));
        const envelopeBuffer = Buffer.from(JSON.stringify(bgwCiphertext));
        const payloadHash = crypto.createHash('sha256')
            .update(envelopeBuffer)
            .digest('hex');
        const ipfsHash = await ipfsService.uploadFile(envelopeBuffer);

        const bgwHeaderForFabric = JSON.stringify(bgwCiphertext.bgwHeader);
        const result = await fabricService.storeHash(
            dataId,
            patientId,
            ipfsHash,
            bgwHeaderForFabric,
            bgwCiphertext.updateToken,
            level,
            authorizedUsers,
            payloadHash,
            category || '',
            {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                recipients: recipientIds.map(Number),
                ownerId,
                uploadedBy,
                uploaderRole
            }
        );

        res.json({
            success: true,
            data: result,
            ipfsHash,
            payloadHash,
            bgwHeader: bgwCiphertext.bgwHeader,
            recipients: recipientIds.map(Number),
            authorizedUsers
        });
    }  catch (err) {
    console.error("UPLOAD ERROR:");
    console.error(err);

    res.status(500).json({
        success: false,
        error: err.message,
        stack: err.stack
    });
}
});

// 3b. Download an IPFS BGW envelope and decrypt it for a recipient.
app.post('/api/bgw/decrypt-ipfs', async (req, res) => {
    try {
        const { ipfsHash, privateKey, publicKey, payloadHash } = req.body;
       const encryptedEnvelope = await ipfsService.downloadFile(access.ipfsHash);

const actualHash = crypto.createHash('sha256')
    .update(encryptedEnvelope)
    .digest('hex');

if (access.payloadHash && actualHash !== access.payloadHash) {
    throw new Error('IPFS payload hash mismatch. Data integrity check failed.');
}

const envelope = JSON.parse(encryptedEnvelope.toString('utf8'));
console.log("ENVELOPE KEYS:", Object.keys(envelope));
console.log("ENVELOPE:", JSON.stringify(envelope, null, 2));

console.log(
  "Fabric recipients:",
  typeof access.bgwHeader === 'string'
    ? JSON.parse(access.bgwHeader).recipientIds
    : access.bgwHeader.recipientIds
);

if (access.bgwHeader) {
    envelope.bgwHeader =
        typeof access.bgwHeader === 'string'
            ? JSON.parse(access.bgwHeader)
            : access.bgwHeader;
}

console.log("Recipients AFTER replacement:", envelope.bgwHeader.recipientIds);

// Use the latest BGW header from Fabric
if (access.bgwHeader) {
    envelope.bgwHeader =
        typeof access.bgwHeader === 'string'
            ? JSON.parse(access.bgwHeader)
            : access.bgwHeader;
}

console.log("IPFS Header:", envelope.bgwHeader.recipientIds);
console.log(
  "IPFS FULL HEADER:",
  JSON.stringify(envelope.bgwHeader, null, 2)
);

console.log(
  "FABRIC FULL HEADER:",
  JSON.stringify(
    typeof access.bgwHeader === 'string'
      ? JSON.parse(access.bgwHeader)
      : access.bgwHeader,
    null,
    2
  )
);

const plaintext = await cryptoService.decryptBroadcastFile(
    envelope,
    publicKey || broadcastPublicKey,
    privateKey
);

        res.json({
            success: true,
            data: plaintext.toString('base64'),
            encoding: 'base64',
            metadata: envelope.metadata
        });
    } catch (err) {
        console.error("BGW DECRYPT ERROR:");
        console.error(err);
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
});

// Paper Phase 4: authorize on Fabric, verify IPFS integrity, then decrypt.
app.post('/api/access/decrypt', async (req, res) => {
    try {
        const { requesterId, dataId, privateKey, publicKey } = req.body;
        await ensureBgwState();
        const access = await fabricService.requestAccess(requesterId, dataId);

        if (access.status !== 'ACCESS_GRANTED') {
            return res.status(403).json({
                success: false,
                access
            });
        }

        const encryptedEnvelope = await ipfsService.downloadFile(access.ipfsHash);
        const actualHash = crypto.createHash('sha256')
            .update(encryptedEnvelope)
            .digest('hex');
        if (access.payloadHash && actualHash !== access.payloadHash) {
            throw new Error('IPFS payload hash mismatch. Data integrity check failed.');
        }

        const envelope = JSON.parse(encryptedEnvelope.toString('utf8'));

console.log("ENVELOPE KEYS:", Object.keys(envelope));
console.log("ENVELOPE:", JSON.stringify(envelope, null, 2));

console.log(
    "Fabric recipients:",
    typeof access.bgwHeader === 'string'
        ? JSON.parse(access.bgwHeader).recipientIds
        : access.bgwHeader.recipientIds
);

// Replace stale IPFS header with latest Fabric header
if (access.bgwHeader) {
    envelope.bgwHeader =
        typeof access.bgwHeader === 'string'
            ? JSON.parse(access.bgwHeader)
            : access.bgwHeader;
}

console.log(
    "Recipients AFTER replacement:",
    envelope.bgwHeader.recipientIds
);

const plaintext = await cryptoService.decryptBroadcastFile(
    envelope,
    publicKey || broadcastPublicKey,
    privateKey
);

        res.json({
            success: true,
            access,
            data: plaintext.toString('base64'),
            encoding: 'base64',
            metadata: envelope.metadata
        });
    } catch (err) {
        console.error("ACCESS DECRYPT ERROR:");
        console.error(err);
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
});

app.post('/api/data/:dataId/privacy-level', async (req, res) => {
    try {
        const result = await fabricService.updatePrivacyLevel(req.params.dataId, req.body.level);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await fabricService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const records = await fabricService.getAllData();
        res.json({ success: true, data: records });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Request access to file
app.post('/api/access', async (req, res) => {
    try {
        const { requesterId, dataId } = req.body;
        const result = await fabricService.requestAccess(requesterId, dataId);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Get all access logs (for dashboard visualization)
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await fabricService.getLogs();
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
app.post('/api/bgw/add-recipients', async (req, res) => {
    try {
        const { dataId, recipientIds, authorizedUsers = [] } = req.body;

        if (!dataId) {
            return res.status(400).json({
                success: false,
                error: 'dataId is required'
            });
        }

        if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'recipientIds must be a non-empty array'
            });
        }

        const record = await fabricService.getData(dataId);

        const header =
            typeof record.bgwHeader === 'string'
                ? JSON.parse(record.bgwHeader)
                : record.bgwHeader;

        const updatedHeader =
            await bgw.addRecipients(
                broadcastPublicKey,
                header,
                recipientIds,
                {
                    updateToken: record.updateToken
                }
            );

        const updatedUsers = [
            ...new Set([
                ...(record.authorizedUsers || []),
                ...authorizedUsers
            ])
        ];

        const result =
            await fabricService.updateBroadcastHeader(
                dataId,
                JSON.stringify(updatedHeader),
                updatedUsers
            );

        res.json({
            success: true,
            recipientIds: updatedHeader.recipientIds,
            result
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});
app.post('/api/bgw/remove-recipients', async (req, res) => {
    try {
        const { dataId, recipientIds, authorizedUsers } = req.body;

        if (!dataId) {
            return res.status(400).json({
                success: false,
                error: 'dataId is required'
            });
        }

        if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'recipientIds must be a non-empty array'
            });
        }

        const record = await fabricService.getData(dataId);

        const header =
            typeof record.bgwHeader === 'string'
                ? JSON.parse(record.bgwHeader)
                : record.bgwHeader;

        const updatedHeader =
            await bgw.removeRecipients(
                broadcastPublicKey,
                header,
                recipientIds,
                {
                    updateToken: record.updateToken
                }
            );

        const updatedUsers =
            Array.isArray(authorizedUsers)
                ? authorizedUsers
                : (record.authorizedUsers || []);

        const result =
            await fabricService.updateBroadcastHeader(
                dataId,
                JSON.stringify(updatedHeader),
                updatedUsers
            );

        res.json({
            success: true,
            recipientIds: updatedHeader.recipientIds,
            result
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Backend API running on http://localhost:${PORT}`));
