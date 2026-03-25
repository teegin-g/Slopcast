# Spec 04: Spatial Layers & Map Integration

**Status**: Not started
**Dependencies**: Spec 01 (DB connection pattern)
**Blocks**: Spec 05 (DSU creation needs map + section layers)

---

## Goal

Build the map component using Mapbox GL (already a dependency) and render real wellbore sticks, land grid sections, lease units, and reservoir domains from Databricks spatial data.

---

## Current State

- `mapbox-gl` is in `package.json` but **no map component exists** in the codebase
- No GeoJSON handling, spatial queries, or coordinate code exists
- Wells are currently displayed only in a table (DesignWellsView)

---

## Databricks Tables

### Wellbore Sticks
| Table | Rows | Key Columns |
|-------|------|-------------|
| `epw.egis.gis__well_master` | 1.6M | `sh_latitude_nad27`, `sh_longitude_nad27`, `bh_latitude_nad27`, `bh_longitude_nad27`, `shape_wkt`, `well_status`, `operator`, `formation` |
| `epw.egis.gis__well_future` | 7.5K | Same columns + `op_nonop` |

### Land Grid
| Table | Rows | Key Columns |
|-------|------|-------------|
| `epw.egis.gis__lg_section` | View | `sec`, `township`, `rng`, `mer`, `state`, `shape_wkt` |
| `epw.egis.gis__lg_tx_abstract` | View | `absna`, `absno`, `county`, `district`, `survna`, `blockna`, `shape_wkt` |

### Lease/Unit Boundaries
| Table | Rows | Key Columns |
|-------|------|-------------|
| `epw.egis.gis__units` | 146K | `unit_id`, `unit_name`, `formation`, `operator`, `op_nonop_noint`, `density`, `total_wells`, `dev_wells`, `undev_wells`, `nri`, `working_interest`, `gross_eur_oil_mmbo`, `shape_wkt` |

### Reservoir Domains
| Table | Key Columns |
|-------|-------------|
| `epw.egis.gis__reservoir_domains` | `asset`, `formation`, `development_group`, `engineer`, `reservoir_domain`, `region`, `phase_window`, `shape_wkt` |

---

## Backend Changes

### New: `backend/spatial_service.py`

**Core responsibility**: Query spatial tables, convert WKT to GeoJSON, handle NAD27→WGS84 conversion.

```python
def get_well_sticks(bbox: tuple, formation=None, operator=None, status=None) -> FeatureCollection:
    """Query gis__well_master + gis__well_future within bbox.

    Returns GeoJSON FeatureCollection with LineString features (SH→BH).
    Properties: well_status, operator, formation, op_nonop (for future wells).

    Rendering hints in properties:
      - category: 'pdp' | 'undeveloped_op' | 'undeveloped_nonop'
      - opacity: 1.0 for PDP, 0.4 for undeveloped
    """

def get_sections(bbox: tuple, state=None) -> FeatureCollection:
    """Query gis__lg_section (or gis__lg_tx_abstract for TX).
    Returns Polygon features with section identifiers.
    """

def get_units(bbox: tuple) -> FeatureCollection:
    """Query gis__units within bbox.
    Returns Polygon features with unit metadata.
    """

def get_reservoir_domains(bbox: tuple) -> FeatureCollection:
    """Query gis__reservoir_domains within bbox.
    Returns Polygon features with domain metadata.
    """
```

**NAD27→WGS84 conversion**:
- eGIS coordinates use NAD27 datum
- Use `pyproj` library for datum transformation
- Apply transform when converting WKT to GeoJSON coordinates
- Add `pyproj` to `backend/requirements.txt`

**WKT→GeoJSON conversion**:
- Use `shapely` for WKT parsing
- Convert to `geojson` format
- Add `shapely`, `geojson` to `backend/requirements.txt`

### Modified: `backend/main.py` — New Endpoints

```
GET /api/layers/wells?bbox=minLng,minLat,maxLng,maxLat&formation=...&operator=...&status=...
    → GeoJSON FeatureCollection of wellbore sticks

GET /api/layers/sections?bbox=...&state=...
    → GeoJSON FeatureCollection of section polygons

GET /api/layers/units?bbox=...
    → GeoJSON FeatureCollection of lease/unit polygons

GET /api/layers/reservoir-domains?bbox=...
    → GeoJSON FeatureCollection of reservoir domain polygons
```

### Modified: `backend/requirements.txt`

Add: `pyproj`, `shapely`, `geojson`

---

## Frontend Changes

### New: `src/components/slopcast/MapView.tsx` — Main Map Component

```typescript
// Mapbox GL JS map component
// Props: wells, layers, onWellClick, onBboxChange, mode ('default' | 'dsu')
//
// Layers:
//   - well-sticks-pdp (LineString, bold stroke, colored by operator)
//   - well-sticks-undev (LineString, translucent 40% opacity)
//   - sections (Polygon, thin border, fill on hover)
//   - units (Polygon, dashed border, slight fill)
//   - reservoir-domains (Polygon, colored by domain)
//
// Interactions:
//   - Click well stick → select well, emit onWellClick
//   - Pan/zoom → emit onBboxChange (debounced 300ms) for viewport loading
//   - Lasso tool → multi-select wells within drawn polygon
```

### New: `src/components/slopcast/MapLayers.tsx` — Layer Toggle Panel

```typescript
// Toggle visibility of each layer:
//   [x] PDP Wells
//   [x] Undeveloped Wells (Op)
//   [ ] Undeveloped Wells (Non-Op)
//   [x] Sections
//   [ ] Lease Units
//   [ ] Reservoir Domains
//
// Each toggle controls a Mapbox layer's visibility
```

### New: `src/services/spatialService.ts`

```typescript
export async function getWellSticks(bbox: BBox, filters?: SpatialFilters): Promise<GeoJSON.FeatureCollection>
export async function getSections(bbox: BBox): Promise<GeoJSON.FeatureCollection>
export async function getUnits(bbox: BBox): Promise<GeoJSON.FeatureCollection>
export async function getReservoirDomains(bbox: BBox): Promise<GeoJSON.FeatureCollection>
```

### New: `src/hooks/useMapLayers.ts`

```typescript
export function useWellSticks(bbox: BBox, filters?: SpatialFilters)
export function useSections(bbox: BBox)
export function useUnits(bbox: BBox)
export function useReservoirDomains(bbox: BBox)
```

### Integration with `DesignWellsView.tsx`

- Replace or augment the current wells table view with the map
- Map and table can coexist (split view or tab toggle)
- Selecting wells on the map updates the same selection state as the table

---

## Rendering Rules

| Layer | Stroke | Fill | Opacity | Color Logic |
|-------|--------|------|---------|-------------|
| PDP wells | 2px solid | — | 1.0 | By operator or single accent color (`--cyan`) |
| Undev (Op) | 1.5px solid | — | 0.4 | Same as PDP but translucent |
| Undev (Non-Op) | 1px dashed | — | 0.3 | Muted gray |
| Sections | 0.5px solid | transparent | 0.6 | `--surface-2` border |
| Units | 1px dashed | semi-transparent | 0.3 | `--lav` border |
| Reservoir Domains | 1px solid | semi-transparent | 0.2 | Categorical by `reservoir_domain` |

---

## Coordinate Handling

- **Source datum**: NAD27 (all eGIS tables use `*_nad27` columns)
- **Target datum**: WGS84 (Mapbox GL requires WGS84/EPSG:4326)
- **Transform**: Backend applies `pyproj.Transformer.from_crs('EPSG:4267', 'EPSG:4326')` when building GeoJSON
- **WKT geometry**: `shape_wkt` column already contains full wellbore geometry; parse with `shapely.wkt.loads()`

---

## Performance Considerations

- **Viewport loading**: Only query wells/sections within the current map bbox + small buffer
- **Debounce**: Debounce bbox change events (300ms) to avoid query spam during pan/zoom
- **Simplification**: For zoomed-out views, simplify polygon geometries server-side (`shapely.simplify()`)
- **Tile approach (future)**: For very dense areas, consider vector tiles; for now, direct GeoJSON is fine for filtered subsets
- **Well stick caching**: Cache sticks per bbox region on the frontend (React Query with stable bbox keys)

---

## Acceptance Criteria

1. Map component renders at localhost:3000 with Mapbox GL
2. PDP wellbore sticks render as bold lines from SH→BH coordinates
3. Undeveloped sticks render as translucent lines
4. Section grid renders as polygon outlines
5. Layer toggle panel shows/hides each layer
6. Viewport-based loading only fetches data within the visible bbox
7. Clicking a well stick selects it and syncs with the well table selection
8. Coordinates are correctly transformed from NAD27→WGS84
