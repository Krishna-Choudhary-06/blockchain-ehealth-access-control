'use strict';
const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class UserRegistry extends Contract {

    async registerUser(ctx, userId, publicKey, role) {

        // Check user already exists
        const existing = await ctx.stub.getState('USER_' + userId);
        if (existing && existing.length > 0) {
            throw new Error(`User ${userId} already registered`);
        }

        // RV = Hash(publicKey || registrationData) — Equation 1 from paper
        const registrationData = userId + role + new Date().toISOString();
        const RV = crypto.createHash('sha256')
                         .update(publicKey + registrationData)
                         .digest('hex');

        const certificate = {
            userId,
            publicKey,
            role,
            RV,
            isValid: true,
            registeredAt: new Date().toISOString()
        };

        await ctx.stub.putState(
            'USER_' + userId,
            Buffer.from(JSON.stringify(certificate))
        );

        ctx.stub.setEvent('UserRegistered',
            Buffer.from(JSON.stringify({ userId, role })));

        return JSON.stringify(certificate);
    }

    async verifyCertificate(ctx, userId) {
        const data = await ctx.stub.getState('USER_' + userId);
        if (!data || data.length === 0) {
            return JSON.stringify({ valid: false, reason: 'User not found' });
        }
        const cert = JSON.parse(data.toString());
        return JSON.stringify({ valid: cert.isValid, certificate: cert });
    }

    async getAllUsers(ctx) {
        const iterator = await ctx.stub.getStateByRange('USER_', 'USER_~');
        const results = [];
        let result = await iterator.next();
        while (!result.done) {
            results.push(JSON.parse(result.value.value.toString()));
            result = await iterator.next();
        }
        return JSON.stringify(results);
    }
}

module.exports = UserRegistry;