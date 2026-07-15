'use strict';

/**
 * Runs Fabric benchmark experiments with globally unique dataIds.
 * Skips wasteful 100-user registration (users were never used in any experiment).
 */

const crypto = require('crypto');
const cryptoService = require('../services/cryptoService');
const fabricService = require('../services/fabricService');
const { ensurePool, disconnectPool } = require('./lib/fabricPool');
const { mean, median, min, max, stddev, roundTo, formatRow, formatHeader } = require('./lib/stats');
const { measure, warmup, reportToCsv, sleep, nowBigInt, elapsedMs, ensureResultsDir } = require('./lib/helpers');

const CSV_FILE = 'fabric-benchmark.csv';
const HEADER = formatHeader(',throughputAvg,throughputMin,throughputMax');

function buildHeaderBundle(op) {
  return {
    bgwHeader: JSON.parse(op.bgwHeader),
    updateToken: op.updateToken,
    authorizedUsers: op.authorizedUsers,
    grantedUsers: [],
    revokedUsers: [],
    payloadHash: op.payloadHash,
    category: 'benchmark',
    metadata: { filename: 'bench.bin', recipients: op.recipientIds }
  };
}

function submitOne(contract, op) {
  return contract.submitTransaction(
    'DataStorage:storeHash',
    op.dataId, op.patientId, op.ipfsHash,
    JSON.stringify(buildHeaderBundle(op)), op.level
  ).then(r => JSON.parse(r.toString()));
}

async function submitConcurrent(ops, poolSize) {
  const pool = await ensurePool(poolSize);
  return Promise.all(
    ops.map((op, i) => submitOne(pool.getContract(i), op))
  );
}

async function main() {
  ensureResultsDir();
  const rows = [];
  const base = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const runs = 3;

  const { publicKey, masterSecret } = await cryptoService.setupBroadcast(120);
  const plaintext = Buffer.from('Fabric benchmark payload ' + 'x'.repeat(512));
  await cryptoService.generateBroadcastPrivateKey(masterSecret, 1, publicKey);

  // Register doctor (the only identity needed)
  const doctorId = `dr_${base}`;
  console.log('Registering doctor...');
  await fabricService.registerUser(doctorId, 'pk', 'Doctor');
  await fabricService.assignLevel(doctorId, 'L0');

  async function makeStoreOp(dataId, patientId) {
    const envelope = await cryptoService.encryptFileForRecipients(plaintext, publicKey, [1], {
      dataId, patientId, level: 'L0', category: 'benchmark',
      filename: 'bench.bin', mimetype: 'application/octet-stream'
    });
    const envelopeBytes = Buffer.from(JSON.stringify(envelope));
    const payloadHash = crypto.createHash('sha256').update(envelopeBytes).digest('hex');
    return {
      dataId, patientId,
      ipfsHash: `cid-${dataId}`,
      bgwHeader: JSON.stringify(envelope.bgwHeader),
      updateToken: envelope.updateToken || '',
      level: 'L0',
      authorizedUsers: [doctorId],
      payloadHash,
      recipientIds: [1]
    };
  }

  // Warmup
  {
    const op = await makeStoreOp(`wu_${base}`, `pat`);
    const p = await ensurePool(1);
    await warmup(() => submitOne(p.getContract(0), op), 1);
    console.log('Warmup done.\n');
  }
  await disconnectPool();
  await sleep(500);

  const blockSizes = [5, 10, 15, 20];
  const concurrencyLevels = [10, 25, 50, 75, 100];
  const tpsLevels = [100, 250, 500, 850];
  const exp3Pool = 50;

  // ───── Exp1: Block Size vs Latency ─────
  console.log('[Exp1] Block Size vs Latency (pool=50, all-at-once)');
  for (const bs of blockSizes) {
    const latencies = []; const throughputs = [];
    for (let r = 0; r < runs; r++) {
      const ops = await Promise.all(
        Array.from({ length: bs }, (_, i) => makeStoreOp(`e1_${base}_bs${bs}_r${r}_${i}`, `pat`))
      );
      await disconnectPool(); await sleep(300);
      const start = nowBigInt();
      await submitConcurrent(ops, 50);
      const totalMs = Number(elapsedMs(start));
      latencies.push(totalMs / bs);
      throughputs.push(bs / (totalMs / 1000));
    }
    rows.push(formatRow('fabric', `exp1-latency`, bs, 50, '-', latencies, `,${roundTo(mean(throughputs))},${roundTo(min(throughputs))},${roundTo(max(throughputs))}`));
    console.log(`  bs=${bs}  lat=${roundTo(mean(latencies))}ms  tput=${roundTo(mean(throughputs))} tx/s`);
  }

  // ───── Exp2: Concurrency vs Throughput ─────
  console.log('\n[Exp2] Concurrency vs Throughput (blockSize=10, all-at-once)');
  for (const cc of concurrencyLevels) {
    const latencies = []; const throughputs = [];
    for (let r = 0; r < runs; r++) {
      const ops = await Promise.all(
        Array.from({ length: 10 }, (_, i) => makeStoreOp(`e2_${base}_cc${cc}_r${r}_${i}`, `pat`))
      );
      await disconnectPool(); await sleep(300);
      try {
        const start = nowBigInt();
        await submitConcurrent(ops, cc);
        const totalMs = Number(elapsedMs(start));
        latencies.push(totalMs / 10);
        throughputs.push(10 / (totalMs / 1000));
      } catch (e) {
        console.log(`  cc=${cc} run=${r} FAILED: ${e.message}`);
      }
    }
    if (latencies.length > 0) {
      rows.push(formatRow('fabric', `exp2-throughput`, 10, cc, '-', latencies, `,${roundTo(mean(throughputs))},${roundTo(min(throughputs))},${roundTo(max(throughputs))}`));
      console.log(`  cc=${cc}  lat=${roundTo(mean(latencies))}ms  tput=${roundTo(mean(throughputs))} tx/s`);
    } else {
      console.log(`  cc=${cc}  FAILED`);
    }
  }

  // ───── Exp3: Transaction Rate vs Throughput ─────
  console.log('\n[Exp3] Transaction Rate vs Throughput (blockSize=10, pool=50, paced)');
  for (const tps of tpsLevels) {
    const latencies = []; const throughputs = [];
    const interTx = 1000 / tps;
    for (let r = 0; r < runs; r++) {
      const ops = await Promise.all(
        Array.from({ length: 10 }, (_, i) => makeStoreOp(`e3_${base}_tps${tps}_r${r}_${i}`, `pat`))
      );
      const pool = await ensurePool(exp3Pool);
      const start = nowBigInt();
      for (let i = 0; i < ops.length; i++) {
        await submitOne(pool.getContract(i), ops[i]);
        if (interTx > 0 && i + 1 < ops.length) await sleep(interTx);
      }
      const totalMs = Number(elapsedMs(start));
      latencies.push(totalMs / 10);
      throughputs.push(10 / (totalMs / 1000));
    }
    rows.push(formatRow('fabric', `exp3-throughput`, 10, exp3Pool, tps, latencies, `,${roundTo(mean(throughputs))},${roundTo(min(throughputs))},${roundTo(max(throughputs))}`));
    console.log(`  tps=${tps}  lat=${roundTo(mean(latencies))}ms  tput=${roundTo(mean(throughputs))} tx/s`);
  }

  // ───── Exp4: Block Size × TPS Matrix ─────
  console.log('\n[Exp4] Block Size × TPS Matrix (pool=50, paced)');
  for (const bs of blockSizes) {
    for (const tps of tpsLevels) {
      const throughputs = [];
      const interTx = 1000 / tps;
      for (let r = 0; r < runs; r++) {
        const ops = await Promise.all(
          Array.from({ length: bs }, (_, i) => makeStoreOp(`e4_${base}_bs${bs}_tps${tps}_r${r}_${i}`, `pat`))
        );
        const pool = await ensurePool(exp3Pool);
        const start = nowBigInt();
        for (let i = 0; i < ops.length; i++) {
          await submitOne(pool.getContract(i), ops[i]);
          if (interTx > 0 && i + 1 < ops.length) await sleep(interTx);
        }
        const totalMs = Number(elapsedMs(start));
        throughputs.push(bs / (totalMs / 1000));
      }
      rows.push(formatRow('fabric', `exp4-matrix`, bs, exp3Pool, tps, throughputs, `,${roundTo(mean(throughputs))},${roundTo(min(throughputs))},${roundTo(max(throughputs))}`));
    }
  }
  console.log('');

  // ───── Extra: Individual operation latency ─────
  console.log('[Extra] Individual operation latency (pool=1)');
  {
    const regLats = []; const levelLats = []; const storeLats = []; const accessLats = [];
    await ensurePool(1);
    const pool1 = await ensurePool(1);
    for (let r = 0; r < runs; r++) {
      const uid = `indiv_${base}_${r}`;
      const { elapsed: t1 } = await measure(() => fabricService.registerUser(uid, 'pk', 'Nurse'));
      regLats.push(t1);
      const { elapsed: t2 } = await measure(() => fabricService.assignLevel(uid, 'L1'));
      levelLats.push(t2);
      const op2 = await makeStoreOp(`indiv_${base}_store_${r}`, `pat`);
      const { elapsed: t3 } = await measure(() => submitOne(pool1.getContract(0), op2));
      storeLats.push(t3);
      const { elapsed: t4 } = await measure(() => fabricService.requestAccess(uid, op2.dataId));
      accessLats.push(t4);
    }
    rows.push(formatRow('fabric', 'registerUser', '-', '-', '-', regLats, ','));
    rows.push(formatRow('fabric', 'assignLevel', '-', '-', '-', levelLats, ','));
    rows.push(formatRow('fabric', 'storeHash-indiv', '-', '-', '-', storeLats, ','));
    rows.push(formatRow('fabric', 'requestAccess', '-', '-', '-', accessLats, ','));
    console.log(`  registerUser=${roundTo(mean(regLats))}ms`);
    console.log(`  assignLevel=${roundTo(mean(levelLats))}ms`);
    console.log(`  storeHash=${roundTo(mean(storeLats))}ms`);
    console.log(`  requestAccess=${roundTo(mean(accessLats))}ms`);
  }

  await disconnectPool();
  const filePath = reportToCsv(CSV_FILE, HEADER, rows);
  console.log(`\nResults: ${filePath}`);
  return rows;
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
