import { test, expect } from './fixtures/slopcast';
import { THEMES } from './helpers/slopcast';

test.describe('Map Command Center', () => {
  test('map loads and renders well dots across themes', async ({ slopcast }) => {
    for (const theme of THEMES) {
      await test.step(`${theme.id}: map loads with wells`, async () => {
        await slopcast.setTheme(theme);
        await slopcast.openDesignView();
        await slopcast.openWellsWorkspace();

        await slopcast.expectMapLoaded();
        await slopcast.expectMapWellsPopulated();
        await slopcast.screenshotMap(`${theme.id}__wells-loaded`);
      });
    }
  });

  test('map overlay controls are functional', async ({ slopcast }) => {
    await slopcast.openDesignView();
    await slopcast.openWellsWorkspace();
    await slopcast.expectMapLoaded();

    const overlayContainer = slopcast.page.locator(
      '[data-testid="map-command-center"] .pointer-events-none',
    );
    await expect(overlayContainer.first()).toBeVisible();
  });
});
