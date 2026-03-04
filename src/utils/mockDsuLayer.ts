/**
 * Generates synthetic DSU (Drilling Spacing Unit) polygons and PUD wellbore lines
 * for a given bounding box. Used for map preview on the landing page.
 */

export interface DsuPolygon {
  id: string;
  name: string;
  coordinates: [number, number][][]; // GeoJSON polygon ring
  wellCount: number;
  operator: string;
  formation: string;
}

export interface PudWellboreLine {
  id: string;
  dsuId: string;
  coordinates: [number, number][]; // GeoJSON line (surface -> toe)
  lateralLength: number;
  formation: string;
  status: 'PUD' | 'DUC' | 'PERMIT';
}

export interface MockDsuLayer {
  dsus: DsuPolygon[];
  wellbores: PudWellboreLine[];
}

const OPERATORS = ['Strata Ops LLC', 'Blue Mesa Energy', 'Atlas Peak Resources', 'Permian Holdings', 'Ironclad Exploration'];
const FORMATIONS = ['Wolfcamp A', 'Wolfcamp B', 'Bone Spring', 'Spraberry', '2nd Bone Spring'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function generateMockDsuLayer(
  centerLat: number,
  centerLng: number,
  gridSize: number = 4,
  seed: number = 42
): MockDsuLayer {
  const rand = seededRandom(seed);
  const dsus: DsuPolygon[] = [];
  const wellbores: PudWellboreLine[] = [];

  const dsuWidth = 0.025; // approx 1 mile in degrees longitude at this latitude
  const dsuHeight = 0.018; // approx 1 mile in degrees latitude
  const startLat = centerLat - (gridSize / 2) * dsuHeight;
  const startLng = centerLng - (gridSize / 2) * dsuWidth;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const sw: [number, number] = [
        startLng + col * dsuWidth,
        startLat + row * dsuHeight,
      ];
      const ne: [number, number] = [
        sw[0] + dsuWidth,
        sw[1] + dsuHeight,
      ];

      const wellCount = Math.floor(rand() * 4) + 1;
      const operator = OPERATORS[Math.floor(rand() * OPERATORS.length)];
      const formation = FORMATIONS[Math.floor(rand() * FORMATIONS.length)];

      const dsuId = `dsu-${row}-${col}`;
      dsus.push({
        id: dsuId,
        name: `Section ${row * gridSize + col + 1}`,
        coordinates: [[
          sw,
          [ne[0], sw[1]],
          ne,
          [sw[0], ne[1]],
          sw, // close ring
        ]],
        wellCount,
        operator,
        formation,
      });

      // Generate PUD wellbore sticks within the DSU
      for (let w = 0; w < wellCount; w++) {
        const spacing = dsuHeight / (wellCount + 1);
        const wellLat = sw[1] + spacing * (w + 1);
        const surfaceLng = sw[0] + dsuWidth * 0.15;
        const toeLng = sw[0] + dsuWidth * (0.6 + rand() * 0.3);
        const lateralLength = Math.round((toeLng - surfaceLng) * 69 * 5280 * Math.cos(wellLat * Math.PI / 180));

        const statuses: Array<'PUD' | 'DUC' | 'PERMIT'> = ['PUD', 'DUC', 'PERMIT'];
        wellbores.push({
          id: `well-${dsuId}-${w}`,
          dsuId,
          coordinates: [
            [surfaceLng, wellLat],
            [toeLng, wellLat + (rand() - 0.5) * 0.001], // slight drift
          ],
          lateralLength,
          formation,
          status: statuses[Math.floor(rand() * statuses.length)],
        });
      }
    }
  }

  return { dsus, wellbores };
}

export function dsuLayerToGeoJSON(layer: MockDsuLayer) {
  return {
    type: 'FeatureCollection' as const,
    features: [
      ...layer.dsus.map(dsu => ({
        type: 'Feature' as const,
        id: dsu.id,
        properties: {
          name: dsu.name,
          wellCount: dsu.wellCount,
          operator: dsu.operator,
          formation: dsu.formation,
          type: 'dsu',
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: dsu.coordinates,
        },
      })),
      ...layer.wellbores.map(wb => ({
        type: 'Feature' as const,
        id: wb.id,
        properties: {
          dsuId: wb.dsuId,
          lateralLength: wb.lateralLength,
          formation: wb.formation,
          status: wb.status,
          type: 'wellbore',
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: wb.coordinates,
        },
      })),
    ],
  };
}
