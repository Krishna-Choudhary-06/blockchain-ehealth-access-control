'use strict';

const { Contract } = require('fabric-contract-api');

class DataAccess extends Contract {

    _roleAccessRank(role) {
        const normalized = String(role || '').trim().toLowerCase();
        const ranks = {
            doctor: 0,
            nurse: 1,
            'lab technician': 1,
            admin: 2,
            accountant: 3
        };
        if (!(normalized in ranks)) {
            return Number.POSITIVE_INFINITY;
        }
        return ranks[normalized];
    }

    _getTimestamp(ctx) {
        try {
            const ts = ctx.stub.getTxTimestamp();
            if (ts && ts.seconds) {
                const secs = ts.seconds.low !== undefined ? ts.seconds.low : parseInt(ts.seconds.toString());
                return new Date(secs * 1000).toISOString();
            } else if (ts && typeof ts.getSeconds === 'function') {
                return new Date(ts.getSeconds() * 1000).toISOString();
            } else {
                return 'TxID-' + ctx.stub.getTxID();
            }
        } catch(e) {
            return 'TxID-' + ctx.stub.getTxID();
        }
    }

    async requestAccess(ctx, requesterId, dataId) {

        const userBytes = await ctx.stub.getState(
            'USER_' + requesterId);
        if (!userBytes || userBytes.length === 0) {
            return JSON.stringify({
                status: 'CERT_ERROR',
                message: 'User not registered',
                ipfsHash: null
            });
        }

        const dataBytes = await ctx.stub.getState(
            'DATA_' + dataId);
        if (!dataBytes || dataBytes.length === 0) {
            return JSON.stringify({
                status: 'NOT_FOUND',
                message: 'Data not found',
                ipfsHash: null
            });
        }
        const data = JSON.parse(dataBytes.toString());

        const user = JSON.parse(userBytes.toString());
        const requesterRank = this._roleAccessRank(user.role);
        const requiredRank = this._privacyRank(data.requiredLevel);
        const grantedUsers = data.grantedUsers || [];
        const revokedUsers = data.revokedUsers || [];
        const isOwner = requesterId === data.patientId || requesterId === data.ownerId;
        const isGranted = grantedUsers.includes(requesterId);
        const isRevoked = revokedUsers.includes(requesterId);
        const meetsPolicy = requesterRank <= requiredRank;
        const granted = isOwner || (isGranted && !isRevoked) || (meetsPolicy && !isRevoked);
        const txId = ctx.stub.getTxID();

const log = {
    docType: 'ACCESS_LOG',
    txId,
    requesterId,
    dataId,
    action: granted ? 'GRANTED' : 'DENIED',
        requesterLevel: user.role || data.requiredLevel,
        dataLevel: data.requiredLevel,
    policy: {
        isOwner,
        isGranted,
        isRevoked,
        meetsPolicy,
        requesterRank,
        requiredRank
    },
    time: this._getTimestamp(ctx)
};

        await ctx.stub.putState(
            'LOG_' + ctx.stub.getTxID(),
            Buffer.from(JSON.stringify(log))
        );

        if (granted) {
            return JSON.stringify({
                status: 'ACCESS_GRANTED',
                ipfsHash: data.ipfsHash,
                bgwHeader: data.bgwHeader,
                payloadHash: data.payloadHash,
                requiredLevel: data.requiredLevel,
                authorizedUsers: data.authorizedUsers
            });
        }

        return JSON.stringify({
            status: 'ACCESS_DENIED',
            message: 'Insufficient access level',
            ipfsHash: null
        });
    }

    _privacyRank(level) {
        const ranks = { L0: 0, L1: 1, L2: 2, L3: 3 };
        if (!(level in ranks)) {
            throw new Error('Invalid level: ' + level);
        }
        return ranks[level];
    }

    async getLogs(ctx) {
        const iterator = await ctx.stub.getStateByRange(
            'LOG_', 'LOG_~');
        const logs = [];
        let res = await iterator.next();
        while (!res.done) {
            logs.push(JSON.parse(
                res.value.value.toString()));
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(logs);
    }

    async wipeAll(ctx) {
        const iterator = await ctx.stub.getStateByRange(
            'LOG_', 'LOG_~');
        let res = await iterator.next();
        let count = 0;
        while (!res.done) {
            await ctx.stub.deleteState(res.value.key);
            count++;
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify({ deleted: count, namespace: 'LOG' });
    }
}

module.exports = DataAccess;
