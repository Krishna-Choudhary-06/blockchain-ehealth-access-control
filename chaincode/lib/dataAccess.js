'use strict';
const { Contract } = require('fabric-contract-api');

const ROLE_PERMISSIONS = {
    'Doctor': ['L0', 'L1', 'L2', 'L3'],
    'Nurse': ['L1', 'L2', 'L3'],
    'Lab Technician': ['L1', 'L3'],
    'Admin': ['L3'],          // Decentralized control: Admin only has L3 (system/audit/billing); no clinical data without explicit patient consent
    'Accountant': ['L3'],
    'Patient': ['L0', 'L1', 'L2', 'L3']
};

class DataAccess extends Contract {

    async requestAccess(ctx, requesterId, dataId) {
        requesterId = String(requesterId || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

        const userBytes = await ctx.stub.getState(`USER_${requesterId}`);
        if (!userBytes || userBytes.length === 0) {
            return JSON.stringify({ status: 'ACCESS_DENIED', message: 'Requester is not registered', ipfsHash: null });
        }
        const user = JSON.parse(userBytes.toString());
        if (!user.isValid) {
            return JSON.stringify({ status: 'ACCESS_DENIED', message: 'Account not valid', ipfsHash: null });
        }

        const levelBytes = await ctx.stub.getState(`ACL_${requesterId}`);
        if (!levelBytes || levelBytes.length === 0) {
            return JSON.stringify({ status: 'ACCESS_DENIED', message: 'No privacy level assigned', ipfsHash: null });
        }
        const requesterLevel = JSON.parse(levelBytes.toString());

        const dataBytes = await ctx.stub.getState(`DATA_${dataId}`);
        if (!dataBytes || dataBytes.length === 0) {
            return JSON.stringify({ status: 'NOT_FOUND', message: `Data record ${dataId} not found`, ipfsHash: null });
        }
        const dataRecord = JSON.parse(dataBytes.toString());

        // 1. Revocation check
        const revokedUsers = (dataRecord.revokedUsers || []).map(u => String(u).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''));
        if (revokedUsers.includes(requesterId)) {
            await this._logAccess(ctx, requesterId, dataId, 'DENIED', 'Access revoked by patient');
            return JSON.stringify({ status: 'ACCESS_DENIED', message: 'Access revoked by patient consent policy', ipfsHash: null });
        }

        // 2. Ownership check: Patient always has access to their own record
        const patientId = String(dataRecord.patientId || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        const isOwner = (requesterId === patientId);

        // 3. Explicit consent grant check
        const broadcastHeader = dataRecord.broadcastHeader || {};
        const headerRecipients = Array.isArray(broadcastHeader.recipientIds) ? broadcastHeader.recipientIds : Object.keys(broadcastHeader);
        const grantedUsers = (dataRecord.grantedUsers || []).map(u => String(u).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''));
        const authorizedUsers = (dataRecord.authorizedUsers || []).map(u => String(u).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''));
        const isExplicitlyGranted = grantedUsers.includes(requesterId) || authorizedUsers.includes(requesterId) || headerRecipients.map(String).includes(requesterId);

        // 4. Role-based Access Control (ABAC) with Decentralized Admin restrictions
        const userRole = user.role || 'Patient';
        let matchedRole = 'Patient';
        for (const roleKey of Object.keys(ROLE_PERMISSIONS)) {
            if (roleKey.toLowerCase().replace(/[^a-z0-9]/g, '') === userRole.toLowerCase().replace(/[^a-z0-9]/g, '')) {
                matchedRole = roleKey;
                break;
            }
        }

        const requiredLevel = dataRecord.requiredLevel || 'L0';

        if (!isOwner && !isExplicitlyGranted) {
            // Decentralized Admin Rule: Admin has NO automatic access to patient clinical files (L0, L1, L2).
            if (matchedRole === 'Admin' && requiredLevel !== 'L3') {
                await this._logAccess(ctx, requesterId, dataId, 'DENIED', 'Admin denied clinical access without patient consent');
                return JSON.stringify({
                    status: 'ACCESS_DENIED',
                    message: 'Decentralized Privacy Protection: Administrator does not possess clinical clearance (L0-L2) without explicit patient consent.',
                    ipfsHash: null
                });
            }

            const allowedLevels = ROLE_PERMISSIONS[matchedRole] || [];
            if (!allowedLevels.includes(requiredLevel)) {
                await this._logAccess(ctx, requesterId, dataId, 'DENIED', `Insufficient role clearance: ${matchedRole} cannot access ${requiredLevel}`);
                return JSON.stringify({
                    status: 'ACCESS_DENIED',
                    message: `Access Denied: Clearance level ${requiredLevel} is required. Role '${matchedRole}' has insufficient security clearance.`,
                    ipfsHash: null
                });
            }
        }

        await this._logAccess(ctx, requesterId, dataId, 'GRANTED', '');
        return JSON.stringify({
            status:             'ACCESS_GRANTED',
            dataId:             dataId,
            patientId:          dataRecord.patientId,
            ipfsHash:           dataRecord.ipfsHash,
            iv:                 dataRecord.iv,
            broadcastHeader:    broadcastHeader,
            authorizedUsers:    headerRecipients,
            accessGrantedAt:    this._getTimestamp(ctx)
        });
    }

    async getLogs(ctx) {
        const iterator = await ctx.stub.getStateByRange('LOG_', 'LOG_~');
        const logs = [];
        let result = await iterator.next();
        while (!result.done) {
            if (result.value && result.value.value) {
                try { logs.push(JSON.parse(result.value.value.toString())); } catch(e) {}
            }
            result = await iterator.next();
        }
        await iterator.close();
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return JSON.stringify(logs);
    }

    async _logAccess(ctx, requesterId, dataId, status, reason) {
        const txId = ctx.stub.getTxID();
        await ctx.stub.putState(`LOG_${txId}`, Buffer.from(JSON.stringify({
            txId, requesterId, dataId, status, reason,
            timestamp: this._getTimestamp(ctx)
        })));
    }

    _getTimestamp(ctx) {
        try {
            const ts = ctx.stub.getTxTimestamp();
            if (ts) {
                if (typeof ts.toDate === 'function') {
                    return ts.toDate().toISOString();
                } else if (ts.seconds) {
                    const secs = ts.seconds.low !== undefined ? ts.seconds.low : parseInt(ts.seconds.toString());
                    return new Date(secs * 1000).toISOString();
                } else if (ts.getTime) {
                    return new Date(ts.getTime()).toISOString();
                }
            }
        } catch(e) {
            // Log silently
        }
        // Deterministic fallback to prevent "Peer endorsements do not match"
        return '1970-01-01T00:00:00.000Z';
    }
}

module.exports = DataAccess;
