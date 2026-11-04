'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

async function main() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const ccpPath = path.resolve(
        homeDir, 'fabric-samples', 'test-network',
        'organizations', 'peerOrganizations', 'org1.example.com',
        'connection-org1.json'
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const ca = new FabricCAServices(caInfo.url, {
        trustedRoots: caInfo.tlsCACerts.pem,
        verify: false
    }, caInfo.caName);

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // 1. Enroll admin
    let adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
        const enrollment = await ca.enroll({
            enrollmentID: 'admin', enrollmentSecret: 'adminpw'
        });
        adminIdentity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes()
            },
            mspId: 'Org1MSP',
            type: 'X.509'
        };
        await wallet.put('admin', adminIdentity);
        console.log('✅ Admin enrolled');
    }

    // 2. Register and enroll appUser
    const userExists = await wallet.get('appUser');
    if (!userExists) {
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        let secret = 'appUserpw';
        try {
            secret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: 'appUser',
                enrollmentSecret: secret,
                role: 'client'
            }, adminUser);
            console.log('Registered appUser with CA');
        } catch (regErr) {
            console.log('appUser was already registered with CA, re-enrolling with credentials...');
        }

        try {
            const enrollment = await ca.enroll({
                enrollmentID: 'appUser', enrollmentSecret: secret
            });
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes()
                },
                mspId: 'Org1MSP',
                type: 'X.509'
            };
            await wallet.put('appUser', x509Identity);
            console.log('✅ appUser enrolled successfully');
        } catch (enrErr) {
            console.log('Enrolling appUser failed with default secret, registering fresh identity...');
            const newUid = 'appUser_' + Date.now();
            const newSecret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: newUid,
                role: 'client'
            }, adminUser);
            const enrollment = await ca.enroll({
                enrollmentID: newUid, enrollmentSecret: newSecret
            });
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes()
                },
                mspId: 'Org1MSP',
                type: 'X.509'
            };
            await wallet.put('appUser', x509Identity);
            console.log(`✅ ${newUid} enrolled and aliased as appUser in wallet`);
        }
    }
}

main().catch(err => {
    console.error('Failed:', err);
    process.exit(1);
});
