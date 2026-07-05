'use strict';

const crypto = require('crypto');
const cryptoService = require('./services/cryptoService');
const fabricService = require('./services/fabricService');

async function main() {
    const suffix = Date.now().toString().slice(-6);
    const doctorId = `doctor_paper_${suffix}`;
    const patientId = `patient_paper_${suffix}`;
    const dataId = `record_paper_${suffix}`;

    const { publicKey, masterSecret } = await cryptoService.setupBroadcast(20);
    const doctorSk = await cryptoService.generateBroadcastPrivateKey(masterSecret, 1, publicKey);

    const envelope = await cryptoService.encryptFileForRecipients(
        Buffer.from('PAPER WORKFLOW: prescription payload'),
        publicKey,
        [1],
        {
            dataId,
            patientId,
            level: 'L0',
            category: 'prescription',
            filename: 'prescription.txt',
            mimetype: 'text/plain'
        }
    );

    const recovered = await cryptoService.decryptBroadcastFile(envelope, publicKey, doctorSk);
    if (recovered.toString() !== 'PAPER WORKFLOW: prescription payload') {
        throw new Error('BGW decrypt mismatch');
    }

    await fabricService.registerUser(doctorId, 'paper-smoke-public-key', 'Doctor');
    await fabricService.assignLevel(doctorId, 'L0');

    const envelopeBytes = Buffer.from(JSON.stringify(envelope));
    const payloadHash = crypto.createHash('sha256').update(envelopeBytes).digest('hex');

    await fabricService.storeHash(
        dataId,
        patientId,
        `bafy-paper-smoke-${suffix}`,
        JSON.stringify(envelope.bgwHeader),
        'L0',
        [doctorId],
        payloadHash,
        'prescription',
        {
            filename: 'prescription.txt',
            smoke: true
        }
    );

    const access = await fabricService.requestAccess(doctorId, dataId);
    if (access.status !== 'ACCESS_GRANTED') {
        throw new Error(`Expected ACCESS_GRANTED, got ${access.status}`);
    }

    console.log(JSON.stringify({
        ok: true,
        doctorId,
        dataId,
        bgw: 'round-trip-ok',
        fabric: access.status,
        payloadHash: access.payloadHash
    }, null, 2));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
