import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const registerUser = async (userId, publicKey, role) => {
    const res = await axios.post(`${API_BASE_URL}/register`, { userId, publicKey, role });
    return res.data;
};

export const assignLevel = async (userId, level) => {
    const res = await axios.post(`${API_BASE_URL}/assign-level`, { userId, level });
    return res.data;
};

export const uploadRecord = async (patientId, dataId, level, file, authorizedUsers = []) => {
    const formData = new FormData();
    formData.append('medicalFile', file);
    formData.append('patientId', patientId);
    formData.append('dataId', dataId);
    formData.append('level', level);
    if (authorizedUsers && authorizedUsers.length > 0) {
        formData.append('authorizedUsers', JSON.stringify(authorizedUsers));
    }

    const res = await axios.post(`${API_BASE_URL}/upload`, formData);
    return res.data;
};

export const requestAccess = async (requesterId, dataId) => {
    const res = await axios.post(`${API_BASE_URL}/access`, { requesterId, dataId });
    return res.data;
};

export const getLogs = async () => {
    const res = await axios.get(`${API_BASE_URL}/logs`);
    return res.data;
};

export const getSystemStats = async () => {
    const res = await axios.get(`${API_BASE_URL}/health`);
    return res.data;
};

export const getPublicKey = async () => {
    const res = await axios.get(`${API_BASE_URL}/public-key`);
    return res.data;
};

export const downloadRecord = async (ipfsHash) => {
    const res = await axios.get(`${API_BASE_URL}/download/${ipfsHash}`, {
        responseType: 'arraybuffer'
    });
    return res.data;
};

export const revokeAccess = async (dataId, revokedUserId) => {
    const res = await axios.post(`${API_BASE_URL}/revoke`, { dataId, revokedUserId });
    return res.data;
};

export const addAuthorizedUser = async (dataId, currentUsers, newUsers) => {
    const res = await axios.post(`${API_BASE_URL}/add-authorized`, { dataId, currentUsers, newUsers });
    return res.data;
};
