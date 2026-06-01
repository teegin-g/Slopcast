import type React from 'react';

type ThemeIconProps = React.SVGProps<SVGSVGElement>;

function ThemeIconFrame({ children, ...props }: ThemeIconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function SlateThemeIcon(props: ThemeIconProps) {
  return (
    <ThemeIconFrame {...props}>
      <path d="M5 20V7.5L12 4l7 3.5V20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 10h2.2M13.8 10H16M8 13.5h2.2M13.8 13.5H16M8 17h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </ThemeIconFrame>
  );
}

export function SynthwaveThemeIcon(props: ThemeIconProps) {
  return (
    <ThemeIconFrame {...props}>
      <path d="M4 15.5h16M6 18h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 14a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 11.5h7M7.7 14h8.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="m6 20 4-4m8 4-4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </ThemeIconFrame>
  );
}

export function TropicalThemeIcon(props: ThemeIconProps) {
  return (
    <ThemeIconFrame {...props}>
      <circle cx="16.5" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 20c2-6 3.4-10.6 4.8-15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 5c-3.8.4-6.1 2-7 4.4 3-.7 5.2-.3 6.8 1.2M12 5c3.2 1 5.2 2.8 6 5.4-2.4-1-4.6-1-6.5 0M11.9 5c-1.4 2-1.9 4.1-1.4 6.4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </ThemeIconFrame>
  );
}

export function NocturneThemeIcon(props: ThemeIconProps) {
  return (
    <ThemeIconFrame {...props}>
      <path d="M16.5 4.5a5.5 5.5 0 0 0 2.3 10.5 6.8 6.8 0 1 1-2.3-10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m3.5 19 5.4-5.1 3.4 3.1 2-1.8L20.5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </ThemeIconFrame>
  );
}

export function StormwatchThemeIcon(props: ThemeIconProps) {
  return (
    <ThemeIconFrame {...props}>
      <path d="M7 15.5h10.2a3 3 0 0 0 .4-6 5.4 5.4 0 0 0-10.2-1.6A3.9 3.9 0 0 0 7 15.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m11.5 14-2 4h3l-1 3 4-5h-3l1-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </ThemeIconFrame>
  );
}

export function ClassicThemeIcon(props: ThemeIconProps) {
  return (
    <ThemeIconFrame {...props}>
      <path d="M5 8.5 9 5h10v10.5L15 19H5V8.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M5 8.5h10v10.4M15 8.5 19 5M15 8.5v10.4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" opacity="0.75" />
      <path d="M8.2 12h3.6M10 10.2v3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </ThemeIconFrame>
  );
}

export function HyperboreaThemeIcon(props: ThemeIconProps) {
  return (
    <ThemeIconFrame {...props}>
      <path d="M5 15.5c1-4 3.8-6 8.3-6 3.2 0 5.2 1.5 5.7 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 14.5v3.8M12 14v4.3M16 14.6v3.7" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
      <path d="M18.8 14c2.6 1.2 2.6 3.7.2 4.8M6.5 10.5C5.5 9.4 5 8.2 5 7" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M8.5 5v4M6.8 6l3.4 2M10.2 6 6.8 8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
    </ThemeIconFrame>
  );
}

export function PermianThemeIcon(props: ThemeIconProps) {
  return (
    <ThemeIconFrame {...props}>
      <path d="M5 19h14M8 19l4-13 4 13M9.2 15h5.6M10.4 11h3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6c2.8-.8 5.1-.2 7 1.6-1.7 1.2-3.7 1.4-6.1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 19c.4-1.5 1.3-2.2 2.8-2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </ThemeIconFrame>
  );
}
