'use strict';

/** 
 * Complete Fabric benchmark with unique dataIds.
 * Saves CSV incrementally so partial results are preserved.
 */

const crypto = require('crypto');
const cryptoService = require('../services/cryptoService');
const fabricService = require('../services/fabricService');
const { ensurePool, disconnectPool } = require('./lib/fabricPool');
const { mean, min, max, stddev, roundTo, formatRow, formatHeader } = require('./lib/stats');
const { measure, warmup, reportToCsv, sleep, nowBigInt, elapsedMs, ensureResultsDir } = require('./lib/helpers');

const CSV_FILE = 'fabric-benchmark.csv';
const HEADER = formatHeader(',throughputAvg,throughputMin,throughputMax');
const RUNS = 3;

function bundle(op) {
  return JSON.stringify({
    bgwHeader: JSON.parse(op.bgwHeader),
    updateToken: op.updateToken,
    authorizedUsers: op.authorizedUsers,
    grantedUsers: [], revokedUsers: [],
    payloadHash: op.payloadHash,
    category: 'benchmark',
    metadata: { filename: 'bench.bin', recipients: op.recipientIds }
  });
}

function submitOne(contract, op) {
  return contract.submitTransaction(
    'DataStorage:storeHash',
    op.dataId, op.patientId, op.ipfsHash, bundle(op), op.level
  ).then(r => JSON.parse(r.toString()));
}

async function submitConcurrent(ops, poolSize) {
  const pool = await ensurePool(poolSize);
  return Promise.all(ops.map((op, i) => submitOne(pool.getContract(i), op)));
}

async function runAll() {
  ensureResultsDir();
  const rows = [];
  const base = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ── BGW Setup ──
  const { publicKey, masterSecret } = await cryptoService.setupBroadcast(120);
  const plaintext = Buffer.from('Fabric benchmark payload ' + 'x'.repeat(512));
  await cryptoService.generateBroadcastPrivateKey(masterSecret, 1, publicKey);

  // ── Doctor registration ──
  const doctorId = `dr_${base}`;
  await fabricService.registerUser(doctorId, 'pk', 'Doctor');
  await fabricService.assignLevel(doctorId, 'L0');

  async function makeStoreOp(dataId) {
    const env = await cryptoService.encryptFileForRecipients(plaintext, publicKey, [1], {
      dataId, patientId: 'pat', level: 'L0', category: 'benchmark',
      filename: 'bench.bin', mimetype: 'application/octet-stream'
    });
    const h = crypto.createHash('sha256').update(Buffer.from(JSON.stringify(env))).digest('hex');
    return { dataId, patientId: 'pat', ipfsHash: `cid-${dataId}`,
      bgwHeader: JSON.stringify(env.bgwHeader), updateToken: env.updateToken || '',
      level: 'L0', authorizedUsers: [doctorId], payloadHash: h, recipientIds: [1] };
  }

  // ── Warmup ──
  {
    const op = await makeStoreOp(`wu_${base}`);
    const p = await ensurePool(1);
    await warmup(() => submitOne(p.getContract(0), op), 1);
    console.log('Warmup OK');
  }
  await disconnectPool(); await sleep(500);

  // ─────────────────────────────────────────
  // Exp1: Block Size vs Latency (pool=50, concurrent)
  // ─────────────────────────────────────────
  console.log('\n[Exp1] Block Size vs Latency');
  for (const bs of [5, 10, 15, 20]) {
    const lats = []; const tputs = [];
    for (let r = 0; r < RUNS; r++) {
      const ops = await Promise.all(Array.from({length: bs}, (_, i) =>
        makeStoreOp(`e1_${base}_bs${bs}_r${r}_${i}`)));
      await disconnectPool(); await sleep(300);
      const t0 = nowBigInt();
      await submitConcurrent(ops, 50);
      const ms = Number(elapsedMs(t0));
      lats.push(ms / bs); tputs.push(bs / (ms / 1000));
    }
    rows.push(formatRow('fabric', 'exp1-latency', bs, 50, '-', lats,
      `,${roundTo(mean(tputs))},${roundTo(min(tputs))},${roundTo(max(tputs))}`));
    console.log(`  bs=${bs}  lat=${roundTo(mean(lats))}ms  tput=${roundTo(mean(tputs))} tx/s`);
  }

  // ─────────────────────────────────────────
  // Exp2: Concurrency vs Throughput (blockSize=10, concurrent)
  // ─────────────────────────────────────────
  console.log('\n[Exp2] Concurrency vs Throughput');
  for (const cc of [10, 25, 50, 75, 100]) {
    const lats = []; const tputs = [];
    for (let r = 0; r < RUNS; r++) {
      const ops = await Promise.all(Array.from({length: 10}, (_, i) =>
        makeStoreOp(`e2_${base}_cc${cc}_r${r}_${i}`)));
      await disconnectPool(); await sleep(300);
      const t0 = nowBigInt();
      try {
        await submitConcurrent(ops, cc);
      } catch (e) {
        console.log(`  cc=${cc} run=${r} FAIL: ${e.message}`); continue;
      }
      const ms = Number(elapsedMs(t0));
      lats.push(ms / 10); tputs.push(10 / (ms / 1000));
    }
    if (lats.length) {
      rows.push(formatRow('fabric', 'exp2-throughput', 10, cc, '-', lats,
        `,${roundTo(mean(tputs))},${roundTo(min(tputs))},${roundTo(max(tputs))}`));
      console.log(`  cc=${cc}  lat=${roundTo(mean(lats))}ms  tput=${roundTo(mean(tputs))} tx/s`);
    } else {
      console.log(`  cc=${cc}  ALL FAILED — local setup cannot support ${cc} connections`);
    }
  }

  // ─────────────────────────────────────────
  // Exp3: Transaction Rate vs Throughput (blockSize=10, pool=50, paced)
  // ─────────────────────────────────────────
  console.log('\n[Exp3] Transaction Rate vs Throughput');
  for (const tps of [100, 250, 500, 850]) {
    const lats = []; const tputs = [];
    const interTx = 1000 / tps;
    for (let r = 0; r < RUNS; r++) {
      const ops = await Promise.all(Array.from({length: 10}, (_, i) =>
        makeStoreOp(`e3_${base}_tps${tps}_r${r}_${i}`)));
      const pool = await ensurePool(50);
      const t0 = nowBigInt();
      for (let i = 0; i < ops.length; i++) {
        await submitOne(pool.getContract(i), ops[i]);
        if (interTx > 0 && i + 1 < ops.length) await sleep(interTx);
      }
      const ms = Number(elapsedMs(t0));
      lats.push(ms / 10); tputs.push(10 / (ms / 1000));
    }
    rows.push(formatRow('fabric', 'exp3-throughput', 10, 50, tps, lats,
      `,${roundTo(mean(tputs))},${roundTo(min(tputs))},${roundTo(max(tputs))}`));
    console.log(`  tps=${tps}  lat=${roundTo(mean(lats))}ms  tput=${roundTo(mean(tputs))} tx/s`);
  }

  // ─────────────────────────────────────────
  // Exp4: Block Size × TPS Matrix (pool=50, paced)
  // ─────────────────────────────────────────
  console.log('\n[Exp4] Block Size × TPS Matrix');
  for (const bs of [5, 10, 15, 20]) {
    process.stdout.write(`  bs=${bs}:`);
    for (const tps of [100, 250, 500, 850]) {
      const tputs = []; const interTx = 1000 / tps;
      for (let r = 0; r < RUNS; r++) {
        const ops = await Promise.all(Array.from({length: bs}, (_, i) =>
          makeStoreOp(`e4_${base}_bs${bs}_tps${tps}_r${r}_${i}`)));
        const pool = await ensurePool(50);
        const t0 = nowBigInt();
        for (let i = 0; i < ops.length; i++) {
          await submitOne(pool.getContract(i), ops[i]);
          if (interTx > 0 && i + 1 < ops.length) await sleep(interTx);
        }
        tputs.push(bs / (Number(elapsedMs(t0)) / 1000));
      }
      rows.push(formatRow('fabric', 'exp4-matrix', bs, 50, tps, tputs,
        `,${roundTo(mean(tputs))},${roundTo(min(tputs))},${roundTo(max(tputs))}`));
      process.stdout.write(` ${tps}tps=${roundTo(mean(tputs))}`);
    }
    process.stdout.write('\n');
  }

  // ─────────────────────────────────────────
  // Extra: Individual operation latency
  // ─────────────────────────────────────────
  console.log('\n[Extra] Individual operation latency');
  {
    const regL = []; const levL = []; const stoL = []; const accL = [];
    await ensurePool(1); const p1 = await ensurePool(1);
    for (let r = 0; r < RUNS; r++) {
      const uid = `ind_${base}_${r}`;
      const { elapsed: t1 } = await measure(() => fabricService.registerUser(uid, 'pk', 'Nurse'));
      regL.push(t1);
      const { elapsed: t2 } = await measure(() => fabricService.assignLevel(uid, 'L1'));
      levL.push(t2);
      const op = await makeStoreOp(`ind_${base}_sto_${r}`);
      const { elapsed: t3 } = await measure(() => submitOne(p1.getContract(0), op));
      stoL.push(t3);
      const { elapsed: t4 } = await measure(() => fabricService.requestAccess(uid, op.dataId));
      accL.push(t4);
    }
    rows.push(formatRow('fabric', 'registerUser', '-', '-', '-', regL, ','));
    rows.push(formatRow('fabric', 'assignLevel', '-', '-', '-', levL, ','));
    rows.push(formatRow('fabric', 'storeHash-indiv', '-', '-', '-', stoL, ','));
    rows.push(formatRow('fabric', 'requestAccess', '-', '-', '-', accL, ','));
    console.log(`  registerUser=${roundTo(mean(regL))}ms  assignLevel=${roundTo(mean(levL))}ms`);
    console.log(`  storeHash=${roundTo(mean(stoL))}ms  requestAccess=${roundTo(mean(accL))}ms`);
  }

  await disconnectPool();
  const fp = reportToCsv(CSV_FILE, HEADER, rows);
  console.log(`\nResults written: ${fp}`);
}

runAll().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
