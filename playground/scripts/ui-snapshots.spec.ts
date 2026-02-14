import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.SLOPCAST_BASE_URL ?? 'http://localhost:3001/';

type ViewMode = 'DESIGN' | 'SCENARIOS';
type ThemeCase = { id: 'mario' | 'slate'; title: 'Classic' | 'Slate' };

const OUT_DIR = path.resolve(process.env.SLOPCAST_SCREENSHOT_DIR ?? 'playground/ui_screenshots/before');

const THEMES: ThemeCase[] = [
  { id: 'mario', title: 'Classic' },
  { id: 'slate', title: 'Slate' },
];

const VIEWS: ViewMode[] = ['DESIGN', 'SCENARIOS'];

async function setTheme(page: any, theme: ThemeCase) {
  await page.locator(`button[title="${theme.title}"]`).click();
  await page.waitForFunction((id: string) => document.documentElement.dataset.theme === id, theme.id);
}

async function setView(page: any, view: ViewMode) {
  await page.getByRole('button', { name: view, exact: true }).click();
}

test.describe('UI baseline screenshots', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  for (const theme of THEMES) {
    for (const view of VIEWS) {
      test(`desktop ${theme.id} ${view}`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('header');

        await setTheme(page, theme);
        await setView(page, view);

        await page.waitForTimeout(250);
        await page.screenshot({
          path: path.join(OUT_DIR, `desktop-${theme.id}-${view.toLowerCase()}.png`),
          fullPage: true,
        });
      });

      test(`mobile ${theme.id} ${view}`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('header');

        await setTheme(page, theme);
        await setView(page, view);

        await page.waitForTimeout(250);
        await page.screenshot({
          path: path.join(OUT_DIR, `mobile-${theme.id}-${view.toLowerCase()}.png`),
          fullPage: true,
        });
      });
    }
  }
});

