/**
 * SynthwaveBackground – animated inline-SVG backdrop for the synthwave theme.
 *
 * Renders a full 1920x1080 scene (sky, stars, sun, wireframe mountains,
 * perspective grid) as a fixed layer behind page content.  CSS class-names
 * on every visual group let theme.css drive all animations.
 */
export default function SynthwaveBackground() {
  return (
    <div
      className="synthwave-bg-wrap"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {/* ── Deep sky gradient (darkened top for richer night sky) ── */}
          <linearGradient id="sw-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#010008" />
            <stop offset="20%"  stopColor="#06001a" />
            <stop offset="45%"  stopColor="#18003d" />
            <stop offset="70%"  stopColor="#0c0a2a" />
            <stop offset="100%" stopColor="#080620" />
          </linearGradient>

          {/* ── Nebula washes ── */}
          <radialGradient id="sw-nebula1" cx="25%" cy="22%" r="32%">
            <stop offset="0%"  stopColor="#7b2ff7" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#7b2ff7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sw-nebula2" cx="78%" cy="18%" r="28%">
            <stop offset="0%"  stopColor="#ff3cac" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ff3cac" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sw-nebula3" cx="50%" cy="35%" r="38%">
            <stop offset="0%"  stopColor="#c840e9" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#c840e9" stopOpacity="0" />
          </radialGradient>

          {/* ── Sun body gradient ── */}
          <linearGradient id="sw-sunBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ffe45e" />
            <stop offset="18%"  stopColor="#ffb347" />
            <stop offset="36%"  stopColor="#ff6b6b" />
            <stop offset="54%"  stopColor="#ff3cac" />
            <stop offset="72%"  stopColor="#c840e9" />
            <stop offset="100%" stopColor="#7b2ff7" />
          </linearGradient>

          {/* ── Sun horizontal-slice clip (classic cut lines) ── */}
          <clipPath id="sw-sunClip">
            <rect x="820" y="310" width="280" height="12" />
            <rect x="820" y="328" width="280" height="14" />
            <rect x="820" y="348" width="280" height="16" />
            <rect x="820" y="370" width="280" height="18" />
            <rect x="820" y="394" width="280" height="20" />
            <rect x="820" y="420" width="280" height="24" />
            <rect x="820" y="450" width="280" height="28" />
            <rect x="820" y="484" width="280" height="34" />
            <rect x="820" y="524" width="280" height="42" />
          </clipPath>

          {/* ── Sun ambient glow ── */}
          <radialGradient id="sw-sunGlow" cx="50%" cy="40%" r="35%">
            <stop offset="0%"   stopColor="#ff3cac" stopOpacity="0.55" />
            <stop offset="25%"  stopColor="#c840e9" stopOpacity="0.30" />
            <stop offset="50%"  stopColor="#7b2ff7" stopOpacity="0.15" />
            <stop offset="80%"  stopColor="#2b1055" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* ── Horizon glow ── */}
          <linearGradient id="sw-horizonGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ff3cac" stopOpacity="0.14" />
            <stop offset="30%"  stopColor="#7b2ff7" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          {/* ── Grid vertical-line gradient (brighter cyan) ── */}
          <linearGradient id="sw-gridV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#00e5ff" stopOpacity="0" />
            <stop offset="12%"  stopColor="#00e5ff" stopOpacity="0.18" />
            <stop offset="50%"  stopColor="#00e5ff" stopOpacity="0.50" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.65" />
          </linearGradient>

          {/* ── Grid horizontal-line gradient ── */}
          <linearGradient id="sw-gridH" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#c840e9" stopOpacity="0" />
            <stop offset="12%"  stopColor="#c840e9" stopOpacity="0.14" />
            <stop offset="50%"  stopColor="#c840e9" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#c840e9" stopOpacity="0.60" />
          </linearGradient>

          {/* ── Neon glow filter (stronger for grid) ── */}
          <filter id="sw-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 0.9 0"
              result="g"
            />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ── Sun glow filter ── */}
          <filter id="sw-sunFilter" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="18" result="b1" />
            <feGaussianBlur stdDeviation="6"  result="b2" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ── Subtle grain ── */}
          <filter id="sw-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={3} stitchTiles="stitch" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.15
                      0 0 0 0 0.10
                      0 0 0 0 0.20
                      0 0 0 0.14 0"
            />
          </filter>

          {/* ── Vignette ── */}
          <radialGradient id="sw-vignette" cx="50%" cy="42%" r="68%">
            <stop offset="0%"   stopColor="#000000" stopOpacity="0" />
            <stop offset="55%"  stopColor="#000000" stopOpacity="0.18" />
            <stop offset="85%"  stopColor="#000000" stopOpacity="0.50" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
          </radialGradient>

          {/* ── Mountain contour line color ── */}
          <linearGradient id="sw-contourCyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#00e5ff" stopOpacity="0.08" />
            <stop offset="50%"  stopColor="#00e5ff" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.08" />
          </linearGradient>

          {/* ── Foreground beam gradients ── */}
          <linearGradient id="sw-fgBeamMagenta" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#ff3cac" stopOpacity="0.38" />
            <stop offset="40%"  stopColor="#ff3cac" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ff3cac" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sw-fgBeamCyan" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#00e5ff" stopOpacity="0.32" />
            <stop offset="40%"  stopColor="#00e5ff" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sw-fgBeamViolet" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#c840e9" stopOpacity="0.34" />
            <stop offset="40%"  stopColor="#c840e9" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#c840e9" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ════════════ BASE SKY ════════════ */}
        <rect width="1920" height="1080" fill="url(#sw-sky)" />

        {/* ════════════ NEBULA WASHES ════════════ */}
        <rect width="1920" height="1080" fill="url(#sw-nebula1)" />
        <rect width="1920" height="1080" fill="url(#sw-nebula2)" />
        <rect width="1920" height="1080" fill="url(#sw-nebula3)" />

        {/* ════════════ STARS ════════════ */}
        <g className="sw-stars" opacity="0.70">
          {/* Bright stars */}
          <g className="sw-star-bright">
            <circle cx="145"  cy="85"  r="1.6" fill="#e0e8ff" />
            <circle cx="390"  cy="155" r="1.3" fill="#ffd6ff" />
            <circle cx="650"  cy="68"  r="1.8" fill="#d4f0ff" />
            <circle cx="880"  cy="120" r="1.2" fill="#ffffff" />
            <circle cx="1095" cy="95"  r="1.5" fill="#e0e8ff" />
            <circle cx="1320" cy="175" r="1.3" fill="#ffd6ff" />
            <circle cx="1540" cy="65"  r="1.7" fill="#d4f0ff" />
            <circle cx="1780" cy="140" r="1.4" fill="#ffffff" />
            <circle cx="260"  cy="42"  r="1.5" fill="#ffffff" />
            <circle cx="510"  cy="110" r="1.3" fill="#e0e8ff" />
            <circle cx="770"  cy="48"  r="1.6" fill="#d4f0ff" />
            <circle cx="1000" cy="58"  r="1.4" fill="#ffd6ff" />
            <circle cx="1220" cy="72"  r="1.5" fill="#ffffff" />
            <circle cx="1430" cy="130" r="1.3" fill="#e0e8ff" />
            <circle cx="1650" cy="42"  r="1.7" fill="#d4f0ff" />
            <circle cx="1870" cy="88"  r="1.4" fill="#ffd6ff" />
          </g>
          {/* Mid stars */}
          <g className="sw-star-mid">
            <circle cx="80"   cy="240" r="1.0" fill="#d4f0ff" />
            <circle cx="310"  cy="310" r="1.1" fill="#ffffff" />
            <circle cx="550"  cy="195" r="0.9" fill="#ffd6ff" />
            <circle cx="740"  cy="260" r="1.2" fill="#e0e8ff" />
            <circle cx="1010" cy="230" r="1.0" fill="#d4f0ff" />
            <circle cx="1200" cy="290" r="1.1" fill="#ffd6ff" />
            <circle cx="1450" cy="210" r="0.9" fill="#ffffff" />
            <circle cx="1680" cy="280" r="1.1" fill="#e0e8ff" />
            <circle cx="1850" cy="340" r="1.0" fill="#d4f0ff" />
            <circle cx="170"  cy="180" r="1.0" fill="#ffd6ff" />
            <circle cx="420"  cy="260" r="0.9" fill="#e0e8ff" />
            <circle cx="630"  cy="330" r="1.1" fill="#d4f0ff" />
            <circle cx="850"  cy="190" r="1.0" fill="#ffffff" />
            <circle cx="1130" cy="170" r="0.9" fill="#ffd6ff" />
            <circle cx="1350" cy="310" r="1.1" fill="#e0e8ff" />
            <circle cx="1560" cy="250" r="1.0" fill="#d4f0ff" />
            <circle cx="1750" cy="200" r="0.9" fill="#ffffff" />
            <circle cx="1900" cy="260" r="1.0" fill="#ffd6ff" />
          </g>
          {/* Faint scattered */}
          <g className="sw-star-faint">
            <circle cx="200"  cy="420" r="0.7" fill="#d4f0ff" opacity="0.5" />
            <circle cx="480"  cy="350" r="0.6" fill="#ffffff" opacity="0.45" />
            <circle cx="1100" cy="370" r="0.7" fill="#ffd6ff" opacity="0.5" />
            <circle cx="1600" cy="400" r="0.6" fill="#d4f0ff" opacity="0.4" />
            <circle cx="50"   cy="380" r="0.6" fill="#e0e8ff" opacity="0.4" />
            <circle cx="340"  cy="460" r="0.7" fill="#ffffff" opacity="0.45" />
            <circle cx="580"  cy="430" r="0.5" fill="#d4f0ff" opacity="0.35" />
            <circle cx="780"  cy="380" r="0.7" fill="#ffd6ff" opacity="0.5" />
            <circle cx="960"  cy="350" r="0.6" fill="#e0e8ff" opacity="0.4" />
            <circle cx="1260" cy="440" r="0.5" fill="#ffffff" opacity="0.35" />
            <circle cx="1420" cy="380" r="0.7" fill="#d4f0ff" opacity="0.45" />
            <circle cx="1720" cy="450" r="0.6" fill="#ffd6ff" opacity="0.4" />
            <circle cx="1880" cy="410" r="0.5" fill="#e0e8ff" opacity="0.35" />
            <circle cx="120"  cy="500" r="0.6" fill="#d4f0ff" opacity="0.3" />
            <circle cx="430"  cy="520" r="0.5" fill="#ffffff" opacity="0.28" />
            <circle cx="700"  cy="480" r="0.6" fill="#ffd6ff" opacity="0.32" />
            <circle cx="1050" cy="500" r="0.5" fill="#e0e8ff" opacity="0.28" />
            <circle cx="1500" cy="490" r="0.6" fill="#d4f0ff" opacity="0.30" />
            <circle cx="1800" cy="520" r="0.5" fill="#ffffff" opacity="0.25" />
          </g>
        </g>

        {/* ════════════ SHOOTING STARS ════════════ */}
        <g className="sw-shooting-star sw-shooting-star-1" opacity="0">
          <line x1="320" y1="100" x2="260" y2="145" stroke="#d4f0ff" strokeWidth="1.8" strokeLinecap="round" />
        </g>
        <g className="sw-shooting-star sw-shooting-star-2" opacity="0">
          <line x1="1400" y1="80" x2="1355" y2="115" stroke="#d4f0ff" strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <g className="sw-shooting-star sw-shooting-star-3" opacity="0">
          <line x1="800" y1="50" x2="750" y2="90" stroke="#e0e8ff" strokeWidth="1.4" strokeLinecap="round" />
        </g>
        <g className="sw-shooting-star sw-shooting-star-4" opacity="0">
          <line x1="1700" y1="130" x2="1660" y2="165" stroke="#ffd6ff" strokeWidth="1.0" strokeLinecap="round" />
        </g>

        {/* ════════════ SUN GLOW (behind sun) ════════════ */}
        <rect className="sw-sun-glow" width="1920" height="1080" fill="url(#sw-sunGlow)" />

        {/* ════════════ SUN ROTATING RAYS ════════════ */}
        <g className="sw-sun-rays" filter="url(#sw-glow)">
          {/* 16 radial beams from sun center, rotating as a group */}
          {[...Array(16)].map((_, i) => {
            const angle = (i * 360) / 16;
            const len = 220 + (i % 3) * 40;
            const w = 2.5 - (i % 2) * 0.8;
            return (
              <line
                key={`ray-${i}`}
                className="sw-sun-ray"
                x1="960"
                y1="440"
                x2={960 + Math.cos((angle * Math.PI) / 180) * len}
                y2={440 + Math.sin((angle * Math.PI) / 180) * len}
                stroke={i % 2 === 0 ? '#ff3cac' : '#c840e9'}
                strokeOpacity="0.35"
                strokeWidth={w}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* ════════════ SUN PULSE RING ════════════ */}
        <circle
          className="sw-sun-pulse-ring"
          cx="960"
          cy="440"
          r="95"
          fill="none"
          stroke="#ff3cac"
          strokeOpacity="0.25"
          strokeWidth="2"
          filter="url(#sw-glow)"
        />

        {/* ════════════ SUN ════════════ */}
        <g className="sw-sun" filter="url(#sw-sunFilter)">
          <circle cx="960" cy="440" r="115" fill="url(#sw-sunBody)" clipPath="url(#sw-sunClip)" />
          <circle cx="960" cy="440" r="130" fill="none" stroke="#ff3cac" strokeOpacity="0.50" strokeWidth="1.5" />
          <circle cx="960" cy="440" r="155" fill="none" stroke="#c840e9" strokeOpacity="0.25" strokeWidth="1.5" />
          <circle cx="960" cy="440" r="185" fill="none" stroke="#7b2ff7" strokeOpacity="0.12" strokeWidth="1" />
        </g>

        {/* ════════════ HORIZON GLOW BAND ════════════ */}
        <rect x="0" y="580" width="1920" height="200" fill="url(#sw-horizonGlow)" />
        <line x1="0" y1="660" x2="1920" y2="660" stroke="#ff3cac" strokeOpacity="0.22" strokeWidth="3" filter="url(#sw-glow)" />

        {/* ════════════ BACK MOUNTAINS (semi-transparent for grid-through) ════════════ */}
        <path
          d="M 0 660 C 120 620, 260 680, 400 640 C 520 605, 640 670, 780 630 C 900 595, 1020 665, 1160 620 C 1300 580, 1440 660, 1580 615 C 1700 580, 1800 640, 1920 610 L 1920 1080 L 0 1080 Z"
          fill="#0a001e"
          opacity="0.72"
        />
        {/* Back mountain neon edge */}
        <path
          className="sw-mountain-edge"
          d="M 0 660 C 120 620, 260 680, 400 640 C 520 605, 640 670, 780 630 C 900 595, 1020 665, 1160 620 C 1300 580, 1440 660, 1580 615 C 1700 580, 1800 640, 1920 610"
          fill="none"
          stroke="#c840e9"
          strokeOpacity="0.35"
          strokeWidth="2"
          filter="url(#sw-glow)"
        />
        {/* Back mountain contour lines (wireframe terrain) */}
        <g className="sw-mountain-contour" opacity="0.30" filter="url(#sw-glow)">
          <path d="M 0 680 C 120 650, 260 695, 400 665 C 520 640, 640 690, 780 660 C 900 635, 1020 685, 1160 655 C 1300 625, 1440 685, 1580 650 C 1700 625, 1800 670, 1920 645" fill="none" stroke="url(#sw-contourCyan)" strokeWidth="1" />
          <path d="M 0 710 C 120 690, 260 720, 400 700 C 520 685, 640 720, 780 700 C 900 685, 1020 720, 1160 700 C 1300 680, 1440 720, 1580 700 C 1700 680, 1800 710, 1920 695" fill="none" stroke="url(#sw-contourCyan)" strokeWidth="1" />
          <path d="M 0 745 C 120 735, 260 755, 400 742 C 520 732, 640 755, 780 742 C 900 732, 1020 755, 1160 742 C 1300 730, 1440 755, 1580 742 C 1700 730, 1800 748, 1920 738" fill="none" stroke="url(#sw-contourCyan)" strokeWidth="1" />
          <path d="M 0 790 C 120 782, 260 798, 400 788 C 520 780, 640 798, 780 788 C 900 780, 1020 798, 1160 788 C 1300 778, 1440 798, 1580 788 C 1700 778, 1800 792, 1920 784" fill="none" stroke="url(#sw-contourCyan)" strokeWidth="1" />
        </g>

        {/* ════════════ FRONT MOUNTAINS (semi-transparent) ════════════ */}
        <path
          d="M 0 710 C 160 670, 300 740, 480 695 C 620 660, 760 745, 920 700 C 1060 660, 1180 750, 1360 695 C 1520 650, 1680 740, 1920 690 L 1920 1080 L 0 1080 Z"
          fill="#060012"
          opacity="0.78"
        />
        {/* Front mountain neon edge */}
        <path
          className="sw-mountain-edge"
          d="M 0 710 C 160 670, 300 740, 480 695 C 620 660, 760 745, 920 700 C 1060 660, 1180 750, 1360 695 C 1520 650, 1680 740, 1920 690"
          fill="none"
          stroke="#ff3cac"
          strokeOpacity="0.45"
          strokeWidth="2.5"
          filter="url(#sw-glow)"
        />
        {/* Front mountain contour lines */}
        <g className="sw-mountain-contour" opacity="0.25" filter="url(#sw-glow)">
          <path d="M 0 740 C 160 710, 300 760, 480 725 C 620 700, 760 765, 920 730 C 1060 700, 1180 770, 1360 725 C 1520 695, 1680 760, 1920 720" fill="none" stroke="url(#sw-contourCyan)" strokeWidth="1" />
          <path d="M 0 780 C 160 760, 300 790, 480 770 C 620 755, 760 795, 920 775 C 1060 755, 1180 800, 1360 770 C 1520 750, 1680 795, 1920 765" fill="none" stroke="url(#sw-contourCyan)" strokeWidth="1" />
          <path d="M 0 830 C 160 818, 300 840, 480 825 C 620 815, 760 845, 920 830 C 1060 815, 1180 848, 1360 828 C 1520 812, 1680 845, 1920 822" fill="none" stroke="url(#sw-contourCyan)" strokeWidth="1" />
          <path d="M 0 890 C 160 882, 300 898, 480 888 C 620 880, 760 902, 920 890 C 1060 880, 1180 905, 1360 888 C 1520 878, 1680 902, 1920 885" fill="none" stroke="url(#sw-contourCyan)" strokeWidth="1" />
          <path d="M 0 960 C 160 955, 300 968, 480 958 C 620 952, 760 970, 920 960 C 1060 952, 1180 972, 1360 960 C 1520 950, 1680 970, 1920 956" fill="none" stroke="url(#sw-contourCyan)" strokeWidth="1" />
        </g>

        {/* ════════════ PERSPECTIVE GRID (no mask – covers landscape) ════════════ */}
        {/* Vertical converging lines (doubled density) */}
        <g className="sw-grid-v" stroke="url(#sw-gridV)" strokeWidth="2" filter="url(#sw-glow)">
          <line x1="-100" y1="1080" x2="960" y2="660" />
          <line x1="30"   y1="1080" x2="960" y2="660" />
          <line x1="140"  y1="1080" x2="960" y2="660" />
          <line x1="250"  y1="1080" x2="960" y2="660" />
          <line x1="355"  y1="1080" x2="960" y2="660" />
          <line x1="460"  y1="1080" x2="960" y2="660" />
          <line x1="555"  y1="1080" x2="960" y2="660" />
          <line x1="645"  y1="1080" x2="960" y2="660" />
          <line x1="730"  y1="1080" x2="960" y2="660" />
          <line x1="810"  y1="1080" x2="960" y2="660" />
          <line x1="885"  y1="1080" x2="960" y2="660" />
          <line x1="960"  y1="1080" x2="960" y2="660" />
          <line x1="1035" y1="1080" x2="960" y2="660" />
          <line x1="1110" y1="1080" x2="960" y2="660" />
          <line x1="1190" y1="1080" x2="960" y2="660" />
          <line x1="1275" y1="1080" x2="960" y2="660" />
          <line x1="1365" y1="1080" x2="960" y2="660" />
          <line x1="1460" y1="1080" x2="960" y2="660" />
          <line x1="1565" y1="1080" x2="960" y2="660" />
          <line x1="1680" y1="1080" x2="960" y2="660" />
          <line x1="1780" y1="1080" x2="960" y2="660" />
          <line x1="1890" y1="1080" x2="960" y2="660" />
          <line x1="2020" y1="1080" x2="960" y2="660" />
        </g>

        {/* Horizontal perspective lines (doubled density, exponential spacing) */}
        <g className="sw-grid-h" stroke="url(#sw-gridH)" strokeWidth="2" filter="url(#sw-glow)">
          <line x1="0" y1="670"  x2="1920" y2="670" />
          <line x1="0" y1="682"  x2="1920" y2="682" />
          <line x1="0" y1="696"  x2="1920" y2="696" />
          <line x1="0" y1="712"  x2="1920" y2="712" />
          <line x1="0" y1="730"  x2="1920" y2="730" />
          <line x1="0" y1="750"  x2="1920" y2="750" />
          <line x1="0" y1="773"  x2="1920" y2="773" />
          <line x1="0" y1="799"  x2="1920" y2="799" />
          <line x1="0" y1="828"  x2="1920" y2="828" />
          <line x1="0" y1="862"  x2="1920" y2="862" />
          <line x1="0" y1="900"  x2="1920" y2="900" />
          <line x1="0" y1="944"  x2="1920" y2="944" />
          <line x1="0" y1="994"  x2="1920" y2="994" />
          <line x1="0" y1="1035" x2="1920" y2="1035" />
          <line x1="0" y1="1080" x2="1920" y2="1080" />
        </g>

        {/* ════════════ FOREGROUND BEAMS ════════════ */}
        <g className="sw-fg-beams" filter="url(#sw-glow)">
          {/* Vertical light pillars rising from the terrain/horizon */}
          <rect className="sw-fg-beam" x="120"  y="500" width="4"   height="580" fill="url(#sw-fgBeamMagenta)" />
          <rect className="sw-fg-beam" x="285"  y="460" width="3"   height="620" fill="url(#sw-fgBeamCyan)" />
          <rect className="sw-fg-beam" x="430"  y="520" width="5"   height="560" fill="url(#sw-fgBeamViolet)" />
          <rect className="sw-fg-beam" x="580"  y="480" width="3.5" height="600" fill="url(#sw-fgBeamMagenta)" />
          <rect className="sw-fg-beam" x="720"  y="500" width="4"   height="580" fill="url(#sw-fgBeamCyan)" />
          <rect className="sw-fg-beam" x="860"  y="450" width="3"   height="630" fill="url(#sw-fgBeamViolet)" />
          <rect className="sw-fg-beam" x="1060" y="450" width="3"   height="630" fill="url(#sw-fgBeamViolet)" />
          <rect className="sw-fg-beam" x="1200" y="500" width="4"   height="580" fill="url(#sw-fgBeamCyan)" />
          <rect className="sw-fg-beam" x="1340" y="480" width="3.5" height="600" fill="url(#sw-fgBeamMagenta)" />
          <rect className="sw-fg-beam" x="1490" y="520" width="5"   height="560" fill="url(#sw-fgBeamViolet)" />
          <rect className="sw-fg-beam" x="1635" y="460" width="3"   height="620" fill="url(#sw-fgBeamCyan)" />
          <rect className="sw-fg-beam" x="1800" y="500" width="4"   height="580" fill="url(#sw-fgBeamMagenta)" />
        </g>

        {/* ════════════ ATMOSPHERIC LAYERS ════════════ */}
        <rect width="1920" height="1080" filter="url(#sw-grain)" opacity="0.25" />
        <rect width="1920" height="1080" fill="url(#sw-vignette)" />
      </svg>
    </div>
  );
}
