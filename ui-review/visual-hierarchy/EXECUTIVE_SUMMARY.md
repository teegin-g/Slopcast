# Visual Hierarchy & Typography Executive Summary

## Executive Summary

The typography system has strong ingredients but an over-compressed hierarchy.
The app clearly wants data to feel weighty and decisive, and in its best
moments, especially the hero KPI card, it succeeds. The problem is that too
many surrounding elements occupy the same visual band: small uppercase text,
heavy weight, and tracked labels that all compete for attention.

The result is not confusion so much as scan friction. Users can find the right
information, but the interface often asks them to read more than it should.

## What The Reports Say

- The hierarchy exists, but section headings, labels, and some controls are too
  visually similar.
- Tracking values are highly fragmented and inconsistently applied.
- Theme-specific heading fonts are well chosen but underused.
- Secondary KPI values and GroupList metrics are quieter than their analytical
  importance warrants.
- Button text is often heavier than necessary, which makes chrome feel louder
  than data.

## Business Interpretation

For a deal-analysis product, typography is not cosmetic. It directly shapes how
quickly users can identify the metrics that matter. This review area is about
increasing scan efficiency and decision confidence, not simply making type more
stylized.

## Top Recommendations To Act On

### 1. Separate headings, labels, and values more clearly

- Keep section headings in the section tier.
- Move KPI labels to a smaller, quieter muted style.
- Let numbers own the emphasis instead of sharing it with their labels.

### 2. Improve the KPI strip first

- Increase key tile values from `text-xl` to `text-2xl`.
- Use color to distinguish metric importance, especially IRR and contextual
  metrics like wells.
- Keep the hero card as the primary peak, but make the secondary tiles feel
  like real supporting metrics rather than footnotes.

### 3. Reduce typographic noise in chrome

- Demote button text from `font-black` to `font-bold` in most cases.
- Consolidate tracking into a strict scale instead of many near-duplicate
  values.
- Expand `heading-font` coverage so theme personality reaches all section-level
  surfaces.

### 4. Turn the system into utilities

- Revise and actually use the existing typography utility classes.
- Treat ad hoc type assembly as temporary, not the default pattern.

## Suggested Priority

### P0 to P1

- Separate KPI labels from section-heading styling.
- Increase KPI strip value prominence.
- Apply color hierarchy in `KpiGrid`.

### P1

- Demote button weight.
- Extend `heading-font` usage.
- Improve GroupList metric legibility.

### P2

- Consolidate the tracking scale.
- Activate the shared typography utilities across the app.

## Success Criteria

This work is successful if users can identify the most important numbers almost
instantly, while the surrounding labels, headings, and controls remain clear
but no longer compete for the same attention.
