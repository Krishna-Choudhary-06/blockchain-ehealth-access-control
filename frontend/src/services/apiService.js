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

export const setupBGW = async (maxUsers) => {
    const res = await axios.post(`${API_BASE_URL}/bgw/setup`, { maxUsers });
    return res.data;
};

export const getBGWState = async () => {
    const res = await axios.get(`${API_BASE_URL}/bgw/state`);
    return res.data;
};

export const generateBGWPrivateKey = async (recipientId, masterSecret, publicKey) => {
    const res = await axios.post(`${API_BASE_URL}/bgw/keygen`, {
        recipientId,
        masterSecret,
        publicKey
    });
    return res.data;
};

export const uploadRecord = async (patientId, dataId, level, file, options = {}) => {
    const formData = new FormData();
    formData.append('medicalFile', file);
    formData.append('patientId', patientId);
    formData.append('dataId', dataId);
    formData.append('level', level);
    formData.append('category', options.category || '');
    formData.append('ownerId', options.ownerId || '');
    formData.append('uploadedBy', options.uploadedBy || '');
    formData.append('uploaderRole', options.uploaderRole || '');
    formData.append('recipientIds', JSON.stringify(options.recipientIds || []));
    formData.append('authorizedUsers', JSON.stringify(options.authorizedUsers || []));
    if (options.bgwPublicKey) {
        formData.append('bgwPublicKey', JSON.stringify(options.bgwPublicKey));
    }

    const res = await axios.post(`${API_BASE_URL}/upload`, formData);
    return res.data;
};

export const requestAccess = async (requesterId, dataId) => {
    const res = await axios.post(`${API_BASE_URL}/access`, { requesterId, dataId });
    return res.data;
};

export const requestAccessAndDecrypt = async (requesterId, dataId, privateKey, publicKey) => {
    const res = await axios.post(`${API_BASE_URL}/access/decrypt`, {
        requesterId,
        dataId,
        privateKey,
        publicKey
    });
    return res.data;
};

export const getUsers = async () => {
    const res = await axios.get(`${API_BASE_URL}/users`);
    return res.data;
};

export const getDataRecords = async () => {
    const res = await axios.get(`${API_BASE_URL}/data`);
    return res.data;
};

export const getLogs = async () => {
    const res = await axios.get(`${API_BASE_URL}/logs`);
    return res.data;
};
