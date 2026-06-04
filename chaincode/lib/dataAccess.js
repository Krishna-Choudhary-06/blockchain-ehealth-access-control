'use strict';
const { Contract } = require('fabric-contract-api');

class DataAccess extends Contract {

    async requestData(ctx, requesterId, dataId) {

        // Step 1 — verify user certificate exists
        const certData = await ctx.stub.getState('USER_' + requesterId);
        if (!certData || certData.length === 0) {
            return JSON.stringify({
                status: 'CERTIFICATION ERROR',
                ipfsHash: null
            });
        }

        // Step 2 — get requester privacy level
        const aclData = await ctx.stub.getState('ACL_' + requesterId);
        if (!aclData || aclData.length === 0) {
            return JSON.stringify({
                status: 'NO PERMISSION - level not assigned',
                ipfsHash: null
            });
        }
        const requesterACL = JSON.parse(aclData.toString());

        // Step 3 — get the data record
        const dataRecord = await ctx.stub.getState('DATA_' + dataId);
        if (!dataRecord || dataRecord.length === 0) {
            return JSON.stringify({
                status: 'DATA NOT FOUND',
                ipfsHash: null
            });
        }
        const data = JSON.parse(dataRecord.toString());

        // Step 4 — check access
        // Lower number = more restricted
        // User level must be <= data required level
        const accessGranted =
            requesterACL.levelNumber <= data.requiredLevelNumber;

        // Step 5 — log event on blockchain (immutable audit trail)
        const logEntry = {
            requesterId,
            dataId,
            action: accessGranted ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
            requesterLevel: requesterACL.privacyLevel,
            dataLevel: data.requiredLevel,
            timestamp: new Date().toISOString()
        };

        await ctx.stub.putState(
            'LOG_' + ctx.stub.getTxID(),
            Buffer.from(JSON.stringify(logEntry))
        );

        if (accessGranted) {
            return JSON.stringify({
                status: 'ACCESS_GRANTED',
                ipfsHash: data.ipfsHash,
                iv: data.iv
            });
        }

        return JSON.stringify({
            status: 'NO PERMISSION',
            ipfsHash: null
        });
    }

    async getAccessLogs(ctx) {
        const iterator = await ctx.stub.getStateByRange('LOG_', 'LOG_~');
        const logs = [];
        let result = await iterator.next();
        while (!result.done) {
            logs.push(JSON.parse(result.value.value.toString()));
            result = await iterator.next();
        }
        return JSON.stringify(logs);
    }
}

module.exports = DataAccess;