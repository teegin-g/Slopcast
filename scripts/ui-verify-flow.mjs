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

async function checkChartDimensions(page) {
  const chartState = await page.evaluate(() => {
    const wrappers = Array.from(document.querySelectorAll('.recharts-wrapper'));
    const visibleWrappers = wrappers.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
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

async function getWellsBadgeCount(page) {
  return await page.evaluate(() => {
    const matches = Array.from(document.querySelectorAll('*'))
      .map((el) => (el.textContent || '').trim())
      .filter(Boolean)
      .map((text) => {
        const hit = text.match(/^(\d+)\s+Wells$/i);
        return hit ? Number(hit[1]) : null;
      })
      .filter((v) => Number.isFinite(v));

    if (matches.length === 0) return 0;
    return Math.max(...matches);
  });
}

async function setNonDefaultOperator(page) {
  return await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const operatorSelect = selects.find((select) => {
      const options = Array.from(select.querySelectorAll('option')).map((opt) => (opt.textContent || '').trim());
      return options.some((option) => option === 'All Operators');
    });

    if (!operatorSelect) return { changed: false, value: null };

    const options = Array.from(operatorSelect.querySelectorAll('option'));
    const nonDefault = options.find((opt) => opt.value !== 'ALL');
    if (!nonDefault) return { changed: false, value: operatorSelect.value };

    operatorSelect.value = nonDefault.value;
    operatorSelect.dispatchEvent(new Event('change', { bubbles: true }));
    return { changed: true, value: nonDefault.value };
  });
}

async function getOperatorValue(page) {
  return await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const operatorSelect = selects.find((select) => {
      const options = Array.from(select.querySelectorAll('option')).map((opt) => (opt.textContent || '').trim());
      return options.some((option) => option === 'All Operators');
    });
    return operatorSelect ? operatorSelect.value : null;
  });
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
      localStorage.setItem('slopcast-design-workspace', 'WELLS');
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

      // DESIGN workspace tab presence
      await page.getByRole('button', { name: 'DESIGN' }).click();
      await page.getByRole('button', { name: 'Wells' }).waitFor({ state: 'visible', timeout: 15000 });
      await page.getByRole('button', { name: 'Economics' }).waitFor({ state: 'visible', timeout: 15000 });

      // Wells workspace checks
      await page.getByRole('button', { name: 'Wells' }).click();
      await ensureVisibleText(page, 'Basin Visualizer');

      const runInWellsVisible = await page.getByRole('button', { name: 'Run Economics' }).first().isVisible().catch(() => false);
      if (runInWellsVisible) {
        throw new Error('Run Economics should not be visible in Wells workspace');
      }

      let operatorChangedValue = null;
      let selectedCountBefore = await getWellsBadgeCount(page);
      let selectedCountAfter = selectedCountBefore;

      if (!viewport.isMobile) {
        const changeResult = await setNonDefaultOperator(page);
        operatorChangedValue = changeResult.value;

        const selectAll = page.getByRole('button', { name: 'Select All' }).first();
        if (await selectAll.isVisible().catch(() => false)) {
          await selectAll.click();
          await page.waitForTimeout(150);
          selectedCountAfter = await getWellsBadgeCount(page);
        }
      }

      // Economics workspace checks
      await page.getByRole('button', { name: 'Economics' }).click();

      if (viewport.isMobile) {
        await page.getByRole('button', { name: 'Setup' }).first().waitFor({ state: 'visible', timeout: 15000 });
        const resultsButton = page.getByRole('button', { name: 'Results' }).first();
        if (await resultsButton.isVisible().catch(() => false)) {
          await resultsButton.click();
          await page.waitForTimeout(100);
        }
      } else {
        await ensureVisibleText(page, 'Economics Readiness');
      }

      await page.getByRole('button', { name: 'Run Economics' }).first().waitFor({ state: 'visible', timeout: 15000 });
      await checkChartDimensions(page);

      // Back to Wells, validate persistence
      await page.getByRole('button', { name: 'Wells' }).click();
      await ensureVisibleText(page, 'Basin Visualizer');

      if (!viewport.isMobile) {
        const operatorValueBack = await getOperatorValue(page);
        if (operatorChangedValue && operatorValueBack !== operatorChangedValue) {
          throw new Error(`Operator filter did not persist across Wells -> Economics -> Wells (${operatorChangedValue} vs ${operatorValueBack})`);
        }

        const selectedCountBack = await getWellsBadgeCount(page);
        if (selectedCountAfter !== selectedCountBack) {
          throw new Error(`Selected well count did not persist (${selectedCountAfter} vs ${selectedCountBack})`);
        }

      }

      // SCENARIOS still works
      await page.getByRole('button', { name: 'SCENARIOS' }).click();
      await ensureVisibleText(page, 'Model Stack');
      await checkChartDimensions(page);
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
