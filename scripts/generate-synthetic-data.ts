/**
 * Synthetic data generator for oil & gas economics testing.
 * Run: npx tsx scripts/generate-synthetic-data.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// ── Configuration ──────────────────────────────────────────────────────────
const CONFIG = {
  wellCount: 200,
  basins: ['Permian', 'Williston', 'DJ Basin', 'Eagle Ford', 'Appalachian', 'Powder River'],
  formations: ['Wolfcamp A', 'Wolfcamp B', 'Bone Spring', 'Bakken', 'Three Forks', 'Niobrara', 'Codell', 'Eagle Ford Shale', 'Marcellus', 'Utica'],
  operators: ['Devon Energy', 'Pioneer Natural Resources', 'Diamondback Energy', 'Continental Resources', 'EOG Resources', 'ConocoPhillips', 'Marathon Oil', 'Ovintiv', 'Coterra Energy', 'Callon Petroleum'],
  wellTypes: ['horizontal', 'vertical'] as const,
  statusOptions: ['producing', 'shut-in', 'drilling', 'completed', 'planned'] as const,
  startYear: 2020,
  endYear: 2026,
  monthlyProductionMonths: 60,
};

const BASIN_COORDS: Record<string, [number, number]> = {
  Permian: [31.9, -102.1],
  Williston: [48.1, -103.5],
  'DJ Basin': [40.1, -104.7],
  'Eagle Ford': [28.8, -98.2],
  Appalachian: [39.8, -80.5],
  'Powder River': [44.5, -106.3],
};

const BASIN_FORMATIONS: Record<string, string[]> = {
  Permian: ['Wolfcamp A', 'Wolfcamp B', 'Bone Spring'],
  Williston: ['Bakken', 'Three Forks'],
  'DJ Basin': ['Niobrara', 'Codell'],
  'Eagle Ford': ['Eagle Ford Shale'],
  Appalachian: ['Marcellus', 'Utica'],
  'Powder River': ['Niobrara'],
};

const STATUS_WEIGHTS = { producing: 60, 'shut-in': 10, drilling: 10, completed: 10, planned: 10 };

// ── Seeded RNG (LCG) ──────────────────────────────────────────────────────
let _seed = 42;
function rand(): number {
  _seed = (_seed * 1664525 + 1013904223) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
function randInt(lo: number, hi: number) { return Math.floor(rand() * (hi - lo + 1)) + lo; }
function randFloat(lo: number, hi: number) { return lo + rand() * (hi - lo); }
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }

function weightedPick<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + (w as number), 0);
  let r = rand() * total;
  for (const [key, w] of entries) { r -= w as number; if (r <= 0) return key; }
  return entries[entries.length - 1][0];
}

// ── Well name generator ────────────────────────────────────────────────────
const PREFIXES = ['State', 'Federal', 'University', 'Ranch', 'Creek', 'Mesa', 'Butte', 'Canyon', 'Ridge', 'Prairie'];
function wellName(): string {
  const pfx = pick(PREFIXES);
  const section = randInt(1, 36);
  const hole = randInt(1, 8);
  const suffix = rand() < 0.85 ? 'H' : '';
  return `${pfx} ${section}-${hole}${suffix}`;
}

function apiNumber(): string {
  const state = pick(['42', '33', '05', '25', '37']);
  const county = String(randInt(1, 500)).padStart(3, '0');
  const seq = String(randInt(10000, 99999));
  return `${state}-${county}-${seq}-00-00`;
}

// ── Date helpers ───────────────────────────────────────────────────────────
function randomDate(yearLo: number, yearHi: number): Date {
  const y = randInt(yearLo, yearHi);
  const m = randInt(0, 11);
  const d = randInt(1, 28);
  return new Date(y, m, d);
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Well {
  id: string; name: string; api: string; operator: string; basin: string;
  formation: string; wellType: 'horizontal' | 'vertical'; status: string;
  lat: number; lng: number; spudDate: string; completionDate: string;
  firstProductionDate: string; lateralLength: number; trueVerticalDepth: number;
  totalProppant: number;
}

interface Production {
  wellId: string; month: number; date: string; oilBbl: number; gasMcf: number; waterBbl: number;
}

// ── Generate wells ─────────────────────────────────────────────────────────
function generateWells(): Well[] {
  const wells: Well[] = [];
  for (let i = 0; i < CONFIG.wellCount; i++) {
    const basin = pick(CONFIG.basins);
    const formations = BASIN_FORMATIONS[basin];
    const formation = pick(formations);
    const isHoriz = rand() < 0.85;
    const wellType = isHoriz ? 'horizontal' : 'vertical';
    const [baseLat, baseLng] = BASIN_COORDS[basin];

    const spud = randomDate(CONFIG.startYear, CONFIG.endYear - 1);
    const comp = addMonths(spud, randInt(1, 4));
    const fp = addMonths(comp, randInt(0, 2));

    wells.push({
      id: `well-${i}`,
      name: wellName(),
      api: apiNumber(),
      operator: pick(CONFIG.operators),
      basin,
      formation,
      wellType,
      status: weightedPick(STATUS_WEIGHTS),
      lat: +(baseLat + randFloat(-0.8, 0.8)).toFixed(5),
      lng: +(baseLng + randFloat(-0.8, 0.8)).toFixed(5),
      spudDate: fmtDate(spud),
      completionDate: fmtDate(comp),
      firstProductionDate: fmtDate(fp),
      lateralLength: isHoriz ? randInt(4000, 12000) : 0,
      trueVerticalDepth: randInt(5000, 14000),
      totalProppant: isHoriz ? randInt(200, 800) : 0,
    });
  }
  return wells;
}

// ── Hyperbolic decline ─────────────────────────────────────────────────────
function hyperbolicRate(qi: number, di: number, b: number, t: number): number {
  return qi * Math.pow(1 + b * di * t, -1 / b);
}

// ── Generate production ────────────────────────────────────────────────────
function generateProduction(wells: Well[]): Production[] {
  const rows: Production[] = [];
  for (const w of wells) {
    if (w.status === 'planned' || w.status === 'drilling') continue;

    const isHoriz = w.wellType === 'horizontal';
    const qi = isHoriz ? randFloat(500, 2000) : randFloat(50, 300);
    const b = randFloat(0.8, 1.8);
    const di = randFloat(0.4, 0.9); // annual
    const diMonthly = di / 12;
    const gor = randFloat(800, 3000);
    const waterCutStart = randFloat(0.2, 0.4);
    const waterCutEnd = randFloat(0.6, 0.8);

    const fpDate = new Date(w.firstProductionDate);
    const months = Math.min(CONFIG.monthlyProductionMonths, diffMonths(fpDate, new Date(CONFIG.endYear, 11, 31)));

    for (let m = 0; m < months; m++) {
      const oilRate = hyperbolicRate(qi, diMonthly, b, m);
      const noise = 1 + randFloat(-0.1, 0.1);
      const oilBbl = Math.max(0, Math.round(oilRate * 30 * noise));
      const gasMcf = Math.round(oilBbl * gor / 1000);
      const wc = waterCutStart + (waterCutEnd - waterCutStart) * (m / Math.max(months - 1, 1));
      const waterBbl = Math.round(oilBbl * wc / (1 - wc));
      const date = addMonths(fpDate, m);

      rows.push({
        wellId: w.id,
        month: m + 1,
        date: fmtDate(date),
        oilBbl,
        gasMcf,
        waterBbl,
      });
    }
  }
  return rows;
}

function diffMonths(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

// ── Main ───────────────────────────────────────────────────────────────────
function main() {
  const outDir = join(import.meta.dirname ?? __dirname, 'synthetic-data');
  mkdirSync(outDir, { recursive: true });

  console.log('Generating wells...');
  const wells = generateWells();

  console.log('Generating production data...');
  const production = generateProduction(wells);

  writeFileSync(join(outDir, 'wells.json'), JSON.stringify(wells, null, 2));
  writeFileSync(join(outDir, 'production.json'), JSON.stringify(production, null, 2));

  // ── Summary stats ──────────────────────────────────────────────────────
  console.log('\n=== Summary ===');
  console.log(`Total wells: ${wells.length}`);
  const byBasin: Record<string, number> = {};
  for (const w of wells) byBasin[w.basin] = (byBasin[w.basin] ?? 0) + 1;
  console.log('Wells by basin:');
  for (const [b, n] of Object.entries(byBasin).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${b}: ${n}`);
  }
  const byStatus: Record<string, number> = {};
  for (const w of wells) byStatus[w.status] = (byStatus[w.status] ?? 0) + 1;
  console.log('Wells by status:');
  for (const [s, n] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${n}`);
  }
  const totalOil = production.reduce((s, p) => s + p.oilBbl, 0);
  const totalGas = production.reduce((s, p) => s + p.gasMcf, 0);
  const totalWater = production.reduce((s, p) => s + p.waterBbl, 0);
  console.log(`Production rows: ${production.length.toLocaleString()}`);
  console.log(`Total oil:   ${totalOil.toLocaleString()} BBL`);
  console.log(`Total gas:   ${totalGas.toLocaleString()} MCF`);
  console.log(`Total water: ${totalWater.toLocaleString()} BBL`);
  console.log(`\nFiles written to ${outDir}/`);
}

main();
