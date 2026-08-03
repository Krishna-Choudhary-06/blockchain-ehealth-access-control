const {
    uploadFile,
    downloadFile
} = require("./services/ipfsService");

async function main() {
    const cid = await uploadFile(
        Buffer.from("Hello Kritika")
    );

    console.log("CID:", cid);

    const data = await downloadFile(cid);

    console.log("Downloaded:", data.toString());
}

main();