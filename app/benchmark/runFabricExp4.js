'use strict';

/** Runs only Exp4 (Block Size × TPS Matrix) with unique dataIds. */

const crypto = require('crypto');
const cryptoService = require('../services/cryptoService');
const fabricService = require('../services/fabricService');
const { ensurePool, disconnectPool } = require('./lib/fabricPool');
const { mean, roundTo, formatRow, formatHeader } = require('./lib/stats');
const { reportToCsv, sleep, nowBigInt, elapsedMs, ensureResultsDir } = require('./lib/helpers');

const CSV_FILE = 'fabric-benchmark-exp4.csv';
const HEADER = formatHeader(',throughputAvg,throughputMin,throughputMax');

async function main() {
  ensureResultsDir();
  const rows = [];
  const base = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const runs = 3;
  const exp3Pool = 50;

  const { publicKey } = await cryptoService.setupBroadcast(120);
  const plaintext = Buffer.from('Fabric benchmark payload ' + 'x'.repeat(512));
  const doctorId = `dr4_${base}`;
  await fabricService.registerUser(doctorId, 'pk', 'Doctor');
  await fabricService.assignLevel(doctorId, 'L0');

  async function makeStoreOp(dataId) {
    const envelope = await cryptoService.encryptFileForRecipients(plaintext, publicKey, [1], {
      dataId, patientId: 'pat', level: 'L0', category: 'benchmark',
      filename: 'bench.bin', mimetype: 'application/octet-stream'
    });
    const envelopeBytes = Buffer.from(JSON.stringify(envelope));
    const payloadHash = crypto.createHash('sha256').update(envelopeBytes).digest('hex');
    return {
      dataId, patientId: 'pat',
      ipfsHash: `cid-${dataId}`,
      bgwHeader: JSON.stringify(envelope.bgwHeader),
      updateToken: envelope.updateToken || '',
      level: 'L0',
      authorizedUsers: [doctorId],
      payloadHash,
      recipientIds: [1]
    };
  }

  const bundle = (op) => JSON.stringify({
    bgwHeader: JSON.parse(op.bgwHeader),
    updateToken: op.updateToken,
    authorizedUsers: op.authorizedUsers,
    grantedUsers: [], revokedUsers: [],
    payloadHash: op.payloadHash,
    category: 'benchmark',
    metadata: { filename: 'bench.bin', recipients: op.recipientIds }
  });

  async function submitOne(contract, op) {
    return contract.submitTransaction(
      'DataStorage:storeHash',
      op.dataId, op.patientId, op.ipfsHash,
      bundle(op), op.level
    ).then(r => JSON.parse(r.toString()));
  }

  console.log('[Exp4] Block Size × TPS Matrix (pool=50, paced)\n');

  for (const bs of [5, 10, 15, 20]) {
    for (const tps of [100, 250, 500, 850]) {
      const throughputs = [];
      const interTx = 1000 / tps;
      for (let r = 0; r < runs; r++) {
        const ops = await Promise.all(
          Array.from({ length: bs }, (_, i) => makeStoreOp(`e4_${base}_bs${bs}_tps${tps}_r${r}_${i}`))
        );
        const pool = await ensurePool(exp3Pool);
        const start = nowBigInt();
        for (let i = 0; i < ops.length; i++) {
          await submitOne(pool.getContract(i), ops[i]);
          if (interTx > 0 && i + 1 < ops.length) await sleep(interTx);
        }
        const totalMs = Number(elapsedMs(start));
        throughputs.push(bs / (totalMs / 1000));
        process.stdout.write(`  bs=${bs} tps=${tps} run=${r} → ${roundTo(bs / (totalMs / 1000))} tx/s\n`);
      }
      rows.push(formatRow('fabric', `exp4-matrix`, bs, exp3Pool, tps, throughputs, `,${roundTo(mean(throughputs))},${roundTo(min(throughputs))},${roundTo(max(throughputs))}`));
    }
  }

  await disconnectPool();
  const filePath = reportToCsv(CSV_FILE, HEADER, rows);
  console.log(`\nResults: ${filePath}`);
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
