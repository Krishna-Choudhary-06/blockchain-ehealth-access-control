'use strict';

const cryptoService = require('./services/cryptoService');

async function main() {
    console.log('=== BGW Unauthorized User Test ===');

    const { publicKey, masterSecret } = await cryptoService.setupBroadcast(20);

    const user1Sk = await cryptoService.generateBroadcastPrivateKey(
        masterSecret,
        1,
        publicKey
    );

    const user2Sk = await cryptoService.generateBroadcastPrivateKey(
        masterSecret,
        2,
        publicKey
    );

    const user3Sk = await cryptoService.generateBroadcastPrivateKey(
        masterSecret,
        3,
        publicKey
    );

    const user4Sk = await cryptoService.generateBroadcastPrivateKey(
        masterSecret,
        4,
        publicKey
    );

    const plaintext = Buffer.from(
        'BGW TEST: only users 1,2,3 should decrypt'
    );

    const envelope = await cryptoService.encryptFileForRecipients(
        plaintext,
        publicKey,
        [1, 2, 3],
        {
            dataId: 'test-record',
            patientId: 'test-patient',
            level: 'L0',
            category: 'test',
            filename: 'test.txt',
            mimetype: 'text/plain'
        }
    );

    // Authorized users
    for (const [id, sk] of [
        [1, user1Sk],
        [2, user2Sk],
        [3, user3Sk]
    ]) {
        const recovered = await cryptoService.decryptBroadcastFile(
            envelope,
            publicKey,
            sk
        );

        console.log(
            `User ${id}:`,
            recovered.toString() === plaintext.toString()
                ? 'PASS'
                : 'FAIL'
        );
    }

    // Unauthorized user
    try {
        await cryptoService.decryptBroadcastFile(
            envelope,
            publicKey,
            user4Sk
        );

        console.log('User 4: FAIL (unauthorized decrypt succeeded)');
    } catch (err) {
        console.log('User 4: PASS (access denied)');
        console.log('Reason:', err.message);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});