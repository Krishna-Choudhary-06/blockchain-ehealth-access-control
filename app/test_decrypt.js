const axios = require('axios');
const bgw = require('./bgw/index.js');
const fs = require('fs');

// IMPORTANT: Paste the exact privateKey JSON object you received when you registered doc_002!
const doctorPrivateKey = {
    "scheme": "BGW05",
    "curve": "BLS12-381",
    "n": 100,
    "recipientId": 3,
    "d": "8efd070a71d69368dfb6a6a0f31da53582467ea40ef5f3d17aeef123a5df761f7be8ad136c15175806431004a46ab3d8"
};

// We need the Public Parameters (PK). In a real app, the backend publishes this.
// For this test, we will temporarily re-run setup with a fixed seed, or you can just fetch it.
// To keep the test simple, we assume you have access to the same PK.
// (In production, PK is public and downloaded by the client once).

async function runDoctorTest() {
    console.log("1. Doctor requests access to record_abc124...");
    
    const accessRes = await axios.post('http://localhost:3000/api/access', {
        requesterId: 'doc_002',
        dataId: 'record_abc124'
    });

    const accessData = accessRes.data.data;
    if (accessData.status !== 'ACCESS_GRANTED') {
        console.error("Access denied!", accessData);
        return;
    }

    console.log("✅ ACCESS GRANTED!");
    console.log("   IPFS Hash:", accessData.ipfsHash);
    console.log("   BGW Header Authorized Users:", accessData.authorizedUsers);

    console.log("\n2. Doctor downloads encrypted file from IPFS...");
    // Since we are running this inside the app folder, we can use the local ipfsService to fetch it
    const ipfsService = require('./services/ipfsService');
    const encryptedJsonBuffer = await ipfsService.downloadFile(accessData.ipfsHash);
    const encryptedPayload = JSON.parse(encryptedJsonBuffer.toString());

    console.log("✅ File downloaded from IPFS!");

    console.log("\n3. Doctor performs Local BGW Decryption using their Private Key...");
    
    // We need the Public Key to decrypt. Let's initialize BGW to get it (assuming same params for test)
    // Note: In real life, frontend downloads `bgwPK` from a public endpoint like `/api/public-key`.
    // Since we didn't add a /api/public-key endpoint, we'll temporarily hack it by requiring the server's PK
    // But actually, we don't have access to it directly from another process without an endpoint.
    
    // Let's add a quick fetch to a public key endpoint. (You'll need to add this endpoint to server.js)
    try {
        const pkRes = await axios.get('http://localhost:3000/api/public-key');
        const bgwPK = pkRes.data.publicKey;

        const decryptedBuffer = await bgw.decrypt(
            bgwPK, 
            accessData.broadcastHeader, 
            doctorPrivateKey, 
            encryptedPayload
        );

        console.log("🎉 SUCCESS! Decrypted Medical Record:");
        console.log("---------------------------------------------------");
        console.log(decryptedBuffer.toString());
        console.log("---------------------------------------------------");

    } catch (err) {
        console.error("Decryption failed:", err.message);
    }
}

runDoctorTest();
