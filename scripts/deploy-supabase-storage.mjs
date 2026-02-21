import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const projectRef = process.env.SUPABASE_PROJECT_REF;
const projectUrl =
  process.env.SUPABASE_URL || (projectRef ? `https://${projectRef}.supabase.co` : undefined);
const secretKey = process.env.SUPABASE_SECRET_KEY;
const bucket = process.env.SUPABASE_BUCKET || 'slopcast-web';
const root = path.resolve(process.env.DIST_DIR || 'dist');

if (!projectUrl) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_PROJECT_REF.');
}
if (!secretKey) {
  throw new Error('Missing SUPABASE_SECRET_KEY.');
}

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
]);

const supabase = createClient(projectUrl, secretKey);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    if (entry.isFile()) files.push(full);
  }
  return files;
}

async function ensureBucket(name) {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`listBuckets failed: ${error.message}`);
  const exists = data.some((item) => item.name === name);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(name, { public: true });
    if (createError) throw new Error(`createBucket failed: ${createError.message}`);
    return;
  }
  const { error: updateError } = await supabase.storage.updateBucket(name, { public: true });
  if (updateError) throw new Error(`updateBucket failed: ${updateError.message}`);
}

async function clearPrefix(prefix = '') {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, offset: 0 });
  if (error) throw new Error(`list failed at ${prefix || '/'}: ${error.message}`);

  const files = [];
  for (const item of data) {
    if (item.id) {
      files.push(prefix ? `${prefix}/${item.name}` : item.name);
    } else {
      const nested = prefix ? `${prefix}/${item.name}` : item.name;
      await clearPrefix(nested);
    }
  }
  if (!files.length) return;
  const { error: removeError } = await supabase.storage.from(bucket).remove(files);
  if (removeError) throw new Error(`remove failed: ${removeError.message}`);
}

await ensureBucket(bucket);
await clearPrefix('');

const files = await walk(root);
for (const abs of files) {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  const ext = path.extname(rel).toLowerCase();
  const contentType = mime.get(ext) || 'application/octet-stream';
  const body = await fs.readFile(abs);
  const { error } = await supabase.storage.from(bucket).upload(rel, body, {
    upsert: true,
    contentType,
    cacheControl: rel === 'index.html' ? '60' : '31536000',
  });
  if (error) throw new Error(`upload failed for ${rel}: ${error.message}`);
}

const { data: urlData } = supabase.storage.from(bucket).getPublicUrl('index.html');
console.log(`Uploaded ${files.length} files to bucket ${bucket}.`);
console.log(`Public URL: ${urlData.publicUrl}`);
