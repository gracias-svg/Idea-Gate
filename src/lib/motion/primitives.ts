// Foundation Phase 1 §6 — Motion Primitives.
// Named behaviors, not per-component animations. Every animation in the
// product composes from these. Cited by name (`Motion: handoff`).
// Durations are STARTING values — human tuning (spec §12) adjusts them;
// the names and structure are fixed.
//
// Import path note: the spec's literal code uses `motion/react`. This repo
// already has framer-motion@12.42.2 installed and locked (Design Blueprint
// §33) — `motion` and `framer-motion` are the same underlying library under
// different package names and cannot coexist, so every import below uses
// 'framer-motion' instead. Variant names, durations, and easings are
// unchanged from the spec.
import type { Variants, Transition } from 'framer-motion';

/* Easings — the product's motion signature */
export const easing = {
  standard: [0.4, 0.0, 0.2, 1] as const,   // most transitions
  out:      [0.0, 0.0, 0.2, 1] as const,   // entrances
  in:       [0.4, 0.0, 1, 1] as const,     // exits
};

export const duration = {
  instant: 0.08, quick: 0.16, standard: 0.24, calm: 0.4,   // seconds
};

/* ── breathe: a node is alive/thinking. The ONLY looping ambient motion. ── */
export const breathe: Variants = {
  idle:   { scale: 1 },
  active: { scale: [1, 1.03, 1], transition: { duration: 2.4, ease: 'easeInOut', repeat: Infinity } },
};

/* ── handoff: work moving along an edge from A to B (edge dash-flow) ── */
export const handoffTransition: Transition = { duration: 1.5, ease: 'linear', repeat: Infinity };
// applied to strokeDashoffset on an animated edge; direction reverses when work returns to CO

/* ── propagate: confidence rippling out from a resolved node ── */
export const propagate: Variants = {
  hidden: { scale: 0.6, opacity: 0.5 },
  ripple: { scale: 2.2, opacity: 0, transition: { duration: 0.9, ease: 'easeOut' } },
};

/* ── settle: a briefing/decision moving into the record ── */
export const settle: Variants = {
  live:    { scale: 1, opacity: 1, y: 0 },
  settled: { scale: 0.9, opacity: 0, y: 24, transition: { duration: 0.4, ease: easing.in } },
};

/* ── reveal: content entering (panels, list items, reasoning) ── */
export const reveal: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easing.out } },
};

/* ── stagger: for lists/grids revealing children in sequence ── */
export const staggerParent: Variants = {
  visible: { transition: { staggerChildren: 0.05 } },
};

// These map 1:1 to the visual grammar (spec §1): breathe<->emerald-glow-
// thinking, handoff<->solid-animated-edge, propagate<->ripple, etc. Motion
// and grammar are one system.

// ─────────────────────────────────────────────────────────────────────────
// Foundation Phase 1 §7 — Interaction Language.
// The four states that must never share a visual treatment. Spec gives
// this as a reference table + prose contracts, not literal CSS/code — kept
// here as typed constants so components reference it by name rather than
// re-deriving timings/treatments inline.
// ─────────────────────────────────────────────────────────────────────────

export type InteractionState = 'hover' | 'focus' | 'activeWork' | 'selection';

export interface InteractionStateSpec {
  treatment: string;
  timing: string;
}

export const interactionStates: Record<InteractionState, InteractionStateSpec> = {
  hover:      { treatment: "Surface lightens one step (surface -> surface-raised); tooltip after 400ms", timing: `${duration.instant}s (duration.instant)` },
  focus:      { treatment: '--ig-focus-ring (2px emerald-muted)', timing: 'instant' },
  activeWork: { treatment: 'Emerald glow + breathe (only while genuinely working)', timing: 'breathe loop' },
  selection:  { treatment: '2px emerald-muted ring, persistent, + subtle surface-raised fill', timing: `${duration.quick}s (duration.quick)` },
};

// Hover contract: hover never triggers data fetches; reveals context already loaded.
// Loading contract: never a bare spinner — name the real operation ("Running Stage 7")
// or show a skeleton.
// Empty contract: never "no data" — state what appears and how.
// Overlays: Floating UI (@floating-ui/react) for all tooltips/popovers/menus
// (positioning, collision, focus) — installed in Batch F0.
