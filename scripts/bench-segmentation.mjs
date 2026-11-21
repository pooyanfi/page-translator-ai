#!/usr/bin/env node
/* Dev-only segmentation benchmark: `node scripts/bench-segmentation.mjs`.
 *
 * It answers one question with numbers instead of opinions: how much sentence
 * context does the translator actually send to the model? The "legacy" column
 * is an independent text-node collector (the 1.2.0 behaviour); the "units"
 * column is the current block collector. No API key is needed.
 *
 * Add --json for machine-readable output.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPage } from '../tests/helpers/load.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAMPLES_DIR = path.join(ROOT, 'bench', 'samples');

const LEGACY_SKIP = new Set([
  'SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'CANVAS', 'SVG', 'MATH', 'IFRAME',
  'TEXTAREA', 'INPUT', 'TITLE'
]);

/* The 1.2.0 collector: every text node with a letter is its own segment. */
function legacySegments(document) {
  const out = [];
  const walker = document.createTreeWalker(document.body, 4);
  let node;
  while ((node = walker.nextNode())) {
    const text = node.data.trim();
    if (!text || !/\p{L}/u.test(text)) continue;
    let excluded = false;
    for (let el = node.parentElement; el; el = el.parentElement) {
      if (LEGACY_SKIP.has(el.tagName)) { excluded = true; break; }
      if (el.getAttribute('translate') === 'no' || el.classList.contains('notranslate')) { excluded = true; break; }
    }
    if (!excluded) out.push(text);
  }
  return out;
}

const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

const stats = (texts) => {
  const lengths = texts.map((t) => t.length);
  const total = lengths.reduce((sum, n) => sum + n, 0);
  return {
    count: texts.length,
    chars: total,
    avg: texts.length ? Math.round(total / texts.length) : 0,
    median: median(lengths),
    fragments: texts.filter((t) => t.length < 25).length
  };
};

function fileNames() {
  return fs.readdirSync(SAMPLES_DIR).filter((name) => name.endsWith('.html')).sort();
}

function runOne(file) {
  const html = fs.readFileSync(path.join(SAMPLES_DIR, file), 'utf8');
  const { AIPT, document } = loadPage({ html, url: 'https://example.com/' + file });

  const legacy = stats(legacySegments(document));
  const collected = AIPT.Dom.collect(document.body);
  const units = collected.units.map((unit) => unit.text.replace(/<\/?[tv]\d+\s*\/?>/g, ''));
  const current = stats(units);

  const tokenised = collected.units.filter((unit) => unit.tokenCount > 0).length;
  const tokens = collected.units.reduce((sum, unit) => sum + unit.tokenCount, 0);
  const labels = collected.attrs.length;

  return {
    file,
    legacy,
    units: current,
    sentencesPerUnit: current.count ? Math.round((legacy.count / current.count) * 10) / 10 : 0,
    tokenisedUnits: tokenised,
    inlineTokens: tokens,
    labels
  };
}

const results = fileNames().map(runOne);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ results }, null, 2));
  process.exit(0);
}

const pad = (value, width) => String(value).padEnd(width);
console.log('Segmentation benchmark — legacy text-node collector vs block units');
console.log('');
console.log(
  pad('sample', 14) + pad('legacy', 8) + pad('units', 7) + pad('merge', 7) +
  pad('avg chars', 11) + pad('fragments', 11) + pad('tokens', 8) + 'labels'
);
console.log('-'.repeat(76));
for (const r of results) {
  console.log(
    pad(r.file, 14) +
    pad(r.legacy.count, 8) +
    pad(r.units.count, 7) +
    pad(r.sentencesPerUnit + 'x', 7) +
    pad(r.units.avg, 11) +
    pad(r.legacy.fragments + '→' + r.units.fragments, 11) +
    pad(r.inlineTokens, 8) +
    r.labels
  );
}

const legacyTotal = results.reduce((sum, r) => sum + r.legacy.count, 0);
const unitTotal = results.reduce((sum, r) => sum + r.units.count, 0);
const charTotal = results.reduce((sum, r) => sum + r.units.chars, 0);
console.log('-'.repeat(76));
console.log(
  pad('TOTAL', 14) +
  pad(legacyTotal, 8) +
  pad(unitTotal, 7) +
  pad(unitTotal ? Math.round((legacyTotal / unitTotal) * 10) / 10 + 'x' : '0x', 7) +
  pad(unitTotal ? Math.round(charTotal / unitTotal) : 0, 11)
);
console.log('');
console.log('legacy  = number of text-node segments the old pipeline sent (sentences split at every link/emphasis)');
console.log('units   = number of whole-block segments the current pipeline sends');
console.log('merge   = legacy segments per unit (higher = more context recovered)');
console.log('fragments = segments shorter than 25 characters (legacy → current)');
console.log('tokens  = inline elements preserved as <tN>/<vN/> placeholders');
