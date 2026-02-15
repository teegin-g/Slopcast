#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

if (process.platform === 'darwin' && process.arch === 'arm64' && !process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE) {
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = 'mac15-arm64';
}

const { chromium } = await import('playwright');

const baseURL = (process.env.UI_BASE_URL || 'http://127.0.0.1:3000/').replace(/\/?$/, '/');
const outDir = process.env.UI_OUT_DIR || path.join('artifacts', 'ui', 'latest');
const fxMode = (process.env.UI_FX_MODE === 'cinematic' || process.env.UI_FX_MODE === 'max')
  ? process.env.UI_FX_MODE
  : null;

const THEMES = [
  { id: 'slate', title: 'Slate' },
  { id: 'mario', title: 'Classic' },
];

const DEFAULT_AUTH_SESSION = {
  provider: 'dev-bypass',
  createdAt: new Date().toISOString(),
  user: {
    id: 'dev-bypass-user',
    email: 'operator@slopcast.local',
    displayName: 'Field Operator',
  },
};

const DESIGN_SHOTS = [
  { id: 'design-wells', workspaceTab: 'Wells', expectText: 'Basin Visualizer' },
  {
    id: 'design-economics-summary',
    workspaceTab: 'Economics',
    resultsTabTestId: 'economics-results-tab-summary',
    expectText: 'Run Summary',
  },
  {
    id: 'design-economics-charts',
    workspaceTab: 'Economics',
    resultsTabTestId: 'economics-results-tab-charts',
    expectText: 'PRODUCTION FORECAST',
  },
  {
    id: 'design-economics-drivers',
    workspaceTab: 'Economics',
    resultsTabTestId: 'economics-results-tab-drivers',
    expectText: 'Scenario Rank',
  },
];

const VIEWS = [
  { id: 'scenarios', tabName: 'SCENARIOS', expectText: 'MODEL STACK' },
];

const VIEWPORTS = [
  { id: 'desktop', width: 1440, height: 900, isMobile: false, deviceScaleFactor: 2 },
  { id: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

async function click(locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.click();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function safeWriteJSON(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function main() {
  await ensureDir(outDir);

  const browser = await chromium.launch();
  const runMeta = {
    baseURL,
    outDir,
    fxMode,
    startedAt: new Date().toISOString(),
    themes: THEMES,
    views: VIEWS,
    designShots: DESIGN_SHOTS,
    viewports: VIEWPORTS,
  };

  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.deviceScaleFactor,
        isMobile: viewport.isMobile,
        hasTouch: viewport.hasTouch,
      });

      await context.addInitScript(({ themeId, session, storageKey, mode }) => {
        localStorage.setItem('slopcast-theme', themeId);
        localStorage.setItem(storageKey, JSON.stringify(session));
        localStorage.setItem('slopcast-design-workspace', 'WELLS');
        localStorage.setItem('slopcast-econ-results-tab', 'SUMMARY');
        if (mode === 'cinematic' || mode === 'max') {
          localStorage.setItem('slopcast-fx-synthwave', mode);
          localStorage.setItem('slopcast-fx-tropical', mode);
          localStorage.setItem('slopcast-fx-mario', mode);
        }
      }, { themeId: THEMES[0].id, session: DEFAULT_AUTH_SESSION, storageKey: 'slopcast-auth-session', mode: fxMode });

      const page = await context.newPage();
      await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      const hubHeading = page.getByRole('heading', { name: /slopcast command hub/i });
      if (await hubHeading.first().isVisible().catch(() => false)) {
        const hubPath = path.join(outDir, `${viewport.id}__hub.png`);
        await page.screenshot({ path: hubPath, fullPage: true });
      }
      await page.goto(`${baseURL}slopcast`, { waitUntil: 'domcontentloaded' });

      try {
        await page.getByRole('button', { name: 'DESIGN' }).waitFor({ state: 'visible', timeout: 20_000 });
        await page.getByRole('button', { name: 'SCENARIOS' }).waitFor({ state: 'visible', timeout: 20_000 });
        await page.getByTitle(THEMES[0].title).waitFor({ state: 'visible', timeout: 20_000 });
      } catch (err) {
        const debugPath = path.join(outDir, `${viewport.id}__debug.png`);
        const htmlPath = path.join(outDir, `${viewport.id}__debug.html`);
        await page.screenshot({ path: debugPath, fullPage: true });
        await fs.writeFile(htmlPath, await page.content(), 'utf8');
        throw err;
      }

      for (const theme of THEMES) {
        await click(page.getByTitle(theme.title));
        await page.waitForFunction((id) => document.documentElement.dataset.theme === id, theme.id);
        await page.waitForTimeout(150);

        await click(page.getByRole('button', { name: 'DESIGN' }));
        await page.getByRole('button', { name: /^Wells/i }).first().waitFor({ timeout: 15_000 });

        for (const shot of DESIGN_SHOTS) {
          await click(page.getByRole('button', { name: new RegExp(`^${shot.workspaceTab}`, 'i') }).first());

          if (shot.workspaceTab === 'Economics') {
            await page.locator('[data-testid="economics-group-bar"]').first().waitFor({ timeout: 15_000 });
            if (viewport.isMobile) {
              const resultsButton = page.getByRole('button', { name: 'Results' }).first();
              if (await resultsButton.isVisible().catch(() => false)) {
                await click(resultsButton);
              }
            }
            if (shot.resultsTabTestId) {
              const tabButton = page.locator(`[data-testid="${shot.resultsTabTestId}"]`).first();
              await tabButton.waitFor({ timeout: 15_000 });
              await click(tabButton);
            }
          }

          await page.getByText(shot.expectText, { exact: false }).first().waitFor({ timeout: 15_000 });
          await page.waitForTimeout(200);
          const fileName = `${viewport.id}__${theme.id}__${shot.id}.png`;
          await page.screenshot({ path: path.join(outDir, fileName), fullPage: true });
        }

        for (const view of VIEWS) {
          await click(page.getByRole('button', { name: view.tabName }));
          await page.getByText(view.expectText, { exact: false }).first().waitFor({ timeout: 15_000 });
          await page.waitForTimeout(200);

          const fileName = `${viewport.id}__${theme.id}__${view.id}.png`;
          const filePath = path.join(outDir, fileName);
          await page.screenshot({ path: filePath, fullPage: true });
        }
      }

      await context.close();
    }
  } finally {
    runMeta.finishedAt = new Date().toISOString();
    await safeWriteJSON(path.join(outDir, 'run.json'), runMeta);
    await browser.close();
  }
}

main().catch((err) => {
  process.stderr.write((err && err.stack) ? `${err.stack}\n` : `${String(err)}\n`);
  process.exit(1);
});
