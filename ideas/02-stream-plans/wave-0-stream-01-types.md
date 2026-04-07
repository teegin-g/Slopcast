# Stream 1: Types & Data Model Foundation

**Wave:** 0 (Foundation)
**Agent:** `types-agent`
**Estimated effort:** ~2 hours
**Dependencies:** None

---

## Objective

Establish all new TypeScript interfaces and extend existing types so that every downstream stream can code against stable contracts from the start.

## Files to Modify

| File | Action |
|------|--------|
| `src/types.ts` | Extend existing types, add new interfaces |
| `src/types/integrations.ts` | Clean up broken imports, reconcile duplicates |

## Pre-Work (Step 0)

1. Read `src/types.ts` in full (611 lines, read in 3 chunks)
2. Read `src/types/integrations.ts` (131 lines)
3. Identify and remove: unused type exports, broken import paths in integrations.ts
4. Commit cleanup separately before adding new types

## Tasks

### Task 1: Clean `types/integrations.ts`
- Remove or fix broken relative imports (`./economics`, `./scenarios`)
- Deduplicate any types that exist in both files
- Decide: does `integrations.ts` re-export from `types.ts`, or is it an independent parallel? Reconcile.

### Task 2: Extend `Well` Type
```typescript
// Add to existing Well interface
interface Well {
  // ... existing fields ...

  // Subsurface data (for Wine Rack)
  tvdFt?: number;              // True vertical depth at lateral (extractable from trajectory.toe.depthFt)
  bench?: string;              // Stratigraphic bench/zone (e.g., "Wolfcamp A Upper")
  formationTop?: number;       // Formation top depth in feet

  // Temporal data
  completionDate?: string;     // ISO date
  firstProdDate?: string;      // ISO date
  spudDate?: string;           // ISO date

  // Production metrics (summary, not time series)
  ip30?: number;               // 30-day initial production (boe/d)
  ip90?: number;               // 90-day initial production (boe/d)
  eurMbo?: number;             // Estimated ultimate recovery (MBO)
  cumOilBbl?: number;          // Cumulative oil production
  cumGasMcf?: number;          // Cumulative gas production
  gorMcfPerBbl?: number;       // Gas-oil ratio
  monthsOnProd?: number;       // Months producing

  // Completion data
  fracIntensityLbsPerFt?: number;
  stageCount?: number;
  proppantLbs?: number;

  // Identifiers
  dsuId?: string;              // Drill spacing unit ID
  sectionTwpRng?: string;      // Section-Township-Range
  leaseId?: string;

  // Extended status
  azimuthDeg?: number;         // Wellbore azimuth (computed from trajectory)
}
```

Extend the `WellStatus` union:
```typescript
type WellStatus = 'PRODUCING' | 'DUC' | 'PERMIT' | 'SHUT_IN' | 'TA' | 'PA' | 'RETURNED';
```

### Task 3: Add Track & Stage Types
```typescript
type TrackKind = 'PDP' | 'UNDEV';

type ProjectStage =
  | 'ACREAGE_FILTER'
  | 'TRACK_PICKER'
  | 'PDP_WELLS'
  | 'PDP_FORECAST'
  | 'UNDEV_WELLS'
  | 'UNDEV_ECONOMICS'
  | 'SCENARIOS';

type WellsViewMode = 'MAP' | 'TABLE' | 'WINE_RACK';

interface StageCompletion {
  stage: ProjectStage;
  status: 'empty' | 'in_progress' | 'complete';
  trackKind?: TrackKind;
}
```

### Task 4: Add AcreageFilter Interface
```typescript
interface AcreageFilter {
  operators: string[];
  formations: string[];
  basins: string[];
  counties?: string[];
  vintageRange?: { from: string; to: string };
  leaseStatus?: string[];
  productionStatusFilter?: WellStatus[];
  spatialBounds?: { north: number; south: number; east: number; west: number };
  customPolygon?: GeoJSON.Polygon;
}
```

### Task 5: Add DSU & Undev Types
```typescript
interface BenchAssignment {
  bench: string;
  wellCount: number;
  spacingFt: number;
  lateralLengthFt: number;
}

interface DsuDefinition {
  id: string;
  name: string;
  geometry: { type: 'Polygon'; coordinates: number[][][] };
  benches: BenchAssignment[];
  computedLateralLengthFt?: number;
  parentChildFlags?: ('parent' | 'child' | 'co_dev')[];
  schedulePriority?: number;
  metadata?: Record<string, unknown>;
}

interface SpacingTemplate {
  name: string;
  wellsPerDsu: number;
  spacingFt: number;
  benches: string[];
}
```

### Task 6: Add PDP-Specific Types
```typescript
type ForecastVendor = 'enverus' | 'novi' | 'sp' | 'in_house' | 'user_upload';

interface ForecastAssignment {
  wellId: string;
  source: ForecastVendor;
  sourceDate?: string;
  adjustmentPct?: number; // +/- miss factor
  rateFloorBoepd?: number;
}

interface EconomicLimit {
  kind: 'rate' | 'cashflow' | 'date';
  value: number; // boe/d, $/month, or epoch ms
}

interface WorkoverAssumptions {
  frequencyPerYear: number;
  costPerEvent: number;
  upliftPct: number;
}
```

### Task 7: Extend WellGroup with Track
```typescript
// Add to existing WellGroup interface
interface WellGroup {
  // ... existing fields ...
  track?: TrackKind;

  // PDP extensions (only when track === 'PDP')
  forecastAssignments?: ForecastAssignment[];
  economicLimit?: EconomicLimit;
  workoverAssumptions?: WorkoverAssumptions;

  // Undev extensions (only when track === 'UNDEV')
  dsus?: DsuDefinition[];
  typeCurveAssignments?: Record<string, string>; // dsuId:bench -> typeCurveId
  spacingTemplate?: SpacingTemplate;
  degradationParams?: DegradationParams;
  lateralLengthScaling?: 'linear' | 'sub_linear' | 'capped';
}
```

### Task 8: Add Scenario Variable Splitting
```typescript
interface ScenarioVariable<T = number> {
  global: T;
  splitByTrack: boolean;
  pdpOverride?: T;
  undevOverride?: T;
}

// Extend Scenario
interface Scenario {
  // ... existing fields ...
  discountRatePct?: ScenarioVariable<number>;
  capexScalarVar?: ScenarioVariable<number>;   // replaces flat capexScalar
  productionScalarVar?: ScenarioVariable<number>; // replaces flat productionScalar
  loeEscalationPct?: ScenarioVariable<number>;
  inflationPct?: ScenarioVariable<number>;
  priceDeck?: 'strip' | 'flat' | 'custom';
  stripPrices?: { month: string; oil: number; gas: number }[];
}
```

### Task 9: Add Wine Rack / Assumption Builder Types
```typescript
// Projection modes for the wine rack
type ProjectionMode = 'average_azimuth' | 'user_drawn_line' | 'surface_x_sort';

// Variable encoding channels
type EncodingChannel = 'color' | 'thickness' | 'opacity' | 'outline' | 'label';
type EncodableAttribute = 'ip90' | 'eurMbo' | 'cumOilBbl' | 'gorMcfPerBbl' |
  'completionYear' | 'fracIntensityLbsPerFt' | 'operator' | 'dsuId' | 'status' |
  'lateralLength' | 'bench' | 'proppantLbs' | 'stageCount';

interface VariableEncoding {
  channel: EncodingChannel;
  attribute: EncodableAttribute;
  scaleType?: 'sequential' | 'divergent' | 'categorical';
  domain?: [number, number] | string[];
  colorScheme?: string;
}

// Coherence scoring
interface CoherenceScore {
  lateralLengthVariance: 'green' | 'yellow' | 'red'; // <10%, 10-25%, >25%
  vintageSpread: 'green' | 'yellow' | 'red';         // <2yr, 2-5yr, >5yr
  benchMix: 'green' | 'yellow' | 'red';              // 1, 2 same fm, mixed fm
  details: {
    lateralLengthCv: number;
    vintageRangeYears: number;
    benchCount: number;
    formationCount: number;
  };
}

// Fit metadata
interface FitMetadata {
  rSquared: number;
  residualStats: { mean: number; std: number; histogram: number[] };
  eurP10Mbo: number;
  eurP50Mbo: number;
  eurP90Mbo: number;
  nWells: number;
  lateralNormMethod?: 'per_1000ft' | 'per_stage' | 'none';
}

// Degradation parameters
interface DegradationParams {
  curveType: 'linear' | 'exponential' | 'piecewise';
  breakpoints: { wellCount: number; productionRatio: number }[];
  functionParams: Record<string, number>;
}

// The core provenance-backed assumption
interface AnalogBackedAssumption {
  id: string;
  name: string;
  type: 'type_curve' | 'loe' | 'spacing_degradation';
  createdAt: string;
  createdBy: string;
  lastRefitAt: string;

  parameters: TypeCurveParams | OpexAssumptions | DegradationParams;

  // Provenance
  analogWellIds: string[];
  analogFilterSnapshot: Partial<AcreageFilter> & {
    bench?: string;
    lateralLengthRange?: [number, number];
    vintageRange?: { from: string; to: string };
  };

  // Quality
  fitMetadata: FitMetadata;
  coherenceScore: CoherenceScore;

  // Staleness
  dataThroughDate: string;
  notes: string;

  // Library
  tags: string[];
  projectId: string | null; // null = global library
}

// Production history (for fit inputs)
interface MonthlyProduction {
  wellId: string;
  month: string; // YYYY-MM
  oilBbl: number;
  gasMcf: number;
  waterBbl: number;
  daysOnProd: number;
}
```

### Task 10: Add BuilderMode Type
```typescript
type BuilderMode = 'diagnostic' | 'build_assumption';

type AssumptionBuilderTab = 'type_curve' | 'loe' | 'spacing_degradation';

interface BuilderState {
  mode: BuilderMode;
  selectedAnalogIds: Set<string>;
  activeTab: AssumptionBuilderTab;
  coherence: CoherenceScore | null;
  fitResult: FitMetadata | null;
  draftAssumption: Partial<AnalogBackedAssumption> | null;
}
```

## Verification

1. `npx tsc --noEmit` — must pass with zero errors
2. `npx eslint src/types.ts src/types/integrations.ts --quiet` — must pass
3. All existing tests still pass: `npm test`
4. Spot-check: grep for any import of removed/renamed types across the codebase

## Acceptance Criteria

- [ ] `types/integrations.ts` has no broken imports
- [ ] `Well` interface extended with all subsurface/temporal/production/completion fields
- [ ] `WellStatus` union expanded to 7 values
- [ ] `TrackKind`, `ProjectStage`, `WellsViewMode` types exported
- [ ] `AcreageFilter` interface defined
- [ ] `DsuDefinition` + `BenchAssignment` + `SpacingTemplate` types defined
- [ ] `ForecastAssignment` + `EconomicLimit` + `WorkoverAssumptions` types defined
- [ ] `WellGroup` extended with optional `track` + track-specific extensions
- [ ] `ScenarioVariable<T>` wrapper type + `Scenario` extensions defined
- [ ] All Wine Rack types defined: `VariableEncoding`, `CoherenceScore`, `FitMetadata`, `DegradationParams`, `AnalogBackedAssumption`, `MonthlyProduction`, `BuilderState`
- [ ] TypeScript compiles cleanly
- [ ] No existing tests broken
