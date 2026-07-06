import React, { useState } from 'react';
import axios from 'axios';
import bgw from './bgw/index'; // Your BGW library!

export default function RecordViewer() {
    const [decryptedText, setDecryptedText] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // In a real app, the doctor logs in and you load their private key from localStorage or a secure context
    // For this test, we paste the exact privateKey JSON object you received when you registered doc_002
    const doctorPrivateKey = {
        "scheme": "BGW05",
        "curve": "BLS12-381",
        "n": 100,
        "recipientId": 3,
        "d": "8efd070a71d69368dfb6a6a0f31da53582467ea40ef5f3d17aeef123a5df761f7be8ad136c15175806431004a46ab3d8"
    };

    async function handleDecryptRecord() {
        setLoading(true);
        setErrorMsg("");
        setDecryptedText("");

        try {
            console.log("1. Requesting Access from Blockchain...");
            const accessRes = await axios.post('http://localhost:3000/api/access', {
                requesterId: 'doc_002',
                dataId: 'record_abc124'
            });

            if (accessRes.data.data.status !== 'ACCESS_GRANTED') {
                throw new Error("Access Denied by Smart Contract! " + (accessRes.data.data.message || ""));
            }

            const { ipfsHash, broadcastHeader } = accessRes.data.data;

            console.log("2. Fetching BGW Public Parameters & IPFS File...");
            // Run both network requests in parallel for speed!
            const [pkRes, ipfsRes] = await Promise.all([
                axios.get('http://localhost:3000/api/public-key'),
                axios.get(`http://localhost:3000/api/download/${ipfsHash}`)
            ]);

            const bgwPK = pkRes.data.publicKey;
            const encryptedPayload = ipfsRes.data;

            console.log("3. Performing In-Browser BLS12-381 Decryption...");
            // This happens entirely on the client's CPU! The backend never sees the plaintext.
            const decryptedBuffer = await bgw.decrypt(
                bgwPK, 
                broadcastHeader, 
                doctorPrivateKey, 
                encryptedPayload
            );

            // Convert the decrypted raw bytes back into text
            const text = new TextDecoder().decode(decryptedBuffer);
            setDecryptedText(text);
            console.log("✅ Decryption Successful!");

        } catch (error) {
            console.error("Decryption failed:", error);
            setErrorMsg(error.message || "Cryptographic pairing failed. Are you authorized?");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
            <h2>🩺 Medical Record Viewer</h2>
            <p>Simulating True Client-Side BGW Decryption</p>
            
            <button 
                onClick={handleDecryptRecord}
                disabled={loading}
                style={{ 
                    padding: '10px 20px', 
                    fontSize: '16px', 
                    backgroundColor: loading ? '#ccc' : '#007bff', 
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? "Decrypting mathematically..." : "Unlock Record with BGW"}
            </button>
            
            {errorMsg && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#f8d7da', color: '#721c24', borderRadius: '5px' }}>
                    <strong>Error:</strong> {errorMsg}
                </div>
            )}

            {decryptedText && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#d4edda', color: '#155724', borderRadius: '5px' }}>
                    <strong>Decrypted Content:</strong>
                    <p style={{ marginTop: '10px', fontSize: '18px' }}>{decryptedText}</p>
                </div>
            )}
        </div>
    );
}
