import React from 'react';
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import DeclineSegmentTable from '../../DeclineSegmentTable';
import { DEFAULT_SEGMENTS } from '../../../constants';
import { currencyMm, summarizeProduction } from './derived';
import { AssumptionTable, InsightBanner, MetricTile, ModulePanel, StableChart } from './EconomicsPrimitives';
import type { EconomicsModuleProps } from './types';

const ProductionModule: React.FC<EconomicsModuleProps> = ({
  activeGroup,
  activeScenario,
  onUpdateGroup,
  onMarkDirty,
}) => {
  const summary = summarizeProduction(activeGroup);
  const splitTotal = summary.eur + summary.totalGas;
  const oilPct = splitTotal > 0 ? (summary.eur / splitTotal) * 100 : 0;
  const gasPct = splitTotal > 0 ? (summary.totalGas / splitTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-theme-border/60 pb-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-theme-cyan">Production</p>
          <h2 className="mt-1 text-xl font-black tracking-normal text-theme-text">Inputs drive the forecast response</h2>
        </div>
        <p className="max-w-2xl text-xs text-theme-muted">
          Tune the selected group type curve, then read the volume response and group economics from the adjacent forecast.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)] gap-4">
        <ModulePanel accent="cyan" title="Production Inputs" bodyClassName="p-5 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-theme-text">Decline segments and type curve</p>
              <p className="mt-1 text-xs text-theme-muted">Edit the assumptions that drive the selected group forecast.</p>
            </div>
            <span className="rounded-inner border border-theme-cyan/25 bg-theme-cyan/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-theme-cyan">
              Scenario scalar {activeScenario.productionScalar.toFixed(2)}x
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <MetricTile label="Initial Rate" value={`${summary.initialRate.toLocaleString()} bopd`} detail="type curve" accent="cyan" compact />
            <MetricTile label="b-factor" value={summary.bFactor.toFixed(2)} detail="decline shape" accent="cyan" compact />
            <MetricTile label="Initial Decline" value={`${summary.initialDecline.toFixed(1)}%`} detail="annualized" accent="cyan" compact />
          </div>

          <DeclineSegmentTable
            segments={activeGroup.typeCurve.segments || DEFAULT_SEGMENTS}
            gorMcfPerBbl={activeGroup.typeCurve.gorMcfPerBbl}
            onChange={(segments, gor) => {
              const firstSeg = segments[0];
              onUpdateGroup({
                ...activeGroup,
                typeCurve: {
                  ...activeGroup.typeCurve,
                  qi: firstSeg?.qi ?? activeGroup.typeCurve.qi,
                  b: firstSeg?.b ?? activeGroup.typeCurve.b,
                  di: firstSeg?.initialDecline ?? activeGroup.typeCurve.di,
                  gorMcfPerBbl: gor,
                  segments,
                },
              });
              onMarkDirty();
            }}
          />

          <AssumptionTable
            accent="cyan"
            columns={['Parameter', 'Oil', 'Gas']}
            rows={[
              ['Initial Rate', `${summary.initialRate.toLocaleString()} bopd`, `${summary.gasOilRatio.toFixed(2)} mcf/bbl`],
              ['Decline Type', 'Arps / segmented', 'Derived from GOR'],
              ['b-factor', summary.bFactor.toFixed(2), '-'],
              ['Initial Decline', `${summary.initialDecline.toFixed(1)}%`, '-'],
            ]}
          />
        </ModulePanel>

        <ModulePanel accent="cyan" title="Forecast Response" bodyClassName="p-4 space-y-4">
          <StableChart className="h-[300px]" deps={[summary.flow.length, activeGroup.id]}>
            {({ width, height }) => (
              <LineChart width={width} height={height} data={summary.flow} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--border) / 0.35)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tickFormatter={(value) => (value % 24 === 0 ? `${value / 12}Y` : '')} tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))', borderRadius: 8, color: 'rgb(var(--text))' }}
                  formatter={(value: number, name: string) => [Math.round(value).toLocaleString(), name === 'oilProduction' ? 'Oil bbl/mo' : 'Gas mcf/mo']}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="oilProduction" name="Oil" stroke="#22d3ee" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="gasProduction" name="Gas" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            )}
          </StableChart>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            <MetricTile label="EUR" value={`${(summary.eur / 1e3).toFixed(0)} Mbo`} detail={currencyMm(activeGroup.metrics?.npv10 ?? 0)} accent="cyan" compact />
            <MetricTile label="Peak Oil" value={`${Math.round(summary.peakOil).toLocaleString()}`} detail={`Month ${summary.peakMonth || '-'}`} accent="cyan" compact />
            <MetricTile label="Initial Decline" value={`${summary.initialDecline.toFixed(1)}%`} detail={`b-factor ${summary.bFactor.toFixed(2)}`} accent="cyan" compact />
          </div>

          <div className="rounded-inner border border-theme-border bg-theme-bg p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-theme-muted">Production split</p>
              <p className="text-[10px] text-theme-muted">Oil {oilPct.toFixed(1)}% · Gas {gasPct.toFixed(1)}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-theme-surface2">
              <div className="h-full bg-theme-cyan" style={{ width: `${oilPct}%` }} />
            </div>
          </div>
        </ModulePanel>
      </div>

      <InsightBanner accent="cyan">
        Forecast quality is driven by the decline segments and the active scenario production scalar. Water and NGL streams are not modeled in this version, so this workspace focuses on oil and gas.
      </InsightBanner>
    </div>
  );
};

export default ProductionModule;
