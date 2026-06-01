/**
 * Assumption template presets.
 *
 * CLAUDE.md documents this module as the home for preset assumption bundles.
 * No distinct preset arrays existed elsewhere in the codebase at the time this
 * file was created (R5-11), so the defaults from src/constants.ts are
 * re-exported here as the canonical "base" template.
 *
 * Add named preset objects here as the product grows (e.g. HIGH_CASE_TEMPLATE,
 * TIGHT_OIL_TEMPLATE). Consumers should import from this path so the documented
 * location stays accurate.
 */

export {
  DEFAULT_TYPE_CURVE,
  DEFAULT_CAPEX,
  DEFAULT_OPEX,
  DEFAULT_OWNERSHIP,
  DEFAULT_COMMODITY_PRICING,
  DEFAULT_SEGMENTS,
} from '../constants';
