const fs = require('fs');
const cryptoService = require('./services/cryptoService');

async function main() {
    console.log('\n=== BGW Dynamic Recipient Test ===\n');

    const state = JSON.parse(
        fs.readFileSync('./app/data/bgw-state.json', 'utf8')
    );

    const publicKey = state.publicKey;
    const masterSecret = state.masterSecret;

    const recipient8Sk =
        await cryptoService.generateBroadcastPrivateKey(
            masterSecret,
            8,
            publicKey
        );

    const recipient15Sk =
        await cryptoService.generateBroadcastPrivateKey(
            masterSecret,
            15,
            publicKey
        );

    const plaintext =
        Buffer.from('Healthcare Record: Patient ABC');

    const envelope =
        await cryptoService.encryptFileForRecipients(
            plaintext,
            publicKey,
            [8, 11]
        );

    console.log('Original recipients:', envelope.bgwHeader.recipientIds);

    //
    // User 15 BEFORE ADD
    //
    try {
        await cryptoService.decryptBroadcastFile(
            envelope,
            publicKey,
            recipient15Sk
        );

        console.log('❌ User 15 should NOT decrypt');
    } catch (err) {
        console.log('✅ User 15 blocked before addition');
    }

    //
    // ADD USER 15
    //
    const updatedHeader =
        await cryptoService.updateBroadcastRecipients(
            publicKey,
            envelope.bgwHeader,
            [8, 11, 15],
            envelope.updateToken
        );

    envelope.bgwHeader = updatedHeader;
    const bgw = require('./services/broadcast');

const gt8 = bgw.deriveGT(
    publicKey,
    updatedHeader,
    recipient8Sk
);

const gt15 = bgw.deriveGT(
    publicKey,
    updatedHeader,
    recipient15Sk
);

const gt8Hex = gt8.serializeToHexStr();
const gt15Hex = gt15.serializeToHexStr();

console.log("\n=== GT CHECK ===");
console.log("GT8 :", gt8Hex);
console.log("GT15:", gt15Hex);
console.log("Equal:", gt8Hex === gt15Hex);
console.log("================\n");

    console.log(
        'Recipients after add:',
        updatedHeader.recipientIds
    );

    //
    // User 15 AFTER ADD
    //
    try {
        const decrypted =
            await cryptoService.decryptBroadcastFile(
                envelope,
                publicKey,
                recipient15Sk
            );

        console.log(
            '✅ User 15 decrypts after addition:',
            decrypted.toString()
        );
    } catch (err) {
    console.log('❌ User 15 still cannot decrypt');
    console.error(err.message);
}

    //
    // REMOVE USER 15
    //
    const removedHeader =
        await cryptoService.updateBroadcastRecipients(
            publicKey,
            envelope.bgwHeader,
            [8, 11],
            envelope.updateToken
        );

    envelope.bgwHeader = removedHeader;

    console.log(
        'Recipients after removal:',
        removedHeader.recipientIds
    );

    //
    // User 15 AFTER REMOVE
    //
    try {
        await cryptoService.decryptBroadcastFile(
            envelope,
            publicKey,
            recipient15Sk
        );

        console.log(
            '❌ User 15 should have been revoked'
        );
    } catch (err) {
        console.log(
            '✅ User 15 blocked after removal'
        );
    }

    //
    // User 8 STILL WORKS
    //
    const finalData =
        await cryptoService.decryptBroadcastFile(
            envelope,
            publicKey,
            recipient8Sk
        );

    console.log(
        '✅ User 8 still decrypts:',
        finalData.toString()
    );
}

main().catch(console.error);