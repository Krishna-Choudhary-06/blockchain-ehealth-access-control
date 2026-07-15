'use strict';

const crypto = require('crypto');
const cryptoService = require('../services/cryptoService');
const fabricService = require('../services/fabricService');
const { ensurePool, disconnectPool } = require('./lib/fabricPool');
const { mean, median, min, max, stddev, roundTo, formatRow, formatHeader } = require('./lib/stats');
const { measure, warmup, reportToCsv, sleep, nowBigInt, elapsedMs } = require('./lib/helpers');

const CSV_FILE = 'fabric-benchmark.csv';
const HEADER = formatHeader(',throughputAvg,throughputMin,throughputMax');

// Build a storeHash headerBundle from a pre-generated operation descriptor.
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

// Submit a single storeHash via a given contract (returns parsed result).
function submitOne(contract, op) {
  return contract.submitTransaction(
    'DataStorage:storeHash',
    op.dataId, op.patientId, op.ipfsHash,
    JSON.stringify(buildHeaderBundle(op)), op.level
  ).then(r => JSON.parse(r.toString()));
}

// Submit N storeHashes concurrently using the pool.
// poolSize controls how many contracts from the pool are used.
async function submitConcurrent(ops, poolSize) {
  const pool = await ensurePool(poolSize);
  return Promise.all(
    ops.map((op, i) => submitOne(pool.getContract(i), op))
  );
}

async function runFabricBenchmark({ runs = 3, scenarioTag = 'default' } = {}) {
  console.log('=== Fabric Workflow Benchmarks (Paper-Aligned) ===\n');
  const rows = [];
  const suffix = Date.now().toString();

  // Single shared setup
  const { publicKey, masterSecret } = await cryptoService.setupBroadcast(120);
  const plaintext = Buffer.from('Fabric benchmark payload ' + 'x'.repeat(512));
  const sk = await cryptoService.generateBroadcastPrivateKey(masterSecret, 1, publicKey);

  // Pre-register 100 test users + doctor
  console.log('  Registering test users on Fabric...');
  const doctorId = `bench_dr_${suffix}`;
  await fabricService.registerUser(doctorId, 'bench-pk', 'Doctor');
  await fabricService.assignLevel(doctorId, 'L0');

  const userIds = [];
  for (let i = 0; i < 100; i++) {
    const uid = `bench_u_${suffix}_${i}`;
    await fabricService.registerUser(uid, 'bench-pk', 'Doctor');
    await fabricService.assignLevel(uid, 'L0');
    userIds.push(uid);
  }
  console.log(`  Registered 100 test users + doctor.\n`);

  // Warmup: submit one throwaway transaction to prime Fabric connections and JIT
  {
    const warmupOp = await makeStoreOp(`bench_warmup_${suffix}`, `pat_warmup_${suffix}`);
    const warmPool = await ensurePool(1);
    await warmup(() => submitOne(warmPool.getContract(0), warmupOp), 1);
    console.log('  Warmup transaction completed.\n');
  }

  // Pre-generate envelope templates for storeHash
  async function makeStoreOp(dataId, patientId) {
    const envelope = await cryptoService.encryptFileForRecipients(plaintext, publicKey, [1], {
      dataId, patientId, level: 'L0', category: 'benchmark',
      filename: 'bench.bin', mimetype: 'application/octet-stream'
    });
    const envelopeBytes = Buffer.from(JSON.stringify(envelope));
    const payloadHash = crypto.createHash('sha256').update(envelopeBytes).digest('hex');
    return {
      dataId, patientId,
      ipfsHash: `bench-cid-${dataId}`,
      bgwHeader: JSON.stringify(envelope.bgwHeader),
      updateToken: envelope.updateToken || '',
      level: 'L0',
      authorizedUsers: [doctorId],
      payloadHash,
      recipientIds: [1]
    };
  }

  // ──────────────────────────────────────────────
  // Experiment 1: Block Size vs Latency
  // Vary: blockSize = [5, 10, 15, 20]
  // Fix: pool=50 (concurrent clients), no pacing
  // All ops submitted simultaneously — truly concurrent.
  // ──────────────────────────────────────────────
  console.log('  [Experiment 1] Block Size vs Latency (clients=50, all-at-once)');
  const blockSizes = [5, 10, 15, 20];
  const expPoolSize = 50;

  for (const bs of blockSizes) {
    const latencies = [];
    const throughputs = [];

    for (let r = 0; r < runs; r++) {
      const ops = await Promise.all(
        Array.from({ length: bs }, (_, i) => makeStoreOp(`e1_${suffix}_${r}_${i}`, `pat_e1_${suffix}`))
      );
      const start = nowBigInt();
      await submitConcurrent(ops, expPoolSize);
      const totalMs = Number(elapsedMs(start));
      latencies.push(totalMs / bs);
      throughputs.push(bs / (totalMs / 1000));
    }
    rows.push(formatRow('fabric', `exp1-latency`, bs, expPoolSize, '-', latencies, `,${roundTo(mean(throughputs))},${roundTo(min(throughputs))},${roundTo(max(throughputs))}`));
    console.log(`    blockSize=${bs}  latency=${roundTo(mean(latencies))}ms (med=${roundTo(median(latencies))})  throughput=${roundTo(mean(throughputs))} tx/s`);
  }

  // ──────────────────────────────────────────────
  // Experiment 2: Concurrency vs Throughput
  // Vary: poolSize = [10, 25, 50, 75, 100]
  // Fix: blockSize=10, no pacing
  // All ops submitted simultaneously.
  // ──────────────────────────────────────────────
  console.log('\n  [Experiment 2] Concurrency vs Throughput (blockSize=10, all-at-once)');
  const concurrencyLevels = [10, 25, 50, 75, 100];
  const exp2BlockSize = 10;

  for (const cc of concurrencyLevels) {
    const latencies = [];
    const throughputs = [];

    for (let r = 0; r < runs; r++) {
      const ops = await Promise.all(
        Array.from({ length: exp2BlockSize }, (_, i) => makeStoreOp(`e2_${suffix}_${r}_${i}_cc${cc}`, `pat_e2_${suffix}`))
      );
      const start = nowBigInt();
      await submitConcurrent(ops, cc);
      const totalMs = Number(elapsedMs(start));
      latencies.push(totalMs / exp2BlockSize);
      throughputs.push(exp2BlockSize / (totalMs / 1000));
    }
    rows.push(formatRow('fabric', `exp2-throughput`, exp2BlockSize, cc, '-', latencies, `,${roundTo(mean(throughputs))},${roundTo(min(throughputs))},${roundTo(max(throughputs))}`));
    console.log(`    concurrency=${cc}  latency=${roundTo(mean(latencies))}ms (med=${roundTo(median(latencies))})  throughput=${roundTo(mean(throughputs))} tx/s`);
  }

  // ──────────────────────────────────────────────
  // Experiment 3: Transaction Rate vs Throughput
  // Vary: tps = [100, 250, 500, 850]
  // Fix: blockSize=10, pool=50
  // Transactions are injected at the specified rate via
  // inter-transmission delay = 1000/tps ms.
  // ──────────────────────────────────────────────
  console.log('\n  [Experiment 3] Transaction Rate vs Throughput (blockSize=10, clients=50, paced)');
  const tpsLevels = [100, 250, 500, 850];
  const exp3BlockSize = 10;
  const exp3Pool = 50;

  for (const tps of tpsLevels) {
    const latencies = [];
    const throughputs = [];
    const interTx = 1000 / tps;

    for (let r = 0; r < runs; r++) {
      const ops = await Promise.all(
        Array.from({ length: exp3BlockSize }, (_, i) => makeStoreOp(`e3_${suffix}_${r}_${i}_tps${tps}`, `pat_e3_${suffix}`))
      );
      const pool = await ensurePool(exp3Pool);
      const start = nowBigInt();
      // Submit one at a time with rate-limiting delay
      for (let i = 0; i < ops.length; i++) {
        await submitOne(pool.getContract(i), ops[i]);
        if (interTx > 0 && i + 1 < ops.length) await sleep(interTx);
      }
      const totalMs = Number(elapsedMs(start));
      latencies.push(totalMs / exp3BlockSize);
      throughputs.push(exp3BlockSize / (totalMs / 1000));
    }
    rows.push(formatRow('fabric', `exp3-throughput`, exp3BlockSize, exp3Pool, tps, latencies, `,${roundTo(mean(throughputs))},${roundTo(min(throughputs))},${roundTo(max(throughputs))}`));
    console.log(`    tps=${tps}  latency=${roundTo(mean(latencies))}ms  throughput=${roundTo(mean(throughputs))} tx/s`);
  }

  // ──────────────────────────────────────────────
  // Experiment 4: Block Size × TPS Matrix
  // Vary: blockSize=[5,10,15,20] × tps=[100,250,500,850]
  // Fix: pool=50, paced submission
  // ──────────────────────────────────────────────
  console.log('\n  [Experiment 4] Block Size × TPS Matrix (clients=50, paced)');
  for (const bs of blockSizes) {
    for (const tps of tpsLevels) {
      const throughputs = [];
      const interTx = 1000 / tps;

      for (let r = 0; r < runs; r++) {
        const ops = await Promise.all(
          Array.from({ length: bs }, (_, i) => makeStoreOp(`e4_${suffix}_${r}_${i}_bs${bs}_tps${tps}`, `pat_e4_${suffix}`))
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

  // Extra: measure individual operation latency for breakdown
  console.log('  [Extra] Individual operation latency (pool=1)');
  {
    const regLats = []; const levelLats = []; const storeLats = []; const accessLats = [];
    await ensurePool(1);
    const pool1 = await ensurePool(1);
    for (let r = 0; r < runs; r++) {
      const uid = `bench_indiv_${suffix}_${r}`;
      const { elapsed: t1 } = await measure(() => fabricService.registerUser(uid, 'bench-pk', 'Nurse'));
      regLats.push(t1);
      const { elapsed: t2 } = await measure(() => fabricService.assignLevel(uid, 'L1'));
      levelLats.push(t2);
      const op2 = await makeStoreOp(`indiv_${suffix}_${r}`, `pat_indiv_${suffix}`);
      const { elapsed: t3 } = await measure(() => submitOne(pool1.getContract(0), op2));
      storeLats.push(t3);
      const { elapsed: t4 } = await measure(() => fabricService.requestAccess(uid, op2.dataId));
      accessLats.push(t4);
    }
    rows.push(formatRow('fabric', 'registerUser', '-', '-', '-', regLats, ','));
    rows.push(formatRow('fabric', 'assignLevel', '-', '-', '-', levelLats, ','));
    rows.push(formatRow('fabric', 'storeHash-indiv', '-', '-', '-', storeLats, ','));
    rows.push(formatRow('fabric', 'requestAccess', '-', '-', '-', accessLats, ','));
    console.log(`    registerUser=${roundTo(mean(regLats))}ms`);
    console.log(`    assignLevel=${roundTo(mean(levelLats))}ms`);
    console.log(`    storeHash(indiv)=${roundTo(mean(storeLats))}ms`);
    console.log(`    requestAccess=${roundTo(mean(accessLats))}ms`);
  }

  await disconnectPool();
  const filePath = reportToCsv(CSV_FILE, HEADER, rows);
  console.log(`\nResults written to: ${filePath}\n`);
  return rows;
}

if (require.main === module) {
  runFabricBenchmark({ runs: 3 }).catch(err => {
    console.error('Fabric benchmark failed:', err);
    process.exit(1);
  });
}

module.exports = { runFabricBenchmark };
