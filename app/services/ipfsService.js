async function getIPFS() {
    const { create } = await import("ipfs-http-client");

    return create({
        host: "127.0.0.1",
        port: 5001,
        protocol: "http"
    });
}

async function uploadFile(data) {
    const ipfs = await getIPFS();

    const result = await ipfs.add(data);

    return result.cid.toString();
}

async function downloadFile(cid) {
    const ipfs = await getIPFS();

    const chunks = [];

    for await (const chunk of ipfs.cat(cid)) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}

module.exports = {
    uploadFile,
    downloadFile
};