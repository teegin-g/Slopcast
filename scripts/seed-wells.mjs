#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const projectRef = process.env.SUPABASE_PROJECT_REF;
const projectUrl =
  process.env.SUPABASE_URL || (projectRef ? `https://${projectRef}.supabase.co` : undefined);
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!projectUrl) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_PROJECT_REF.');
}
if (!secretKey) {
  throw new Error('Missing SUPABASE_SECRET_KEY.');
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildWells(count = 40) {
  const centerLat = 31.9;
  const centerLng = -102.3;
  const operators = ['Strata Ops LLC', 'Blue Mesa Energy', 'Atlas Peak Resources'];
  const formations = ['Wolfcamp A', 'Wolfcamp B', 'Bone Spring'];
  const statuses = ['PRODUCING', 'DUC', 'PERMIT'];
  const rand = mulberry32(271828);

  return Array.from({ length: count }, (_, i) => ({
    external_key: `w-${i}`,
    name: `Maverick ${i + 1}H`,
    lat: centerLat + (rand() - 0.5) * 0.15,
    lng: centerLng + (rand() - 0.5) * 0.2,
    lateral_length: rand() > 0.5 ? 10000 : 7500,
    status: statuses[i % statuses.length],
    operator: operators[i % operators.length],
    formation: formations[i % formations.length],
  }));
}

async function main() {
  const supabase = createClient(projectUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const wells = buildWells();
  const { error } = await supabase.from('wells').upsert(wells, { onConflict: 'external_key' });
  if (error) throw error;

  console.log(`Seeded ${wells.length} wells to ${projectUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
