const crypto = require("crypto");
const bgw = require("./broadcast");

function encryptFile(fileBuffer) {

    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        key,
        iv
    );

    const encryptedData = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
    ]);

    return {
        encryptedData,
        key: key.toString("hex"),
        iv: iv.toString("hex")
    };
}

function decryptFile(
    encryptedData,
    keyHex,
    ivHex
) {

    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(keyHex, "hex"),
        Buffer.from(ivHex, "hex")
    );

    const decryptedData = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
    ]);

    return decryptedData;
}

async function setupBroadcast(maxUsers) {
    return bgw.setup({ n: Number(maxUsers || 100) });
}

async function generateBroadcastPrivateKey(masterSecret, recipientId, publicKey) {
    return bgw.keygen(masterSecret, Number(recipientId), publicKey);
}

async function encryptFileForRecipients(fileBuffer, publicKey, recipientIds, options = {}) {
    await bgw.init();

    return bgw.encryptForIpfs(
        publicKey,
        recipientIds.map(Number),
        fileBuffer,
        {
            exportUpdateToken: true,
            fabricAssetId: options.dataId,
            ipfsCid: options.ipfsCid,
            metadata: {
                patientId: options.patientId,
                level: options.level,
                category: options.category,
                filename: options.filename,
                mimetype: options.mimetype,
                ownerId: options.ownerId,
                uploadedBy: options.uploadedBy,
                uploaderRole: options.uploaderRole,
                createdAt: new Date().toISOString()
            }
        }
    );
}

async function decryptBroadcastFile(envelope, publicKey, privateKey) {
    await bgw.init();

    return bgw.decryptFromIpfsEnvelope(publicKey, privateKey, envelope);
}

async function updateBroadcastRecipients(publicKey, header, nextRecipientIds, updateToken) {
    return bgw.updateHeader(
        publicKey,
        header,
        nextRecipientIds.map(Number),
        { updateToken }
    );
}

function encryptKeyForUser() {
    throw new Error("RSA key sharing has been removed. Use BGW broadcast encryption instead.");
}

function decryptKeyForUser() {
    throw new Error("RSA key sharing has been removed. Use BGW broadcast encryption instead.");
}

function shareKeyWithUsers() {
    throw new Error("RSA key sharing has been removed. Use BGW broadcast encryption instead.");
}

function revokeUserAccess() {
    throw new Error("RSA key sharing has been removed. Use BGW updateHeader or re-encrypt.");
}

function generateUserKeyPair() {
    throw new Error("RSA key pairs are not used by BGW. Call generateBroadcastPrivateKey instead.");
}
module.exports = {
    encryptFile,
    decryptFile,
    setupBroadcast,
    generateBroadcastPrivateKey,
    encryptFileForRecipients,
    decryptBroadcastFile,
    updateBroadcastRecipients,
    encryptKeyForUser,
    decryptKeyForUser,
    shareKeyWithUsers,
    revokeUserAccess,
    generateUserKeyPair
};
