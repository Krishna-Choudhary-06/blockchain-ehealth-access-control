'use strict';

const { Contract } = require('fabric-contract-api');

class DataStorage extends Contract {

    _getTimestamp(ctx) {
        // MUST be deterministic across all peers - never use new Date()
        const ts = ctx.stub.getTxTimestamp();
        const secs = ts.seconds.low !== undefined
            ? ts.seconds.low
            : parseInt(ts.seconds.toString());
        return new Date(secs * 1000).toISOString();
    }

    async storeHash(ctx, dataId, patientId,
                    ipfsHash, iv, level) {
        const levelMap = {
            'L0': 0, 'L1': 1, 'L2': 2, 'L3': 3
        };

        if (!(level in levelMap)) {
            throw new Error('Invalid level: ' + level);
        }

        const record = {
            dataId,
            patientId,
            ipfsHash,
            iv,
            requiredLevel: level,
            requiredLevelNum: levelMap[level],
            storedAt: this._getTimestamp(ctx)
        };

        await ctx.stub.putState(
            'DATA_' + dataId,
            Buffer.from(JSON.stringify(record))
        );

        return JSON.stringify({
            success: true,
            dataId,
            ipfsHash
        });
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
}

module.exports = DataStorage;
