const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    const wallet = await Wallets.newFileSystemWallet('./wallet');

    const certPath = path.join(
        process.env.HOME,
        'fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem'
    );

    const keyDir = path.join(
        process.env.HOME,
        'fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore'
    );

    const keyFile = fs.readdirSync(keyDir)[0];

    const cert = fs.readFileSync(certPath).toString();
    const key = fs.readFileSync(path.join(keyDir, keyFile)).toString();

    const identity = {
        credentials: {
            certificate: cert,
            privateKey: key
        },
        mspId: 'Org1MSP',
        type: 'X.509'
    };

    await wallet.put('admin', identity);

    console.log('Admin imported successfully');
}

main();