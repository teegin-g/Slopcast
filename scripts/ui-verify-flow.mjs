#!/usr/bin/env node
import process from 'node:process';

if (process.platform === 'darwin' && process.arch === 'arm64' && !process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE) {
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = 'mac15-arm64';
}

const { chromium } = await import('playwright');

const baseURL = (process.env.UI_BASE_URL || 'http://127.0.0.1:3000').replace(/\/?$/, '');

const THEMES = [
  { id: 'slate', title: 'Slate' },
  { id: 'mario', title: 'Classic' },
];

const VIEWPORTS = [
  { id: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { id: 'mid', width: 1180, height: 800, isMobile: false, hasTouch: false },
  { id: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

const VIEWS = [
  {
    id: 'design',
    tabName: 'DESIGN',
    requiredTexts: ['Basin Visualizer', 'Operations Console', 'Portfolio NPV'],
  },
  {
    id: 'scenarios',
    tabName: 'SCENARIOS',
    requiredTexts: ['Model Stack', 'Portfolio Overlay', 'Portfolio NPV Sensitivity'],
  },
];

function hasDimensionWarning(msg) {
  const text = `${msg.text || ''}`;
  return (
    text.includes('The width(') ||
    text.includes('height(0)') ||
    text.includes('height(-1)') ||
    text.includes('width(0)') ||
    text.includes('width(-1)')
  );
}

async function ensureVisibleText(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 15000 });
}

async function checkPrimaryPanels(page, viewId, isMobile) {
  if (viewId === 'design' && isMobile) {
    const visibleRegionCount = await page.evaluate(() => {
      const regions = Array.from(document.querySelectorAll('main aside, main section'));
      return regions.filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length;
    });
    if (visibleRegionCount <= 0) {
      throw new Error('Primary panel check failed for mobile design: no visible regions');
    }
    return;
  }

  const selectors = viewId === 'design'
    ? ['main section', 'main aside', 'main h2']
    : ['main [class*=grid]', 'main'];

  const results = await page.evaluate((sels) => {
    return sels.map((selector) => {
      const el = document.querySelector(selector);
      if (!el) {
        return { selector, ok: false, reason: 'missing' };
      }
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return { selector, ok: false, reason: 'zero-size' };
      }
      return { selector, ok: true };
    });
  }, selectors);

  const failed = results.find(r => !r.ok);
  if (failed) {
    throw new Error(`Primary panel check failed for ${viewId}: ${failed.selector} (${failed.reason})`);
  }
}

async function checkChartDimensions(page) {
  const chartState = await page.evaluate(() => {
    const wrappers = Array.from(document.querySelectorAll('.recharts-wrapper'));
    const visibleWrappers = wrappers.filter((el) => {
      const rect = el.getBoundingClientRect();
      return (rect.width > 0 || rect.height > 0) && el.offsetParent !== null;
    });
    if (visibleWrappers.length === 0) return { wrappers: 0, zeroCount: 0 };

    let zeroCount = 0;
    for (const el of visibleWrappers) {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) zeroCount += 1;
    }

    return { wrappers: visibleWrappers.length, zeroCount };
  });

  if (chartState.wrappers > 0 && chartState.zeroCount > 0) {
    throw new Error(`Detected ${chartState.zeroCount}/${chartState.wrappers} zero-sized recharts wrappers`);
  }
}

const browser = await chromium.launch();
let failed = false;

try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
      deviceScaleFactor: 2,
    });

    await context.addInitScript(() => {
      localStorage.setItem('slopcast-auth-session', JSON.stringify({
        provider: 'dev-bypass',
        createdAt: new Date().toISOString(),
        user: {
          id: 'dev-bypass-user',
          email: 'operator@slopcast.local',
          displayName: 'Field Operator',
        },
      }));
    });

    const page = await context.newPage();
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto(`${baseURL}/slopcast`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'DESIGN' }).waitFor({ state: 'visible', timeout: 20000 });

    for (const theme of THEMES) {
      await page.getByTitle(theme.title).click();
      await page.waitForFunction((id) => document.documentElement.dataset.theme === id, theme.id);

      for (const view of VIEWS) {
        await page.getByRole('button', { name: view.tabName }).click();
        if (viewport.isMobile && view.id === 'design') {
          await page.getByRole('button', { name: 'Setup' }).click();
          await ensureVisibleText(page, 'Scenarios / Groups');
          await page.getByRole('button', { name: 'Workspace' }).click();
          await ensureVisibleText(page, 'Basin Visualizer');
          await page.getByRole('button', { name: 'KPIs' }).click();
          await ensureVisibleText(page, 'Operations Console');
        } else {
          for (const text of view.requiredTexts) {
            await ensureVisibleText(page, text);
          }
        }
        await page.waitForTimeout(250);

        await checkPrimaryPanels(page, view.id, viewport.isMobile);
        await checkChartDimensions(page);
      }
    }

    const dimWarnings = consoleMessages.filter(hasDimensionWarning);
    if (dimWarnings.length > 0) {
      throw new Error(
        `Detected ${dimWarnings.length} dimension warnings on ${viewport.id}:\n` +
        dimWarnings.map(msg => `- ${msg.text}`).join('\n')
      );
    }

    await context.close();
    process.stdout.write(`Verified viewport: ${viewport.id}\n`);
  }
} catch (err) {
  failed = true;
  process.stderr.write(`${err?.stack || String(err)}\n`);
} finally {
  await browser.close();
}

if (failed) {
  process.exit(1);
}

process.stdout.write('UI flow verification passed.\n');
