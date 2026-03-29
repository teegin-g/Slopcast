import { expect, type Locator, type Page } from '@playwright/test';

export type ThemeCase = {
  id: 'slate' | 'mario';
  title: 'Slate' | 'Classic';
};

export type EconomicsTabCase = 'OVERVIEW' | 'CASH_FLOW' | 'RESERVES';

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
        localStorage.setItem('slopcast-econ-results-tab', 'OVERVIEW');
      },
      { session: DEV_BYPASS_SESSION, initialThemeId: themeId },
    );
  }

  async goto(): Promise<void> {
    const designWorkspaceTabs = this.page.getByTestId('design-workspace-tabs').first();
    const signInButton = this.page.getByRole('button', { name: /Sign In As Demo User/i }).first();
    const blankWorkspaceButton = this.page.getByRole('button', { name: 'Open Blank Workspace' }).first();

    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt === 0) {
        await this.page.goto('/slopcast', { waitUntil: 'domcontentloaded' });
      } else {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }

      await this.page
        .waitForFunction(() => document.body.innerText.trim().length > 0, undefined, { timeout: 10_000 })
        .catch(() => null);

      const readyState = await this.waitForFirstVisible(
        [
          { label: 'tabs', locator: designWorkspaceTabs },
          { label: 'sign-in', locator: signInButton },
          { label: 'blank-workspace', locator: blankWorkspaceButton },
        ],
        6_000,
      );

      if (readyState === 'tabs') {
        return;
      }

      if (readyState === 'sign-in') {
        await signInButton.click();
        const postSignInState = await this.waitForFirstVisible(
          [
            { label: 'tabs', locator: designWorkspaceTabs },
            { label: 'blank-workspace', locator: blankWorkspaceButton },
          ],
          6_000,
        );

        if (postSignInState === 'tabs') {
          return;
        }
      }

      if (await blankWorkspaceButton.isVisible().catch(() => false)) {
        await blankWorkspaceButton.click();
        await expect(designWorkspaceTabs).toBeVisible({ timeout: 15_000 });
        return;
      }
    }

    throw new Error('Slopcast design workspace tabs were not visible after bootstrap');
  }

  async setTheme(theme: ThemeCase): Promise<void> {
    const hasDropdown = await this.page
      .getByTestId('theme-dropdown-toggle')
      .first()
      .isVisible()
      .catch(() => false);

    if (hasDropdown) {
      await this.page.getByTestId('theme-dropdown-toggle').click();
      await this.page.getByTestId(`theme-option-${theme.id}`).click();
    } else {
      await this.page.locator(`button[title="${theme.title}"]`).first().click();
    }

    await this.page.waitForFunction(
      (themeId) => document.documentElement.dataset.theme === themeId,
      theme.id,
    );
  }

  async openDesignView(): Promise<void> {
    if (await this.page.getByTestId('design-workspace-tabs').first().isVisible().catch(() => false)) {
      return;
    }

    const button = await this.findVisibleLocator(
      this.header.getByRole('button', { name: 'DESIGN', exact: true }),
      'Design navigation button',
    );
    await button.click();
    await expect(this.page.getByTestId('design-workspace-tabs').first()).toBeVisible({ timeout: 15_000 });
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
    const operatorSelect = await this.ensureOperatorFilterVisible();
    await expect
      .poll(async () => {
        return await operatorSelect.evaluate((element) => (element as HTMLSelectElement).options.length);
      })
      .toBeGreaterThan(1);

    const nextValue = await operatorSelect.evaluate((element) => {
      const select = element as HTMLSelectElement;
      const nextOption = Array.from(select.options).find((option) => option.value !== 'ALL');
      return nextOption?.value ?? null;
    });

    if (!nextValue) {
      return null;
    }

    await operatorSelect.selectOption(nextValue);
    await expect.poll(async () => this.readOperatorValue()).toBe(nextValue);
    return nextValue;
  }

  async readOperatorValue(): Promise<string | null> {
    const operatorSelect = await this.ensureOperatorFilterVisible();
    return await operatorSelect.inputValue();
  }

  async selectAllVisibleWells(): Promise<void> {
    const locator = this.isMobileViewport
      ? this.page.getByTestId('wells-select-filtered')
      : this.page.getByTestId('wells-selection-actions-select-filtered');
    const button = await this.findVisibleLocator(locator, 'Select filtered wells button');
    await button.click();
  }

  async readSelectedVisibleWellCount(): Promise<number> {
    return await this.readNumericTestId('wells-selected-visible-count');
  }

  async readFilteredWellCount(): Promise<number> {
    return await this.readNumericTestId('wells-filtered-count');
  }

  async resetWellsWorkspaceState(): Promise<void> {
    const resetButton = this.page.getByRole('button', { name: 'Reset', exact: true }).first();
    if (await resetButton.isVisible().catch(() => false)) {
      await resetButton.click();
      await expect.poll(async () => this.readOperatorValue()).toBe('ALL');
    }

    if ((await this.readSelectedVisibleWellCount()) > 0) {
      const clearButton = await this.findVisibleLocator(
        this.isMobileViewport
          ? this.page.getByTestId('wells-mobile-clear')
          : this.page.getByTestId('wells-selection-actions-clear'),
        'Clear selected wells button',
      );
      await clearButton.click();
      await expect.poll(async () => this.readSelectedVisibleWellCount()).toBe(0);
    }
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

  private async ensureOperatorFilterVisible(): Promise<Locator> {
    const operatorSelect = this.page.getByTestId('wells-filter-operator').first();
    const isVisible = await operatorSelect.isVisible().catch(() => false);
    if (!isVisible) {
      await this.page.getByTestId('wells-filters-toggle').click();
      await expect(operatorSelect).toBeVisible({ timeout: 5_000 });
    }
    return operatorSelect;
  }

  private async readNumericTestId(testId: string): Promise<number> {
    const raw = (await this.page.getByTestId(testId).first().textContent())?.trim() || '0';
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  }

  private async findVisibleLocator(
    locator: Locator,
    label: string,
    timeoutMs = 15_000,
  ): Promise<Locator> {
    const visibleLocator = await this.tryFindVisibleLocator(locator, timeoutMs);
    if (visibleLocator) {
      return visibleLocator;
    }

    throw new Error(`${label} was not visible`);
  }

  private async waitForFirstVisible(
    entries: Array<{ label: string; locator: Locator }>,
    timeoutMs = 5_000,
  ): Promise<string | null> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      for (const entry of entries) {
        if (await entry.locator.isVisible().catch(() => false)) {
          return entry.label;
        }
      }

      await this.page.waitForTimeout(100);
    }

    return null;
  }

  private async tryFindVisibleLocator(
    locator: Locator,
    timeoutMs = 15_000,
  ): Promise<Locator | null> {
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

    return null;
  }
}
