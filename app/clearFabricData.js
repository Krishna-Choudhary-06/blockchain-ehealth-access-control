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
const walletPath = path.join(__dirname, 'wallet');

async function clearAll() {
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'appUser3',
        discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('ehr-registration-v3');

    const namespaces = [
        { contract: 'UserRegistry', label: 'USER (registrations)' },
        { contract: 'PrivacyLevel', label: 'ACL (privacy levels)' },
        { contract: 'DataStorage', label: 'DATA (records)' },
        { contract: 'DataAccess', label: 'LOG (access logs)' }
    ];

    for (const ns of namespaces) {
        try {
            const result = await contract.submitTransaction(`${ns.contract}:wipeAll`);
            const parsed = JSON.parse(result.toString());
            console.log(`Cleared ${ns.label}: ${parsed.deleted} entries deleted`);
        } catch (err) {
            console.error(`Failed to clear ${ns.label}:`, err.message);
        }
    }

    gateway.disconnect();
    console.log('Fabric ledger cleanup complete.');
}

clearAll().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
