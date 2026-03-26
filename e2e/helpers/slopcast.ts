import { expect, type Locator, type Page } from '@playwright/test';

export type ThemeCase = {
  id: 'slate' | 'mario';
  title: 'Slate' | 'Classic';
};

export type EconomicsTabCase = 'SUMMARY' | 'CHARTS' | 'DRIVERS';

type ConsoleEntry = {
  type: string;
  text: string;
};

const DEV_BYPASS_SESSION = {
  provider: 'dev-bypass',
  createdAt: '2026-03-26T00:00:00.000Z',
  user: {
    id: 'dev-bypass-user',
    email: 'operator@slopcast.local',
    displayName: 'Field Operator',
  },
} as const;

export const THEMES: ThemeCase[] = [
  { id: 'slate', title: 'Slate' },
  { id: 'mario', title: 'Classic' },
];

function hasDimensionWarning(message: ConsoleEntry): boolean {
  return (
    message.text.includes('The width(') ||
    message.text.includes('height(0)') ||
    message.text.includes('height(-1)') ||
    message.text.includes('width(0)') ||
    message.text.includes('width(-1)')
  );
}

export class SlopcastApp {
  readonly consoleMessages: ConsoleEntry[] = [];
  readonly header: Locator;

  constructor(
    readonly page: Page,
    readonly isMobileViewport: boolean,
  ) {
    this.header = page.getByRole('banner');
    page.on('console', (message) => {
      this.consoleMessages.push({
        type: message.type(),
        text: message.text(),
      });
    });
  }

  async bootstrap(themeId: ThemeCase['id'] = 'slate'): Promise<void> {
    await this.page.addInitScript(
      ({ session, initialThemeId }) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('slopcast-auth-session', JSON.stringify(session));
        localStorage.setItem('slopcast-color-mode', 'dark');
        localStorage.setItem('slopcast-onboarding-done', '1');
        localStorage.setItem('slopcast-theme', initialThemeId);
        localStorage.setItem('slopcast-design-workspace', 'WELLS');
        localStorage.setItem('slopcast-econ-results-tab', 'SUMMARY');
      },
      { session: DEV_BYPASS_SESSION, initialThemeId: themeId },
    );
  }

  async goto(): Promise<void> {
    await this.page.goto('/slopcast', { waitUntil: 'domcontentloaded' });

    const blankWorkspaceButton = this.page.getByRole('button', { name: 'Open Blank Workspace' });
    const shouldEnterWorkspace = await blankWorkspaceButton
      .first()
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (shouldEnterWorkspace) {
      await blankWorkspaceButton.first().click();
      await this.page.waitForTimeout(150);
    }

    await this.findVisibleLocator(
      this.header.getByRole('button', { name: 'DESIGN', exact: true }),
      'Design navigation button',
    );
    await this.findVisibleLocator(
      this.header.getByRole('button', { name: 'SCENARIOS', exact: true }),
      'Scenarios navigation button',
    );
  }

  async setTheme(theme: ThemeCase): Promise<void> {
    await this.page.getByTestId('theme-dropdown-toggle').click();
    await this.page.getByTestId(`theme-option-${theme.id}`).click();
    await this.page.waitForFunction(
      (themeId) => document.documentElement.dataset.theme === themeId,
      theme.id,
    );
  }

  async openDesignView(): Promise<void> {
    const button = await this.findVisibleLocator(
      this.header.getByRole('button', { name: 'DESIGN', exact: true }),
      'Design navigation button',
    );
    await button.click();
  }

  async openScenarioView(): Promise<void> {
    const button = await this.findVisibleLocator(
      this.header.getByRole('button', { name: 'SCENARIOS', exact: true }),
      'Scenarios navigation button',
    );
    await button.click();
  }

  async openWellsWorkspace(): Promise<void> {
    await this.page.getByTestId('design-workspace-wells').click();
  }

  async openEconomicsWorkspace(): Promise<void> {
    await this.page.getByTestId('design-workspace-economics').click();
    await expect(this.page.locator('[data-testid="economics-group-bar"]').first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectWellsWorkspace(): Promise<void> {
    await expect(this.page.getByText('Basin Visualizer', { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectScenarioView(): Promise<void> {
    await expect(this.page.getByText('Model Stack', { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async openMobileResultsPanelIfNeeded(): Promise<void> {
    if (!this.isMobileViewport) {
      return;
    }

    const resultsButton = this.page.getByRole('button', { name: 'Results' });
    if (await resultsButton.first().isVisible().catch(() => false)) {
      await resultsButton.first().click();
    }
  }

  async assertSaveSnapshotHidden(): Promise<void> {
    const isVisible = await this.page
      .getByRole('button', { name: 'Save Snapshot' })
      .first()
      .isVisible()
      .catch(() => false);

    expect(isVisible).toBe(false);
  }

  async assertSaveSnapshotVisible(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Save Snapshot' }).first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async setEconomicsResultsTab(tab: EconomicsTabCase): Promise<void> {
    await this.page.getByTestId(`economics-results-tab-${tab.toLowerCase()}`).click();
    await this.expectStoredValue('slopcast-econ-results-tab', tab);
  }

  async expectStoredValue(key: string, expected: string): Promise<void> {
    await expect
      .poll(async () => this.readLocalStorage(key), {
        message: `Expected localStorage["${key}"] to equal ${expected}`,
      })
      .toBe(expected);
  }

  async readLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
  }

  async assertChartsHealthy(options?: { requireVisible?: boolean }): Promise<void> {
    const requireVisible = options?.requireVisible ?? false;
    const chartState = await this.page.evaluate(() => {
      const wrappers = Array.from(document.querySelectorAll('.recharts-wrapper'));
      const visibleWrappers = wrappers.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && element instanceof HTMLElement && element.offsetParent !== null;
      });

      let zeroCount = 0;
      for (const element of visibleWrappers) {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          zeroCount += 1;
        }
      }

      return {
        wrappers: visibleWrappers.length,
        zeroCount,
      };
    });

    if (requireVisible) {
      expect(chartState.wrappers).toBeGreaterThan(0);
    }
    expect(chartState.zeroCount).toBe(0);
  }

  async ensureEconomicsGroupSwitch(): Promise<void> {
    await expect(this.page.locator('[data-testid="economics-group-select"]').first()).toBeVisible({
      timeout: 15_000,
    });

    const groupLabelBefore = await this.getActiveGroupLabel();
    await this.page.locator('[data-testid="economics-group-next"]').first().click();
    await this.page.waitForTimeout(120);

    let groupLabelAfter = await this.getActiveGroupLabel();
    if (groupLabelAfter && groupLabelAfter !== groupLabelBefore) {
      return;
    }

    await this.page.locator('[data-testid="economics-group-clone"]').first().click();
    await this.page.waitForTimeout(240);
    groupLabelAfter = await this.getActiveGroupLabel();
    if (groupLabelAfter && groupLabelAfter !== groupLabelBefore) {
      return;
    }

    await this.page.locator('[data-testid="economics-group-next"]').first().click();
    await this.page.waitForTimeout(180);
    groupLabelAfter = await this.getActiveGroupLabel();

    expect(groupLabelAfter).not.toBe('');
    expect(groupLabelAfter).not.toBe(groupLabelBefore);
  }

  async setNonDefaultOperator(): Promise<string | null> {
    return await this.page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const operatorSelect = selects.find((select) => {
        const options = Array.from(select.querySelectorAll('option')).map((option) =>
          (option.textContent || '').trim(),
        );
        return options.includes('All Operators');
      });

      if (!(operatorSelect instanceof HTMLSelectElement)) {
        return null;
      }

      const nextOption = Array.from(operatorSelect.options).find((option) => option.value !== 'ALL');
      if (!nextOption) {
        return operatorSelect.value;
      }

      operatorSelect.value = nextOption.value;
      operatorSelect.dispatchEvent(new Event('change', { bubbles: true }));
      return nextOption.value;
    });
  }

  async readOperatorValue(): Promise<string | null> {
    return await this.page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const operatorSelect = selects.find((select) => {
        const options = Array.from(select.querySelectorAll('option')).map((option) =>
          (option.textContent || '').trim(),
        );
        return options.includes('All Operators');
      });

      return operatorSelect instanceof HTMLSelectElement ? operatorSelect.value : null;
    });
  }

  async selectAllVisibleWells(): Promise<void> {
    const button = await this.findVisibleLocator(
      this.page.getByRole('button', { name: /Select (All|Filtered)/i }),
      'Select wells button',
    );
    await button.click();
  }

  async readSelectedWellsBadgeCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const matches = Array.from(document.querySelectorAll('*'))
        .map((element) => (element.textContent || '').trim())
        .filter(Boolean)
        .map((text) => {
          const hit = text.match(/^(\d+)\s+Wells$/i);
          return hit ? Number(hit[1]) : null;
        })
        .filter((value): value is number => Number.isFinite(value));

      if (matches.length === 0) {
        return 0;
      }

      return Math.max(...matches);
    });
  }

  async assertNoDimensionWarnings(): Promise<void> {
    const warnings = this.consoleMessages.filter(hasDimensionWarning);
    expect(
      warnings.map((warning) => `[${warning.type}] ${warning.text}`).join('\n'),
    ).toBe('');
  }

  private async getActiveGroupLabel(): Promise<string> {
    return (
      (await this.page.locator('[data-testid="economics-active-group-label"]').first().textContent())?.trim() ||
      ''
    );
  }

  private async findVisibleLocator(
    locator: Locator,
    label: string,
    timeoutMs = 15_000,
  ): Promise<Locator> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const count = await locator.count();

      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);
        if (await candidate.isVisible().catch(() => false)) {
          return candidate;
        }
      }

      await this.page.waitForTimeout(100);
    }

    throw new Error(`${label} was not visible`);
  }
}
