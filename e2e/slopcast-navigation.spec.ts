import { test } from './fixtures/slopcast';
import { THEMES } from './helpers/slopcast';

test.describe('Slopcast navigation coverage', () => {
  test('design and scenarios stay navigable across all themes', async ({ slopcast }) => {
    test.setTimeout(120_000);
    for (const theme of THEMES) {
      const label = theme.alias || theme.id;
      await test.step(`verify ${label} navigation`, async () => {
        await slopcast.setTheme(theme);

        await slopcast.openDesignView();
        await slopcast.openWellsWorkspace();
        await slopcast.expectWellsWorkspace();
        await slopcast.assertSaveSnapshotHidden();

        await slopcast.openScenarioView();
        await slopcast.expectScenarioView();
        await slopcast.assertChartsHealthy({ requireVisible: true });
      });
    }

    await slopcast.assertNoDimensionWarnings();
  });
});
