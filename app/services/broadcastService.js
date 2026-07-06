'use strict';
/**
 * ============================================================
 * broadcastService.js
 * Blockchain E-Health Access Control System - BGW05 Integrated
 * ============================================================
 *
 * PURPOSE:
 *   Implements true broadcast encryption using the BGW05 library.
 *
 * HOW IT WORKS:
 *   1. Setup Phase: Admin generates PK (Public Key/Params) and MSK (Master Secret Key).
 *   2. Keygen: Each user gets a unique private key SK_u derived from MSK.
 *   3. Encrypt: BGW generates a symmetric key (K) and a broadcast header (H) for a set of users S.
 *   4. File is encrypted with K. H is stored on chain.
 *   5. Decrypt: Authorized user downloads H and S, uses their SK_u to recover K.
 * ============================================================
 */

// Assuming the user's BGW library is placed in the bgw folder at the app root.
const bgw = require('../bgw/index.js');
const crypto = require('crypto');

/**
 * Build a broadcast header for a set of authorized users using BGW.
 * 
 * @param {Array} authorizedUsers - Array of user ID strings
 * @param {Object} pk - BGW Public Parameters
 * @returns {Object} { symmetricKey (Buffer), broadcastHeader (Object) }
 */
function buildBroadcastHeader(authorizedUsers, pk) {
    if (!Array.isArray(authorizedUsers) || authorizedUsers.length === 0) {
        throw new Error('authorizedUsers must be a non-empty array');
    }
    
    // The BGW library encrypt function should return a symmetric key and a header
    const { key, header } = bgw.encrypt(pk, authorizedUsers);
    
    return {
        symmetricKey: Buffer.from(key, 'hex'), // 32 bytes AES key
        broadcastHeader: header
    };
}

/**
 * Recover the AES key from a broadcast header using a private key.
 * 
 * @param {Object} broadcastHeader - The BGW header
 * @param {Array} authorizedUsers - Array of user IDs
 * @param {Object} privateKey - BGW private key of the requester
 * @param {Object} pk - BGW Public Parameters
 * @param {string} userId - ID of the requester
 * @returns {Buffer} The original AES key K (32 bytes)
 */
function recoverKeyFromHeader(broadcastHeader, authorizedUsers, privateKey, pk, userId) {
    if (!broadcastHeader || !authorizedUsers) {
        throw new Error('Broadcast header and authorized users set are required');
    }
    if (!privateKey) {
        throw new Error('Private key is required to recover AES key');
    }

    // Use BGW to decrypt the header to get the symmetric key
    const keyHex = bgw.decrypt(pk, privateKey, broadcastHeader, authorizedUsers, userId);
    return Buffer.from(keyHex, 'hex');
}

/**
 * Update the header for adding/revoking users (BGW header update).
 * 
 * @param {Object} pk - BGW Public Parameters
 * @param {Object} existingHeader - Current BGW header
 * @param {Array} currentUsers - Current authorized users
 * @param {Array} newUsers - New list of authorized users
 * @returns {Object} Updated broadcast header
 */
function updateBroadcastHeader(pk, existingHeader, currentUsers, newUsers) {
    // BGW update header function creates a new header for the new set
    const updatedHeader = bgw.updateHeader(pk, existingHeader, currentUsers, newUsers);
    return updatedHeader;
}

module.exports = {
    buildBroadcastHeader,
    recoverKeyFromHeader,
    updateBroadcastHeader
};