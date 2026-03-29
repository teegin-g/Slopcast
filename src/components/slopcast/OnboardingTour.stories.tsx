import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import OnboardingTour, { ONBOARDING_STORAGE_KEY } from './OnboardingTour';

interface OnboardingTourHarnessProps {
  isClassic: boolean;
}

function OnboardingTourHarness({ isClassic }: OnboardingTourHarnessProps) {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }

  return (
    <div className="relative min-h-[42rem] overflow-hidden rounded-panel border border-theme-border bg-theme-bg p-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section data-tour-step="welcome" className="rounded-panel border border-theme-border bg-theme-surface1/80 p-5 shadow-card">
          <p className="typo-label">Portfolio</p>
          <h2 className="typo-h2 heading-font mt-2">Permian development sandbox</h2>
          <p className="typo-body mt-2 text-theme-muted">
            New users land here to build groups, configure assumptions, and run their first economics pass.
          </p>
        </section>

        <section data-tour-step="workflow-stepper" className="rounded-panel border border-theme-border bg-theme-surface1/70 p-5 shadow-card">
          <p className="typo-section heading-font">Workflow progress</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {['Setup', 'Select', 'Run', 'Review'].map((step, index) => (
              <div key={step} className="rounded-inner border border-theme-border/60 bg-theme-surface2/40 px-3 py-2">
                <p className="typo-label">
                  {index + 1}. {step}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section data-tour-step="wells-workspace" className="rounded-panel border border-theme-border bg-theme-surface1/70 p-5 shadow-card">
          <p className="typo-section heading-font">Wells workspace</p>
          <p className="typo-body mt-2 text-theme-muted">Operator filters, lasso selection, and assignment actions live here.</p>
        </section>

        <section data-tour-step="economics-workspace" className="rounded-panel border border-theme-border bg-theme-surface1/70 p-5 shadow-card">
          <p className="typo-section heading-font">Economics workspace</p>
          <p className="typo-body mt-2 text-theme-muted">Decline curves, CAPEX, OPEX, and ownership edits update portfolio metrics live.</p>
        </section>

        <section data-tour-step="review-snapshot" className="rounded-panel border border-theme-border bg-theme-surface1/70 p-5 shadow-card">
          <p className="typo-section heading-font">Review snapshot</p>
          <p className="typo-body mt-2 text-theme-muted">Saved runs, exported outputs, and memo-ready metrics surface here.</p>
        </section>
      </div>

      <OnboardingTour isClassic={isClassic} />
    </div>
  );
}

const meta = {
  title: 'Slopcast/OnboardingTour',
  component: OnboardingTourHarness,
  args: {
    isClassic: false,
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof OnboardingTourHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GuidedFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      async () => {
        await expect(canvas.getByRole('dialog')).toBeVisible();
        await expect(canvas.getByText(/welcome to slopcast/i)).toBeVisible();
      },
      { timeout: 2_000 },
    );

    await userEvent.click(canvas.getByRole('button', { name: /next/i }));

    await waitFor(async () => {
      const dialog = canvas.getByRole('dialog');
      await expect(within(dialog).getByText(/wells workspace/i)).toBeVisible();
    });
  },
};

export const ClassicTheme: Story = {
  args: {
    isClassic: true,
  },
  globals: {
    theme: 'mario',
  },
};
