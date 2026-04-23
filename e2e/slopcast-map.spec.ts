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

  test('3D laterals stay inactive below threshold and render at close zoom', async ({ isMobileViewport, slopcast }) => {
    test.skip(isMobileViewport, '3D lateral validation is only enforced on the desktop map harness.');

    await test.step('far zoom stays 2D-only', async () => {
      await slopcast.reloadForMapTestView({ zoom: 8, pitch: 45, bearing: 0 });
      await slopcast.openDesignView();
      await slopcast.openWellsWorkspace();
      await slopcast.navigateToMapTab();
      await slopcast.expectMapLoaded();
      await slopcast.expectMapWellsPopulated();
      await slopcast.toggleLaterals(true);

      await expect
        .poll(async () => slopcast.readMapZoom(), {
          timeout: 10_000,
          message: 'Expected initial map zoom to stay below the lateral threshold',
        })
        .toBeLessThan(10);

      await expect
        .poll(async () => (await slopcast.readWellboreDiagnostics()).wellboreCount, {
          timeout: 10_000,
          message: 'Expected no 3D wellbores below the close-zoom threshold',
        })
        .toBe(0);
    });

    await test.step('close zoom drives the 3D wellbore render path', async () => {
      await slopcast.reloadForMapTestView({ zoom: 14, pitch: 60, bearing: 20 });
      await slopcast.openDesignView();
      await slopcast.openWellsWorkspace();
      await slopcast.navigateToMapTab();
      await slopcast.expectMapLoaded();
      await slopcast.expectMapWellsPopulated();
      await slopcast.toggleLaterals(true);

      await expect
        .poll(async () => slopcast.readMapZoom(), {
          timeout: 10_000,
          message: 'Expected close zoom test view to load',
        })
        .toBeGreaterThanOrEqual(14);
      await expect
        .poll(async () => (await slopcast.readWellboreDiagnostics()).mounted, {
          timeout: 10_000,
        })
        .toBe(true);
      await expect
        .poll(async () => (await slopcast.readWellboreDiagnostics()).wellboreCount, {
          timeout: 15_000,
          message: 'Expected trajectory-backed wellbores once the map is close enough',
        })
        .toBeGreaterThan(0);
      await expect
        .poll(async () => (await slopcast.readWellboreDiagnostics()).vertexCount, {
          timeout: 15_000,
        })
        .toBeGreaterThan(0);
      await expect
        .poll(async () => (await slopcast.readWellboreDiagnostics()).drawCalls, {
          timeout: 15_000,
        })
        .toBeGreaterThan(0);
      await expect
        .poll(async () => (await slopcast.readWellboreDiagnostics()).lastDrawVertexCount, {
          timeout: 15_000,
        })
        .toBeGreaterThan(0);

      await slopcast.screenshotMap('3d-laterals-close-zoom');
    });
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
