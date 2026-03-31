#!/usr/bin/env node
/**
 * Storybook Component Screenshots
 *
 * Captures screenshots of every Storybook story across all 7 themes.
 * Requires a built Storybook (npm run storybook:build) to exist.
 *
 * Usage:
 *   node scripts/storybook-snapshots.mjs
 *
 * Environment variables:
 *   STORYBOOK_OUT_DIR  — Output directory (default: artifacts/ui/stories)
 *   STORYBOOK_DIR      — Built Storybook path (default: node_modules/.cache/storybook-static)
 *   STORYBOOK_THEMES   — Comma-separated theme IDs (default: all 7)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import http from 'node:http';

if (process.platform === 'darwin' && process.arch === 'arm64' && !process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE) {
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = 'mac15-arm64';
}

const { chromium } = await import('playwright');

const ALL_THEMES = [
  { id: 'slate', title: 'Slate' },
  { id: 'synthwave', title: 'Synthwave' },
  { id: 'tropical', title: 'Tropical' },
  { id: 'league', title: 'Nocturne' },
  { id: 'stormwatch', title: 'Stormwatch' },
  { id: 'mario', title: 'Classic' },
  { id: 'hyperborea', title: 'Hyperborea' },
];

const outDir = process.env.STORYBOOK_OUT_DIR || path.join('artifacts', 'ui', 'stories');
const storybookDir = process.env.STORYBOOK_DIR || path.join('node_modules', '.cache', 'storybook-static');
const themes = process.env.STORYBOOK_THEMES
  ? process.env.STORYBOOK_THEMES.split(',').map(id => ALL_THEMES.find(t => t.id === id)).filter(Boolean)
  : ALL_THEMES;

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 2 };
const SETTLE_MS = 400; // Wait for animations/theme transitions to settle

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Start a static file server for the built Storybook.
 * Returns { server, port, close() }.
 */
function startStaticServer(dir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://localhost');
      let filePath = path.join(dir, decodeURIComponent(url.pathname));

      // Default to index.html for directory requests
      try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
      } catch { /* file not found handled below */ }

      try {
        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
          '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
          '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        server,
        port,
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise(r => server.close(r)),
      });
    });
    server.on('error', reject);
  });
}

async function main() {
  // Verify Storybook is built
  try {
    await fs.access(path.join(storybookDir, 'index.html'));
  } catch {
    console.error(`Storybook not built at ${storybookDir}. Run: npm run storybook:build`);
    process.exit(1);
  }

  // Load story index
  let storyIndex;
  try {
    const indexPath = path.join(storybookDir, 'index.json');
    const raw = await fs.readFile(indexPath, 'utf8');
    storyIndex = JSON.parse(raw);
  } catch {
    console.error('Could not read Storybook index.json. Ensure Storybook is built correctly.');
    process.exit(1);
  }

  // Filter to actual stories (not docs)
  const stories = Object.values(storyIndex.entries || storyIndex.v || {})
    .filter(entry => entry.type === 'story');

  if (stories.length === 0) {
    console.error('No stories found in Storybook index.');
    process.exit(1);
  }

  console.log(`Found ${stories.length} stories, capturing across ${themes.length} themes...`);

  // Start static server for built Storybook
  const srv = await startStaticServer(storybookDir);
  console.log(`Storybook server on ${srv.url}`);

  await ensureDir(outDir);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: VIEWPORT.width, height: VIEWPORT.height },
    deviceScaleFactor: VIEWPORT.deviceScaleFactor,
  });

  const page = await context.newPage();
  const results = [];
  let captured = 0;
  let failed = 0;

  try {
    for (const theme of themes) {
      const themeDir = path.join(outDir, theme.id);
      await ensureDir(themeDir);

      for (const story of stories) {
        const storyId = story.id;
        const iframeUrl = `${srv.url}/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story&globals=theme:${theme.id};colorMode:dark`;

        try {
          await page.goto(iframeUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 });

          // Wait for theme to apply
          await page.waitForFunction(
            (id) => document.documentElement.dataset.theme === id,
            theme.id,
            { timeout: 5_000 }
          ).catch(() => {
            // Some stories may not apply theme — still capture
          });

          await page.waitForTimeout(SETTLE_MS);

          // Sanitize story ID for filename (replace slashes and special chars)
          const safeName = storyId.replace(/[/\\:*?"<>|]/g, '_');
          const screenshotPath = path.join(themeDir, `${safeName}.png`);
          await page.screenshot({ path: screenshotPath });

          results.push({
            storyId,
            theme: theme.id,
            file: path.relative(outDir, screenshotPath),
            status: 'captured',
          });
          captured++;
        } catch (err) {
          results.push({
            storyId,
            theme: theme.id,
            file: null,
            status: 'failed',
            error: err.message,
          });
          failed++;
        }
      }
    }
  } finally {
    await context.close();
    await browser.close();
    await srv.close();
  }

  // Write manifest
  const manifest = {
    startedAt: new Date().toISOString(),
    outDir,
    themes: themes.map(t => t.id),
    storyCount: stories.length,
    captured,
    failed,
    results,
  };
  await fs.writeFile(path.join(outDir, 'stories-run.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`Done: ${captured} captured, ${failed} failed (${stories.length} stories × ${themes.length} themes)`);
  if (failed > 0) {
    console.error(`${failed} screenshots failed — check stories-run.json for details`);
  }
}

main().catch((err) => {
  process.stderr.write((err && err.stack) ? `${err.stack}\n` : `${String(err)}\n`);
  process.exit(1);
});
