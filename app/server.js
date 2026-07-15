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
const userProfileService = require('./services/userProfileService');
const {
    deriveRequiredLevel,
    deriveEligibleUsers,
    buildRecipientSet,
    roleDefaultPrivacyLevel,
    levelRank,
    roleAccessRank,
    canAccessRecord,
    isRecordOwner,
    isRecordSubject
} = require('./services/privacyPolicy');

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
    // NOTE: masterSecret (alpha, gamma) is persisted to disk for server restart
    // recovery. This is acceptable for a demo/prototype but MUST be moved to
    // a secure key store (vault, HSM, encrypted KMS) in production.
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
                publicKey: result.publicKey
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// BGW private key for a registered recipient index i.
// Accepts an optional client-supplied masterSecret for test/debug use;
// production callers should omit it and rely on the server-side secret.
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
        const { userId, publicKey, role, organization } = req.body;
        const result = await fabricService.registerUser(userId, publicKey, role);
        userProfileService.upsertProfile({
            userId,
            role,
            privacyLevel: roleDefaultPrivacyLevel(role),
            organization
        });
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
        const profile = userProfileService.getProfile(userId);
        if (profile) {
            userProfileService.upsertProfile({ ...profile, privacyLevel: level });
        } else {
            userProfileService.upsertProfile({ userId, role: '', privacyLevel: level });
        }
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Register or update a user's BGW recipient profile for automatic recipient derivation.
app.post('/api/users/profile', async (req, res) => {
    try {
        const { userId, role, privacyLevel, bgwRecipientId, organization } = req.body;
        const profile = userProfileService.upsertProfile({
            userId,
            role,
            privacyLevel,
            bgwRecipientId,
            organization
        });
        res.json({ success: true, data: profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/users/profiles', async (req, res) => {
    try {
        const profiles = userProfileService.getAllProfiles();
        res.json({ success: true, data: profiles });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

async function resolveEligibleRecipients(requiredLevel, organization = '') {
    const profiles = userProfileService.getAllProfiles();
    let aclRecords = [];
    try {
        aclRecords = await fabricService.getAllLevels();
    } catch (err) {
        console.warn('Could not load Fabric ACL levels:', err.message);
    }
    const users = userProfileService.mergeWithAclLevels(profiles, aclRecords);
    const orgFiltered = organization
        ? users.filter((u) => String(u.organization || '').toLowerCase() === organization.toLowerCase())
        : users;
    const eligibleUsers = deriveEligibleUsers(orgFiltered, requiredLevel);
    return {
        users: orgFiltered,
        eligibleUsers,
        ...buildRecipientSet(eligibleUsers)
    };
}

// 3. Upload + BGW-encrypt + store medical file in IPFS
app.post('/api/upload', upload.single('medicalFile'), async (req, res) => {
    try {
        const { patientId, dataId, category, ownerId, ownerRecipientId, uploadedBy, uploaderRole } = req.body;
        await ensureBgwState();
        const publicKey = parseJsonField(req.body.bgwPublicKey, broadcastPublicKey);
        const recordOwnerId = ownerId || uploadedBy || patientId;
        const ownerProfile = userProfileService.getProfile(recordOwnerId) || {};
        const uploadOrganization = req.body.organization || ownerProfile.organization || '';
        const resolvedOwnerRecipientId = Number(
            ownerRecipientId ||
            ownerProfile.bgwRecipientId ||
            req.body.bgwRecipientId ||
            req.body.recipientId ||
            0
        );

        if (!req.file) {
            throw new Error('medicalFile is required.');
        }
        if (!publicKey) {
            throw new Error('BGW public key is required. Call /api/bgw/setup first or send bgwPublicKey.');
        }
        if (!patientId) {
            throw new Error('patientId is required.');
        }
        if (!category) {
            throw new Error('category is required.');
        }

        const requiredLevel = deriveRequiredLevel(category);
        const recipientResolution = await resolveEligibleRecipients(requiredLevel, uploadOrganization);
        const users = Array.isArray(recipientResolution.users) ? recipientResolution.users : [];
        const eligibleUsers = Array.isArray(recipientResolution.eligibleUsers) ? recipientResolution.eligibleUsers : [];
        const recipientIds = Array.isArray(recipientResolution.recipientIds) ? recipientResolution.recipientIds : [];
        const authorizedUsers = Array.isArray(recipientResolution.authorizedUsers) ? recipientResolution.authorizedUsers : [];
        let patientBgwId = 0;
        {
            const normalizedPid = String(patientId).trim().toLowerCase();
            const directProfile = userProfileService.getProfile(normalizedPid) || {};
            patientBgwId = Number(directProfile.bgwRecipientId || directProfile.recipientId || 0);
            if (!patientBgwId || patientBgwId <= 0) {
                const allProfiles = userProfileService.getAllProfiles();
                for (const p of allProfiles) {
                    if (String(p.userId).trim().toLowerCase() === normalizedPid) {
                        const pid = Number(p.bgwRecipientId || p.recipientId || 0);
                        if (pid > 0) { patientBgwId = pid; break; }
                    }
                }
            }
        }
        const finalRecipientIds = [
            ...new Set([
                ...recipientIds.map(Number).filter((id) => Number.isInteger(id) && id > 0),
                ...(Number.isInteger(resolvedOwnerRecipientId) && resolvedOwnerRecipientId > 0 ? [resolvedOwnerRecipientId] : []),
                ...(Number.isInteger(patientBgwId) && patientBgwId > 0 ? [patientBgwId] : [])
            ])
        ];
        const finalAuthorizedUsers = [
            ...new Set([
                ...authorizedUsers,
                ...(recordOwnerId ? [recordOwnerId] : []),
                ...(patientId ? [patientId] : [])
            ])
        ];

        console.info('[upload] privacy policy resolution', {
            dataId,
            patientId,
            category,
            requiredLevel,
            candidateUsers: users.map((user) => ({
                userId: user.userId,
                role: user.role,
                privacyLevel: user.privacyLevel || roleDefaultPrivacyLevel(user.role),
                bgwRecipientId: user.bgwRecipientId
            })),
            eligibleUsers: eligibleUsers.map((user) => ({
                userId: user.userId,
                role: user.role,
                privacyLevel: user.privacyLevel || roleDefaultPrivacyLevel(user.role),
                bgwRecipientId: user.bgwRecipientId
            })),
            recipientIds: finalRecipientIds,
            authorizedUsers: finalAuthorizedUsers,
            ownerProfile
        });

        if (!finalRecipientIds.length) {
            throw new Error(
                `No eligible BGW recipients found for required level ${requiredLevel}. Make sure registered users have privacyLevel and bgwRecipientId values.`
            );
        }

        const bgwCiphertext = await cryptoService.encryptFileForRecipients(
            req.file.buffer,
            publicKey,
            finalRecipientIds,
            {
                dataId,
                patientId,
                level: requiredLevel,
                category,
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                ownerId: recordOwnerId,
                ownerRecipientId: resolvedOwnerRecipientId || undefined,
                uploadedBy,
                uploaderRole
            }
        );
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
            requiredLevel,
            finalAuthorizedUsers,
            payloadHash,
            category || '',
            {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                recipients: finalRecipientIds.map(Number),
                ownerId: recordOwnerId,
                ownerRecipientId: resolvedOwnerRecipientId || null,
                uploadedBy,
                uploaderRole,
                organization: req.body.organization || ''
            },
            [],
            []
        );

        res.json({
            success: true,
            data: result,
            ipfsHash,
            payloadHash,
            bgwHeader: bgwCiphertext.bgwHeader,
            requiredLevel,
            recipients: finalRecipientIds.map(Number),
            authorizedUsers: finalAuthorizedUsers,
            ownerId: recordOwnerId,
            ownerRecipientId: resolvedOwnerRecipientId || null,
            eligibleUsers: eligibleUsers.map((user) => user.userId)
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
        if (!ipfsHash) {
            return res.status(400).json({ success: false, error: 'ipfsHash is required.' });
        }
        if (!privateKey) {
            return res.status(400).json({ success: false, error: 'privateKey is required.' });
        }

        const encryptedEnvelope = await ipfsService.downloadFile(ipfsHash);
        const actualHash = crypto.createHash('sha256')
            .update(encryptedEnvelope)
            .digest('hex');

        if (payloadHash && actualHash !== payloadHash) {
            throw new Error('IPFS payload hash mismatch. Data integrity check failed.');
        }

        const envelope = JSON.parse(encryptedEnvelope.toString('utf8'));

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
        const { requesterId, dataId, privateKey, publicKey, requesterRole } = req.body;
        await ensureBgwState();
        const access = await fabricService.getData(dataId);
        const record = access || {};
        console.log('[decrypt] dataId:', dataId, 'requesterId:', requesterId);
        console.log('[decrypt] record has grantedUsers:', 'grantedUsers' in record, 'val:', JSON.stringify(record.grantedUsers));
        console.log('[decrypt] record has authorizedUsers:', 'authorizedUsers' in record, 'val:', JSON.stringify(record.authorizedUsers));
        console.log('[decrypt] record has revokedUsers:', 'revokedUsers' in record, 'val:', JSON.stringify(record.revokedUsers));
        console.log('[decrypt] record keys:', Object.keys(record));
        const requesterProfile = userProfileService.getProfile(requesterId) || {};
        const effectiveRole = requesterRole || requesterProfile.role || '';
        const effectivePrivacy = requesterProfile.privacyLevel || roleDefaultPrivacyLevel(effectiveRole);
        let requesterRecipientId = Number(
            requesterProfile.bgwRecipientId ||
            requesterProfile.recipientId ||
            requesterProfile.bgwIndex ||
            (typeof privateKey === 'object' && privateKey ? privateKey.recipientId : null) ||
            0
        );
        if (!requesterRecipientId || requesterRecipientId <= 0) {
            const allProfiles = userProfileService.getAllProfiles();
            for (const p of allProfiles) {
                if (String(p.userId).trim().toLowerCase() === String(requesterId).trim().toLowerCase()) {
                    const pid = Number(p.bgwRecipientId || p.recipientId || 0);
                    if (pid > 0) { requesterRecipientId = pid; break; }
                }
            }
        }
        if (requesterRecipientId <= 0 && typeof privateKey === 'string') {
            try {
                const parsed = JSON.parse(privateKey);
                if (parsed && parsed.recipientId) requesterRecipientId = Number(parsed.recipientId);
            } catch (e) { /* ignore parse failure */ }
        }
        const userOrganization = requesterProfile.organization || '';
        const recordOrganization = record.metadata?.organization || '';
        const isOwner = isRecordOwner(record, requesterId);
        const isSubject = isRecordSubject(record, requesterId);

        const recordGranted = Array.isArray(record.grantedUsers) ? record.grantedUsers : [];
        const recordRevoked = Array.isArray(record.revokedUsers) ? record.revokedUsers : [];
        const isAuthorized = canAccessRecord(
            effectiveRole,
            record.requiredLevel,
            {
                isOwner,
                isSubject,
                grantedUsers: recordGranted,
                revokedUsers: recordRevoked,
                userId: requesterId,
                userOrganization,
                recordOrganization
            }
        );

        if (!isAuthorized) {
            console.log('[403] Access denied for', requesterId, 'role:', effectiveRole, 'level:', record.requiredLevel);
            console.log('[403] grantedUsers:', JSON.stringify(recordGranted));
            console.log('[403] revokedUsers:', JSON.stringify(recordRevoked));
            console.log('[403] userOrg:', userOrganization, 'recordOrg:', recordOrganization);
            return res.status(403).json({
                success: false,
                error: 'Access Denied',
                access: {
                    status: 'ACCESS_DENIED',
                    requesterId,
                    requesterRole: effectiveRole,
                    privacyLevel: effectivePrivacy,
                    requiredLevel: record.requiredLevel,
                    grantedUsers: recordGranted,
                    revokedUsers: recordRevoked
                }
            });
        }

        // Check that the requester is in the BGW recipient set
        const headerObject = typeof record.bgwHeader === 'string'
            ? JSON.parse(record.bgwHeader)
            : record.bgwHeader;
        const headerRecipientIds = Array.isArray(headerObject?.recipientIds)
            ? headerObject.recipientIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
            : [];

        const isInBgwSet = requesterRecipientId > 0 && headerRecipientIds.includes(requesterRecipientId);
        let activeBgwHeader = headerObject;
        let activeRecord = record;

        if (!isInBgwSet) {
            const isOwnerOrSubject = isOwner || isSubject;
            const envelopeUpdateToken = record.updateToken || '';

            if (envelopeUpdateToken) {
                try {
                    const repairedHeader = await bgw.addRecipients(
                        broadcastPublicKey,
                        headerObject,
                        [requesterRecipientId],
                        { updateToken: envelopeUpdateToken }
                    );
                    activeBgwHeader = repairedHeader;
                    const existingAuthorized = Array.isArray(record.authorizedUsers) ? record.authorizedUsers : [];
                    const existingGranted = Array.isArray(record.grantedUsers) ? record.grantedUsers : [];
                    activeRecord = await fabricService.updateBroadcastHeader(
                        dataId,
                        JSON.stringify(repairedHeader),
                        {
                            authorizedUsers: [...new Set([...existingAuthorized, requesterId])],
                            grantedUsers: [...new Set([...existingGranted, requesterId])],
                            revokedUsers: (Array.isArray(record.revokedUsers) ? record.revokedUsers : []).filter((userId) => userId !== requesterId)
                        }
                    );
                    console.log('[decrypt-repair] success - added', requesterId, 'to BGW header for', dataId);
                } catch (repairError) {
                    console.log('[decrypt-repair] failed:', repairError.message);
                    if (!isOwnerOrSubject) {
                        return res.status(403).json({
                            success: false,
                            error: 'Auto-repair failed: ' + repairError.message + '. Ask the record owner to grant you access.',
                            access: {
                                status: 'ACCESS_DENIED',
                                requesterId,
                                requesterRole: effectiveRole,
                                privacyLevel: effectivePrivacy,
                                requiredLevel: record.requiredLevel,
                                reason: 'AUTO_REPAIR_FAILED'
                            }
                        });
                    }
                    console.log('[decrypt] owner/subject proceeding despite repair failure');
                }
            } else if (!isOwnerOrSubject) {
                return res.status(403).json({
                    success: false,
                    error: 'User is not in the BGW recipient set and no update token is available to repair. Ask the record owner to grant you access.',
                    access: {
                        status: 'ACCESS_DENIED',
                        requesterId,
                        requesterRole: effectiveRole,
                        privacyLevel: effectivePrivacy,
                        requiredLevel: record.requiredLevel,
                        reason: 'NOT_IN_BGW_SET_NO_UPDATE_TOKEN'
                    }
                });
            }
        }

        const encryptedEnvelope = await ipfsService.downloadFile(record.ipfsHash);
        const actualHash = crypto.createHash('sha256')
            .update(encryptedEnvelope)
            .digest('hex');
        if (record.payloadHash && actualHash !== record.payloadHash) {
            throw new Error('IPFS payload hash mismatch. Data integrity check failed.');
        }

        const envelope = JSON.parse(encryptedEnvelope.toString('utf8'));
        console.log('[decrypt] envelope keys:', Object.keys(envelope), 'has updateToken:', !!envelope.updateToken, 'record.updateToken:', record.updateToken, 'requesterRecipientId:', requesterRecipientId, 'headerRecipientIds:', headerRecipientIds);
        if (record.bgwHeader) {
            envelope.bgwHeader = activeBgwHeader;
        }

        let plaintext;
        try {
            plaintext = await cryptoService.decryptBroadcastFile(
                envelope,
                publicKey || broadcastPublicKey,
                privateKey
            );
        } catch (decryptError) {
            console.log('[decrypt-error]', decryptError.message, 'requesterRecipientId:', requesterRecipientId, 'headerRecipientIds:', headerRecipientIds);
            throw decryptError;
        }

        res.json({
            success: true,
            access: {
                status: 'ACCESS_GRANTED',
                requesterId,
                requesterRole: effectiveRole,
                privacyLevel: effectivePrivacy,
                requiredLevel: record.requiredLevel,
                grantedUsers: record.grantedUsers || [],
                revokedUsers: record.revokedUsers || []
            },
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
        const record = await fabricService.getData(dataId);
        const requesterProfile = userProfileService.getProfile(requesterId) || {};
        const isOwner = isRecordOwner(record, requesterId);
        const isSubject = isRecordSubject(record, requesterId);
        const allowed = canAccessRecord(
            requesterProfile.role,
            record.requiredLevel,
            {
                isOwner,
                isSubject,
                grantedUsers: record.grantedUsers || [],
                revokedUsers: record.revokedUsers || [],
                userId: requesterId,
                userOrganization: requesterProfile.organization || '',
                recordOrganization: record.metadata?.organization || ''
            }
        );
        res.json({
            success: true,
            data: {
                status: allowed ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
                requesterId,
                requesterRole: requesterProfile.role || '',
                requiredLevel: record.requiredLevel,
                patientId: record.patientId,
                ipfsHash: allowed ? record.ipfsHash : null,
                message: allowed ? 'Access granted' : 'Access denied'
            }
        });
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
        let { dataId, recipientIds, authorizedUsers = [], requesterId } = req.body;
        if (!Array.isArray(authorizedUsers)) authorizedUsers = [];

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

        if (!requesterId || !isRecordOwner(record, requesterId)) {
            return res.status(403).json({
                success: false,
                error: 'Only the record owner can grant access.'
            });
        }

        const header =
            typeof record.bgwHeader === 'string'
                ? JSON.parse(record.bgwHeader)
                : record.bgwHeader;
        if (!header || !record.updateToken) {
            return res.status(400).json({
                success: false,
                error: 'This record does not support BGW recipient management.'
            });
        }

        const updatedHeader =
            await bgw.addRecipients(
                broadcastPublicKey,
                header,
                recipientIds,
                {
                    updateToken: record.updateToken
                }
            );

        const existingGranted = Array.isArray(record.grantedUsers) ? record.grantedUsers : [];
        const existingAuthorized = Array.isArray(record.authorizedUsers) ? record.authorizedUsers : [];
        const existingRevoked = Array.isArray(record.revokedUsers) ? record.revokedUsers : [];
        const nextGranted = [
            ...new Set([
                ...existingGranted,
                ...authorizedUsers
            ])
        ];
        const nextAuthorized = [
            ...new Set([
                ...existingAuthorized,
                ...authorizedUsers
            ])
        ];

        console.log('[grant] dataId:', dataId, 'requesterId:', requesterId);
        console.log('[grant] existingGranted:', JSON.stringify(existingGranted), 'existingAuthorized:', JSON.stringify(existingAuthorized));
        console.log('[grant] adding authorizedUsers:', JSON.stringify(authorizedUsers));
        console.log('[grant] nextGranted:', JSON.stringify(nextGranted), 'nextAuthorized:', JSON.stringify(nextAuthorized));

        const result =
            await fabricService.updateBroadcastHeader(
                dataId,
                JSON.stringify(updatedHeader),
                {
                    authorizedUsers: nextAuthorized,
                    grantedUsers: nextGranted,
                    revokedUsers: existingRevoked.filter(
                        (userId) => !authorizedUsers.includes(userId)
                    )
                }
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
        let { dataId, recipientIds, authorizedUsers = [], requesterId } = req.body;
        if (!Array.isArray(authorizedUsers)) authorizedUsers = [];

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

        if (!requesterId || !isRecordOwner(record, requesterId)) {
            return res.status(403).json({
                success: false,
                error: 'Only the record owner can revoke access.'
            });
        }

        const isRemovingOwner = authorizedUsers.some((userId) => isRecordOwner(record, userId));
        if (isRemovingOwner) {
            return res.status(403).json({
                success: false,
                error: 'Cannot revoke the record owner\'s access.'
            });
        }

        const ownerId = record.metadata?.ownerId || record.patientId || record.ownerId || '';
        const ownerProfile = userProfileService.getProfile(ownerId);
        const ownerRecipientId = Number(ownerProfile?.bgwRecipientId || 0);
        if (ownerRecipientId > 0 && recipientIds.map(Number).includes(ownerRecipientId)) {
            return res.status(403).json({
                success: false,
                error: 'Cannot remove the record owner\'s BGW recipient.'
            });
        }

        const header =
            typeof record.bgwHeader === 'string'
                ? JSON.parse(record.bgwHeader)
                : record.bgwHeader;
        if (!header || !record.updateToken) {
            return res.status(400).json({
                success: false,
                error: 'This record does not support BGW recipient management.'
            });
        }

        const updatedHeader =
            await bgw.removeRecipients(
                broadcastPublicKey,
                header,
                recipientIds,
                {
                    updateToken: record.updateToken
                }
            );

        const existingRevoked = Array.isArray(record.revokedUsers) ? record.revokedUsers : [];
        const existingGranted = Array.isArray(record.grantedUsers) ? record.grantedUsers : [];
        const existingAuthorized = Array.isArray(record.authorizedUsers) ? record.authorizedUsers : [];
        const revokedSet = new Set([...existingRevoked, ...authorizedUsers]);
        const grantedSet = new Set(existingGranted);
        authorizedUsers.forEach((userId) => grantedSet.delete(userId));

        const nextAuthorized = existingAuthorized.filter(
            (userId) => !authorizedUsers.includes(userId)
        );

        const result =
            await fabricService.updateBroadcastHeader(
                dataId,
                JSON.stringify(updatedHeader),
                {
                    authorizedUsers: nextAuthorized,
                    grantedUsers: [...grantedSet],
                    revokedUsers: [...revokedSet]
                }
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
