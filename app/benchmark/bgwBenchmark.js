'use strict';

const bgw = require('../services/broadcast');
const { mean, median, stddev, roundTo, formatRow, formatHeader } = require('./lib/stats');
const { measure, warmup, reportToCsv } = require('./lib/helpers');

const PAYLOAD = Buffer.from('Benchmark test payload for BGW broadcast encryption ' + 'x'.repeat(1024));
const CSV_FILE = 'bgw-benchmark.csv';
const HEADER = formatHeader(',throughputAvg');

async function runBgwBenchmark() {
  console.log('=== BGW Broadcast Encryption Microbenchmarks ===\n');
  await bgw.init();
  const rows = [];
  const runs = 7;
  const recipientCounts = [1, 5, 10, 25, 50, 75, 100];

  // Warmup: run one encrypt to prime WASM JIT
  {
    const { publicKey: wpk, masterSecret: wms } = await bgw.setup({ n: 10 });
    const wIds = [1, 2, 3];
    await warmup(() => bgw.encrypt(wpk, wIds, Buffer.from('warmup')), 2);
  }

  async function runAndRecord(label, rCount, fn) {
    const times = [];
    for (let r = 0; r < runs; r++) {
      const { elapsed } = await measure(fn);
      times.push(elapsed);
    }
    const avg = mean(times);
    const med = median(times);
    const throughput = avg > 0 ? roundTo(1000 / avg, 2) : 0;
    rows.push(formatRow('bgw', label, '-', rCount, '-', times, `,${throughput}`));
    console.log(`  ${label.padEnd(25)} recipients=${String(rCount).padEnd(4)} ` +
      `avg=${roundTo(avg)}ms  med=${roundTo(med)}ms  stddev=${roundTo(stddev(times))}ms  ${throughput} ops/s`);
  }

  // Setup with varying n
  for (const n of recipientCounts) {
    await runAndRecord('setup', n, () => bgw.setup({ n }));
  }

  // Use a large setup for all subsequent tests
  const { publicKey, masterSecret } = await bgw.setup({ n: 120 });

  // Keygen for varying recipient counts
  for (const n of recipientCounts) {
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    await runAndRecord('keygen', n, () => Promise.all(ids.map(id => bgw.keygen(masterSecret, id, publicKey))));
  }

  // Encrypt with varying recipient counts
  for (const n of recipientCounts) {
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    await runAndRecord('encrypt', n, () => bgw.encrypt(publicKey, ids, PAYLOAD, { exportUpdateToken: true }));
  }

  // Decrypt (authorized) with varying recipient counts
  for (const n of recipientCounts) {
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const result = await bgw.encrypt(publicKey, ids, PAYLOAD, { exportUpdateToken: true });
    const sk = await bgw.keygen(masterSecret, 1, publicKey);
    await runAndRecord('decrypt', n, () => bgw.decrypt(publicKey, result.header, sk, result.encryptedPayload));
  }

  // Unauthorized decrypt: must fail
  console.log('\n  --- Unauthorized decrypt check ---');
  for (const n of recipientCounts) {
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const result = await bgw.encrypt(publicKey, ids, PAYLOAD, { exportUpdateToken: true });
    const outsiderSk = await bgw.keygen(masterSecret, n + 1, publicKey);
    let failed = false;
    try {
      await bgw.decrypt(publicKey, result.header, outsiderSk, result.encryptedPayload);
    } catch (e) { failed = true; }
    if (!failed) { console.error(`  FAIL: unauthorized decrypt succeeded for n=${n}`); process.exit(1); }
  }
  console.log('  [PASS] All unauthorized decrypt attempts correctly rejected.\n');

  // UpdateHeader
  for (const n of recipientCounts) {
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const result = await bgw.encrypt(publicKey, ids, PAYLOAD, { exportUpdateToken: true });
    await runAndRecord('updateHeader-add', n, () =>
      bgw.addRecipients(publicKey, result.header, [n + 1], { updateToken: result.updateToken }));
    if (n >= 2) {
      const withAll = await bgw.addRecipients(publicKey, result.header, [...ids, n + 1], { updateToken: result.updateToken });
      await runAndRecord('updateHeader-remove', n, () =>
        bgw.removeRecipients(publicKey, withAll, [n], { updateToken: result.updateToken }));
    }
  }

  // Encapsulate + deriveGT
  for (const n of recipientCounts) {
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    await runAndRecord('encapsulate', n, () => bgw.encapsulate(publicKey, ids));
  }
  for (const n of recipientCounts) {
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const result = await bgw.encrypt(publicKey, ids, PAYLOAD, { exportUpdateToken: true });
    const sk = await bgw.keygen(masterSecret, 1, publicKey);
    await runAndRecord('deriveGT', n, () => bgw.deriveGT(publicKey, result.header, sk));
  }

  const filePath = reportToCsv(CSV_FILE, HEADER, rows);
  console.log(`Results written to: ${filePath}\n`);
  return rows;
}

if (require.main === module) {
  runBgwBenchmark().catch(err => { console.error('BGW benchmark failed:', err); process.exit(1); });
}

module.exports = { runBgwBenchmark };
