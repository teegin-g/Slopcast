import { test } from './fixtures/slopcast';
import { THEMES } from './helpers/slopcast';

test.describe('Slopcast economics coverage', () => {
  test('economics tabs and group controls remain healthy across themes', async ({
    isMobileViewport,
    slopcast,
  }) => {
    for (const theme of THEMES) {
      await test.step(`verify ${theme.id} economics results`, async () => {
        await slopcast.setTheme(theme);

        await slopcast.openDesignView();
        await slopcast.openEconomicsWorkspace();
        await slopcast.openMobileResultsPanelIfNeeded();
        await slopcast.assertSaveSnapshotVisible();
        await slopcast.ensureEconomicsGroupSwitch();

        await slopcast.setEconomicsResultsTab('SUMMARY');
        await slopcast.setEconomicsResultsTab('CHARTS');
        await slopcast.assertChartsHealthy({ requireVisible: !isMobileViewport });
        await slopcast.setEconomicsResultsTab('DRIVERS');
      });
    }

    await slopcast.assertNoDimensionWarnings();
  });
});
