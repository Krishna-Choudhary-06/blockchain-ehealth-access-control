'use strict';
/**
 * ============================================================
 * broadcastService.js
 * Blockchain E-Health Access Control System
 * ============================================================
 *
 * PURPOSE:
 *   Implements broadcast encryption for secure AES key distribution.
 *   Drop this file into: app/services/broadcastService.js
 *
 * HOW IT WORKS:
 *   1. One AES key K encrypts the actual medical file
 *   2. K is RSA-encrypted once per authorized user → broadcast header
 *   3. On access grant, user gets THEIR encrypted copy of K
 *   4. User decrypts with their RSA private key → recovers K
 *   5. Revocation = remove user's entry from header (no re-encryption)
 *
 * DEPENDS ON: Node.js built-in 'crypto' only (no npm install needed)
 * ============================================================
 */

const crypto = require('crypto');

/**
 * Build a broadcast header for a set of authorized users.
 *
 * @param {Buffer} aesKey        - The AES-256 key to protect (32 bytes)
 * @param {Array}  authorizedUsers - Array of { userId, publicKey } objects
 *                                   publicKey must be RSA PEM format
 * @returns {Object} broadcastHeader - { userId: base64EncryptedKey, ... }
 *
 * Example:
 *   const header = buildBroadcastHeader(K, [
 *     { userId: 'doc_bob',   publicKey: '-----BEGIN RSA PUBLIC KEY-----...' },
 *     { userId: 'doc_carol', publicKey: '-----BEGIN RSA PUBLIC KEY-----...' }
 *   ]);
 *   // Returns: { doc_bob: "X9kL3m...", doc_carol: "7hN2wQ..." }
 */
function buildBroadcastHeader(aesKey, authorizedUsers) {
    if (!Buffer.isBuffer(aesKey) || aesKey.length !== 32) {
        throw new Error('aesKey must be a 32-byte Buffer');
    }
    if (!Array.isArray(authorizedUsers) || authorizedUsers.length === 0) {
        throw new Error('authorizedUsers must be a non-empty array');
    }

    const header = {};

    for (const user of authorizedUsers) {
        if (!user.userId || !user.publicKey) {
            console.warn(`Skipping user with missing userId or publicKey`);
            continue;
        }
        try {
            const encryptedKey = crypto.publicEncrypt(
                user.publicKey,
                aesKey
            );
            header[user.userId] = encryptedKey.toString('base64');
        } catch (err) {
            console.error(`Failed to encrypt key for ${user.userId}:`, err.message);
        }
    }

    return header;
}

/**
 * Recover the AES key from a broadcast header using a private key.
 * Called on the DOCTOR/USER side after receiving ACCESS_GRANTED.
 *
 * @param {string} encryptedKeyBase64 - The user's encrypted key from the header
 * @param {string} privateKeyPem      - RSA private key in PEM format
 * @returns {Buffer} The original AES key K (32 bytes)
 *
 * Example:
 *   const K = recoverKeyFromHeader(
 *     accessResult.encryptedKeyForYou,
 *     doctor.privateKey
 *   );
 */
function recoverKeyFromHeader(encryptedKeyBase64, privateKeyPem) {
    if (!encryptedKeyBase64) {
        throw new Error('No encrypted key provided — user may be revoked');
    }
    if (!privateKeyPem) {
        throw new Error('Private key is required to recover AES key');
    }

    const encryptedKeyBuffer = Buffer.from(encryptedKeyBase64, 'base64');
    return crypto.privateDecrypt(privateKeyPem, encryptedKeyBuffer);
}

/**
 * Add a new user to an existing broadcast header.
 * Called when a new doctor is added to an authorized set.
 *
 * @param {Object} existingHeader  - Current broadcast header object
 * @param {string} newUserId       - The new user's ID
 * @param {string} newUserPublicKey - The new user's RSA public key (PEM)
 * @param {Buffer} aesKey          - The original AES key K
 * @returns {Object} Updated broadcast header
 */
function addUserToHeader(existingHeader, newUserId, newUserPublicKey, aesKey) {
    const updatedHeader = { ...existingHeader };
    const encryptedKey = crypto.publicEncrypt(newUserPublicKey, aesKey);
    updatedHeader[newUserId] = encryptedKey.toString('base64');
    return updatedHeader;
}

/**
 * Remove a user from a broadcast header (revocation).
 * This is the KEY ADVANTAGE of broadcast encryption:
 * revoke without re-encrypting the file.
 *
 * @param {Object} existingHeader - Current broadcast header object
 * @param {string} revokedUserId  - The user to remove
 * @returns {Object} Updated broadcast header without the revoked user
 */
function revokeUserFromHeader(existingHeader, revokedUserId) {
    const updatedHeader = { ...existingHeader };

    if (!updatedHeader[revokedUserId]) {
        console.warn(`User ${revokedUserId} not found in broadcast header`);
        return updatedHeader;
    }

    delete updatedHeader[revokedUserId];
    return updatedHeader;
}

/**
 * Check if a user is in the broadcast header (authorized set).
 *
 * @param {Object} broadcastHeader - The broadcast header object
 * @param {string} userId          - User to check
 * @returns {boolean}
 */
function isUserAuthorized(broadcastHeader, userId) {
    return !!(broadcastHeader && broadcastHeader[userId]);
}

/**
 * Get the list of authorized user IDs from a header.
 *
 * @param {Object} broadcastHeader
 * @returns {string[]} Array of user IDs currently in authorized set
 */
function getAuthorizedUsers(broadcastHeader) {
    return Object.keys(broadcastHeader || {});
}

module.exports = {
    buildBroadcastHeader,
    recoverKeyFromHeader,
    addUserToHeader,
    revokeUserFromHeader,
    isUserAuthorized,
    getAuthorizedUsers
};