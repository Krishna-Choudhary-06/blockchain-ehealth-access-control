'use strict';

const { Contract } = require('fabric-contract-api');

class PrivacyLevel extends Contract {

    _getTimestamp(ctx) {
        try {
            const ts = ctx.stub.getTxTimestamp();
            const secs = parseInt(ts.seconds.toString());
            return new Date(secs * 1000).toISOString();
        } catch(e) {
            return new Date().toISOString();
        }
    }

    async assignLevel(ctx, userId, level) {
        const validLevels = ['L0', 'L1', 'L2', 'L3'];
        if (!validLevels.includes(level)) {
            throw new Error('Invalid level. Use L0/L1/L2/L3');
        }

        const userBytes = await ctx.stub.getState(
            'USER_' + userId);
        if (!userBytes || userBytes.length === 0) {
            throw new Error('User not registered: ' + userId);
        }

        const record = {
            userId,
            level,
            levelNum: parseInt(level.substring(1)),
            assignedAt: this._getTimestamp(ctx)
        };

        await ctx.stub.putState(
            'ACL_' + userId,
            Buffer.from(JSON.stringify(record))
        );

        return JSON.stringify(record);
    }

    async getLevel(ctx, userId) {
        const data = await ctx.stub.getState('ACL_' + userId);
        if (!data || data.length === 0) {
            throw new Error('No level for: ' + userId);
        }
        return data.toString();
    }

    async getAllLevels(ctx) {
        const iterator = await ctx.stub.getStateByRange(
            'ACL_', 'ACL_~');
        const results = [];
        let res = await iterator.next();
        while (!res.done) {
            results.push(JSON.parse(
                res.value.value.toString()));
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(results);
    }
}

module.exports = PrivacyLevel;
