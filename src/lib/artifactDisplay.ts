// src/lib/artifactDisplay.ts
// Sprint 07 — extracted from src/app/improve/page.tsx so the new Workspace
// tree (src/components/workspace/) and the page share one implementation
// instead of drifting copies. Behaviour unchanged from the original inline
// helpers.

export const stageNum = (f: string): number => parseInt(f.split('-')[0], 10) || 0;

export const stageColor = (f: string): string => {
  const n = stageNum(f);
  return n <= 2 ? '#22c55e' : n <= 5 ? '#38bdf8' : n <= 9 ? '#a78bfa' : n <= 11 ? '#fb923c' : '#fde047';
};

// Same breakpoints as stageColor — the existing color-banding IS the only
// grouping concept present anywhere in the codebase/docs. No narrative
// category taxonomy ("Discovery"/"Strategy"/etc.) exists to draw on, so
// bands are labelled by stage range, not invented names (Sprint 08 Part 1).
const BAND_BOUNDS = [2, 5, 9, 11, Infinity];
export const stageBand = (f: string): number => {
  const n = stageNum(f);
  return BAND_BOUNDS.findIndex(max => n <= max);
};

export const humanName = (f: string): string =>
  f.replace('.md', '').replace(/^\d+-/, '').replace(/-/g, ' ');
