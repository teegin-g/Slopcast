import React, { useEffect, useId, useRef, useState } from 'react';
import { getThemeChrome, getThemeIcon, getThemePreview } from '../../theme/registry';
import type { ThemeDefinition, ThemeId } from '../../theme/types';

interface ThemeSelectorMenuProps {
  isClassic: boolean;
  theme: ThemeDefinition;
  themes: readonly ThemeDefinition[];
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

function ThemeIconMark({ theme, className }: { theme: ThemeDefinition; className?: string }) {
  const icon = getThemeIcon(theme);

  if (icon.kind === 'svg' && icon.component) {
    const Icon = icon.component;
    return <Icon className={className} />;
  }

  return (
    <span className={className} aria-hidden="true">
      {icon.value ?? icon.fallback}
    </span>
  );
}

function CheckMark() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3.2 8.1 3 3.1 6.6-6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ThemeSelectorMenu: React.FC<ThemeSelectorMenuProps> = ({
  isClassic,
  theme,
  themes,
  themeId,
  setThemeId,
}) => {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, themes.findIndex(option => option.id === themeId));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const currentPreview = getThemePreview(theme);
  const currentChrome = getThemeChrome(theme);

  useEffect(() => {
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      listboxRef.current?.focus();
    }
  }, [open]);

  const closeAndFocusTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openMenu = (index = selectedIndex) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const selectTheme = (nextTheme: ThemeDefinition) => {
    setThemeId(nextTheme.id);
    closeAndFocusTrigger();
  };

  const moveActive = (delta: number) => {
    setActiveIndex(current => (current + delta + themes.length) % themes.length);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu(selectedIndex);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(selectedIndex);
    }
  };

  const handleListboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(themes.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectTheme(themes[activeIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        closeAndFocusTrigger();
        break;
    }
  };

  const activeOptionId = `${listboxId}-option-${themes[activeIndex]?.id ?? themeId}`;
  const triggerClass = isClassic || currentChrome.brandTreatment === 'classic-cartridge'
    ? 'border-2 border-black/25 bg-black/15 text-white shadow-card hover:bg-black/20'
    : 'border border-theme-border/70 bg-theme-surface1/70 text-theme-text shadow-[inset_0_1px_0_rgb(var(--text)/0.06)] hover:bg-theme-surface2/80';

  return (
    <div ref={rootRef} className="relative min-w-0" data-testid="theme-selector-menu">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={`Theme ${theme.label}`}
        data-testid="theme-selector-trigger"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={`group inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-inner px-2.5 py-1.5 text-left theme-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-cyan/50 motion-safe:transition motion-safe:duration-200 motion-reduce:transition-none ${triggerClass}`}
      >
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-inner border border-current/20"
          style={{ background: currentPreview.swatch, color: currentPreview.accent }}
        >
          <ThemeIconMark theme={theme} className="h-[18px] w-[18px] text-current" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[10px] font-black uppercase tracking-[0.18em] leading-tight">
            {theme.label}
          </span>
          <span className="hidden truncate text-[8px] font-bold uppercase tracking-[0.16em] text-theme-muted sm:block">
            Theme world
          </span>
        </span>
        <svg className={`h-3 w-3 shrink-0 text-theme-muted motion-safe:transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label="Choose theme"
          aria-activedescendant={activeOptionId}
          tabIndex={-1}
          onKeyDown={handleListboxKeyDown}
          className={`absolute left-0 top-[calc(100%+0.55rem)] z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-panel border p-2 outline-none theme-transition motion-safe:animate-in motion-reduce:transition-none ${
            isClassic
              ? 'border-black/35 bg-[#141414]/95 shadow-card'
              : 'border-theme-border/80 bg-theme-surface1/95 shadow-[0_24px_70px_rgb(0_0_0/0.38),inset_0_1px_0_rgb(var(--text)/0.06)] backdrop-blur-xl'
          }`}
        >
          <div className="px-2 pb-2 pt-1">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-theme-muted">Choose a world</p>
          </div>
          <div className="grid gap-1.5">
            {themes.map((option, index) => {
              const preview = getThemePreview(option);
              const icon = getThemeIcon(option);
              const selected = option.id === themeId;
              const active = index === activeIndex;

              return (
                <button
                  key={option.id}
                  id={`${listboxId}-option-${option.id}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-active={active}
                  data-testid={`theme-selector-option-${option.id}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectTheme(option)}
                  className={`grid min-h-[56px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-inner px-2.5 py-2 text-left theme-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-cyan/45 motion-safe:transition motion-safe:duration-150 motion-reduce:transition-none ${
                    selected
                      ? isClassic
                        ? 'bg-theme-warning text-black shadow-card'
                        : 'bg-theme-cyan/14 text-theme-text shadow-[inset_0_0_0_1px_rgb(var(--cyan)/0.34)]'
                      : active
                        ? isClassic
                          ? 'bg-black/25 text-white'
                          : 'bg-theme-surface2/80 text-theme-text'
                        : 'text-theme-muted hover:text-theme-text'
                  }`}
                >
                  <span
                    className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-inner border border-current/15"
                    style={{ background: preview.swatch, color: preview.accent }}
                  >
                    <ThemeIconMark theme={option} className="relative z-10 h-5 w-5 text-current drop-shadow-sm" />
                  </span>

                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-xs font-black uppercase tracking-[0.14em]">{option.label}</span>
                      {option.fxTheme && (
                        <span className="rounded-full border border-current/25 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em]">
                          FX
                        </span>
                      )}
                      {option.hasLightVariant && (
                        <span className="rounded-full border border-current/25 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em]">
                          Light
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-[10px] font-semibold leading-tight opacity-80">
                      {preview.tagline}
                    </span>
                  </span>

                  <span className={`grid h-6 w-6 place-items-center rounded-full ${selected ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
                    <CheckMark />
                  </span>
                  <span className="sr-only">{icon.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelectorMenu;
