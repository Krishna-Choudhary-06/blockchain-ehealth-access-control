import React, { useState, useEffect } from 'react';
import axios from 'axios';
import bgw from './bgw/index'; // Your BGW library!

export default function RecordViewer() {
    const [requesterId, setRequesterId] = useState("");
    const [dataId, setDataId] = useState("");
    const [privateKeyInput, setPrivateKeyInput] = useState("");
    
    const [decryptedText, setDecryptedText] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Try to auto-populate the private key from local storage registered identities
    useEffect(() => {
        try {
            const registeredStr = localStorage.getItem('registered_users');
            if (registeredStr) {
                const users = JSON.parse(registeredStr);
                if (users && users.length > 0) {
                    const firstUser = users[0];
                    setRequesterId(firstUser.userId || "");
                    const keysKey = `user_keys_${firstUser.name}`;
                    const keysStr = localStorage.getItem(keysKey);
                    if (keysStr) {
                        const parsed = JSON.parse(keysStr);
                        if (parsed && parsed.privateKey) {
                            setPrivateKeyInput(JSON.stringify(parsed.privateKey, null, 2));
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Failed to auto-populate credentials:', e);
        }
    }, []);

    async function handleDecryptRecord() {
        if (!requesterId || !dataId) {
            setErrorMsg("No record selected");
            return;
        }

        setLoading(true);
        setErrorMsg("");
        setDecryptedText("");

        try {
            let keyObj;
            try {
                keyObj = JSON.parse(privateKeyInput);
            } catch (e) {
                throw new Error("Invalid Private Key JSON format");
            }

            console.log("1. Requesting Access from Blockchain...");
            const accessRes = await axios.post('http://localhost:3000/api/access', {
                requesterId,
                dataId
            });

            if (!accessRes.data || !accessRes.data.data) {
                throw new Error("Invalid response from authorization server");
            }

            if (accessRes.data.data.status !== 'ACCESS_GRANTED') {
                throw new Error("Access Denied by Smart Contract! " + (accessRes.data.data.message || ""));
            }

            const { ipfsHash, broadcastHeader } = accessRes.data.data;

            console.log("2. Fetching BGW Public Parameters & IPFS File...");
            const [pkRes, ipfsRes] = await Promise.all([
                axios.get('http://localhost:3000/api/public-key'),
                axios.get(`http://localhost:3000/api/download/${ipfsHash}`)
            ]);

            const bgwPK = pkRes.data.publicKey;
            const encryptedPayload = ipfsRes.data;

            console.log("3. Performing In-Browser BLS12-381 Decryption...");
            const decryptedBuffer = await bgw.decrypt(
                bgwPK, 
                broadcastHeader, 
                keyObj, 
                encryptedPayload
            );

            const text = new TextDecoder().decode(decryptedBuffer);
            setDecryptedText(text);
            console.log("✅ Decryption Successful!");

        } catch (error) {
            console.error("Decryption failed:", error);
            setErrorMsg(error.response?.data?.message || error.message || "Cryptographic pairing failed. Are you authorized?");
        } finally {
            setLoading(false);
        }
    }

    const hasSelection = requesterId && dataId;

    return (
        <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold' }}>🩺 Medical Record Viewer</h2>
            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>True Client-Side BGW Decryption Sandbox</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>Requester User ID</label>
                    <input 
                        type="text" 
                        value={requesterId}
                        onChange={(e) => setRequesterId(e.target.value)}
                        placeholder="e.g. UID-123456"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>Target Data ID (Record ID)</label>
                    <input 
                        type="text" 
                        value={dataId}
                        onChange={(e) => setDataId(e.target.value)}
                        placeholder="e.g. file_abc123"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>BGW Private Key (JSON)</label>
                    <textarea 
                        rows="6"
                        value={privateKeyInput}
                        onChange={(e) => setPrivateKeyInput(e.target.value)}
                        placeholder='{ "scheme": "BGW05", ... }'
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'monospace', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            {!hasSelection ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic', border: '2px dashed #eee', borderRadius: '8px' }}>
                    No record selected
                </div>
            ) : (
                <button 
                    onClick={handleDecryptRecord}
                    disabled={loading}
                    style={{ 
                        width: '100%',
                        padding: '12px 20px', 
                        fontSize: '15px', 
                        fontWeight: 'bold',
                        backgroundColor: loading ? '#ccc' : '#7c3aed', 
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s'
                    }}
                >
                    {loading ? "Decrypting mathematically..." : "Unlock Record with BGW"}
                </button>
            )}
            
            {errorMsg && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5' }}>
                    <strong>Error:</strong> {errorMsg}
                </div>
            )}

            {decryptedText && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5' }}>
                    <strong>Decrypted Content:</strong>
                    <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: '500', whiteSpace: 'pre-wrap' }}>{decryptedText}</p>
                </div>
            )}
        </div>
    );
}
