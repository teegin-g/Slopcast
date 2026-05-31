/**
 * ThemePanel
 *
 * Encapsulates the isClassic panel pattern used across Hub/Auth/Integrations pages.
 *
 * The className string order matches the original inline ternaries exactly:
 *   `rounded-panel border ${className} ${themeSuffix}`
 *
 * Classic suffix:  `sc-panel`
 * Modern suffix:   `bg-theme-surface1/{opacity} border-theme-border shadow-card`
 *
 * The `opacity` prop selects the Tailwind opacity suffix for the modern surface
 * (`/80`, `/60`, `/70`, `/75`, `/65`). Defaults to `/80`.
 *
 * Extra classes (padding, spacing, layout) are passed via `className` and appear
 * between `rounded-panel border` and the theme suffix — preserving byte-identity
 * with the original inline strings.
 */

import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export type ThemePanelOpacity = '80' | '75' | '70' | '65' | '60';

interface ThemePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Tailwind opacity suffix for the modern bg-theme-surface1 class.
   * @default '80'
   */
  opacity?: ThemePanelOpacity;
}

const ThemePanel = React.forwardRef<HTMLDivElement, ThemePanelProps>(
  ({ opacity = '80', className = '', children, ...rest }, ref) => {
    const { theme } = useTheme();
    const isClassic = theme.features.isClassicTheme;

    // The theme-specific suffix appears AFTER className to preserve the exact
    // class order from the original inline ternaries:
    //   `rounded-panel border ${className} ${themeSuffix}`
    const themeSuffix = isClassic
      ? 'sc-panel'
      : `bg-theme-surface1/${opacity} border-theme-border shadow-card`;

    const fullCls = className
      ? `rounded-panel border ${className} ${themeSuffix}`
      : `rounded-panel border ${themeSuffix}`;

    return (
      <div ref={ref} className={fullCls} {...rest}>
        {children}
      </div>
    );
  }
);

ThemePanel.displayName = 'ThemePanel';

export default ThemePanel;
