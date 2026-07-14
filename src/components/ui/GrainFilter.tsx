// W0-B — Grammar §1.3 Grain (🔬 EXPERIMENTAL).
//
// Defines the one global SVG turbulence filter. Does NOT apply it to
// anything — mounting this component only makes `url(#ig-grain)` and the
// `.ig-grain-overlay` utility class (globals.css) available to use later.
// Zero visual change from mounting this alone.
//
// Trivially removable: delete the <GrainFilter /> mount in layout.tsx (one
// line) and this file. The Grammar flags grain as experimental — it may
// read as noise on dense text (Desk) and need to come straight back out
// after human review, so this is kept maximally easy to rip out.
export default function GrainFilter() {
  return (
    <svg aria-hidden width={0} height={0} style={{ position: 'absolute' }}>
      <filter id="ig-grain">
        <feTurbulence type="fractalNoise" baseFrequency={0.8} numOctaves={4} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </svg>
  );
}
