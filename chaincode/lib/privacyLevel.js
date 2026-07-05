'use strict';

const { Contract } = require('fabric-contract-api');

class PrivacyLevel extends Contract {

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
            docType: 'ACL',
            userId,
            level,
            levelNum: parseInt(level.substring(1)),
            clearanceRank: this._clearanceRank(level),
            assignedAt: this._getTimestamp(ctx)
        };

        await ctx.stub.putState(
            'ACL_' + userId,
            Buffer.from(JSON.stringify(record))
        );

        return JSON.stringify(record);
    }

    _clearanceRank(level) {
        const ranks = { L0: 3, L1: 2, L2: 1, L3: 0 };
        if (!(level in ranks)) {
            throw new Error('Invalid level: ' + level);
        }
        return ranks[level];
    }

    async determineHighestAccessLevel(ctx, userId) {
        const userBytes = await ctx.stub.getState('USER_' + userId);
        if (!userBytes || userBytes.length === 0) {
            throw new Error('User not registered: ' + userId);
        }

        const user = JSON.parse(userBytes.toString());
        const role = String(user.role || '').toLowerCase();
        let level = 'L2';

        if (role.includes('doctor') || role.includes('physician') || role.includes('admin')) {
            level = 'L0';
        } else if (role.includes('lab')) {
            level = 'L1';
        } else if (role.includes('nurse') || role.includes('staff')) {
            level = 'L2';
        } else if (role.includes('billing') || role.includes('public')) {
            level = 'L3';
        }

        return JSON.stringify({
            userId,
            role: user.role,
            level,
            clearanceRank: this._clearanceRank(level)
        });
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
