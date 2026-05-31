import type { EconomicsAccent } from './types';

const accentText: Record<EconomicsAccent, string> = {
  cyan: 'text-theme-cyan',
  green: 'text-emerald-300',
  amber: 'text-amber-300',
  red: 'text-red-300',
  mint: 'text-teal-300',
  violet: 'text-violet-300',
};

const accentBorder: Record<EconomicsAccent, string> = {
  cyan: 'border-theme-cyan/45',
  green: 'border-emerald-400/45',
  amber: 'border-amber-400/45',
  red: 'border-red-400/45',
  mint: 'border-teal-400/45',
  violet: 'border-violet-400/45',
};

const accentBg: Record<EconomicsAccent, string> = {
  cyan: 'bg-theme-cyan/10',
  green: 'bg-emerald-400/10',
  amber: 'bg-amber-400/10',
  red: 'bg-red-400/10',
  mint: 'bg-teal-400/10',
  violet: 'bg-violet-400/10',
};

export const accentClass = (accent: EconomicsAccent) => ({
  text: accentText[accent],
  border: accentBorder[accent],
  bg: accentBg[accent],
});
