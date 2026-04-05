import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTheme } from '../../theme/ThemeProvider';
import { useStableChartContainer } from './hooks/useStableChartContainer';
import SectionCard from './SectionCard';
import type { WellGroup, Scenario } from '../../types';
import type { ChartDataPoint } from './hooks/useScenarioAnalysis';

interface PortfolioOverlayChartProps {
  groups: WellGroup[];
  scenarios: Scenario[];
  cfChartData: ChartDataPoint[];
}

const PortfolioOverlayChart: React.FC<PortfolioOverlayChartProps> = ({ groups, scenarios, cfChartData }) => {
  const { theme } = useTheme();
  const { chartPalette } = theme;
  const isClassic = theme.features.isClassicTheme;
  const titleClass = theme.features.brandFont ? 'brand-font' : 'heading-font';
  const overlayChart = useStableChartContainer([theme.id, scenarios.length, cfChartData.length]);
  const isEmpty = groups.length === 0 || groups.every(g => g.wellIds.size === 0);

  return (
    <SectionCard
      isClassic={isClassic}
      title="PORTFOLIO OVERLAY"
      panelStyle="glass"
      headerClassName={isClassic ? 'sc-titlebar--red px-5 py-4' : ''}
      titleClassName={isClassic ? titleClass : `${titleClass} text-theme-lavender`}
      bodyClassName={isClassic ? 'p-5' : 'p-8'}
    >
      {isEmpty ? (
        <div className="space-y-3 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-theme-border/40">
            <svg className="h-8 w-8 text-theme-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-theme-text">Portfolio Overlay</p>
          <p className="mx-auto max-w-xs text-xs text-theme-muted">
            Create multiple well groups with economics to compare portfolio-level metrics across scenarios.
          </p>
        </div>
      ) : (
        <div className="h-[320px] w-full" ref={overlayChart.containerRef}>
          {overlayChart.ready ? (
            <ResponsiveContainer width={overlayChart.width} height={overlayChart.height}>
              <LineChart data={cfChartData}>
                <CartesianGrid strokeDasharray="6 6" stroke={chartPalette.grid} vertical={false} />
                <XAxis dataKey="month" stroke={chartPalette.text} fontSize={9} tickFormatter={(v) => v % 12 === 0 ? `Y${v / 12}` : ''} axisLine={false} tickLine={false} />
                <YAxis stroke={chartPalette.text} fontSize={9} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: chartPalette.surface, borderRadius: 'var(--radius-inner)', borderColor: chartPalette.border, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                  formatter={(val: number) => [`$${(val / 1e6).toFixed(2)}MM`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} iconType="circle" />
                {scenarios.map(s => <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} strokeWidth={4} dot={false} animationDuration={2000} />)}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full w-full rounded-inner ${isClassic ? 'bg-black/20' : 'animate-pulse bg-theme-bg/40'}`} />
          )}
        </div>
      )}
    </SectionCard>
  );
};

export default PortfolioOverlayChart;
