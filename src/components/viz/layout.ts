// Mission Control v1 — Batch M2 — Graph layout.
//
// Position is a DESIGN decision, not a data derivation. A symmetric algorithmic
// arc is exactly what makes a graph read as machine-generated, so the layout is
// a hand-tuned constant injected into the adapter (same DI pattern as agentDefs)
// — not a formula. These are STARTING values for a human tuning pass; they live
// in one place so they can be nudged in seconds.
//
// DELIBERATE ASYMMETRY — do NOT "correct" into symmetry. PS(210,78) is not the
// mirror of UX(590,72); RE(180,292) is not the mirror of AR(620,298). The
// imperfection is the signal of "hand-placed", not "generated". QA sits alone
// on the right because it is the final gate — semantic, not decorative.

import type { AgentId } from '@/lib/execution/adapters/orchestration';

export const CANVAS = { width: 820, height: 400 };

export const AGENT_LAYOUT: Record<AgentId, { x: number; y: number }> = {
  CO: { x: 400, y: 185 }, // hub — optical centre (above geometric centre)
  PS: { x: 210, y: 78 },  // STRATEGY cluster — left
  RE: { x: 180, y: 292 },
  UX: { x: 590, y: 72 },  // EXECUTION cluster — right
  AR: { x: 620, y: 298 },
  QA: { x: 760, y: 185 }, // the gate — terminal, alone on the right
};
