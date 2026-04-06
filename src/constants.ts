
import { Well, WellTrajectory, TypeCurveParams, CapexAssumptions, CapexItem, CommodityPricingAssumptions, OpexAssumptions, OwnershipAssumptions, ForecastSegment } from './types';

// Generate some mock wells in a basin-like cluster
const generateWells = (count: number): Well[] => {
  const wells: Well[] = [];
  const centerLat = 31.9;
  const centerLng = -102.3;
  const operators = ['Strata Ops LLC', 'Blue Mesa Energy', 'Atlas Peak Resources'];
  const formations = ['Wolfcamp A', 'Wolfcamp B', 'Bone Spring'];
  const statuses: Array<Well['status']> = ['PRODUCING', 'DUC', 'PERMIT'];

  // Degrees per foot at ~32°N latitude: 1° lat ≈ 364,000 ft
  const FT_TO_DEG = 1 / 364000;

  for (let i = 0; i < count; i++) {
    const lat = centerLat + (Math.random() - 0.5) * 0.15;
    const lng = centerLng + (Math.random() - 0.5) * 0.2;
    const lateralLength = Math.random() > 0.5 ? 10000 : 7500;
    const status = statuses[i % statuses.length];

    let trajectory: WellTrajectory | undefined;
    if (status === 'PRODUCING' || status === 'DUC') {
      // Realistic horizontal well trajectory with full survey path.
      // Vary azimuth per well for visual diversity (golden angle stagger).
      const azimuthRad = ((i * 137.5) % 360) * (Math.PI / 180);
      const cosAz = Math.cos(azimuthRad);
      const sinAz = Math.sin(azimuthRad);
      const lngScale = FT_TO_DEG / Math.cos(lat * Math.PI / 180); // adjust for latitude

      // Key points
      const kopDepth = 7500;   // kickoff point TVD
      const lateralTVD = 8000; // horizontal section TVD
      const surfacePt = { lat, lng, depthFt: 0 };

      // Generate mock survey path: vertical section + build curve + horizontal lateral
      const surveyPath: typeof surfacePt[] = [surfacePt];

      // Vertical section: 0 to KOP (every 500ft, slight drift)
      for (let d = 500; d < kopDepth; d += 500) {
        const drift = (d / kopDepth) * 0.0005; // slight lateral drift during vertical
        surveyPath.push({
          lat: lat + cosAz * drift,
          lng: lng + sinAz * drift * lngScale * 364000 * FT_TO_DEG,
          depthFt: d,
        });
      }

      // Build curve: KOP to ~1500ft past KOP (inclination ramps 0→90°)
      const buildLength = 1500;
      for (let j = 0; j <= 5; j++) {
        const t = j / 5;
        const md = kopDepth + t * buildLength;
        const incl = t * (Math.PI / 2); // 0 to 90 degrees
        const horizOffset = buildLength * (1 - Math.cos(incl)) * FT_TO_DEG;
        surveyPath.push({
          lat: lat + cosAz * horizOffset + cosAz * 0.0005,
          lng: lng + sinAz * horizOffset * lngScale * 364000 * FT_TO_DEG,
          depthFt: kopDepth + buildLength * Math.sin(incl) * 0.07, // TVD increases slightly
        });
      }

      // Heel point (start of horizontal)
      const heelLat = surveyPath[surveyPath.length - 1].lat;
      const heelLng = surveyPath[surveyPath.length - 1].lng;
      const heelPt = { lat: heelLat, lng: heelLng, depthFt: lateralTVD };

      // Horizontal lateral: every 1000ft along azimuth at constant TVD
      const lateralSteps = Math.floor(lateralLength / 1000);
      for (let j = 1; j <= lateralSteps; j++) {
        const dist = j * 1000;
        surveyPath.push({
          lat: heelLat + cosAz * dist * FT_TO_DEG,
          lng: heelLng + sinAz * dist * lngScale * 364000 * FT_TO_DEG,
          depthFt: lateralTVD + (Math.random() - 0.5) * 50, // slight TVD variation
        });
      }

      // Toe point (end of lateral)
      const toePt = surveyPath[surveyPath.length - 1];

      trajectory = {
        path: surveyPath,
        surface: surfacePt,
        heel: heelPt,
        toe: toePt,
        mdFt: kopDepth + buildLength + lateralLength,
      };
    }

    wells.push({
      id: `w-${i}`,
      name: `Maverick ${i + 1}H`,
      lat,
      lng,
      lateralLength,
      status,
      operator: operators[i % operators.length],
      formation: formations[i % formations.length],
      trajectory,
    });
  }
  return wells;
};

export const MOCK_WELLS: Well[] = generateWells(40);

export const DEFAULT_SEGMENTS: ForecastSegment[] = [
  { id: 's1', name: 'primary', method: 'arps', qi: 850, b: 1.2, initialDecline: 65, cutoffKind: 'rate', cutoffValue: 200 },
  { id: 's2', name: 'tail', method: 'arps', qi: null, b: 0, initialDecline: 8, cutoffKind: 'default', cutoffValue: null },
];

export const DEFAULT_TYPE_CURVE: TypeCurveParams = {
  qi: 850,
  b: 1.2,
  di: 65, // 65% initial decline
  terminalDecline: 8,
  gorMcfPerBbl: 0,
  segments: DEFAULT_SEGMENTS,
};

const DEFAULT_CAPEX_ITEMS: CapexItem[] = [
    { id: 'c-1', name: 'Location/Roads', category: 'FACILITIES', value: 85000, basis: 'PER_WELL', offsetDays: -15 },
    { id: 'c-2', name: 'Rig Mob/Demob', category: 'DRILLING', value: 45000, basis: 'PER_WELL', offsetDays: 0 },
    { id: 'c-3', name: 'Drilling - Tangibles', category: 'DRILLING', value: 125, basis: 'PER_FOOT', offsetDays: 10 },
    { id: 'c-4', name: 'Drilling - Intangibles', category: 'DRILLING', value: 350, basis: 'PER_FOOT', offsetDays: 10 },
    { id: 'c-5', name: 'Cement & Services', category: 'DRILLING', value: 120000, basis: 'PER_WELL', offsetDays: 15 },
    { id: 'c-6', name: 'Frac / Stimulation', category: 'COMPLETION', value: 650, basis: 'PER_FOOT', offsetDays: 45 },
    { id: 'c-7', name: 'Water Transfer/Disp', category: 'COMPLETION', value: 200000, basis: 'PER_WELL', offsetDays: 50 },
    { id: 'c-8', name: 'Tank Battery/Facilities', category: 'FACILITIES', value: 450000, basis: 'PER_WELL', offsetDays: 80 },
    { id: 'c-9', name: 'Tubing & Lift Equip', category: 'EQUIPMENT', value: 110000, basis: 'PER_WELL', offsetDays: 90 },
];

export const DEFAULT_CAPEX: CapexAssumptions = {
  rigCount: 2,
  drillDurationDays: 18,
  stimDurationDays: 12,
  rigStartDate: new Date().toISOString().split('T')[0],
  items: DEFAULT_CAPEX_ITEMS,
};

export const DEFAULT_COMMODITY_PRICING: CommodityPricingAssumptions = {
  oilPrice: 75.00,
  gasPrice: 3.25,
  oilDifferential: 2.50,
  gasDifferential: 0.35,
};

export const DEFAULT_OPEX: OpexAssumptions = {
  segments: [
    {
      id: 'o-1',
      label: 'Base LOE',
      startMonth: 1,
      endMonth: 120,
      fixedPerWellPerMonth: 8500,
      variableOilPerBbl: 0,
      variableGasPerMcf: 0,
    },
  ],
};

export const DEFAULT_OWNERSHIP: OwnershipAssumptions = {
  baseNri: 0.75,
  baseCostInterest: 1.0,
  agreements: [],
};

export const GROUP_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];
