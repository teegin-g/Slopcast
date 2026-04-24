import { test } from './fixtures/slopcast';
import { THEMES } from './helpers/slopcast';

test.describe('Slopcast economics coverage', () => {
  test('economics modules and group controls remain healthy across themes', async ({
    isMobileViewport,
    slopcast,
  }) => {
    test.setTimeout(180_000);
    for (const theme of THEMES) {
      const label = theme.alias || theme.id;
      await test.step(`verify ${label} economics results`, async () => {
        await slopcast.setTheme(theme);

        await slopcast.openDesignView();
        await slopcast.openEconomicsWorkspace();
        await slopcast.openMobileResultsPanelIfNeeded();
        await slopcast.assertSaveSnapshotVisible();
        await slopcast.ensureEconomicsGroupSwitch();

        await slopcast.setEconomicsModule('PRODUCTION');
        await slopcast.setEconomicsModule('CAPEX');
        await slopcast.assertChartsHealthy({ requireVisible: !isMobileViewport });
        await slopcast.setEconomicsModule('PRICING');
      });
    }

    await slopcast.assertNoDimensionWarnings();
  });
});
