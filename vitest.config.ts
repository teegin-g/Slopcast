import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { defineConfig } from 'vitest/config';
import { sharedPlugins, sharedResolve } from './vite.base';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: sharedPlugins,
  resolve: sharedResolve,
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'app',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript: 'npm run storybook -- --ci --no-open',
          }),
        ],
        test: {
          name: 'storybook',
          exclude: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./.storybook/vitest.setup.ts'],
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
