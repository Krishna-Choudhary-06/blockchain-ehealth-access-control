'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class UserRegistry extends Contract {

    _getTimestamp(ctx) {
        try {
            const ts = ctx.stub.getTxTimestamp();
            const secs = parseInt(ts.seconds.toString());
            return new Date(secs * 1000).toISOString();
        } catch(e) {
            return new Date().toISOString();
        }
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
