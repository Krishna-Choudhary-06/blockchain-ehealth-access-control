'use strict';
const { Contract } = require('fabric-contract-api');

class PrivacyLevel extends Contract {

    async assignPrivacyLevel(ctx, userId, level) {

        // Validate level — L0 most private, L3 public
        const validLevels = ['L0', 'L1', 'L2', 'L3'];
        if (!validLevels.includes(level)) {
            throw new Error('Invalid level. Use L0, L1, L2 or L3');
        }

        // Check user exists first
        const userData = await ctx.stub.getState('USER_' + userId);
        if (!userData || userData.length === 0) {
            throw new Error('User not found. Register first.');
        }

        const record = {
            userId,
            privacyLevel: level,
            levelNumber: parseInt(level[1]),
            assignedAt: new Date().toISOString()
        };

        await ctx.stub.putState(
            'ACL_' + userId,
            Buffer.from(JSON.stringify(record))
        );

        return JSON.stringify(record);
    }

    async getUserLevel(ctx, userId) {
        const data = await ctx.stub.getState('ACL_' + userId);
        if (!data || data.length === 0) {
            throw new Error('No level assigned for: ' + userId);
        }
        return data.toString();
    }
}

module.exports = PrivacyLevel;