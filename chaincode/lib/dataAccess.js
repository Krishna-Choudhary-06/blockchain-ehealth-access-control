'use strict';

const { Contract } = require('fabric-contract-api');

class DataAccess extends Contract {

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

        const aclBytes = await ctx.stub.getState(
            'ACL_' + requesterId);
        if (!aclBytes || aclBytes.length === 0) {
            return JSON.stringify({
                status: 'NO_LEVEL',
                message: 'No privacy level assigned',
                ipfsHash: null
            });
        }
        const acl = JSON.parse(aclBytes.toString());

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

        const requesterRank = acl.clearanceRank !== undefined
            ? acl.clearanceRank
            : this._clearanceRank(acl.level);
        const requiredRank = data.requiredClearanceRank !== undefined
            ? data.requiredClearanceRank
            : this._clearanceRank(data.requiredLevel);
        const authUsers = data.authorizedUsers || [];
        const isOwner = requesterId === data.patientId || requesterId === data.ownerId;
        const isListed = authUsers.includes(requesterId);
        const isPublic = data.requiredLevel === 'L3';
        const granted = isOwner || isPublic || (requesterRank >= requiredRank && isListed);
        const txId = ctx.stub.getTxID();

const log = {
    docType: 'ACCESS_LOG',
    txId,
    requesterId,
    dataId,
    action: granted ? 'GRANTED' : 'DENIED',
    requesterLevel: acl.level,
    dataLevel: data.requiredLevel,
    policy: {
        isOwner,
        isPublic,
        isListed,
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

    _clearanceRank(level) {
        const ranks = { L0: 3, L1: 2, L2: 1, L3: 0 };
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
}

module.exports = DataAccess;
