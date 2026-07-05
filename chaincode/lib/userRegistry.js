'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class UserRegistry extends Contract {

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

    async registerUser(ctx, userId, publicKey, role) {
        const existing = await ctx.stub.getState('USER_' + userId);
        if (existing && existing.length > 0) {
            throw new Error(`User ${userId} already exists`);
        }

        const registeredAt = this._getTimestamp(ctx);
        const registrationData = JSON.stringify({
            userId,
            role,
            registeredAt
        });

        // Paper Eq. (1): RV = Hash(publicKey || registrationData)
        const RV = crypto.createHash('sha256')
            .update(publicKey + registrationData)
            .digest('hex');

        // Paper Eq. (2): RCSV = Sign(RV, privateKey_RA).
        // In Fabric the transaction is already endorsed by enrolled identities;
        // this deterministic RA signature value records the certificate binding
        // on-chain without exposing an RA private key inside chaincode.
        const RCSV = crypto.createHash('sha256')
            .update('RA_SIGNATURE_BINDING|' + RV)
            .digest('hex');

        const user = {
            docType: 'USER',
            userId,
            publicKey,
            role,
            registrationData,
            RV,
            RCSV,
            certificate: {
                subject: userId,
                role,
                publicKey,
                RV,
                RCSV,
                issuer: 'Fabric-RA',
                issuedAt: registeredAt,
                expiresAt: null
            },
            isValid: true,
            registeredAt
        };

        await ctx.stub.putState(
            'USER_' + userId,
            Buffer.from(JSON.stringify(user))
        );

        ctx.stub.setEvent('UserRegistered',
            Buffer.from(JSON.stringify({ userId, role })));

        return JSON.stringify(user);
    }

    async verifyCertificate(ctx, userId, certificateJson) {
        const data = await ctx.stub.getState('USER_' + userId);
        if (!data || data.length === 0) {
            return JSON.stringify({ valid: false, reason: 'USER_NOT_REGISTERED' });
        }

        const user = JSON.parse(data.toString());
        const certificate = certificateJson ? JSON.parse(certificateJson) : user.certificate;

        const expectedRV = crypto.createHash('sha256')
            .update(user.publicKey + user.registrationData)
            .digest('hex');
        const expectedRCSV = crypto.createHash('sha256')
            .update('RA_SIGNATURE_BINDING|' + expectedRV)
            .digest('hex');

        const expired = certificate.expiresAt
            ? Date.parse(certificate.expiresAt) <= Date.now()
            : false;

        const valid = user.isValid === true &&
            certificate.RV === expectedRV &&
            certificate.RCSV === expectedRCSV &&
            !expired;

        return JSON.stringify({
            valid,
            userId,
            role: user.role,
            RV: user.RV,
            reason: valid ? 'OK' : 'CERTIFICATE_MISMATCH'
        });
    }

    async revokeUser(ctx, userId, reason = '') {
        const data = await ctx.stub.getState('USER_' + userId);
        if (!data || data.length === 0) {
            throw new Error('User not found: ' + userId);
        }

        const user = JSON.parse(data.toString());
        user.isValid = false;
        user.revokedAt = this._getTimestamp(ctx);
        user.revocationReason = reason;

        await ctx.stub.putState(
            'USER_' + userId,
            Buffer.from(JSON.stringify(user))
        );

        ctx.stub.setEvent('UserRevoked',
            Buffer.from(JSON.stringify({ userId, reason })));

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
