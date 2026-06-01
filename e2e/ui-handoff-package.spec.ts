/**
 * Full UI handoff screenshot pack → ~/Downloads/slopcast-ui-handoff-<stamp>/
 * Run: npm run ui:handoff
 *
 * Uses Playwright webServer (Vite on :3100). Override with UI_BASE_URL.
 * Single test + browser fixture so desktop and mobile land in one folder.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { test, type Browser, type Page } from '@playwright/test';
import { THEMES, getUiThemeCases } from '../src/theme/registry';
import type { ThemeId } from '../src/theme/types';
import type { ThemeCase } from './helpers/slopcast';
import { SlopcastApp } from './helpers/slopcast';

const DEV_BYPASS_SESSION = {
  provider: 'dev-bypass',
  createdAt: '2026-03-26T00:00:00.000Z',
  user: {
    id: 'dev-bypass-user',
    email: 'operator@slopcast.local',
    displayName: 'Field Operator',
  },
} as const;

const THEME_ROTATION: ThemeId[] = THEMES.map((t) => t.id);

function stampDir(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `slopcast-ui-handoff-${local}`;
}

function darkCaseFor(id: ThemeId): ThemeCase {
  const matches = getUiThemeCases().filter((c) => c.id === id);
  if (matches.length === 1) return matches[0];
  return matches.find((c) => c.colorMode === 'dark') ?? matches[0];
}

function lightCaseFor(id: ThemeId): ThemeCase {
  const matches = getUiThemeCases().filter((c) => c.id === id);
  return matches.find((c) => c.colorMode === 'light') ?? matches[0];
}

function themeLabel(tc: ThemeCase): string {
  return tc.alias ?? tc.id;
}

async function settle(ms = 450): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function snap(page: Page, filePath: string): Promise<void> {
  await settle(350);
  await page.screenshot({ path: filePath, fullPage: true });
}

async function captureDesktop(browser: Browser, handoffRoot: string): Promise<void> {
  const outDir = path.join(handoffRoot, 'desktop');
  let ti = 0;
  const nextId = (): ThemeId => {
    const id = THEME_ROTATION[ti % THEME_ROTATION.length];
    ti += 1;
    return id;
  };

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  try {
    const app = new SlopcastApp(page, false);
    await app.bootstrap('slate');
    await app.goto();
    await app.expectMapLoaded();

    let tc = darkCaseFor(nextId());
    await app.setTheme(tc);
    await page.getByRole('banner').getByRole('button', { name: 'HUB', exact: true }).click();
    await page.getByRole('heading', { name: /slopcast command hub/i }).waitFor({ timeout: 15_000 });
    await snap(page, path.join(outDir, `01_hub__${themeLabel(tc)}.png`));

    tc = darkCaseFor(nextId());
    await app.setTheme(tc);
    await page.goto('/hub/integrations');
    await page.getByText('Data Integrations').first().waitFor({ timeout: 15_000 });
    await snap(page, path.join(outDir, `02_integrations__${themeLabel(tc)}.png`));

    {
      const origin = new URL(page.url()).origin;
      const ctx = await browser.newContext({
        baseURL: origin,
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      });
      const authPage = await ctx.newPage();
      await authPage.goto('/auth', { waitUntil: 'domcontentloaded' });
      await authPage.getByRole('button', { name: /sign in as demo user/i }).waitFor({ timeout: 20_000 });
      await snap(authPage, path.join(outDir, '03_auth_unauthenticated.png'));
      await ctx.close();
    }

    await page.evaluate(
      ({ session }) => {
        localStorage.setItem('slopcast-auth-session', JSON.stringify(session));
      },
      { session: DEV_BYPASS_SESSION },
    );
    await page.goto('/slopcast');
    await app.goto();
    await app.expectMapLoaded();

    await app.openDesignView();
    await app.openWellsWorkspace();
    tc = darkCaseFor(nextId());
    await app.setTheme(tc);
    await snap(page, path.join(outDir, `04_design_wells_map__${themeLabel(tc)}.png`));

    const filtersToggle = page.getByTestId('wells-filters-toggle');
    if (await filtersToggle.isVisible().catch(() => false)) {
      tc = darkCaseFor(nextId());
      await app.setTheme(tc);
      await filtersToggle.click();
      await settle();
      await snap(page, path.join(outDir, `05_design_wells_filters_open__${themeLabel(tc)}.png`));
      await filtersToggle.click().catch(() => {});
    }

    await app.openEconomicsWorkspace();
    const econModules = ['production', 'pricing', 'opex', 'taxes', 'ownership', 'capex'] as const;
    let n = 6;
    for (const mod of econModules) {
      tc = darkCaseFor(nextId());
      await app.setTheme(tc);
      await page.getByTestId(`economics-module-tab-${mod}`).click();
      await page.locator('[data-testid="economics-group-bar"]').first().waitFor({ timeout: 15_000 });
      await settle(500);
      await snap(page, path.join(outDir, `${String(n).padStart(2, '0')}_economics_${mod}__${themeLabel(tc)}.png`));
      n += 1;
    }

    tc = darkCaseFor(nextId());
    await app.setTheme(tc);
    await app.openScenarioView();
    await page.getByText(/model stack/i).first().waitFor({ timeout: 20_000 });
    await snap(page, path.join(outDir, `12_scenarios_analysis__${themeLabel(tc)}.png`));

    tc = darkCaseFor(nextId());
    await app.setTheme(tc);
    await page.goto('/this-route-does-not-exist-slopcast');
    await page.getByText('Route Not Found').waitFor({ timeout: 10_000 });
    await snap(page, path.join(outDir, `13_not_found__${themeLabel(tc)}.png`));

    await page.goto('/slopcast');
    await app.goto();

    await app.setTheme(lightCaseFor('slate'));
    await app.goto();
    await app.openDesignView();
    await app.openEconomicsWorkspace();
    await page.getByTestId('economics-module-tab-production').click();
    await settle(600);
    await snap(page, path.join(outDir, '14_economics_production_slate-light.png'));

    await app.setTheme(lightCaseFor('permian'));
    await app.goto();
    await app.openDesignView();
    await app.openWellsWorkspace();
    await app.expectMapLoaded();
    await settle(600);
    await snap(page, path.join(outDir, '15_design_wells_permian-noon.png'));
  } finally {
    await page.close();
  }
}

async function captureMobile(browser: Browser, handoffRoot: string): Promise<void> {
  const outDir = path.join(handoffRoot, 'mobile');
  let ti = 0;
  const nextId = (): ThemeId => {
    const id = THEME_ROTATION[ti % THEME_ROTATION.length];
    ti += 1;
    return id;
  };

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  try {
    const app = new SlopcastApp(page, true);
    await app.bootstrap('slate');
    await app.goto();
    await app.expectWellsWorkspace();
    await app.navigateToMapTab();
    await app.expectMapLoaded();

    let tc = darkCaseFor(nextId());
    await app.setTheme(tc);
    await snap(page, path.join(outDir, `m01_map_tab__${themeLabel(tc)}.png`));

    await page.getByTestId('wells-mobile-tab-groups').click();
    await settle();
    tc = darkCaseFor(nextId());
    await app.setTheme(tc);
    await snap(page, path.join(outDir, `m02_groups_tab__${themeLabel(tc)}.png`));

    await app.openEconomicsWorkspace();
    await app.openMobileResultsPanelIfNeeded();
    tc = darkCaseFor(nextId());
    await app.setTheme(tc);
    await page.getByTestId('economics-module-tab-opex').click();
    await settle(500);
    await snap(page, path.join(outDir, `m03_economics_opex__${themeLabel(tc)}.png`));

    tc = darkCaseFor(nextId());
    await app.setTheme(tc);
    await app.openScenarioView();
    await page.getByText(/model stack/i).first().waitFor({ timeout: 20_000 });
    await snap(page, path.join(outDir, `m04_scenarios__${themeLabel(tc)}.png`));

    await page.getByRole('banner').getByRole('button', { name: 'HUB', exact: true }).click();
    await page.getByRole('heading', { name: /slopcast command hub/i }).waitFor({ timeout: 15_000 });
    tc = darkCaseFor(nextId());
    await app.setTheme(tc);
    await snap(page, path.join(outDir, `m05_hub__${themeLabel(tc)}.png`));
  } finally {
    await ctx.close();
  }
}

test.describe('Slopcast UI handoff package', () => {
  test('writes Downloads handoff (desktop + mobile)', async ({ browser }) => {
    test.setTimeout(300_000);

    const handoffRoot = process.env.UI_HANDOFF_DIR
      ? path.resolve(process.env.UI_HANDOFF_DIR)
      : path.join(homedir(), 'Downloads', stampDir());

    fs.mkdirSync(path.join(handoffRoot, 'desktop'), { recursive: true });
    fs.mkdirSync(path.join(handoffRoot, 'mobile'), { recursive: true });

    fs.writeFileSync(
      path.join(handoffRoot, 'manifest.json'),
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          outputDir: handoffRoot,
          baseURL: process.env.UI_BASE_URL ?? 'http://127.0.0.1:3100 (Playwright webServer)',
          themeRotation: THEME_ROTATION,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    await captureDesktop(browser, handoffRoot);
    await captureMobile(browser, handoffRoot);

    fs.writeFileSync(
      path.join(handoffRoot, 'README.md'),
      [
        '# Slopcast UI handoff package',
        '',
        `Generated: ${new Date().toISOString()}`,
        `Folder: \`${handoffRoot}\``,
        '',
        '## Contents',
        '',
        '- `desktop/` — 1440×900 @2x',
        '- `mobile/` — 390×844 @2x',
        '- `manifest.json` — run metadata',
        '',
        '## Notes',
        '',
        '- Themes rotate through registry order: slate → synthwave → tropical → league → stormwatch → mario → hyperborea → permian.',
        '- Auth capture uses a **fresh browser context** (no session). Other routes use dev-bypass auth.',
        '- Light variants: **slate-light** (economics production) and **permian-noon** (wells map).',
        '- Dev server: Playwright starts Vite on **3100** unless `UI_BASE_URL` is set.',
        '',
        '### Mobile folder',
        '',
        '- Map tab, Groups tab, Economics (OPEX), Scenarios, Hub — each advances the theme rotation.',
        '',
      ].join('\n'),
      'utf8',
    );
  });
});
