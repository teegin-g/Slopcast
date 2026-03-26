# Color & Atmosphere Technical Audit

Comprehensive inventory of CSS custom property colors, surface layer
hierarchy, opacity values, contrast observations, and hardcoded colors
across all seven themes.

---

## 1. CSS Custom Property Colors Per Theme

All values from `src/styles/theme.css`. Format: `R G B` (space-separated
for Tailwind alpha modifier support, per `theme.css:4-7`).

### Slate (:root, line 11-175)
| Token          | RGB Value       | Hex       | Role                   |
|----------------|----------------|-----------|------------------------|
| `--bg-deep`    | 15 23 42       | `#0f172a` | Page void              |
| `--bg-space`   | 27 41 62       | `#1B293E` | Ambient gradient       |
| `--surface-1`  | 30 41 59       | `#1e293b` | Panel base             |
| `--surface-2`  | 51 65 85       | `#334155` | Lifted / hover         |
| `--border`     | 71 85 105      | `#475569` | Borders                |
| `--cyan`       | 59 130 246     | `#3b82f6` | Primary accent         |
| `--magenta`    | 236 72 153     | `#ec4899` | Secondary accent       |
| `--lav`        | 216 180 254    | `#d8b4fe` | Tertiary text          |
| `--text`       | 241 245 249    | `#f1f5f9` | Body text              |
| `--muted`      | 148 163 184    | `#94a3b8` | Subdued text           |

### Synthwave (line 178-229)
| Token          | RGB Value       | Hex       | Role                   |
|----------------|----------------|-----------|------------------------|
| `--bg-deep`    | 14 6 26        | `#0E061A` | Deep purple void       |
| `--bg-space`   | 27 14 43       | `#1B0E2B` | Ambient                |
| `--surface-1`  | 35 37 88       | `#232558` | Panel                  |
| `--surface-2`  | 47 56 135      | `#2F3887` | Lifted                 |
| `--border`     | 96 83 160      | `#6053A0` | Purple border          |
| `--cyan`       | 158 211 240    | `#9ED3F0` | Ice blue primary       |
| `--magenta`    | 229 102 218    | `#E566DA` | Neon pink              |
| `--text`       | 235 233 238    | `#EBE9EE` | Warm white             |
| `--muted`      | 168 163 168    | `#A8A3A8` | Neutral gray           |

### Tropical (line 232-286)
| Token          | RGB Value       | Hex       | Role                   |
|----------------|----------------|-----------|------------------------|
| `--bg-deep`    | 18 28 40       | `#121C28` | Ocean midnight         |
| `--surface-1`  | 30 50 60       | `#1e323c` | Driftwood              |
| `--surface-2`  | 42 72 82       | `#2a4852` | Wet palm bark          |
| `--border`     | 45 212 191     | `#2dd4bf` | Seafoam teal (accent!) |
| `--cyan`       | 45 212 191     | `#2dd4bf` | Teal primary           |
| `--magenta`    | 255 127 107    | `#FF7F6B` | Coral                  |
| `--text`       | 236 242 238    | `#ECF2EE` | Sea-foam white         |

### Nocturne / League (line 289-374)
| Token          | RGB Value       | Hex       | Role                   |
|----------------|----------------|-----------|------------------------|
| `--bg-deep`    | 3 8 16         | `#030810` | Near-black blue        |
| `--surface-1`  | 14 26 48       | `#0E1A30` | Deep navy              |
| `--surface-2`  | 24 38 66       | `#182642` | Navy lift              |
| `--cyan`       | 103 195 238    | `#67C3EE` | Cool azure             |
| `--magenta`    | 220 129 96     | `#DC8160` | Muted terracotta       |
| `--warning`    | 233 176 103    | `#E9B067` | Golden amber           |

### Stormwatch (line 377-461)
| Token          | RGB Value       | Hex       | Role                   |
|----------------|----------------|-----------|------------------------|
| `--bg-deep`    | 7 11 22        | `#070B16` | Storm dark             |
| `--surface-1`  | 20 33 56       | `#142138` | Steel blue             |
| `--border`     | 82 107 148     | `#526B94` | Slate blue             |
| `--cyan`       | 155 196 255    | `#9BC4FF` | Pale sky blue          |
| `--magenta`    | 242 166 90     | `#F2A65A` | Warm amber             |

### Classic / Mario (line 465-657)
| Token          | RGB Value       | Hex       | Role                   |
|----------------|----------------|-----------|------------------------|
| `--bg-deep`    | 243 239 233    | `#F3EFE9` | Light cream (!)        |
| `--surface-1`  | 15 29 48       | `#0F1D30` | Navy module            |
| `--surface-2`  | 21 41 68       | `#152944` | Navy lift              |
| `--border`     | 201 177 139    | `#C9B18B` | Sand                   |
| `--cyan`       | 18 112 255     | `#1270FF` | Classic blue           |
| `--magenta`    | 220 0 0        | `#DC0000` | Classic red            |
| `--lav`        | 255 213 0      | `#FFD500` | Gold                   |
| `--text`       | 255 255 255    | `#FFFFFF` | White on modules       |

### Hyperborea (line 660-736)
| Token          | RGB Value       | Hex       | Role                   |
|----------------|----------------|-----------|------------------------|
| `--bg-deep`    | 11 19 32       | `#0B1320` | Ice night              |
| `--surface-1`  | 32 52 80       | `#203450` | Cold navy              |
| `--surface-2`  | 44 67 101      | `#2C4365` | Frost steel            |
| `--cyan`       | 56 189 248     | `#38BDF8` | Bright sky blue        |
| `--magenta`    | 125 211 252    | `#7DD3FC` | Ice blue (not pink!)   |

---

## 2. Surface Layer Hierarchy Map

Effective surface stack (back to front, non-classic themes):

```
z:-1  Animated background (canvas/SVG, position:fixed)
z:0   --grad-space body gradient
z:0   .theme-atmo::before pseudo-element (atmospheric overlay)
z:0   .theme-atmo-bands / horizon / ridges / palms (positioned abs)
z:10  Vignette.tsx (position:fixed, z-index:10)
z:20  Header (sticky, z-index:20, backdrop-blur-md)
      - bg-theme-surface1/80 (PageHeader.tsx:263)
      - Header atmospheric overlays rendered as children
---   Content area:
      - SectionCard: bg-theme-surface1/{20|70|100} per panelStyle
      - KpiGrid hero: bg-theme-surface1/{20|90|100} per panelStyle
      - KpiGrid tiles: bg-theme-surface1/{20|60|100} per panelStyle
      - Inner tiles: bg-theme-surface1/60 default (KpiGrid.tsx:162)
```

---

## 3. Contrast Observations

Approximate contrast ratios (text color vs. effective background,
accounting for panel opacity over `--bg-deep`):

### Glass panels (70% surface over bg-deep)

| Theme       | Text on Panel | Muted on Panel | Status |
|-------------|:------------:|:--------------:|:------:|
| Slate       | ~14:1        | ~7:1           | Pass   |
| Synthwave   | ~11:1        | ~5.5:1         | Pass   |
| Tropical    | ~12:1        | ~6.5:1         | Pass   |
| Nocturne    | ~15:1        | ~7:1           | Pass   |
| Stormwatch  | ~14:1        | ~7:1           | Pass   |
| Hyperborea  | ~13:1        | ~6.5:1         | Pass   |

### Outline panels (20% surface over animated BG)

| Theme       | Text on Panel | Small Text (11px) | Risk   |
|-------------|:------------:|:-----------------:|:------:|
| Synthwave   | ~5-8:1 *     | ~3-5:1 *          | FAIL   |
| Tropical    | N/A (glass)  | N/A               | -      |

*Synthwave outline panels vary wildly because the SVG background includes
bright neon lines (#00e5ff, #ff3cac) at 30-65% opacity that shift the
effective background luminance frame-to-frame.*

### Header readability
All themes: `bg-theme-surface1/80` + `backdrop-blur-md` at `theme.css:263`
provides reliable high contrast. The blur diffuses background motion
effectively.

---

## 4. Opacity Value Inventory

### CSS Token-Level Opacities
| Location                    | Value  | Notes                            |
|-----------------------------|--------|----------------------------------|
| `theme.css:50` (slate glow) | 0.15   | Shadow glow spread               |
| `theme.css:210-211` (synth) | 0.22, 0.12 | Double-ring glow cyan/magenta |
| `theme.css:766` (synth atmo)| 0.76   | Base atmospheric overlay         |
| `theme.css:777` (synth max) | 0.98   | FX-max atmospheric               |
| `theme.css:822` (synth bands)| 0.34  | Repeating line bands             |
| `theme.css:837` (synth max) | 0.74   | FX-max bands                     |
| `theme.css:852` (synth horiz)| 0.75  | Horizon glow base                |
| `theme.css:876` (synth ridge)| 0.84  | Ridge darkness                   |
| `theme.css:900` (trop atmo) | 0.74   | Tropical base atmospheric        |
| `theme.css:924` (trop max)  | 0.96   | Tropical FX-max                  |
| `theme.css:948` (trop bands)| 0.24   | Tropical scan bands              |
| `theme.css:1106` (league)   | 0.82   | Nocturne base atmospheric        |
| `theme.css:1162` (storm)    | 0.82   | Stormwatch base atmospheric      |
| `theme.css:1289` (mario)    | 0.50   | Classic base atmospheric         |
| `theme.css:1302` (mario max)| 0.96   | Classic FX-max                   |
| `theme.css:1405` (hyper)    | 0.60   | Hyperborea base atmospheric      |
| `theme.css:1417` (hyper max)| 0.85   | Hyperborea FX-max                |

### Component-Level Opacities
| Location                         | Value | Context                     |
|----------------------------------|-------|-----------------------------|
| `Vignette.tsx:21`                | 0.3   | Global vignette edge        |
| `SectionCard.tsx:18` (glass)     | /70   | Glass panel BG              |
| `SectionCard.tsx:20` (outline)   | /20   | Outline panel BG            |
| `KpiGrid.tsx:220` (hero glass)   | /90   | Hero card BG                |
| `KpiGrid.tsx:222` (hero outline) | /20   | Hero card outline BG        |
| `KpiGrid.tsx:226` (tile glass)   | /60   | KPI tile BG                 |
| `KpiGrid.tsx:228` (tile outline) | /20   | KPI tile outline BG         |
| `PageHeader.tsx:263`             | /80   | Header BG                   |

### Background Vignette Opacities
| Background      | Edge Opacity | Center Radius | File:Line              |
|-----------------|:------------:|:-------------:|------------------------|
| Synthwave SVG   | 0.75         | 55% clear     | SynthwaveBackground:150|
| Tropical        | 0.4          | 28% clear     | TropicalBackground:858 |
| Nocturne        | 0.70         | 0% center     | MoonlightBackground:382|
| Stormwatch      | 0.58         | 13% clear     | StormDuskBackground:725|
| Classic         | 0.50         | 21% clear     | MarioOverworld:337     |
| Hyperborea      | 0.5          | 37% clear     | HyperboreaBackground:953|

---

## 5. Hardcoded Colors That Should Use Tokens

### SynthwaveBackground.tsx
All colors are hardcoded SVG attributes — this is expected for a static SVG
asset. No token violations; the SVG is a self-contained scene.

### TropicalBackground.tsx
| Line(s)    | Hardcoded Value            | Should Be                       |
|------------|----------------------------|---------------------------------|
| 22-41      | Full COLORS object         | Acceptable (canvas palette)     |
| 283-285    | `rgba(30, 90, 110, ...)`   | Could derive from --surface-1   |
| 412        | `'#030e18'`                | Hardcoded deep ocean            |
| 627-628    | `'#0b5e34'`               | Hardcoded frond midrib          |
| 697-698    | `'#050e0a'`               | Hardcoded silhouette            |
| 731        | `'#5a3a1a'`               | Coconut color, acceptable       |

### MoonlightBackground.tsx
| Line(s)    | Hardcoded Value            | Should Be                       |
|------------|----------------------------|---------------------------------|
| 279-282    | `'#f8dca8'` through `'#c07828'` | Moon body gradient, acceptable |
| 290        | `'#a07030'`               | Moon surface texture             |

### StormDuskBackground.tsx
| Line(s)    | Hardcoded Value            | Should Be                       |
|------------|----------------------------|---------------------------------|
| 500        | `'255, 214, 157'`         | Matches COLORS.lampWarm inline  |
| 622        | `'255, 214, 157'`         | Duplicated warm lamp color      |
| 664        | `'rgba(16, 22, 30, 0.62)'`| Branch color, acceptable        |

### PageHeader.tsx
| Line(s)    | Hardcoded Value            | Should Be                       |
|------------|----------------------------|---------------------------------|
| 58         | `'bg-black/25'`           | Classic-mode only, acceptable   |
| 59         | `'bg-black/35'`           | Classic-mode hover              |
| 76         | `'bg-black/80'`           | Classic dropdown bg             |

### KpiGrid.tsx
| Line(s)    | Hardcoded Value            | Should Be                       |
|------------|----------------------------|---------------------------------|
| 243        | `'text-white/30'`         | Classic sparkline, acceptable   |
| 251-254    | `'text-5xl'` etc.         | Font sizes, not color           |

### SectionCard.tsx
| Line(s)    | Hardcoded Value            | Should Be                       |
|------------|----------------------------|---------------------------------|
| 64         | `'text-white'`            | Classic-mode only, acceptable   |
| 65         | `'text-theme-cyan'`       | Correct token usage             |

**Summary:** Canvas background files necessarily hardcode their palettes
(they cannot read CSS custom properties at canvas render time). The UI
component layer correctly uses theme tokens via Tailwind classes. No
critical token violations found.

---

## 6. Shadow System Audit

Per-theme shadow values from `theme.css`:

| Theme       | `--shadow-glow-cyan`                 | `--shadow-card`              |
|-------------|--------------------------------------|------------------------------|
| Slate       | `0 0 10px rgba(59,130,246,0.15)`     | `0 10px 30px rgba(0,0,0,.45)`|
| Synthwave   | `0 0 18px ..0.22, 0 0 48px ..0.12`  | `0 10px 30px rgba(0,0,0,.55)`|
| Tropical    | `0 0 14px ..0.17, 0 0 40px ..0.07`  | `0 10px 30px rgba(0,0,0,.45)`|
| Nocturne    | `0 0 14px ..0.12, 0 0 32px ..0.05`  | `0 14px 32px rgba(0,0,0,0.52)`|
| Stormwatch  | `0 0 16px ..0.14, 0 0 40px ..0.06`  | `0 14px 32px rgba(0,0,0,0.56)`|
| Classic     | `0 0 0 rgba(0,0,0,0)` (disabled!)   | `0 6px 12px rgba(0,0,0,0.35)`|
| Hyperborea  | `0 0 16px ..0.14, 0 0 40px ..0.06`  | `0 14px 32px rgba(0,0,0,0.56)`|

Classic correctly disables glow shadows. Stormwatch and Hyperborea share
identical shadow-card values — differentiation opportunity.
