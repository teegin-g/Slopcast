# Spec 05: DSU Creation & Stick Generation

**Status**: Not started
**Dependencies**: Spec 04 (map component + section layer rendering)
**Blocks**: None

---

## Goal

Allow users to select contiguous sections on the map to create Drill Spacing Units (DSUs), then auto-generate synthetic undeveloped well sticks based on spacing and lateral length assumptions.

---

## User Decisions

- **Stick generation**: App generates sticks from spacing (wells/section) and lateral length assumptions — that simple
- **DSU max length**: 6 sections (roughly 6 miles) is the cap, since horizontal DSUs accommodate 2-3 mile laterals and 6 miles is a reasonable maximum
- **Generated wells**: Get a Slopcast UUID, inherit DSU's type curve / cost profile / ownership, flow into well groups and economics engine

---

## Data Model

### New: `DSU` Interface (add to `src/types.ts`)

```typescript
export interface DSU {
  id: string;                          // Slopcast UUID
  name: string;                        // User-provided name
  sectionIds: string[];                // References to lg_section or lg_tx_abstract IDs
  geometry: GeoJSON.Polygon;           // Union of section geometries
  totalAcreage: number;                // Computed from geometry
  linearLengthMiles: number;           // End-to-end length of DSU
  formation: string;                   // Target formation
  wellsPerSection: number;             // Density assumption (default: 4)
  lateralLengthFt: number;             // Lateral length for generated sticks (default: 10000)
  typeCurveId: string | null;          // Link to reservoir domain type curve
  costProfileId: string | null;        // Link to cost profile
  ownershipProfile: OwnershipAssumptions | null;
  reservoirDomain: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Generated Wells

Generated wells are standard `Well` objects with:
- `id`: Slopcast UUID (e.g., `gen-{dsuId}-{index}`)
- `status`: `'PERMIT'` (synthetic wells)
- `lat`/`lng`: Computed from DSU geometry
- `lateralLength`: From DSU's `lateralLengthFt`
- `formation`: From DSU's `formation`
- `operator`: User's company or 'Generated'
- All other fields optional/null

---

## Stick Generation Algorithm

### Input
- DSU geometry (Polygon)
- `wellsPerSection`: number of wells per section (e.g., 4)
- `sectionCount`: number of sections in DSU
- `lateralLengthFt`: lateral length in feet

### Algorithm
```
totalWells = wellsPerSection × sectionCount

1. Determine DSU bounding box and primary axis (longest dimension)
2. Compute lateral direction perpendicular to DSU's long axis
   (or follow formation dip if available — simplified: use E-W for now)
3. Divide DSU into `totalWells` evenly-spaced rows along the short axis
4. For each row:
   a. Find intersection of row line with DSU polygon → clipped segment
   b. Place stick centered on segment:
      - Surface hole (SH) = midpoint offset by lateralLength/2 in lateral direction
      - Bottom hole (BH) = midpoint offset by lateralLength/2 in opposite direction
   c. Ensure stick stays within DSU polygon (clip if necessary)
5. Return array of { surfaceHole: [lng, lat], bottomHole: [lng, lat] } for each stick
```

### Conversion
- 1 mile ≈ 5,280 feet
- 1 degree latitude ≈ 364,567 feet (at ~32°N Permian Basin)
- 1 degree longitude ≈ 308,773 feet (at ~32°N)

---

## Frontend Changes

### New: `src/components/slopcast/DsuCreator.tsx`

**DSU Mode** — activated from map toolbar:

1. **Section selection**: User clicks sections on map → highlight selected, validate contiguity
2. **Configuration panel**:
   - DSU name (text input)
   - Formation target (dropdown, from section data or user input)
   - Wells per section (number input, default 4)
   - Lateral length (number input, default 10,000 ft)
3. **Preview**: Show generated sticks as preview lines on map before saving
4. **Save**: Create DSU, generate wells, add to state

**Validation**:
- Sections must be contiguous (share at least one edge)
- Maximum 6 sections per DSU
- Show error toast if validation fails

### New: `src/utils/dsuGeometry.ts` — Pure Geometry Functions

```typescript
export function validateContiguity(sectionGeometries: GeoJSON.Polygon[]): boolean
// Check that every section shares an edge with at least one other section

export function unionSections(sectionGeometries: GeoJSON.Polygon[]): GeoJSON.Polygon
// Compute union polygon of all selected sections

export function computeAcreage(polygon: GeoJSON.Polygon): number
// Calculate area in acres from polygon coordinates

export function computeLinearLength(polygon: GeoJSON.Polygon): number
// Calculate the longest dimension of the polygon in miles

export function generateSticks(
  dsuPolygon: GeoJSON.Polygon,
  wellsPerSection: number,
  sectionCount: number,
  lateralLengthFt: number,
): Array<{ sh: [number, number]; bh: [number, number] }>
// Generate evenly-spaced stick positions within the DSU polygon

export function sticksToWells(
  sticks: Array<{ sh: [number, number]; bh: [number, number] }>,
  dsu: DSU,
): Well[]
// Convert stick geometry + DSU metadata into Well objects
```

**Dependencies**: Consider adding `@turf/turf` (Turf.js) for client-side geometry operations (union, area, boolean intersect, line intersect). Alternatively, keep it lightweight with manual coordinate math.

### New: `src/hooks/useDsuState.ts`

```typescript
export function useDsuState() {
  // State: DSU[], activeDsuId, dsuMode (boolean)
  // Actions: createDsu, deleteDsu, updateDsu, enterDsuMode, exitDsuMode
  // Derived: generatedWells (all wells from all DSUs)
}
```

### Modified: `src/components/slopcast/MapView.tsx`

- Add DSU mode toggle to map toolbar
- When DSU mode active: clicking sections selects/deselects them for DSU
- Show DSU boundary highlight for saved DSUs
- Render generated sticks within DSU boundaries

### Modified: `src/hooks/useSlopcastWorkspace.ts`

- Add DSU state to workspace
- Include generated wells from DSUs in the well pool available for group assignment

---

## Contiguity Validation

Two sections are contiguous if their polygons share a common edge (not just a point).

```typescript
function sharesEdge(poly1: GeoJSON.Polygon, poly2: GeoJSON.Polygon): boolean {
  // 1. Compute intersection of poly1 and poly2 boundaries
  // 2. Check if intersection is a LineString (edge) not just a Point (corner)
  // With Turf: turf.lineOverlap(turf.polygonToLine(poly1), turf.polygonToLine(poly2))
  //   → returns features with length > 0
}

function validateContiguity(sections: GeoJSON.Polygon[]): boolean {
  // Build adjacency graph
  // Check that graph is connected (BFS/DFS from first section reaches all)
}
```

---

## Integration with Economics

Generated wells from DSUs flow into the existing system:

1. DSU generates `Well[]` objects
2. User adds generated wells to a `WellGroup`
3. DSU's type curve → group's `typeCurve`
4. DSU's cost profile → group's `capex`
5. DSU's ownership → group's `ownership`
6. Economics engine runs normally — no special treatment needed

---

## Acceptance Criteria

1. User can enter DSU mode from the map toolbar
2. Clicking a section highlights it; clicking again deselects
3. Selecting 7+ sections shows error (6-section max)
4. Non-contiguous section selection is rejected with error message
5. Configuration panel allows setting name, formation, wells/section, lateral length
6. Generated sticks preview on map before saving
7. Saved DSU shows boundary highlight and generated wells on map
8. Generated wells appear in the well pool and can be added to well groups
9. Economics run correctly with generated wells (type curve, CAPEX, ownership inherited)
