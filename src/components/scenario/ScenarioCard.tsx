import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Shared shell for the ScenarioDashboard summary card and portfolio-overlay panel.
 *
 * Both usages fork classic / modern the same way:
 *  - classic: an `sc-panel` wrapper whose header is an `sc-panelTitlebar sc-titlebar--red`
 *    strip holding a white, uppercase, optionally brand-font title; the body lives in a
 *    padded region.
 *  - modern: a rounded card with an inline-styled title and a body region.
 *
 * To keep rendered output byte-identical across both call sites (which differ in element
 * type, padding, title tag, tracking, decorations, and the modern header markup) every
 * structural difference is passed in as a prop. ScenarioCard only owns the branch that is
 * truly common: pick the wrapper element, apply the classic-vs-modern wrapper class, and in
 * classic mode render the titlebar header + the body wrapper.
 *
 * NOTE: The MODEL STACK scenario-list item (a button whose classic variant uses inline
 * border styling rather than an `sc-panelTitlebar` header, and whose internal layout is a
 * dot/name/pricing stack) does not share this shell and is intentionally left inline in
 * ScenarioDashboard.
 */
export interface ScenarioCardProps {
  /** Rendered wrapper element. */
  as: 'button' | 'div';
  /** Wrapper className applied when the active theme is classic. */
  classicWrapperClassName: string;
  /** Wrapper className applied for non-classic (modern) themes. */
  modernWrapperClassName: string;
  /** Optional decorations rendered before the header in both modes (e.g. color bar / glow). */
  decorations?: React.ReactNode;
  /** Title text shown in the classic titlebar header. */
  title: string;
  /** Tag for the classic titlebar title (h3 / h4). */
  classicTitleAs: 'h3' | 'h4';
  /** className for the classic titlebar title element. */
  classicTitleClassName: string;
  /** className for the classic `sc-panelTitlebar` header strip. */
  classicHeaderClassName: string;
  /** className for the classic body wrapper that surrounds {@link children}. */
  classicBodyClassName: string;
  /** Header markup rendered in modern mode (rendered before {@link children}). */
  modernHeader: React.ReactNode;
  /** className for the modern body wrapper that surrounds {@link children}. */
  modernBodyClassName?: string;
  /** Body content. */
  children: React.ReactNode;
  /** Click handler (button usage). */
  onClick?: () => void;
  /** Button type when `as === 'button'`. */
  type?: 'button' | 'submit' | 'reset';
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  as,
  classicWrapperClassName,
  modernWrapperClassName,
  decorations,
  title,
  classicTitleAs,
  classicTitleClassName,
  classicHeaderClassName,
  classicBodyClassName,
  modernHeader,
  modernBodyClassName,
  children,
  onClick,
  type = 'button',
}) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;

  const ClassicTitle = classicTitleAs;

  const inner = isClassic ? (
    <>
      {decorations}
      <div className={classicHeaderClassName}>
        <ClassicTitle className={classicTitleClassName}>{title}</ClassicTitle>
      </div>
      <div className={classicBodyClassName}>{children}</div>
    </>
  ) : (
    <>
      {decorations}
      {modernHeader}
      {modernBodyClassName !== undefined ? (
        <div className={modernBodyClassName}>{children}</div>
      ) : (
        children
      )}
    </>
  );

  const className = isClassic ? classicWrapperClassName : modernWrapperClassName;

  if (as === 'button') {
    return (
      <button type={type} onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
};

export default ScenarioCard;
