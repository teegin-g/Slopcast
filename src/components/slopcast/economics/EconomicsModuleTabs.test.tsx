import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EconomicsModuleTabs from './EconomicsModuleTabs';
import type { EconomicsModule } from './types';

afterEach(() => cleanup());

describe('EconomicsModuleTabs', () => {
  it('emits selected module changes', () => {
    const onChange = vi.fn();
    render(<EconomicsModuleTabs module="PRODUCTION" onChange={onChange} />);

    fireEvent.click(screen.getByTestId('economics-module-tab-pricing'));
    expect(onChange).toHaveBeenCalledWith('PRICING');
  });

  it('renders active state after switching', () => {
    function Harness() {
      const [module, setModule] = useState<EconomicsModule>('PRODUCTION');
      return <EconomicsModuleTabs module={module} onChange={setModule} />;
    }

    render(<Harness />);
    fireEvent.click(screen.getByTestId('economics-module-tab-capex'));
    expect(screen.getByTestId('economics-module-tab-capex').getAttribute('aria-pressed')).toBe('true');
  });
});
