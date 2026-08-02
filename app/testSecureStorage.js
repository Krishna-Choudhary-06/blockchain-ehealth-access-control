const fs = require("fs");

const {
    encryptFile,
    decryptFile
} = require("./services/cryptoService");

const {
    uploadFile,
    downloadFile
} = require("./services/ipfsService");

async function main() {

    const fileBuffer = fs.readFileSync("sample.pdf");

    const {
        encryptedData,
        key,
        iv
    } = encryptFile(fileBuffer);

    console.log("File Encrypted");

    const cid =
        await uploadFile(encryptedData);

    console.log("Stored CID:", cid);

    const downloaded =
        await downloadFile(cid);

    const original =
        decryptFile(
            downloaded,
            key,
            iv
        );

    fs.writeFileSync(
        "recovered.pdf",
        original
    );

    console.log(
        "Recovered PDF Saved"
    );
}

main();