import axios from 'axios';

const IPFS_API_URL = 'http://127.0.0.1:5001/api/v0';

/**
 * Uploads a file buffer (or blob) to IPFS.
 * @param {ArrayBuffer|Blob|Uint8Array} data 
 * @returns {Promise<string>} IPFS Content Identifier (CID)
 */
export async function uploadFile(data) {
  const formData = new FormData();
  const blob = data instanceof Blob ? data : new Blob([data]);
  formData.append('file', blob);

  const response = await axios.post(`${IPFS_API_URL}/add`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  const cid = response.data.Hash;
  if (!cid) {
    throw new Error("IPFS upload returned empty CID response");
  }
  return cid;
}

/**
 * Downloads a file buffer from IPFS by its CID.
 * @param {string} cid 
 * @returns {Promise<ArrayBuffer>} data buffer
 */
export async function downloadFile(cid) {
  // Try retrieving via backend proxy first
  try {
    const response = await axios.get(`http://localhost:3000/api/download/${cid}`, {
      responseType: 'arraybuffer'
    });
    if (response.data) return response.data;
  } catch (backendErr) {
    console.warn(`Backend IPFS proxy endpoint failed: ${backendErr.message}`);
  }

  // Fallback to local IPFS daemon directly
  const response = await axios.post(`${IPFS_API_URL}/cat?arg=${cid}`, null, {
    responseType: 'arraybuffer'
  });
  return response.data;
}
