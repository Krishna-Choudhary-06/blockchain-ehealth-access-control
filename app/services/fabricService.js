'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const ccpPath = path.resolve(
    process.env.HOME,
    'fabric-samples', 'test-network', 'organizations',
    'peerOrganizations', 'org1.example.com',
    'connection-org1.json'
);

const walletPath = path.join(process.cwd(), 'wallet');

async function getContract() {
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'appUser',
        discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork('healthchannel');
    const contract = network.getContract('healthcontract');

    return { contract, gateway };
}

async function registerUser(userId, publicKey, role) {
    const { contract, gateway } = await getContract();
    try {
        const result = await contract.submitTransaction(
            'UserRegistry:registerUser', userId, publicKey, role
        );
        return JSON.parse(result.toString());
    } finally {
        gateway.disconnect();
    }
}

async function assignLevel(userId, level) {
    const { contract, gateway } = await getContract();
    try {
        const result = await contract.submitTransaction(
            'PrivacyLevel:assignLevel', userId, level
        );
        return JSON.parse(result.toString());
    } finally {
        gateway.disconnect();
    }
}

async function storeHash(dataId, patientId, ipfsHash, iv, level) {
    const { contract, gateway } = await getContract();
    try {
        const result = await contract.submitTransaction(
            'DataStorage:storeHash', dataId, patientId, ipfsHash, iv, level
        );
        return JSON.parse(result.toString());
    } finally {
        gateway.disconnect();
    }
}

async function requestAccess(requesterId, dataId) {
    const { contract, gateway } = await getContract();
    try {
        const result = await contract.submitTransaction(
            'DataAccess:requestAccess', requesterId, dataId
        );
        return JSON.parse(result.toString());
    } finally {
        gateway.disconnect();
    }
}

async function getLogs() {
    const { contract, gateway } = await getContract();
    try {
        const result = await contract.evaluateTransaction(
            'DataAccess:getLogs'
        );
        return JSON.parse(result.toString());
    } finally {
        gateway.disconnect();
    }
}

module.exports = {
    registerUser,
    assignLevel,
    storeHash,
    requestAccess,
    getLogs
};
