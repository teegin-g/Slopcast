import React from 'react';
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import DeclineSegmentTable from '../../DeclineSegmentTable';
import { DEFAULT_SEGMENTS } from '../../../constants';
import { currencyMm, summarizeProduction } from './derived';
import { AssumptionTable, InsightBanner, MetricTile, ModulePanel, StableChart } from './EconomicsPrimitives';
import type { EconomicsModuleProps } from './types';

const ProductionModule: React.FC<EconomicsModuleProps> = ({
  activeWorkflow,
  activeGroup,
  onUpdateGroup,
  onMarkDirty,
}) => {
  const summary = summarizeProduction(activeGroup);
  const pdp = activeWorkflow === 'PDP' ? activeGroup.pdpForecast : null;
  const splitTotal = summary.eur + summary.totalGas;
  const oilPct = splitTotal > 0 ? (summary.eur / splitTotal) * 100 : 0;
  const gasPct = splitTotal > 0 ? (summary.totalGas / splitTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-4">
        <ModulePanel accent="cyan" title={activeWorkflow === 'PDP' ? 'History-Driven PDP Forecast' : 'Total Production'} bodyClassName="p-4">
          {pdp && (
            <div className="mb-4 grid gap-2 md:grid-cols-4">
              <MetricTile label="Loaded History" value={`${pdp.loadedWellCount + pdp.partialWellCount}`} detail={`${pdp.missingWellCount} missing`} accent={pdp.missingWellCount > 0 ? 'amber' : 'green'} compact />
              <MetricTile label="Last Production" value={pdp.lastProductionDate ?? 'Missing'} detail="fixture adapter" accent="cyan" compact />
              <MetricTile label="Current Oil" value={`${Math.round(pdp.currentOilBblPerDay).toLocaleString()} bopd`} detail="last loaded month" accent="green" compact />
              <MetricTile label="Quality Flags" value={`${pdp.qualityFlags.length}`} detail={pdp.qualityFlags[0] ?? 'Clean'} accent={pdp.qualityFlags.length > 0 ? 'amber' : 'mint'} compact />
            </div>
          )}
          <StableChart className="h-[320px]" deps={[summary.flow.length, activeGroup.id]}>
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
        </ModulePanel>

        <ModulePanel accent="cyan" title={activeWorkflow === 'PDP' ? 'PDP Forecast Status' : 'Forecast Metrics'} bodyClassName="p-3 space-y-2">
          <MetricTile label="EUR" value={`${(summary.eur / 1e3).toFixed(0)} Mbo`} detail={currencyMm(activeGroup.metrics?.npv10 ?? 0)} accent="cyan" compact />
          <MetricTile label="Peak Oil" value={`${Math.round(summary.peakOil).toLocaleString()}`} detail={`Month ${summary.peakMonth || '-'}`} accent="green" compact />
          <MetricTile label="Initial Decline" value={`${summary.initialDecline.toFixed(1)}%`} detail={`b-factor ${summary.bFactor.toFixed(2)}`} accent="violet" compact />
          <div className="rounded-inner border border-theme-border bg-theme-bg p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-theme-muted">Production Split</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-theme-surface2">
              <div className="h-full bg-theme-cyan" style={{ width: `${oilPct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-theme-muted">
              <span>Oil {oilPct.toFixed(1)}%</span>
              <span>Gas {gasPct.toFixed(1)}%</span>
            </div>
          </div>
        </ModulePanel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4">
        <ModulePanel accent="cyan" title="Production Inputs" bodyClassName="p-4">
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
        </ModulePanel>

        <ModulePanel accent="cyan" title="Type Curve Parameters" bodyClassName="p-4">
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
      </div>

      <InsightBanner accent="cyan">
        {activeWorkflow === 'PDP'
          ? 'PDP forecasts start from loaded historical production, then use decline segments for the forward curve. Third-party source selection is intentionally secondary in this slice.'
          : 'Forecast quality is driven by the decline segments and the active scenario production scalar. Water and NGL streams are not modeled in this version, so this workspace focuses on oil and gas.'}
      </InsightBanner>
    </div>
  );
};

export default ProductionModule;
