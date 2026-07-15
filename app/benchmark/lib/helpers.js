'use strict';

const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '..', 'results');

function ensureResultsDir() {
  fs.mkdirSync(resultsDir, { recursive: true });
}

function elapsedMs(start) {
  return (process.hrtime.bigint() - start) / 1_000_000n;
}

function nowBigInt() {
  return process.hrtime.bigint();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function warmup(fn, count = 3) {
  for (let i = 0; i < count; i++) {
    await fn();
  }
}

async function measure(fn) {
  const start = nowBigInt();
  const result = await fn();
  const elapsed = Number(elapsedMs(start));
  return { result, elapsed };
}

function reportToCsv(filename, header, rows) {
  ensureResultsDir();
  const filePath = path.join(resultsDir, filename);
  const data = [header, ...rows].join('\n') + '\n';
  fs.writeFileSync(filePath, data);
  return filePath;
}

function reportToJson(filename, data) {
  ensureResultsDir();
  const filePath = path.join(resultsDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

module.exports = {
  ensureResultsDir, elapsedMs, nowBigInt, sleep, warmup, measure,
  reportToCsv, reportToJson
};
