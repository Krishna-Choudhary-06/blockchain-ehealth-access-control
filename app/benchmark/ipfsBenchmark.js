'use strict';

const crypto = require('crypto');
const cryptoService = require('../services/cryptoService');
const ipfsService = require('../services/ipfsService');
const { mean, median, stddev, roundTo, formatRow, formatHeader } = require('./lib/stats');
const { measure, warmup, reportToCsv } = require('./lib/helpers');

const CSV_FILE = 'ipfs-benchmark.csv';
const HEADER = formatHeader(',payloadBytes,commBytes');

async function runIpfsBenchmark() {
  console.log('=== IPFS + Envelope Workflow Benchmarks ===\n');
  const rows = [];
  const runs = 5;
  const payloadSizes = [256, 1024, 10240, 102400, 1048576];

  const { publicKey, masterSecret } = await cryptoService.setupBroadcast(50);
  const recipientIds = [1, 2, 3, 4, 5];

  // Warmup: upload and download a small payload to prime connections
  {
    const wBuf = Buffer.from('warmup-payload');
    try {
      const wCid = await ipfsService.uploadFile(wBuf);
      await warmup(() => ipfsService.downloadFile(wCid), 1);
    } catch (e) { /* IPFS may not be available; skip warmup */ }
  }

  for (const size of payloadSizes) {
    const plaintext = Buffer.from('x'.repeat(size));
    const envelope = await cryptoService.encryptFileForRecipients(plaintext, publicKey, recipientIds, {
      dataId: 'bench-ipfs', patientId: 'bench-pat', level: 'L0', category: 'benchmark',
      filename: 'bench.bin', mimetype: 'application/octet-stream'
    });
    const envelopeBytes = Buffer.from(JSON.stringify(envelope));
    const payloadHash = crypto.createHash('sha256').update(envelopeBytes).digest('hex');
    const commBytes = envelopeBytes.length; // bytes sent to IPFS

    // Upload to IPFS
    let cid;
    try { cid = await ipfsService.uploadFile(envelopeBytes); } catch (e) { cid = `mock-cid-${Date.now()}`; }
    const uploadTimes = [];
    for (let r = 0; r < runs; r++) {
      const { elapsed } = await measure(() => ipfsService.uploadFile(envelopeBytes));
      uploadTimes.push(elapsed);
    }
    rows.push(formatRow('ipfs', 'upload', '-', String(size), '-', uploadTimes, `,${size},${commBytes}`));
    const upAvg = mean(uploadTimes);

    // Download
    const dlTimes = [];
    for (let r = 0; r < runs; r++) {
      const { elapsed } = await measure(() => ipfsService.downloadFile(cid));
      dlTimes.push(elapsed);
    }
    rows.push(formatRow('ipfs', 'download', '-', String(size), '-', dlTimes, `,${size},${commBytes}`));
    const dlAvg = mean(dlTimes);

    // Download + hash verify
    const dvTimes = [];
    for (let r = 0; r < runs; r++) {
      const { elapsed } = await measure(async () => {
        const fetched = await ipfsService.downloadFile(cid);
        const hash = crypto.createHash('sha256').update(fetched).digest('hex');
        if (hash !== payloadHash) throw new Error('Hash mismatch');
      });
      dvTimes.push(elapsed);
    }
    rows.push(formatRow('ipfs', 'download+verify', '-', String(size), '-', dvTimes, `,${size},${commBytes}`));

    // Full: download + decrypt
    const sk = await cryptoService.generateBroadcastPrivateKey(masterSecret, 1, publicKey);
    const ddTimes = [];
    for (let r = 0; r < runs; r++) {
      const { elapsed } = await measure(async () => {
        const fetched = await ipfsService.downloadFile(cid);
        const fe = JSON.parse(fetched.toString('utf8'));
        const recovered = await cryptoService.decryptBroadcastFile(fe, publicKey, sk);
        if (!recovered.equals(plaintext)) throw new Error('Decrypt mismatch');
      });
      ddTimes.push(elapsed);
    }
    rows.push(formatRow('ipfs', 'download+decrypt', '-', String(size), '-', ddTimes, `,${size},${commBytes}`));

    const ddAvg = mean(ddTimes);
    console.log(`  size=${String(size).padEnd(8)}B  envelope=${String(commBytes).padEnd(8)}B  ` +
      `upload=${roundTo(upAvg)}ms (med=${roundTo(median(uploadTimes))})  download=${roundTo(mean(dlTimes))}ms (med=${roundTo(median(dlTimes))})  full=${roundTo(ddAvg)}ms`);
  }

  const filePath = reportToCsv(CSV_FILE, HEADER, rows);
  console.log(`\nResults written to: ${filePath}\n`);
  return rows;
}

if (require.main === module) {
  runIpfsBenchmark().catch(err => { console.error('IPFS benchmark failed:', err); process.exit(1); });
}

module.exports = { runIpfsBenchmark };
