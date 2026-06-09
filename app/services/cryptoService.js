const crypto = require("crypto");

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

module.exports = {
    encryptFile,
    decryptFile
};