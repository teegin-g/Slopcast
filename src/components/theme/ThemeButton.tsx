/**
 * ThemeButton
 *
 * Encapsulates the two recurring isClassic button patterns used across Hub /
 * Auth / Integrations pages.
 *
 * variant="primary"
 *   Classic:  `rounded-inner px-{px} py-{py} text-[10px] font-black uppercase tracking-[0.2em]
 *               bg-theme-cyan text-white border border-theme-magenta/60 shadow-card`
 *   Modern:   `rounded-inner px-{px} py-{py} text-[10px] font-black uppercase tracking-[0.2em]
 *               bg-theme-cyan text-theme-bg shadow-glow-cyan`
 *
 * variant="secondary"
 *   Classic:  `rounded-inner px-{px} py-{py} text-[10px] font-black uppercase tracking-[0.2em]
 *               bg-black/20 border border-black/25 text-white/90`
 *   Modern:   `rounded-inner px-{px} py-{py} text-[10px] font-black uppercase tracking-[0.2em]
 *               bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text`
 *
 * Padding defaults (`px-4 py-2`) match the most common wizard button call sites.
 * Pass `px`/`py` to override (e.g. `px="4" py="3"` for the auth sign-in button).
 *
 * Optional `extraModernCls` appends additional classes to the modern string only
 * (e.g. `hover:brightness-105` on wizard Next/Save). This keeps the classic
 * output unchanged while enriching the modern one where the original code did so.
 *
 * All other button attributes (onClick, disabled, type, data-testid…) are
 * forwarded via rest props.
 */

import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export type ThemeButtonVariant = 'primary' | 'secondary';

interface ThemeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ThemeButtonVariant;
  /** Tailwind px-{n} suffix, default '4' */
  px?: string;
  /** Tailwind py-{n} suffix, default '2' */
  py?: string;
  /** Additional classes appended to the MODERN string only */
  extraModernCls?: string;
}

const ThemeButton = React.forwardRef<HTMLButtonElement, ThemeButtonProps>(
  (
    {
      variant = 'primary',
      px = '4',
      py = '2',
      extraModernCls = '',
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const { theme } = useTheme();
    const isClassic = theme.features.isClassicTheme;

    const base = `rounded-inner px-${px} py-${py} text-[10px] font-black uppercase tracking-[0.2em]`;

    let themeCls: string;
    if (variant === 'primary') {
      themeCls = isClassic
        ? 'bg-theme-cyan text-white border border-theme-magenta/60 shadow-card'
        : `bg-theme-cyan text-theme-bg shadow-glow-cyan${extraModernCls ? ` ${extraModernCls}` : ''}`;
    } else {
      themeCls = isClassic
        ? 'bg-black/20 border border-black/25 text-white/90'
        : `bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text${extraModernCls ? ` ${extraModernCls}` : ''}`;
    }

    const fullCls = className
      ? `${base} ${themeCls} ${className}`
      : `${base} ${themeCls}`;

    return (
      <button ref={ref} className={fullCls} {...rest}>
        {children}
      </button>
    );
  }
);

ThemeButton.displayName = 'ThemeButton';

export default ThemeButton;
