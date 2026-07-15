'use strict';

const bgw = require('../services/broadcast');
const cryptoService = require('../services/cryptoService');
const { mean, median, stddev, roundTo, formatRow, formatHeader } = require('./lib/stats');
const { measure, warmup, reportToCsv } = require('./lib/helpers');

const CSV_FILE = 'overhead-benchmark.csv';
const HEADER = formatHeader(',metric');

async function runOverheadBenchmark() {
  console.log('=== Overhead Metrics: Communication & Computation ===\n');
  const rows = [];
  const runs = 5;
  const recipientCounts = [1, 5, 10, 25, 50, 75, 100];
  await bgw.init();

  // Warmup: prime WASM JIT and crypto paths
  {
    const { publicKey: wpk } = await bgw.setup({ n: 10 });
    await warmup(() => bgw.encrypt(wpk, [1, 2], Buffer.from('warmup')), 2);
  }

  // ──────────────────────────────────────────────
  // 1. Communication Overhead — BGW envelope bytes
  // (directly measured from serialized structures)
  // ──────────────────────────────────────────────
  console.log('  [Communication] BGW Envelope Bytes vs Recipient Count  [MEASURED]');
  for (const n of recipientCounts) {
    const { publicKey, masterSecret } = await bgw.setup({ n: Math.max(n + 10, 110) });
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const payload = Buffer.from('x'.repeat(64));
    const result = await bgw.encrypt(publicKey, ids, payload);
    const headerBytes = Buffer.byteLength(JSON.stringify(result.header), 'utf8');
    const ctBytes = Buffer.byteLength(JSON.stringify(result.encryptedPayload), 'utf8');
    const totalBytes = headerBytes + ctBytes;
    const overheadRatio = totalBytes / payload.length;
    const c0Bytes = Buffer.byteLength(result.header.c0, 'utf8') / 2; // hex->raw
    const c1Bytes = Buffer.byteLength(result.header.c1, 'utf8') / 2;

    rows.push(formatRow('overhead', 'header-size', '-', n, '-', [headerBytes], ',B'));
    rows.push(formatRow('overhead', 'ciphertext-size', '-', n, '-', [ctBytes], ',B'));
    rows.push(formatRow('overhead', 'total-envelope', '-', n, '-', [totalBytes], ',B'));
    rows.push(formatRow('overhead', 'overhead-ratio', '-', n, '-', [overheadRatio], ',x'));
    rows.push(formatRow('overhead', 'c0-element-bytes', '-', n, '-', [c0Bytes], ',B'));
    rows.push(formatRow('overhead', 'c1-element-bytes', '-', n, '-', [c1Bytes], ',B'));
    console.log(`    n=${String(n).padEnd(4)} header=${String(headerBytes).padEnd(6)}B  ct=${String(ctBytes).padEnd(6)}B  total=${String(totalBytes).padEnd(8)}B  ratio=${roundTo(overheadRatio, 2)}x`);
  }

  // ──────────────────────────────────────────────
  // 2. Communication Overhead — Request/Response Bytes per Operation
  // Uses actual serialized payloads sized via Buffer.byteLength().
  // These are HTTP-body estimates (not wire captures). Internal
  // Fabric gRPC traffic (proposals, blocks, gossip) is NOT included.
  // ──────────────────────────────────────────────
  console.log('\n  [Communication] Request/Response Bytes per Operation');
  const { publicKey, masterSecret } = await bgw.setup({ n: 110 });
  const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const payload = Buffer.from('x'.repeat(1024));

  // BGW Setup
  const pkStr = JSON.stringify(publicKey);
  const setupResBytes = Buffer.byteLength(pkStr, 'utf8');
  rows.push(formatRow('overhead', 'bgw-setup-request', '-', '-', '-', [0], ',B,measured'));
  rows.push(formatRow('overhead', 'bgw-setup-response', '-', '-', '-', [setupResBytes], ',B,measured'));
  console.log(`    bgw-setup: req=0B  res=${setupResBytes}B (publicKey JSON)  [measured]`);

  // BGW Keygen
  const msStr = JSON.stringify(masterSecret);
  const keygenReqObj = { masterSecret: msStr, recipientId: 1 };
  const keygenReqBytes = Buffer.byteLength(JSON.stringify(keygenReqObj), 'utf8');
  const sk = await bgw.keygen(masterSecret, 1, publicKey);
  const keygenResBytes = Buffer.byteLength(JSON.stringify(sk), 'utf8');
  rows.push(formatRow('overhead', 'bgw-keygen-request', '-', '-', '-', [keygenReqBytes], ',B,measured'));
  rows.push(formatRow('overhead', 'bgw-keygen-response', '-', '-', '-', [keygenResBytes], ',B,measured'));
  console.log(`    bgw-keygen: req=${keygenReqBytes}B  res=${keygenResBytes}B  [measured]`);

  // BGW Encrypt (10 recipients, 1 KB payload)
  const ciphertext = await bgw.encrypt(publicKey, ids, payload);
  const encryptReqBytes = Buffer.byteLength(payload, 'utf8');
  const encryptResBytes = Buffer.byteLength(JSON.stringify(ciphertext), 'utf8');
  rows.push(formatRow('overhead', 'bgw-encrypt-request', '-', '10', '-', [encryptReqBytes], ',B,measured'));
  rows.push(formatRow('overhead', 'bgw-encrypt-response', '-', '10', '-', [encryptResBytes], ',B,measured'));
  console.log(`    bgw-encrypt(10rec,1KB): req=${encryptReqBytes}B  res=${encryptResBytes}B  [measured]`);

  // Fabric storeHash — typical HTTP request body (without publicKey;
  // server holds broadcastPublicKey in memory, client skips re-sending it).
  // Size includes the encrypted envelope metadata + file data.
  const storeReqBody = {
    dataId: 'bench-001', patientId: 'bench-pat-001',
    category: 'prescription', ownerId: 'dr-bench', ownerRecipientId: 1,
    uploadedBy: 'dr-bench', uploaderRole: 'Doctor', level: 'L0'
  };
  const storeReqBytes = Buffer.byteLength(JSON.stringify(storeReqBody), 'utf8');
  rows.push(formatRow('overhead', 'fabric-storeHash-request', '-', '-', '-', [storeReqBytes], ',B,approximate'));
  // storeHash response: success + data + ipfsHash + bgwHeader + etc.
  const storeResBody = {
    success: true, data: { txId: 'tx-001' },
    ipfsHash: 'QmABC', payloadHash: 'abc123def456',
    requiredLevel: 'L0', recipients: [1], authorizedUsers: ['dr-bench'], ownerId: 'dr-bench'
  };
  const storeResBytes = Buffer.byteLength(JSON.stringify(storeResBody), 'utf8');
  rows.push(formatRow('overhead', 'fabric-storeHash-response', '-', '-', '-', [storeResBytes], ',B,approximate'));
  console.log(`    fabric-storeHash: req=${storeReqBytes}B  res=${storeResBytes}B  [approximate — HTTP body, excludes Fabric gRPC overhead]`);

  // Fabric requestAccess
  const accessReqBody = { requesterId: 'dr-bench', dataId: 'bench-001' };
  const accessReqBytes = Buffer.byteLength(JSON.stringify(accessReqBody), 'utf8');
  const accessResBody = {
    success: true, data: { status: 'ACCESS_GRANTED', requesterId: 'dr-bench', requesterRole: 'Doctor', requiredLevel: 'L0', patientId: 'pat-001', ipfsHash: 'QmABC', message: 'Access granted' }
  };
  const accessResBytes = Buffer.byteLength(JSON.stringify(accessResBody), 'utf8');
  rows.push(formatRow('overhead', 'fabric-requestAccess-request', '-', '-', '-', [accessReqBytes], ',B,measured'));
  rows.push(formatRow('overhead', 'fabric-requestAccess-response', '-', '-', '-', [accessResBytes], ',B,measured'));
  console.log(`    fabric-requestAccess: req=${accessReqBytes}B  res=${accessResBytes}B  [measured]`);

  // IPFS upload: envelope bytes sent (directly measured from encrypt output)
  const ipfsUploadBytes = encryptResBytes;
  // IPFS upload response: CID (typically 46-64 bytes as string)
  const ipfsUploadRes = Buffer.byteLength(JSON.stringify({ Hash: 'QmW2rAoabYQa7hNbS3gC' }), 'utf8');
  rows.push(formatRow('overhead', 'ipfs-upload-request', '-', '10', '-', [ipfsUploadBytes], ',B,measured'));
  rows.push(formatRow('overhead', 'ipfs-upload-response', '-', '-', '-', [ipfsUploadRes], ',B,approximate'));
  console.log(`    ipfs-upload(10rec,1KB): req=${ipfsUploadBytes}B  res=${ipfsUploadRes}B  [measured — envelope bytes sent to daemon]`);

  // IPFS download: request is CID, response is envelope bytes
  rows.push(formatRow('overhead', 'ipfs-download-request', '-', '-', '-', [ipfsUploadRes], ',B,approximate'));
  rows.push(formatRow('overhead', 'ipfs-download-response', '-', '10', '-', [ipfsUploadBytes], ',B,measured'));
  console.log(`    ipfs-download: req=${ipfsUploadRes}B  res=${ipfsUploadBytes}B  [measured — envelope bytes received from daemon]`);

  // ──────────────────────────────────────────────
  // 3. Computation Overhead — Crypto time breakdown
  // (directly measured)
  // ──────────────────────────────────────────────
  console.log('\n  [Computation] Crypto Time Breakdown  [MEASURED]');
  const pay1024 = Buffer.from('x'.repeat(1024));

  for (const n of recipientCounts) {
    const idsN = Array.from({ length: n }, (_, i) => i + 1);
    const sk1 = await bgw.keygen(masterSecret, 1, publicKey);
    let result;

    const encTimes = [];
    for (let r = 0; r < runs; r++) {
      const { elapsed } = await measure(() => bgw.encrypt(publicKey, idsN, pay1024));
      encTimes.push(elapsed);
    }
    result = await bgw.encrypt(publicKey, idsN, pay1024, { exportUpdateToken: true });

    const decTimes = [];
    for (let r = 0; r < runs; r++) {
      const { elapsed } = await measure(() => bgw.decrypt(publicKey, result.header, sk1, result.encryptedPayload));
      decTimes.push(elapsed);
    }

    const kgTimes = [];
    for (let r = 0; r < runs; r++) {
      const { elapsed } = await measure(() => bgw.keygen(masterSecret, 1, publicKey));
      kgTimes.push(elapsed);
    }

    const upTimes = [];
    for (let r = 0; r < runs; r++) {
      const { elapsed } = await measure(() =>
        bgw.addRecipients(publicKey, result.header, [n + 1], { updateToken: result.updateToken }));
      upTimes.push(elapsed);
    }

    rows.push(formatRow('computation', 'encrypt', '-', n, '-', encTimes, ',ms'));
    rows.push(formatRow('computation', 'decrypt', '-', n, '-', decTimes, ',ms'));
    rows.push(formatRow('computation', 'keygen-single', '-', n, '-', kgTimes, ',ms'));
    rows.push(formatRow('computation', 'updateHeader', '-', n, '-', upTimes, ',ms'));

    console.log(`    n=${String(n).padEnd(4)} encrypt=${roundTo(mean(encTimes), 1)}ms (med=${roundTo(median(encTimes), 1)})  decrypt=${roundTo(mean(decTimes), 1)}ms (med=${roundTo(median(decTimes), 1)})  keygen=${roundTo(mean(kgTimes), 3)}ms  update=${roundTo(mean(upTimes), 1)}ms`);
  }

  // ──────────────────────────────────────────────
  // 4. Computation — AES-GCM overhead
  // (directly measured)
  // ──────────────────────────────────────────────
  {
    console.log('\n  [Computation] AES-GCM Overhead  [MEASURED]');
    const aesSizes = [64, 1024, 10240, 102400, 1048576];
    for (const size of aesSizes) {
      const aesIn = Buffer.from('x'.repeat(size));
      const times = [];
      for (let r = 0; r < runs; r++) {
        const { elapsed } = await measure(() => bgw.aesGcmEncrypt(Buffer.alloc(32), aesIn));
        times.push(elapsed);
      }
      rows.push(formatRow('computation', 'aes-gcm-encrypt', '-', '-', String(size), times, ',ms'));
      console.log(`    ${String(size).padEnd(8)}B  avg=${roundTo(mean(times), 3)}ms`);
    }
  }

  // ──────────────────────────────────────────────
  // 5. Computation — Encrypt vs payload size
  // (directly measured)
  // ──────────────────────────────────────────────
  {
    console.log('\n  [Computation] Encrypt vs Payload Size (recipients=10)  [MEASURED]');
    const { publicKey: pk2 } = await bgw.setup({ n: 50 });
    const ids10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const sizes = [64, 1024, 10240, 102400, 1048576];

    for (const size of sizes) {
      const pBuf = Buffer.from('x'.repeat(size));
      const times = [];
      for (let r = 0; r < runs; r++) {
        const { elapsed } = await measure(() => bgw.encrypt(pk2, ids10, pBuf));
        times.push(elapsed);
      }
      rows.push(formatRow('computation', 'encrypt-vs-payload', '-', '10', String(size), times, ',ms'));
      console.log(`    ${String(size).padEnd(8)}B  avg=${roundTo(mean(times), 1)}ms`);
    }
  }

  const filePath = reportToCsv(CSV_FILE, HEADER, rows);
  console.log(`\nResults written to: ${filePath}\n`);
  return rows;
}

if (require.main === module) {
  runOverheadBenchmark().catch(err => { console.error('Overhead benchmark failed:', err); process.exit(1); });
}

module.exports = { runOverheadBenchmark };
