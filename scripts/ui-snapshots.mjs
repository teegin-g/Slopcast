#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { loadThemeSnapshotMetadata } from './theme-cases.mjs';

if (process.platform === 'darwin' && process.arch === 'arm64' && !process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE) {
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = 'mac15-arm64';
}

const { chromium } = await import('playwright');

const baseURL = (process.env.UI_BASE_URL || 'http://127.0.0.1:3000/').replace(/\/?$/, '/');
const outDir = process.env.UI_OUT_DIR || path.join('artifacts', 'ui', 'latest');
const fxMode = (process.env.UI_FX_MODE === 'cinematic' || process.env.UI_FX_MODE === 'max')
  ? process.env.UI_FX_MODE
  : null;

const { themes: THEMES, fxThemeIds: FX_THEME_IDS } = await loadThemeSnapshotMetadata();

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
  { id: 'design-wells', workspaceTab: 'Wells', expectTestId: 'map-command-center' },
  {
    id: 'design-economics-production',
    workspaceTab: 'Economics',
    moduleTabTestId: 'economics-module-tab-production',
    expectedModule: 'PRODUCTION',
    expectText: 'Total Production',
  },
  {
    id: 'design-economics-pricing',
    workspaceTab: 'Economics',
    moduleTabTestId: 'economics-module-tab-pricing',
    expectedModule: 'PRICING',
    expectText: 'Realized Net Price',
  },
  {
    id: 'design-economics-capex',
    workspaceTab: 'Economics',
    moduleTabTestId: 'economics-module-tab-capex',
    expectedModule: 'CAPEX',
    expectText: 'CAPEX Summary',
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
  try {
    await locator.click();
  } catch {
    await locator.click({ force: true });
  }
}

async function clickByTestId(page, testId) {
  await page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!(el instanceof HTMLElement)) {
      throw new Error(`Missing element for ${id}`);
    }
    el.click();
  }, testId);
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

      await context.addInitScript(({ themeId, session, storageKey, mode, fxThemeIds }) => {
        // Seed localStorage defaults only if the key is missing so that
        // subsequent reloads preserve theme/mode changes made by the test.
        const seed = (key, value) => {
          if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
        };
        seed('slopcast-theme', themeId);
        seed(storageKey, JSON.stringify(session));
        seed('slopcast-design-workspace', 'WELLS');
        seed('slopcast-econ-module', 'PRODUCTION');
        seed('slopcast-onboarding-done', '1');
        if (mode === 'cinematic' || mode === 'max') {
          for (const fxThemeId of fxThemeIds) {
            seed(`slopcast-fx-${fxThemeId}`, mode);
          }
        }
      }, { themeId: THEMES[0].id, session: DEFAULT_AUTH_SESSION, storageKey: 'slopcast-auth-session', mode: fxMode, fxThemeIds: FX_THEME_IDS });

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
        if (theme.colorMode === 'dark' || theme.colorMode === 'light') {
          await page.evaluate((mode) => {
            localStorage.setItem('slopcast-color-mode', mode);
          }, theme.colorMode);
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.waitForFunction((id) => document.documentElement.dataset.theme === id, theme.id);
          await page.waitForFunction((expected) => document.documentElement.dataset.mode === expected, theme.colorMode);
        }
        await page.waitForTimeout(150);

        const themeKey = theme.alias || theme.id;

        await click(page.getByRole('button', { name: 'DESIGN' }));
        await page.getByRole('button', { name: /^Wells/i }).first().waitFor({ timeout: 15_000 });

        for (const shot of DESIGN_SHOTS) {
          await click(page.getByRole('button', { name: new RegExp(`^${shot.workspaceTab}`, 'i') }).first());

          if (shot.workspaceTab === 'Economics') {
            await page.locator('[data-testid="economics-group-bar"]').first().waitFor({ timeout: 15_000 });
            if (viewport.isMobile) {
              const resultsButton = page.getByRole('button', { name: 'Workspace' }).first();
              if (await resultsButton.isVisible().catch(() => false)) {
                await click(resultsButton);
              }
            }
            if (shot.moduleTabTestId) {
              await clickByTestId(page, shot.moduleTabTestId);
              if (shot.expectedModule) {
                await page.waitForFunction((expected) => localStorage.getItem('slopcast-econ-module') === expected, shot.expectedModule, { timeout: 15_000 });
              }
            }
          }

          if (shot.expectTestId) {
            await page.getByTestId(shot.expectTestId).first().waitFor({ state: 'attached', timeout: 15_000 });
          } else if (shot.expectText) {
            await page.getByText(shot.expectText, { exact: false }).first().waitFor({ timeout: 15_000 });
          }
          await page.waitForTimeout(200);
          const fileName = `${viewport.id}__${themeKey}__${shot.id}.png`;
          await page.screenshot({ path: path.join(outDir, fileName), fullPage: true });
        }

        for (const view of VIEWS) {
          await click(page.getByRole('button', { name: view.tabName }));
          await page.getByText(view.expectText, { exact: false }).first().waitFor({ timeout: 15_000 });
          await page.waitForTimeout(200);

          const fileName = `${viewport.id}__${themeKey}__${view.id}.png`;
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
