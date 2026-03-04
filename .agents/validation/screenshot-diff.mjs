#!/usr/bin/env node

/**
 * Screenshot diff tool using pixelmatch.
 *
 * Usage:
 *   node .agents/validation/screenshot-diff.mjs <baseline-dir> <after-dir> [--threshold <pct>]
 *
 * Compares PNG files in baseline-dir against after-dir.
 * Outputs diff images to a sibling "diff" directory and a JSON summary.
 * Prints SCREENSHOT_DIFF_PASS or SCREENSHOT_DIFF_FAIL based on threshold.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const args = process.argv.slice(2);
let baselineDir = null;
let afterDir = null;
let threshold = 1; // percent

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--threshold' && args[i + 1]) {
    threshold = parseFloat(args[i + 1]);
    i++;
  } else if (!baselineDir) {
    baselineDir = args[i];
  } else if (!afterDir) {
    afterDir = args[i];
  }
}

if (!baselineDir || !afterDir) {
  console.error('Usage: screenshot-diff.mjs <baseline-dir> <after-dir> [--threshold <pct>]');
  process.exit(1);
}

const diffDir = path.join(path.dirname(afterDir), 'diff');
await fs.mkdir(diffDir, { recursive: true });

function readPNG(filePath) {
  return new Promise((resolve, reject) => {
    const data = [];
    const rs = require('node:fs').createReadStream(filePath);
    rs.pipe(new PNG())
      .on('parsed', function () { resolve(this); })
      .on('error', reject);
  });
}

// Use dynamic import-friendly approach
async function loadPNG(filePath) {
  const buffer = await fs.readFile(filePath);
  return new Promise((resolve, reject) => {
    new PNG().parse(buffer, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

async function writePNG(png, filePath) {
  const buffer = PNG.sync.write(png);
  await fs.writeFile(filePath, buffer);
}

// Get all PNG files from baseline
const baselineFiles = (await fs.readdir(baselineDir))
  .filter(f => f.endsWith('.png'))
  .filter(f => !f.startsWith('debug') && f !== 'run.json');

const results = [];
let maxDiffPct = 0;
let hasFailure = false;

for (const file of baselineFiles) {
  const baselinePath = path.join(baselineDir, file);
  const afterPath = path.join(afterDir, file);

  try {
    await fs.access(afterPath);
  } catch {
    results.push({ file, status: 'missing', diffPct: 100 });
    maxDiffPct = 100;
    hasFailure = true;
    console.log(`  ${file}: MISSING in after directory`);
    continue;
  }

  const baselineImg = await loadPNG(baselinePath);
  const afterImg = await loadPNG(afterPath);

  const width = Math.max(baselineImg.width, afterImg.width);
  const height = Math.max(baselineImg.height, afterImg.height);

  // If dimensions differ, pad the smaller image
  const padded = (img) => {
    if (img.width === width && img.height === height) return img;
    const out = new PNG({ width, height });
    PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
    return out;
  };

  const b = padded(baselineImg);
  const a = padded(afterImg);

  const diff = new PNG({ width, height });
  const numDiffPixels = pixelmatch(
    b.data, a.data, diff.data,
    width, height,
    { threshold: 0.1, alpha: 0.3 }
  );

  const totalPixels = width * height;
  const diffPct = (numDiffPixels / totalPixels) * 100;

  if (diffPct > maxDiffPct) maxDiffPct = diffPct;
  if (diffPct > threshold) hasFailure = true;

  const status = diffPct > threshold ? 'FAIL' : 'PASS';
  results.push({ file, status, diffPct: Math.round(diffPct * 100) / 100, numDiffPixels, totalPixels });

  // Write diff image if there are differences
  if (numDiffPixels > 0) {
    await writePNG(diff, path.join(diffDir, file));
  }

  const icon = status === 'PASS' ? '  ' : '  ';
  console.log(`${icon}${file}: ${diffPct.toFixed(2)}% diff (${numDiffPixels}/${totalPixels} pixels) — ${status}`);
}

// Check for files in after that aren't in baseline (new screenshots)
const afterFiles = (await fs.readdir(afterDir))
  .filter(f => f.endsWith('.png'))
  .filter(f => !f.startsWith('debug'));

for (const file of afterFiles) {
  if (!baselineFiles.includes(file)) {
    results.push({ file, status: 'new', diffPct: 0 });
    console.log(`  ${file}: NEW (not in baseline)`);
  }
}

// Write summary JSON
const summary = {
  timestamp: new Date().toISOString(),
  baselineDir,
  afterDir,
  diffDir,
  threshold,
  maxDiffPct: Math.round(maxDiffPct * 100) / 100,
  result: hasFailure ? 'FAIL' : 'PASS',
  files: results,
};

await fs.writeFile(
  path.join(diffDir, 'summary.json'),
  JSON.stringify(summary, null, 2) + '\n'
);

// Print verdict
console.log('');
if (hasFailure) {
  console.log(`SCREENSHOT_DIFF_FAIL — Max diff: ${maxDiffPct.toFixed(2)}% (threshold: ${threshold}%)`);
  process.exit(1);
} else {
  console.log(`SCREENSHOT_DIFF_PASS — Max diff: ${maxDiffPct.toFixed(2)}% (threshold: ${threshold}%)`);
}
