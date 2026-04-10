import { expect, test } from './fixtures/slopcast';
import { THEMES } from './helpers/slopcast';

test.describe('Slopcast persistence coverage', () => {
  test('desktop keeps operator filter and selected wells when returning from economics', async ({
    isMobileViewport,
    slopcast,
  }) => {
    test.skip(isMobileViewport, 'Operator and selection persistence coverage is desktop-only.');

    for (const theme of THEMES) {
      await test.step(`verify ${theme.id} persistence`, async () => {
        await slopcast.setTheme(theme);

        await slopcast.openDesignView();
        await slopcast.openWellsWorkspace();
        await slopcast.expectWellsWorkspace();
        await slopcast.assertSaveSnapshotHidden();

        const operatorValue = await slopcast.setNonDefaultOperator();
        expect(operatorValue).not.toBeNull();

        await slopcast.selectAllVisibleWells();
        const selectedCountAfterSelection = await slopcast.readSelectedVisibleWellCount();
        expect(selectedCountAfterSelection).toBeGreaterThan(0);

        await slopcast.openEconomicsWorkspace();
        await slopcast.assertSaveSnapshotVisible();

        await slopcast.openWellsWorkspace();
        await slopcast.expectWellsWorkspace();

        await expect(await slopcast.readOperatorValue()).toBe(operatorValue);
        await expect(await slopcast.readSelectedVisibleWellCount()).toBe(selectedCountAfterSelection);
      });
    }

    await slopcast.assertNoDimensionWarnings();
  });
});
