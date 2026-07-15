'use strict';

const crypto = require('crypto');
const cryptoService = require('./services/cryptoService');
const fabricService = require('./services/fabricService');
const ipfsService = require('./services/ipfsService');

async function main() {
    const suffix = Date.now().toString().slice(-6);
    const doctorId = `doctor_full_${suffix}`;
    const unauthorizedDoctorId = `doctor_denied_${suffix}`;
    const patientId = `patient_full_${suffix}`;
    const dataId = `record_full_${suffix}`;
    const plaintext = Buffer.from('FULL WORKFLOW: BGW + IPFS + Fabric prescription payload');

    const { publicKey, masterSecret } = await cryptoService.setupBroadcast(20);
    const doctorSk = await cryptoService.generateBroadcastPrivateKey(masterSecret, 1, publicKey);

    const envelope = await cryptoService.encryptFileForRecipients(
        plaintext,
        publicKey,
        [1],
        {
            dataId,
            patientId,
            level: 'L0',
            category: 'prescription',
            filename: 'full-prescription.txt',
            mimetype: 'text/plain'
        }
    );

    const envelopeBytes = Buffer.from(JSON.stringify(envelope));
    const payloadHash = crypto.createHash('sha256').update(envelopeBytes).digest('hex');
    const cid = await ipfsService.uploadFile(envelopeBytes);

    await fabricService.registerUser(doctorId, 'full-smoke-public-key', 'Doctor');
    await fabricService.assignLevel(doctorId, 'L0');
    await fabricService.registerUser(
    unauthorizedDoctorId,
    'unauthorized-public-key',
    'Doctor'
);

await fabricService.assignLevel(
    unauthorizedDoctorId,
    'L0'
);
    await fabricService.storeHash(
        dataId,
        patientId,
        cid,
        JSON.stringify(envelope.bgwHeader),
        envelope.updateToken || '',
        'L0',
        [doctorId],
        payloadHash,
        'prescription',
        {
            filename: 'full-prescription.txt',
            smoke: true
        }
    );

    const access = await fabricService.requestAccess(doctorId, dataId);
    const deniedAccess =
    await fabricService.requestAccess(
        unauthorizedDoctorId,
        dataId
    );
    if (deniedAccess.status !== 'ACCESS_DENIED') {
    throw new Error(
        `Expected ACCESS_DENIED, got ${deniedAccess.status}`
    );
}

console.log(
    'Unauthorized:',
    deniedAccess
);
    if (access.status !== 'ACCESS_GRANTED') {
        throw new Error(`Expected ACCESS_GRANTED, got ${access.status}`);
    }

    const fetched = await ipfsService.downloadFile(access.ipfsHash);
    const fetchedHash = crypto.createHash('sha256').update(fetched).digest('hex');
    if (fetchedHash !== access.payloadHash) {
        throw new Error('IPFS payload hash mismatch');
    }

    const fetchedEnvelope = JSON.parse(fetched.toString('utf8'));
    const recovered = await cryptoService.decryptBroadcastFile(
        fetchedEnvelope,
        publicKey,
        doctorSk
    );
    if (!recovered.equals(plaintext)) {
        throw new Error('Recovered plaintext mismatch');
    }

    console.log(JSON.stringify({
        ok: true,
        doctorId,
        dataId,
        cid,
        payloadHash,
        fabric: access.status,
        plaintext: recovered.toString()
    }, null, 2));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
