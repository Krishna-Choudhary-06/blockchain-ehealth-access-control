'use strict';
const { Contract } = require('fabric-contract-api');

class DataAccess extends Contract {

    async requestAccess(ctx, requesterId, dataId) {
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

        if (requesterLevel.levelNum > dataRecord.requiredLevelNum) {
            await this._logAccess(ctx, requesterId, dataId, 'DENIED', 'Insufficient level');
            return JSON.stringify({ status: 'ACCESS_DENIED', message: `Insufficient access level. Yours: ${requesterLevel.level}, Required: ${dataRecord.requiredLevel}`, ipfsHash: null });
        }

        const broadcastHeader = dataRecord.broadcastHeader || {};
        
        // BGW provides cryptographic access control. 
        // If a user is not in the authorized set, their BLS12-381 private key will simply fail to decrypt the AES key.
        // The chaincode only enforces role/privacy levels.

        await this._logAccess(ctx, requesterId, dataId, 'GRANTED', '');
        return JSON.stringify({
            status:             'ACCESS_GRANTED',
            dataId:             dataId,
            patientId:          dataRecord.patientId,
            ipfsHash:           dataRecord.ipfsHash,
            iv:                 dataRecord.iv,
            broadcastHeader:    broadcastHeader,
            authorizedUsers:    broadcastHeader.recipientIds || [],
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
