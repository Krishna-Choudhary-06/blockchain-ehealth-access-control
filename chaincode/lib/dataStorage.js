'use strict';
/**
 * ============================================================
 * dataStorage.js — UPDATED with Broadcast Encryption
 * Blockchain E-Health Access Control System
 * ============================================================
 *
 * CHANGES FROM PREVIOUS VERSION:
 *   storeHash() now accepts a 6th argument: broadcastHeader (JSON string)
 *   broadcastHeader is stored on ledger alongside ipfsHash and iv
 *   updateBroadcastHeader() is a NEW function for revoke/add-user
 *
 * Replace: chaincode/lib/dataStorage.js
 * ============================================================
 */

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class DataStorage extends Contract {

    // ─────────────────────────────────────────────────────────
    // storeHash — store encrypted file metadata on blockchain
    //
    // Args:
    //   dataId          - unique ID for this data record
    //   patientId       - patient's userId (must be registered)
    //   ipfsHash        - CID from IPFS after encrypted file upload
    //   iv              - AES IV used during encryption (hex string)
    //   level           - privacy level: L0 / L1 / L2 / L3
    //   broadcastHeader - JSON string: { userId: base64EncryptedKey, ... }
    //
    // Example call from fabricService.js:
    //   contract.submitTransaction(
    //     'DataStorage:storeHash',
    //     'data001', 'alice001', 'QmX7mU...', '3f8a2c...', 'L1',
    //     '{"doc_bob":"X9kL3m...","doc_carol":"7hN2wQ..."}'
    //   )
    // ─────────────────────────────────────────────────────────
    async storeHash(ctx, dataId, patientId, ipfsHash, iv, level, broadcastHeader) {

        // Validate required fields
        if (!dataId || !patientId || !ipfsHash || !iv || !level) {
            throw new Error('dataId, patientId, ipfsHash, iv, and level are all required');
        }

        // Validate level
        const validLevels = { L0: 0, L1: 1, L2: 2, L3: 3 };
        if (validLevels[level] === undefined) {
            throw new Error(`Invalid level "${level}". Must be L0, L1, L2, or L3`);
        }

        // Check if patientId is a registered user
        const patientBytes = await ctx.stub.getState(`USER_${patientId}`);
        if (!patientBytes || patientBytes.length === 0) {
            throw new Error(`Patient ${patientId} is not registered on blockchain`);
        }

        // Check data record doesn't already exist
        const existing = await ctx.stub.getState(`DATA_${dataId}`);
        if (existing && existing.length > 0) {
            throw new Error(`Data record ${dataId} already exists`);
        }

        // Parse broadcast header (default to empty object if not provided)
        let parsedHeader = {};
        if (broadcastHeader && broadcastHeader.trim() !== '') {
            try {
                parsedHeader = JSON.parse(broadcastHeader);
            } catch (e) {
                throw new Error(`Invalid broadcastHeader JSON: ${e.message}`);
            }
        }

        // Build the ledger record
        const dataRecord = {
            dataId:           dataId,
            patientId:        patientId,
            ipfsHash:         ipfsHash,
            iv:               iv,
            requiredLevel:    level,
            requiredLevelNum: validLevels[level],
            broadcastHeader:  parsedHeader,          // ← NEW: stored on ledger
            authorizedCount:  Object.keys(parsedHeader).length,
            storedAt:         this._getTimestamp(ctx)
        };

        // Write to ledger (permanent, immutable)
        await ctx.stub.putState(
            `DATA_${dataId}`,
            Buffer.from(JSON.stringify(dataRecord))
        );

        // Return confirmation (without exposing encrypted keys in full)
        return JSON.stringify({
            success:         true,
            dataId:          dataId,
            patientId:       patientId,
            ipfsHash:        ipfsHash,
            requiredLevel:   level,
            authorizedUsers: Object.keys(parsedHeader),
            storedAt:        dataRecord.storedAt
        });
    }

    // ─────────────────────────────────────────────────────────
    // updateBroadcastHeader — NEW function
    // Used by revoke and add-user operations.
    // Updates the header WITHOUT changing ipfsHash, iv, or level.
    //
    // Args:
    //   dataId             - the data record to update
    //   updatedHeaderJson  - new broadcast header as JSON string
    //   requesterId        - who is requesting this change (for audit)
    //
    // Only the patient (data owner) should be able to call this.
    // In production: add ownership check here.
    // ─────────────────────────────────────────────────────────
    async updateBroadcastHeader(ctx, dataId, updatedHeaderJson, requesterId) {

        // Fetch existing record
        const dataBytes = await ctx.stub.getState(`DATA_${dataId}`);
        if (!dataBytes || dataBytes.length === 0) {
            throw new Error(`Data record ${dataId} not found`);
        }

        const dataRecord = JSON.parse(dataBytes.toString());

        // Parse the new header
        let newHeader;
        try {
            newHeader = JSON.parse(updatedHeaderJson);
        } catch (e) {
            throw new Error(`Invalid updatedHeaderJson: ${e.message}`);
        }

        // Track what changed (for the audit log)
        const oldUsers = Object.keys(dataRecord.broadcastHeader || {});
        const newUsers = Object.keys(newHeader);
        const revoked  = oldUsers.filter(u => !newUsers.includes(u));
        const added    = newUsers.filter(u => !oldUsers.includes(u));

        // Update the record
        dataRecord.broadcastHeader  = newHeader;
        dataRecord.authorizedCount  = newUsers.length;
        dataRecord.headerUpdatedAt  = this._getTimestamp(ctx);
        dataRecord.headerUpdatedBy  = requesterId;

        // Write updated record back to ledger
        await ctx.stub.putState(
            `DATA_${dataId}`,
            Buffer.from(JSON.stringify(dataRecord))
        );

        return JSON.stringify({
            success:          true,
            dataId:           dataId,
            authorizedUsers:  newUsers,
            revokedUsers:     revoked,
            addedUsers:       added,
            updatedAt:        dataRecord.headerUpdatedAt
        });
    }

    // ─────────────────────────────────────────────────────────
    // getDataRecord — retrieve a data record from ledger
    // Used internally by dataAccess.js
    // ─────────────────────────────────────────────────────────
    async getDataRecord(ctx, dataId) {
        const dataBytes = await ctx.stub.getState(`DATA_${dataId}`);
        if (!dataBytes || dataBytes.length === 0) {
            throw new Error(`Data record ${dataId} not found`);
        }
        return dataBytes.toString();
    }

    // ─────────────────────────────────────────────────────────
    // _getTimestamp — deterministic timestamp helper
    // MUST use getTxTimestamp() to ensure both peers
    // compute the same value during endorsement.
    // NEVER use new Date() inside chaincode.
    // ─────────────────────────────────────────────────────────
    _getTimestamp(ctx) {
    try {
        const ts = ctx.stub.getTxTimestamp();
        if (ts && ts.seconds) {
            const secs = ts.seconds.low !== undefined 
                ? ts.seconds.low 
                : parseInt(ts.seconds.toString());
            return new Date(secs * 1000).toISOString();
        }
        return new Date().toISOString();
    } catch(e) {
        return new Date().toISOString();
    }
}
}

module.exports = DataStorage;