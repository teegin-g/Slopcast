/**
 * AI Assistant Service
 * Parses natural language prompts into structured state mutations for Slopcast parameters.
 */

import type {
  WellGroup,
  CommodityPricingAssumptions,
  TypeCurveParams,
  CapexAssumptions,
} from '../types';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type AssistantActionType =
  | 'SET_OIL_PRICE'
  | 'SET_GAS_PRICE'
  | 'SET_OIL_DIFFERENTIAL'
  | 'SET_GAS_DIFFERENTIAL'
  | 'SET_QI'
  | 'SET_B_FACTOR'
  | 'SET_DECLINE_RATE'
  | 'SET_CAPEX_SCALAR'
  | 'SET_PRODUCTION_SCALAR'
  | 'SET_RIG_COUNT'
  | 'SET_NRI'
  | 'UNKNOWN';

export interface AssistantAction {
  type: AssistantActionType;
  value: number;
  description: string;
  field: string;
}

export interface AssistantHistoryEntry {
  id: string;
  prompt: string;
  actions: AssistantAction[];
  timestamp: number;
  previousState: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Prompt parser (rule-based, no API dependency)
// ---------------------------------------------------------------------------

const PATTERNS: Array<{
  regex: RegExp;
  type: AssistantActionType;
  field: string;
  descriptionTemplate: string;
}> = [
  {
    regex: /(?:set|change|update)\s+(?:the\s+)?oil\s+price\s+(?:to\s+)?\$?(\d+(?:\.\d+)?)/i,
    type: 'SET_OIL_PRICE',
    field: 'oilPrice',
    descriptionTemplate: 'Set oil price to $VALUE/bbl',
  },
  {
    regex: /oil\s+(?:price\s+)?(?:at|to|=)\s*\$?(\d+(?:\.\d+)?)/i,
    type: 'SET_OIL_PRICE',
    field: 'oilPrice',
    descriptionTemplate: 'Set oil price to $VALUE/bbl',
  },
  {
    regex: /(?:set|change|update)\s+(?:the\s+)?gas\s+price\s+(?:to\s+)?\$?(\d+(?:\.\d+)?)/i,
    type: 'SET_GAS_PRICE',
    field: 'gasPrice',
    descriptionTemplate: 'Set gas price to $VALUE/mcf',
  },
  {
    regex: /gas\s+(?:price\s+)?(?:at|to|=)\s*\$?(\d+(?:\.\d+)?)/i,
    type: 'SET_GAS_PRICE',
    field: 'gasPrice',
    descriptionTemplate: 'Set gas price to $VALUE/mcf',
  },
  {
    regex: /(?:set|change|update)\s+(?:the\s+)?(?:initial\s+rate|qi|ip)\s+(?:to\s+)?(\d+(?:\.\d+)?)/i,
    type: 'SET_QI',
    field: 'qi',
    descriptionTemplate: 'Set initial rate (Qi) to VALUE BOPD',
  },
  {
    regex: /qi\s+(?:at|to|=)\s*(\d+(?:\.\d+)?)/i,
    type: 'SET_QI',
    field: 'qi',
    descriptionTemplate: 'Set initial rate (Qi) to VALUE BOPD',
  },
  {
    regex: /(?:set|change|update)\s+(?:the\s+)?(?:b[- ]?factor)\s+(?:to\s+)?(\d+(?:\.\d+)?)/i,
    type: 'SET_B_FACTOR',
    field: 'b',
    descriptionTemplate: 'Set b-factor to VALUE',
  },
  {
    regex: /(?:set|change|update)\s+(?:the\s+)?(?:decline|di)\s+(?:rate\s+)?(?:to\s+)?(\d+(?:\.\d+)?)/i,
    type: 'SET_DECLINE_RATE',
    field: 'di',
    descriptionTemplate: 'Set decline rate to VALUE%',
  },
  {
    regex: /(?:set|change|update)\s+(?:the\s+)?(?:rig\s+count|rigs)\s+(?:to\s+)?(\d+(?:\.\d+)?)/i,
    type: 'SET_RIG_COUNT',
    field: 'rigCount',
    descriptionTemplate: 'Set rig count to VALUE',
  },
  {
    regex: /(?:set|change|update)\s+(?:the\s+)?(?:nri|net\s+revenue\s+interest)\s+(?:to\s+)?(\d+(?:\.\d+)?)/i,
    type: 'SET_NRI',
    field: 'nri',
    descriptionTemplate: 'Set NRI to VALUE%',
  },
  {
    regex: /(?:increase|raise|bump)\s+(?:the\s+)?(?:capex|capital)\s+(?:by\s+)?(\d+(?:\.\d+)?)%/i,
    type: 'SET_CAPEX_SCALAR',
    field: 'capexScalar',
    descriptionTemplate: 'Increase CAPEX by VALUE%',
  },
  {
    regex: /(?:decrease|lower|reduce|cut)\s+(?:the\s+)?(?:capex|capital)\s+(?:by\s+)?(\d+(?:\.\d+)?)%/i,
    type: 'SET_CAPEX_SCALAR',
    field: 'capexScalar',
    descriptionTemplate: 'Decrease CAPEX by VALUE%',
  },
  {
    regex: /(?:increase|raise|bump)\s+(?:the\s+)?(?:production|output)\s+(?:by\s+)?(\d+(?:\.\d+)?)%/i,
    type: 'SET_PRODUCTION_SCALAR',
    field: 'productionScalar',
    descriptionTemplate: 'Increase production by VALUE%',
  },
];

export function parsePrompt(prompt: string): AssistantAction[] {
  const actions: AssistantAction[] = [];

  for (const pattern of PATTERNS) {
    const match = prompt.match(pattern.regex);
    if (match) {
      let value = parseFloat(match[1]);

      // Handle percentage-based scalars
      if (pattern.type === 'SET_CAPEX_SCALAR') {
        const isDecrease = /(?:decrease|lower|reduce|cut)/i.test(prompt);
        value = isDecrease ? 1 - value / 100 : 1 + value / 100;
      }
      if (pattern.type === 'SET_PRODUCTION_SCALAR') {
        value = 1 + value / 100;
      }
      // NRI should be expressed as decimal if given as percentage
      if (pattern.type === 'SET_NRI' && value > 1) {
        value = value / 100;
      }

      actions.push({
        type: pattern.type,
        value,
        description: pattern.descriptionTemplate.replace('VALUE', match[1]),
        field: pattern.field,
      });
    }
  }

  if (actions.length === 0) {
    actions.push({
      type: 'UNKNOWN',
      value: 0,
      description: `Could not parse: "${prompt}"`,
      field: '',
    });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// State mutation
// ---------------------------------------------------------------------------

export interface MutationResult {
  updatedGroup: WellGroup;
  updatedPricing?: Partial<CommodityPricingAssumptions>;
  updatedScalars?: { capex: number; production: number };
  changes: string[];
}

export function applyActions(
  actions: AssistantAction[],
  group: WellGroup,
  currentScalars: { capex: number; production: number },
): MutationResult {
  let updatedGroup = { ...group };
  let updatedScalars = { ...currentScalars };
  const changes: string[] = [];

  for (const action of actions) {
    if (action.type === 'UNKNOWN') continue;

    switch (action.type) {
      case 'SET_QI':
        updatedGroup = {
          ...updatedGroup,
          typeCurve: { ...updatedGroup.typeCurve, qi: action.value },
        };
        changes.push(action.description);
        break;
      case 'SET_B_FACTOR':
        updatedGroup = {
          ...updatedGroup,
          typeCurve: { ...updatedGroup.typeCurve, b: action.value },
        };
        changes.push(action.description);
        break;
      case 'SET_DECLINE_RATE':
        updatedGroup = {
          ...updatedGroup,
          typeCurve: { ...updatedGroup.typeCurve, di: action.value },
        };
        changes.push(action.description);
        break;
      case 'SET_RIG_COUNT':
        updatedGroup = {
          ...updatedGroup,
          capex: { ...updatedGroup.capex, rigCount: action.value },
        };
        changes.push(action.description);
        break;
      case 'SET_NRI':
        updatedGroup = {
          ...updatedGroup,
          ownership: { ...updatedGroup.ownership, baseNri: action.value },
        };
        changes.push(action.description);
        break;
      case 'SET_CAPEX_SCALAR':
        updatedScalars = { ...updatedScalars, capex: action.value };
        changes.push(action.description);
        break;
      case 'SET_PRODUCTION_SCALAR':
        updatedScalars = { ...updatedScalars, production: action.value };
        changes.push(action.description);
        break;
      default:
        // Pricing actions return updatedPricing in the result
        break;
    }
  }

  // Collect pricing changes
  let updatedPricing: Partial<CommodityPricingAssumptions> | undefined;
  const pricingActions = actions.filter(a =>
    ['SET_OIL_PRICE', 'SET_GAS_PRICE', 'SET_OIL_DIFFERENTIAL', 'SET_GAS_DIFFERENTIAL'].includes(a.type)
  );
  if (pricingActions.length > 0) {
    updatedPricing = {};
    for (const pa of pricingActions) {
      switch (pa.type) {
        case 'SET_OIL_PRICE':
          updatedPricing.oilPrice = pa.value;
          break;
        case 'SET_GAS_PRICE':
          updatedPricing.gasPrice = pa.value;
          break;
        case 'SET_OIL_DIFFERENTIAL':
          updatedPricing.oilDifferential = pa.value;
          break;
        case 'SET_GAS_DIFFERENTIAL':
          updatedPricing.gasDifferential = pa.value;
          break;
      }
      changes.push(pa.description);
    }
  }

  return { updatedGroup, updatedPricing, updatedScalars, changes };
}

// ---------------------------------------------------------------------------
// History stack (undo support)
// ---------------------------------------------------------------------------

let historyStack: AssistantHistoryEntry[] = [];

export function pushHistory(entry: AssistantHistoryEntry): void {
  historyStack.push(entry);
  // Keep last 20 entries
  if (historyStack.length > 20) historyStack = historyStack.slice(-20);
}

export function popHistory(): AssistantHistoryEntry | undefined {
  return historyStack.pop();
}

export function getHistory(): AssistantHistoryEntry[] {
  return [...historyStack];
}

export function clearHistory(): void {
  historyStack = [];
}
