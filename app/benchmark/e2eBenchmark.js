'use strict';

const crypto = require('crypto');
const cryptoService = require('../services/cryptoService');
const fabricService = require('../services/fabricService');
const ipfsService = require('../services/ipfsService');
const { ensurePool, disconnectPool } = require('./lib/fabricPool');
const { mean, median, stddev, roundTo, formatRow, formatHeader } = require('./lib/stats');
const { measure, warmup, reportToCsv, nowBigInt, elapsedMs } = require('./lib/helpers');

const CSV_FILE = 'e2e-benchmark.csv';
const HEADER = formatHeader(',phase');

async function runE2eBenchmark({ runs = 3, scenarioTag = 'default' } = {}) {
  console.log('=== End-to-End Workflow Benchmark (Paper-Aligned) ===\n');
  const rows = [];
  const suffix = Date.now().toString();
  const plaintext = Buffer.from('E2E paper benchmark payload ' + 'x'.repeat(1024));
  const BGW_RUNS = 3; // use 3 individual runs per scenario

  const { publicKey, masterSecret } = await cryptoService.setupBroadcast(100);
  const recipientIds = [1];
  const sk = await cryptoService.generateBroadcastPrivateKey(masterSecret, 1, publicKey);

  const doctorId = `e2e_dr_${suffix}`;
  await fabricService.registerUser(doctorId, 'e2e-pk', 'Doctor');
  await fabricService.assignLevel(doctorId, 'L0');

  // Warmup: run one full lifecycle to prime Fabric connections and crypto JIT
  {
    const wEnv = await cryptoService.encryptFileForRecipients(plaintext, publicKey, recipientIds, {
      dataId: 'e2e_warmup', patientId: 'pat_warmup', level: 'L0', category: 'benchmark',
      filename: 'warmup.bin', mimetype: 'application/octet-stream'
    });
    const wBytes = Buffer.from(JSON.stringify(wEnv));
    let wCid;
    try { wCid = await ipfsService.uploadFile(wBytes); } catch (e) { wCid = 'mock-warmup'; }
    await warmup(() => fabricService.storeHash('e2e_warmup', 'pat_warmup', wCid,
      JSON.stringify(wEnv.bgwHeader), wEnv.updateToken || '',
      'L0', [doctorId], crypto.createHash('sha256').update(wBytes).digest('hex'), 'benchmark',
      { filename: 'warmup.bin', recipients: recipientIds }, [], []), 1);
  }

  // ────────────────────────────────────────────
  // Experiment: Full lifecycle with phase breakdown
  // Block sizes: [5, 10, 15, 20]
  // ────────────────────────────────────────────
  const blockSizes = [5, 10, 15, 20];

  for (const bs of blockSizes) {
    console.log(`  [BlockSize=${bs}] Full E2E Lifecycle`);

    const phaseData = { encrypt: [], ipfsUpload: [], fabricStore: [], requestAccess: [], downloadDecrypt: [], total: [] };

    for (let r = 0; r < BGW_RUNS; r++) {
      const batchOps = await Promise.all(
        Array.from({ length: bs }, (_, i) => (async () => {
          const did = `e2e_${suffix}_bs${bs}_r${r}_${i}`;
          const pid = `pat_e2e_${suffix}`;
          const t0 = nowBigInt();
          const envelope = await cryptoService.encryptFileForRecipients(plaintext, publicKey, recipientIds, {
            dataId: did, patientId: pid, level: 'L0', category: 'benchmark',
            filename: 'e2e.bin', mimetype: 'application/octet-stream'
          });
          const encryptMs = Number(elapsedMs(t0));
          const envelopeBytes = Buffer.from(JSON.stringify(envelope));
          const payloadHash = crypto.createHash('sha256').update(envelopeBytes).digest('hex');

          const t1 = nowBigInt();
          let cid;
          try { cid = await ipfsService.uploadFile(envelopeBytes); } catch (e) { cid = `mock-${did}`; }
          const ipfsMs = Number(elapsedMs(t1));

          const t2 = nowBigInt();
          await fabricService.storeHash(
            did, pid, cid,
            JSON.stringify(envelope.bgwHeader), envelope.updateToken || '',
            'L0', [doctorId], payloadHash, 'benchmark',
            { filename: 'e2e.bin', recipients: recipientIds }, [], []
          );
          const fabricMs = Number(elapsedMs(t2));

          const t3 = nowBigInt();
          const access = await fabricService.requestAccess(doctorId, did);
          const accessMs = Number(elapsedMs(t3));

          const t4 = nowBigInt();
          let fetched;
          try { fetched = await ipfsService.downloadFile(cid); } catch (e) { fetched = envelopeBytes; }
          const fHash = crypto.createHash('sha256').update(fetched).digest('hex');
          if (fHash !== payloadHash) throw new Error(`Hash mismatch on ${did}`);
          const fe = JSON.parse(fetched.toString('utf8'));
          const recovered = await cryptoService.decryptBroadcastFile(fe, publicKey, sk);
          if (!recovered.equals(plaintext)) throw new Error(`Plaintext mismatch on ${did}`);
          const dlDecMs = Number(elapsedMs(t4));

          return { encryptMs, ipfsMs, fabricMs, accessMs, dlDecMs };
        })())
      );

      for (const p of batchOps) {
        phaseData.encrypt.push(p.encryptMs);
        phaseData.ipfsUpload.push(p.ipfsMs);
        phaseData.fabricStore.push(p.fabricMs);
        phaseData.requestAccess.push(p.accessMs);
        phaseData.downloadDecrypt.push(p.dlDecMs);
        phaseData.total.push(p.encryptMs + p.ipfsMs + p.fabricMs + p.accessMs + p.dlDecMs);
      }
    }

    // Record phase stats
    for (const [phase, vals] of Object.entries(phaseData)) {
      if (vals.length > 0) {
        rows.push(formatRow('e2e', phase, bs, '-', '-', vals, `,${phase}`));
      }
    }

    const avgTotal = roundTo(mean(phaseData.total));
    const avgStore = roundTo(mean(phaseData.fabricStore));
    const avgAccess = roundTo(mean(phaseData.requestAccess));
    console.log(`    total=${avgTotal}ms  fabric-store=${avgStore}ms  request-access=${avgAccess}ms`);
  }

  // ────────────────────────────────────────────
  // Batch test: concurrent storeHash via pool
  // ────────────────────────────────────────────
  console.log('\n  [Batch] Concurrent storeHash via gateway pool');
  for (const bs of blockSizes) {
    const times = [];
    for (let r = 0; r < BGW_RUNS; r++) {
      const ops = await Promise.all(
        Array.from({ length: bs }, (_, i) => (async () => {
          const did = `e2e_batch_${suffix}_bs${bs}_r${r}_${i}`;
          const envelope = await cryptoService.encryptFileForRecipients(plaintext, publicKey, recipientIds, {
            dataId: did, patientId: `pat_e2e_${suffix}`, level: 'L0', category: 'benchmark',
            filename: 'e2e.bin', mimetype: 'application/octet-stream'
          });
          const envelopeBytes = Buffer.from(JSON.stringify(envelope));
          const payloadHash = crypto.createHash('sha256').update(envelopeBytes).digest('hex');
          let cid;
          try { cid = await ipfsService.uploadFile(envelopeBytes); } catch (e) { cid = `mock-${did}`; }
          return { did, cid, envelope, payloadHash };
        })())
      );
      const pool = await ensurePool(bs);
      const start = nowBigInt();
      await Promise.all(ops.map((o, i) => {
        const contract = pool.getContract(i);
        const hb = {
          bgwHeader: o.envelope.bgwHeader, updateToken: o.envelope.updateToken || '',
          authorizedUsers: [doctorId], grantedUsers: [], revokedUsers: [],
          payloadHash: o.payloadHash, category: 'benchmark',
          metadata: { filename: 'e2e.bin', recipients: [1] }
        };
        return contract.submitTransaction('DataStorage:storeHash', o.did, `pat_e2e_${suffix}`,
          o.cid, JSON.stringify(hb), 'L0');
      }));
      const totalMs = Number(elapsedMs(start));
      times.push(totalMs);
    }
    rows.push(formatRow('e2e', 'batch-storeHash', bs, bs, '-', times, ',batch'));
    const avgBatch = roundTo(mean(times));
    const perTx = roundTo(mean(times) / bs);
    console.log(`    blockSize=${bs} total=${avgBatch}ms per-tx=${perTx}ms`);
  }

  await disconnectPool();
  const filePath = reportToCsv(CSV_FILE, HEADER, rows);
  console.log(`\nResults written to: ${filePath}\n`);
  return rows;
}

if (require.main === module) {
  runE2eBenchmark({ runs: 3 }).catch(err => { console.error('E2E benchmark failed:', err); process.exit(1); });
}

module.exports = { runE2eBenchmark };
