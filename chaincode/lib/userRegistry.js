'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class UserRegistry extends Contract {

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
        return '1970-01-01T00:00:00.000Z';
    }

    async registerUser(ctx, userId, publicKey, role) {
        const existing = await ctx.stub.getState('USER_' + userId);
        if (existing && existing.length > 0) {
            throw new Error(`User ${userId} already exists`);
        }

        const RV = crypto.createHash('sha256')
            .update(publicKey + userId + role)
            .digest('hex');

        const user = {
            userId,
            publicKey,
            role,
            RV,
            isValid: true,
            registeredAt: this._getTimestamp(ctx)
        };

        await ctx.stub.putState(
            'USER_' + userId,
            Buffer.from(JSON.stringify(user))
        );

        ctx.stub.setEvent('UserRegistered',
            Buffer.from(JSON.stringify({ userId, role })));

        return JSON.stringify(user);
    }

    async getUser(ctx, userId) {
        const data = await ctx.stub.getState('USER_' + userId);
        if (!data || data.length === 0) {
            throw new Error('User not found: ' + userId);
        }
        return data.toString();
    }

    async getAllUsers(ctx) {
        const iterator = await ctx.stub.getStateByRange(
            'USER_', 'USER_~');
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

module.exports = UserRegistry;
