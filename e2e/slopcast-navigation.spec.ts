import { test } from './fixtures/slopcast';
import { THEMES } from './helpers/slopcast';

test.describe('Slopcast navigation coverage', () => {
  test('design and scenarios stay navigable across slate and mario', async ({ slopcast }) => {
    for (const theme of THEMES) {
      await test.step(`verify ${theme.id} navigation`, async () => {
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
