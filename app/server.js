'use strict';

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const fabricService = require('./services/fabricService');
const cryptoService = require('./services/cryptoService');
const ipfsService = require('./services/ipfsService');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Register user on blockchain
app.post('/api/register', async (req, res) => {
    try {
        const { userId, publicKey, role } = req.body;
        const result = await fabricService.registerUser(userId, publicKey, role);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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

// 3. Upload + encrypt + store medical file (uses Aditi's + IPFS teammate's code)
app.post('/api/upload', upload.single('medicalFile'), async (req, res) => {
    try {
        const { patientId, level, dataId } = req.body;

        // Use Aditi's encryption
        const { encryptedData, key, iv } = cryptoService.encryptFile(req.file.buffer);

        // Use IPFS teammate's upload
        const ipfsHash = await ipfsService.uploadFile(encryptedData);

        // Use YOUR chaincode to store hash
        const result = await fabricService.storeHash(dataId, patientId, ipfsHash, iv, level);

        res.json({ success: true, data: result, encryptionKey: key });
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

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Backend API running on http://localhost:${PORT}`));
