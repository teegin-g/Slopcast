import { test as base, expect } from '@playwright/test';
import { SlopcastApp } from '../helpers/slopcast';

type SlopcastFixtures = {
  isMobileViewport: boolean;
  slopcast: SlopcastApp;
};

export const test = base.extend<SlopcastFixtures>({
  isMobileViewport: async ({}, use, testInfo) => {
    await use(Boolean(testInfo.project.use.isMobile));
  },
  slopcast: async ({ page, isMobileViewport }, use) => {
    const app = new SlopcastApp(page, isMobileViewport);
    await app.bootstrap();
    await app.goto();
    await use(app);
  },
});

export { expect };
