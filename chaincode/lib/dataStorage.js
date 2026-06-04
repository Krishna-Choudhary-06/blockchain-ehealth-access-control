'use strict';
const { Contract } = require('fabric-contract-api');

class DataStorage extends Contract {

    async storeDataHash(ctx, dataId, patientId,
                        ipfsHash, iv, sensitivityLevel) {

        const levelMap = { 'L0': 0, 'L1': 1, 'L2': 2, 'L3': 3 };

        const record = {
            dataId,
            patientId,
            ipfsHash,        // CID from IPFS — NOT the actual file
            iv,              // needed for AES decryption
            requiredLevel: sensitivityLevel,
            requiredLevelNumber: levelMap[sensitivityLevel],
            storedAt: new Date().toISOString()
        };

        await ctx.stub.putState(
            'DATA_' + dataId,
            Buffer.from(JSON.stringify(record))
        );

        return JSON.stringify({ success: true, dataId, ipfsHash });
    }

    async getDataRecord(ctx, dataId) {
        const data = await ctx.stub.getState('DATA_' + dataId);
        if (!data || data.length === 0) {
            throw new Error('Data not found: ' + dataId);
        }
        return data.toString();
    }
}

module.exports = DataStorage;