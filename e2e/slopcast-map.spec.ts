import { test, expect } from './fixtures/slopcast';
import { THEMES } from './helpers/slopcast';

test.describe('Map Command Center', () => {
  test('map loads and renders well dots across themes', async ({ slopcast }) => {
    for (const theme of THEMES) {
      await test.step(`${theme.id}: map loads with wells`, async () => {
        await slopcast.setTheme(theme);
        await slopcast.openDesignView();
        await slopcast.openWellsWorkspace();

        await slopcast.navigateToMapTab();
        await slopcast.expectMapLoaded();
        await slopcast.expectMapWellsPopulated();
        await slopcast.screenshotMap(`${theme.id}__wells-loaded`);
      });
    }
  });

  test('map overlay controls are functional', async ({ slopcast }) => {
    await slopcast.openDesignView();
    await slopcast.openWellsWorkspace();
    await slopcast.navigateToMapTab();
    await slopcast.expectMapLoaded();

    const overlayContainer = slopcast.page.locator(
      '[data-testid="map-command-center"] .pointer-events-none',
    );
    await expect(overlayContainer.first()).toBeVisible();
  });
});

test.describe('Data Source Badge', () => {
  test('shows Mock badge when spatial source is mock', async ({ isMobileViewport, slopcast }) => {
    test.skip(isMobileViewport, 'Data source badge is only rendered in the desktop MapCommandCenter overlay.');
    // Default bootstrap sets no spatial source, so getStoredSpatialSourceId() returns 'mock'
    await slopcast.openDesignView();
    await slopcast.openWellsWorkspace();
    await slopcast.navigateToMapTab();
    await slopcast.expectMapLoaded();

    const mapContainer = slopcast.page.getByTestId('map-command-center');
    const mockBadge = mapContainer.getByText('Mock', { exact: true });
    await expect(mockBadge).toBeVisible({ timeout: 10_000 });
  });

  test('shows Mock badge with live source when backend is unavailable', async ({ isMobileViewport, page, slopcast }) => {
    test.skip(isMobileViewport, 'Data source badge is only rendered in the desktop MapCommandCenter overlay.');
    // Set localStorage to 'live' before loading
    await page.addInitScript(() => {
      localStorage.setItem('slopcast_spatial_source', 'live');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await slopcast.goto();
    await slopcast.openDesignView();
    await slopcast.openWellsWorkspace();
    await slopcast.navigateToMapTab();
    await slopcast.expectMapLoaded();

    // Without a running backend, the live source fails and falls back to mock.
    // The badge should still be visible (shows either Mock or DB).
    const mapContainer = slopcast.page.getByTestId('map-command-center');
    const badge = mapContainer.getByText(/Mock|DB/, { exact: false });
    await expect(badge.first()).toBeVisible({ timeout: 10_000 });
  });
});
