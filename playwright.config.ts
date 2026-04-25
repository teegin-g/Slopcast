import { defineConfig } from '@playwright/test';

if (
  process.platform === 'darwin' &&
  process.arch === 'arm64' &&
  !process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE
) {
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = 'mac15-arm64';
}

const localBaseUrl = 'http://127.0.0.1:3100';
const baseURL = (process.env.UI_BASE_URL || localBaseUrl).replace(/\/$/, '');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['line']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: [
        '--use-angle=swiftshader',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--enable-unsafe-swiftshader',
      ],
    },
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        isMobile: false,
        hasTouch: false,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: process.env.UI_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 3100',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
