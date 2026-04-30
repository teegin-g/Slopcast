import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const root = process.cwd();
const distDir = join(root, 'dist');
const maxAssetKb = Number(process.env.BUNDLE_MAX_ASSET_KB || 0);
const maxTotalKb = Number(process.env.BUNDLE_MAX_TOTAL_KB || 0);

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return [path];
  }));
  return files.flat();
}

const files = (await listFiles(distDir))
  .filter((file) => /\.(js|css)$/.test(file))
  .sort();

const rows = await Promise.all(files.map(async (file) => {
  const info = await stat(file);
  const raw = readFileSync(file);
  return {
    file: relative(root, file),
    bytes: info.size,
    gzipBytes: gzipSync(raw).length,
  };
}));

const totalBytes = rows.reduce((sum, row) => sum + row.bytes, 0);
const totalGzipBytes = rows.reduce((sum, row) => sum + row.gzipBytes, 0);

console.log('Bundle assets:');
for (const row of rows) {
  console.log(`${row.file} ${(row.bytes / 1024).toFixed(1)} KiB (${(row.gzipBytes / 1024).toFixed(1)} KiB gzip)`);
}
console.log(`Total ${(totalBytes / 1024).toFixed(1)} KiB (${(totalGzipBytes / 1024).toFixed(1)} KiB gzip)`);

const failures = [];
if (maxAssetKb > 0) {
  for (const row of rows) {
    const assetKb = row.bytes / 1024;
    if (assetKb > maxAssetKb) failures.push(`${row.file} exceeds BUNDLE_MAX_ASSET_KB (${assetKb.toFixed(1)} > ${maxAssetKb})`);
  }
}
if (maxTotalKb > 0 && totalBytes / 1024 > maxTotalKb) {
  failures.push(`total bundle exceeds BUNDLE_MAX_TOTAL_KB (${(totalBytes / 1024).toFixed(1)} > ${maxTotalKb})`);
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
