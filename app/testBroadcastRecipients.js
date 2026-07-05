'use strict';

const cryptoService = require('./services/cryptoService');

async function main() {
    console.log('=== BGW Broadcast Test ===');

    const { publicKey, masterSecret } =
        await cryptoService.setupBroadcast(20);

    const recipientIds = [1, 2, 3, 4, 5];

    const privateKeys = {};

    for (const id of recipientIds) {
        privateKeys[id] =
            await cryptoService.generateBroadcastPrivateKey(
                masterSecret,
                id,
                publicKey
            );
    }

    const plaintext = Buffer.from(
        'BGW BROADCAST TEST MESSAGE'
    );

    const envelope =
        await cryptoService.encryptFileForRecipients(
            plaintext,
            publicKey,
            recipientIds,
            {
                dataId: 'broadcast-test',
                patientId: 'patient-test',
                level: 'L0',
                category: 'test',
                filename: 'broadcast.txt',
                mimetype: 'text/plain'
            }
        );

    let allPassed = true;

    for (const id of recipientIds) {
        const recovered =
            await cryptoService.decryptBroadcastFile(
                envelope,
                publicKey,
                privateKeys[id]
            );

        const pass =
            recovered.toString() === plaintext.toString();

        console.log(`User ${id}: ${pass ? 'PASS' : 'FAIL'}`);

        if (!pass) {
            allPassed = false;
        }
    }

    console.log(
        '\nBroadcast Result:',
        allPassed ? 'PASS' : 'FAIL'
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});