import axios from 'axios';

const IPFS_API_URL = 'http://127.0.0.1:5001/api/v0';

// In-memory mock storage for testing and offline fallback
export const mockIpfsStorage = new Map();

/**
 * Caches content locally in mock storage for offline/robust fallback
 */
export function cacheMockIpfs(cid, data) {
  mockIpfsStorage.set(cid, data);
}


/**
 * Uploads a file buffer (or blob) to IPFS.
 * Falls back to an in-memory client-side registry if the local IPFS daemon is not running.
 * @param {ArrayBuffer|Blob|Uint8Array} data 
 * @returns {Promise<string>} IPFS Content Identifier (CID)
 */
export async function uploadFile(data) {
  try {
    const formData = new FormData();
    const blob = data instanceof Blob ? data : new Blob([data]);
    formData.append('file', blob);

    // Make request to local IPFS daemon
    const response = await axios.post(`${IPFS_API_URL}/add`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 1000 // Small timeout so fallback is fast if not running
    });

    const cid = response.data.Hash;
    if (cid) {
      mockIpfsStorage.set(cid, data);
      return cid;
    }
  } catch (error) {
    console.warn("Failed to connect to local IPFS daemon. Falling back to mock client-side IPFS registry.", error.message);
  }

  // Fallback mock implementation
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const mockCid = 'Qm' + Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  mockIpfsStorage.set(mockCid, data);
  return mockCid;
}

/**
 * Downloads a file buffer from IPFS by its CID.
 * Retrieves from the client-side fallback storage or contacts the local daemon.
 * @param {string} cid 
 * @returns {Promise<ArrayBuffer>} decrypted/raw data buffer
 */
export async function downloadFile(cid) {
  // Check mock storage first to resolve mock uploads
  if (mockIpfsStorage.has(cid)) {
    const data = mockIpfsStorage.get(cid);
    if (data instanceof ArrayBuffer) {
      return data;
    } else if (data instanceof Blob) {
      return await data.arrayBuffer();
    } else if (data instanceof Uint8Array) {
      return data.buffer;
    } else if (typeof data === 'string') {
      const enc = new TextEncoder();
      return enc.encode(data).buffer;
    }
    // Generic fallback
    return new Blob([data]).arrayBuffer();
  }

  // Try retrieving via backend proxy first
  try {
    const response = await axios.get(`http://localhost:3000/api/ipfs/${cid}`, {
      responseType: 'arraybuffer',
      timeout: 2000
    });
    if (response.data) return response.data;
  } catch (backendErr) {
    console.warn(`Backend IPFS proxy endpoint failed or unavailable. Falling back to local daemon: ${backendErr.message}`);
  }

  // Fallback to local IPFS daemon directly
  try {
    const response = await axios.post(`${IPFS_API_URL}/cat?arg=${cid}`, null, {
      responseType: 'arraybuffer',
      timeout: 2000
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to retrieve CID ${cid} from local IPFS daemon or mock registry.`, error.message);
    throw new Error(`CID ${cid} could not be retrieved. Connection error: ${error.message}`);
  }
}
