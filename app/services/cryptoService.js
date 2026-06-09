const crypto = require("crypto");
const {
    publicEncrypt,
    privateDecrypt
} = require("crypto");

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
function encryptKeyForUser(
    symmetricKey,
    publicKey
) {

    const encryptedKey =
        publicEncrypt(
            publicKey,
            Buffer.from(symmetricKey)
        );

    return encryptedKey.toString("base64");
}

function decryptKeyForUser(
    encryptedKey,
    privateKey
) {

    const decryptedKey =
        privateDecrypt(
            privateKey,
            Buffer.from(
                encryptedKey,
                "base64"
            )
        );

    return decryptedKey.toString();
}
module.exports = {
    encryptFile,
    decryptFile,
    encryptKeyForUser,
    decryptKeyForUser
};