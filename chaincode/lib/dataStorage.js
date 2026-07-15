'use strict';

const { Contract } = require('fabric-contract-api');

class DataStorage extends Contract {

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

    _levelMap() {
        return { L0: 0, L1: 1, L2: 2, L3: 3 };
    }

    _privacyRank(level) {
        const ranks = { L0: 0, L1: 1, L2: 2, L3: 3 };
        if (!(level in ranks)) {
            throw new Error('Invalid level: ' + level);
        }
        return ranks[level];
    }

    _classifyCategory(category, fallbackLevel) {
        const map = {
            prescription: 'L0',
            prescriptions: 'L0',
            laboratory: 'L1',
            'lab report': 'L1',
            lab: 'L1',
            medical_history: 'L2',
            'medical history': 'L2',
            history: 'L2',
            billing: 'L3',
            public: 'L3'
        };
        return map[String(category || '').toLowerCase().trim()] || fallbackLevel || 'L0';
    }

    _parseJson(value, fallback) {
        if (value === undefined || value === null || value === '') {
            return fallback;
        }
        if (typeof value !== 'string') {
            return value;
        }
        return JSON.parse(value);
    }

    async verifyData(ctx, dataId, patientId, ipfsHash, payloadHash) {
        const valid = Boolean(dataId && patientId && ipfsHash && payloadHash);
        return JSON.stringify({
            valid,
            reason: valid ? 'OK' : 'MISSING_REQUIRED_DATA_FIELDS'
        });
    }

    async storeHash(ctx, dataId, patientId,
                    ipfsHash, bgwHeader, level) {
        const levelMap = {
            'L0': 0, 'L1': 1, 'L2': 2, 'L3': 3
        };

        const headerBundle = this._parseJson(bgwHeader, {});
        const storedHeader = headerBundle.bgwHeader
            ? JSON.stringify(headerBundle.bgwHeader)
            : bgwHeader;
        const authorizedUsers = headerBundle.authorizedUsers || [];
        const grantedUsers = headerBundle.grantedUsers || [];
        const revokedUsers = headerBundle.revokedUsers || [];
        const payloadHash = headerBundle.payloadHash || '';
        const category = headerBundle.category || '';
        const metadata = headerBundle.metadata || {};
        const updateToken = headerBundle.updateToken || '';

        const classifiedLevel = this._classifyCategory(category, level);
        if (!(classifiedLevel in levelMap)) {
            throw new Error('Invalid level: ' + classifiedLevel);
        }

        const verified = JSON.parse(await this.verifyData(
            ctx,
            dataId,
            patientId,
            ipfsHash,
            payloadHash
        ));
        if (!verified.valid) {
            throw new Error('Data verification failed: ' + verified.reason);
        }

        const record = {
            docType: 'DATA',
            dataId,
            patientId,
            ipfsHash,
            bgwHeader: storedHeader,
            updateToken,
            authorizedUsers,
            grantedUsers,
            revokedUsers,
            payloadHash,
            category,
            metadata,
            requiredLevel: classifiedLevel,
            requiredLevelNum: levelMap[classifiedLevel],
            storedAt: this._getTimestamp(ctx)
        };

        await ctx.stub.putState(
            'DATA_' + dataId,
            Buffer.from(JSON.stringify(record))
        );

        return JSON.stringify({
            success: true,
            dataId,
            ipfsHash,
            payloadHash,
            requiredLevel: classifiedLevel
        });
    }

    async updateBroadcastHeader(ctx, dataId, bgwHeader, policyJson) {
        const dataBytes = await ctx.stub.getState('DATA_' + dataId);
        if (!dataBytes || dataBytes.length === 0) {
            throw new Error('Not found: ' + dataId);
        }

        const record = JSON.parse(dataBytes.toString());
        const policy = this._parseJson(policyJson, {});
        record.bgwHeader = bgwHeader;
        if (Array.isArray(policy.authorizedUsers)) {
            record.authorizedUsers = policy.authorizedUsers;
        }
        if (Array.isArray(policy.grantedUsers)) {
            record.grantedUsers = policy.grantedUsers;
        }
        if (Array.isArray(policy.revokedUsers)) {
            record.revokedUsers = policy.revokedUsers;
        }
        record.headerUpdatedAt = this._getTimestamp(ctx);

        await ctx.stub.putState(
            'DATA_' + dataId,
            Buffer.from(JSON.stringify(record))
        );

        ctx.stub.setEvent('BEHeaderUpdated',
            Buffer.from(JSON.stringify({
                dataId,
                authorizedUsers: record.authorizedUsers,
                grantedUsers: record.grantedUsers || [],
                revokedUsers: record.revokedUsers || []
            })));

        return JSON.stringify(record);
    }

    async updatePrivacyLevel(ctx, dataId, level) {
        const dataBytes = await ctx.stub.getState('DATA_' + dataId);
        if (!dataBytes || dataBytes.length === 0) {
            throw new Error('Not found: ' + dataId);
        }
        const levelMap = this._levelMap();
        if (!(level in levelMap)) {
            throw new Error('Invalid level: ' + level);
        }

        const record = JSON.parse(dataBytes.toString());
        record.requiredLevel = level;
        record.requiredLevelNum = levelMap[level];
        record.policyUpdatedAt = this._getTimestamp(ctx);

        await ctx.stub.putState(
            'DATA_' + dataId,
            Buffer.from(JSON.stringify(record))
        );

        ctx.stub.setEvent('PrivacyLevelUpdated',
            Buffer.from(JSON.stringify({ dataId, level })));

        return JSON.stringify(record);
    }

    async getData(ctx, dataId) {
        const data = await ctx.stub.getState(
            'DATA_' + dataId);
        if (!data || data.length === 0) {
            throw new Error('Not found: ' + dataId);
        }
        return data.toString();
    }

    async getAllData(ctx) {
        const iterator = await ctx.stub.getStateByRange(
            'DATA_', 'DATA_~');
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

    async wipeAll(ctx) {
        const iterator = await ctx.stub.getStateByRange(
            'DATA_', 'DATA_~');
        let res = await iterator.next();
        let count = 0;
        while (!res.done) {
            await ctx.stub.deleteState(res.value.key);
            count++;
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify({ deleted: count, namespace: 'DATA' });
    }
}

module.exports = DataStorage;
