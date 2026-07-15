'use strict';

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function min(values) {
  return values.length ? Math.min(...values) : 0;
}

function max(values) {
  return values.length ? Math.max(...values) : 0;
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function trimmedMean(values, trim = 0.2) {
  if (values.length < 3) return mean(values);
  const sorted = [...values].sort((a, b) => a - b);
  const k = Math.max(1, Math.floor(sorted.length * trim));
  const trimmed = sorted.slice(k, sorted.length - k);
  return trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
}

function stddev(values, avg) {
  if (values.length < 2) return 0;
  const m = avg ?? mean(values);
  const sqDiffs = values.map(v => (v - m) ** 2);
  return Math.sqrt(sqDiffs.reduce((s, v) => s + v, 0) / (values.length - 1));
}

function roundTo(v, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(v * factor) / factor;
}

function formatRow(header, label, blockSize, concurrency, tps, runs, meta = '') {
  const avg = roundTo(mean(runs));
  const stdev = roundTo(stddev(runs));
  const mn = roundTo(min(runs));
  const mx = roundTo(max(runs));
  return `${header},${label},${blockSize},${concurrency},${tps},${runs.length},${mn},${mx},${avg},${stdev}${meta}`;
}

function formatHeader(extra = '') {
  return `header,label,blockSize,concurrency,tps,runs,min,max,avg,stddev${extra}`;
}

module.exports = { mean, median, trimmedMean, min, max, stddev, roundTo, formatRow, formatHeader };
