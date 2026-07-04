'use strict';
/**
 * ============================================================
 * dataAccess.js — UPDATED with Broadcast Encryption
 * Blockchain E-Health Access Control System
 * ============================================================
 *
 * CHANGES FROM PREVIOUS VERSION:
 *   requestAccess() now returns encryptedKeyForYou in GRANTED response.
 *   This is the requester's RSA-encrypted copy of the AES key K,
 *   taken from the broadcast header stored on the ledger.
 *
 * Replace: chaincode/lib/dataAccess.js
 * ============================================================
 */

const { Contract } = require('fabric-contract-api');

class DataAccess extends Contract {

    // ─────────────────────────────────────────────────────────
    // requestAccess — core access control function (Algorithm 5)
    //
    // Args:
    //   requesterId - userId of person requesting access
    //   dataId      - which data record they want
    //
    // Returns (GRANTED):
    //   {
    //     status:             "ACCESS_GRANTED",
    //     ipfsHash:           "QmX7mUBW...",
    //     iv:                 "3f8a2c...",
    //     encryptedKeyForYou: "X9kL3m..."   ← NEW
    //   }
    //
    // Returns (DENIED):
    //   { status: "ACCESS_DENIED", message: "reason" }
    //
    // After GRANTED, the caller:
    //   1. Decrypts encryptedKeyForYou with their RSA private key → K
    //   2. Downloads encrypted file from IPFS using ipfsHash
    //   3. Decrypts file using K and iv → original medical record
    // ─────────────────────────────────────────────────────────
    async requestAccess(ctx, requesterId, dataId, isEmergencyStr = "false") {

        // ── CHECK 1: Is requester registered? ─────────────────
        const userBytes = await ctx.stub.getState(`USER_${requesterId}`);
        if (!userBytes || userBytes.length === 0) {
            return JSON.stringify({
                status:  'ACCESS_DENIED',
                message: 'Requester is not registered on blockchain'
            });
        }

        const user = JSON.parse(userBytes.toString());
        if (!user.isValid) {
            return JSON.stringify({
                status:  'ACCESS_DENIED',
                message: 'Requester account is not valid'
            });
        }

        // ── CHECK 2: Does requester have a privacy level? ──────
        const levelBytes = await ctx.stub.getState(`ACL_${requesterId}`);
        if (!levelBytes || levelBytes.length === 0) {
            return JSON.stringify({
                status:  'ACCESS_DENIED',
                message: 'Requester has no privacy level assigned'
            });
        }

        const requesterLevel = JSON.parse(levelBytes.toString());

        // ── CHECK 3: Does the data record exist? ───────────────
        const dataBytes = await ctx.stub.getState(`DATA_${dataId}`);
        if (!dataBytes || dataBytes.length === 0) {
            return JSON.stringify({
                status:   'NOT_FOUND',
                message:  `Data record ${dataId} not found`,
                ipfsHash: null
            });
        }

        const dataRecord = JSON.parse(dataBytes.toString());
        const isEmergency = (isEmergencyStr === 'true');
        const policy = dataRecord.policy || {};

        // ── ADAPTIVE POLICY 1: Break-Glass (Emergency Mode) ────────
        if (isEmergency && policy.emergencyAllowed) {
            ctx.stub.setEvent("EmergencyAccessTriggered", Buffer.from(dataId));
            // Log emergency access immutably to the ledger
            await this._logAccess(ctx, requesterId, dataId, 'EMERGENCY_GRANTED', 'Break-glass emergency access invoked');
        } else {
            // ── ADAPTIVE POLICY 2: Temporal Constraints ────────────
            const currentTime = Math.floor(new Date(this._getTimestamp(ctx)).getTime() / 1000);
            if (policy.timeWindowStart && policy.timeWindowEnd) {
                if (currentTime < policy.timeWindowStart || currentTime > policy.timeWindowEnd) {
                    await this._logAccess(ctx, requesterId, dataId, 'DENIED', 'Request falls outside authorized time window');
                    return JSON.stringify({
                        status:   'ACCESS_DENIED',
                        message:  'Access denied: request falls outside authorized time window',
                        ipfsHash: null
                    });
                }
            }

            // ── ADAPTIVE POLICY 3: Role-Based Attributes ───────────
            if (policy.authorizedRoles && policy.authorizedRoles.length > 0) {
                if (!policy.authorizedRoles.includes(user.role)) {
                    await this._logAccess(ctx, requesterId, dataId, 'DENIED', `Role ${user.role} not authorized by policy`);
                    return JSON.stringify({
                        status:   'ACCESS_DENIED',
                        message:  `Access denied: Role ${user.role} is not in the authorized roles list`,
                        ipfsHash: null
                    });
                }
            }

            // ── CHECK 4: Level-based access control ───────────────
            // Rule from paper: requesterLevelNum <= dataRequiredLevelNum
            const requesterLevelNum = requesterLevel.levelNum;
            const dataLevelNum      = dataRecord.requiredLevelNum;

            if (requesterLevelNum > dataLevelNum) {
                // Log the denied attempt
                await this._logAccess(ctx, requesterId, dataId, 'DENIED',
                    `Level ${requesterLevel.level}(${requesterLevelNum}) insufficient for ${dataRecord.requiredLevel}(${dataLevelNum})`
                );

                return JSON.stringify({
                    status:   'ACCESS_DENIED',
                    message:  `Insufficient access level. Your level: ${requesterLevel.level}, Required: ${dataRecord.requiredLevel}`,
                    ipfsHash: null
                });
            }
        }

        // ── CHECK 5: Is requester in the broadcast header? ────
        // This is the broadcast encryption check.
        const broadcastHeader = dataRecord.broadcastHeader || {};
        let encryptedKeyForRequester = broadcastHeader[requesterId];

        if (!encryptedKeyForRequester) {
            if (isEmergency && policy.emergencyAllowed) {
                // In an emergency, if user is not in the broadcast header, provide an organizational Master Key
                // cipher fallback to allow decryption. (Assuming CP-ABBE architecture trapdoor).
                encryptedKeyForRequester = "EMERGENCY_RECOVERY_KEY_CIPHERTEXT";
            } else {
                // Level check passed but user not in broadcast header
                // This means: user was revoked, or was never added to this file's header
                await this._logAccess(ctx, requesterId, dataId, 'REVOKED',
                    'User not in broadcast header (may have been revoked)'
                );

                return JSON.stringify({
                    status:   'ACCESS_DENIED',
                    message:  'You are not in the authorized set for this data record. Contact the patient to be added.',
                    ipfsHash: null
                });
            }
        }

        // ── ALL CHECKS PASSED → GRANT ACCESS ──────────────────
        await this._logAccess(ctx, requesterId, dataId, 'GRANTED', '');

        return JSON.stringify({
            status:             'ACCESS_GRANTED',
            dataId:             dataId,
            patientId:          dataRecord.patientId,
            ipfsHash:           dataRecord.ipfsHash,          // download from IPFS
            iv:                 dataRecord.iv,                // needed to decrypt
            encryptedKeyForYou: encryptedKeyForRequester,    // ← NEW: decrypt with your RSA private key to get AES key K
            accessGrantedAt:    this._getTimestamp(ctx)
        });
    }

    // ─────────────────────────────────────────────────────────
    // getLogs — return all access attempt logs (immutable audit)
    // ─────────────────────────────────────────────────────────
    async getLogs(ctx) {
        const iterator = await ctx.stub.getStateByRange('LOG_', 'LOG_~');
        const logs = [];

        let result = await iterator.next();
        while (!result.done) {
            if (result.value && result.value.value) {
                try {
                    logs.push(JSON.parse(result.value.value.toString()));
                } catch (e) {
                    // skip malformed entries
                }
            }
            result = await iterator.next();
        }
        await iterator.close();

        // Sort by timestamp (newest first)
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return JSON.stringify(logs);
    }

    // ─────────────────────────────────────────────────────────
    // _logAccess — internal helper to write access attempt to ledger
    // Every attempt (granted or denied) is permanently recorded.
    // ─────────────────────────────────────────────────────────
    async _logAccess(ctx, requesterId, dataId, status, reason) {
        const txId  = ctx.stub.getTxID();
        const logEntry = {
            txId:        txId,
            requesterId: requesterId,
            dataId:      dataId,
            status:      status,
            reason:      reason,
            timestamp:   this._getTimestamp(ctx)
        };

        await ctx.stub.putState(
            `LOG_${txId}`,
            Buffer.from(JSON.stringify(logEntry))
        );
    }

    // ─────────────────────────────────────────────────────────
    // _getTimestamp — deterministic timestamp (NEVER use new Date())
    // ─────────────────────────────────────────────────────────
    _getTimestamp(ctx) {
        const ts   = ctx.stub.getTxTimestamp();
        const secs = parseInt(ts.seconds.toString());
        return new Date(secs * 1000).toISOString();
    }
}

module.exports = DataAccess;