'use client';

// Mission Control v1 — Batch M2 — CoordinatorNode.
// The Coordinator, and ONLY the Coordinator, is a hexagon. It is the single
// hexagon in the entire product — unmistakably not-a-circle from across the
// room. Presentation-only: it reads `status`, never a runtime field.
//
// XYFlow owns the node wrapper's transform (positioning). Framer Motion must
// never touch that transform, or it fights XYFlow and jitters. `breathe`
// animates an INNER element's scale only (spec §6).

import { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { breathe, propagate, easing } from '@/lib/motion/primitives';
import type { AgentNodeData } from '@/lib/execution/adapters/orchestration';

const W = 80;
const H = 72; // flat-top regular-ish hexagon
// Flat-top hexagon: horizontal top & bottom edges, points left & right.
const HEX = `${W * 0.25},0 ${W * 0.75},0 ${W},${H / 2} ${W * 0.75},${H} ${W * 0.25},${H} 0,${H / 2}`;

function CoordinatorNodeImpl({ data, selected }: NodeProps<Node<AgentNodeData>>) {
  const active = data.status === 'active';
  const done = data.status === 'done';
  // Emerald is the coordinator's own colour; done/waiting only dim it.
  const strokeOpacity = active ? 1 : done ? 0.55 : 0.32;
  const textOpacity = active ? 1 : done ? 0.7 : 0.4;
  const prefersReducedMotion = useReducedMotion();

  // M2.5 Task 2 — one-shot confidence ripple. `rippleNonce` is an
  // ever-incrementing counter overlaid by the composition layer; a change
  // (not the value itself) is the trigger, so re-firing on the same nonce
  // never happens and repeats of the same nonce are ignored.
  const [rippling, setRippling] = useState(false);
  const seenNonce = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (data.rippleNonce === undefined || data.rippleNonce === seenNonce.current) return;
    seenNonce.current = data.rippleNonce;
    if (prefersReducedMotion) return; // decorative-only; skip entirely, don't fake-static-render.
    setRippling(true);
    const t = setTimeout(() => setRippling(false), 950);
    return () => clearTimeout(t);
  }, [data.rippleNonce, prefersReducedMotion]);
  const rippleColor = data.rippleTone === 'caution' ? 'var(--ig-caution)' : 'var(--ig-emerald)';

  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      {/* XYFlow needs handles to route edges; kept invisible. */}
      <Handle type="target" position={Position.Top} style={HANDLE} />
      <Handle type="source" position={Position.Bottom} style={HANDLE} />

      {/* Glow — only while alive. Layered: soft wide falloff + a tighter
          bright core, so it reads as illuminated rather than a flat wash. */}
      {active && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: -28,
              borderRadius: '50%',
              background:
                'radial-gradient(closest-side, var(--ig-emerald-glow), transparent 72%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              background:
                'radial-gradient(closest-side, var(--ig-emerald-bright) 0%, var(--ig-emerald-glow) 40%, transparent 75%)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* Confidence ripple — fires once per resolved stage (M2.5 Task 2). */}
      {rippling && (
        <motion.div
          variants={propagate}
          initial="hidden"
          animate="ripple"
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: `2px solid ${rippleColor}`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* breathe on the inner wrapper only — never the XYFlow node wrapper. */}
      <motion.div
        variants={breathe}
        animate={active ? 'active' : 'idle'}
        style={{ width: W, height: H, transformOrigin: 'center' }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
          <polygon
            points={HEX}
            fill="var(--ig-surface-raised)"
            stroke="var(--ig-emerald)"
            strokeOpacity={strokeOpacity}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* Selection ring — a second, offset hexagon in emerald-muted. */}
          {selected && (
            <polygon
              points={HEX}
              fill="none"
              stroke="var(--ig-emerald)"
              strokeOpacity={0.9}
              strokeWidth={2}
              strokeLinejoin="round"
              transform="scale(1.14)"
              transformOrigin="center"
              style={{ transformBox: 'fill-box' }}
            />
          )}
          <text
            x={W / 2}
            y={H / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--ig-font-mono)"
            fontSize={14}
            fontWeight={600}
            fill="var(--ig-emerald)"
            fillOpacity={textOpacity}
          >
            CO
          </text>
        </svg>
      </motion.div>

      {/* Label sits outside the measured box (absolute) so the hexagon's centre
          stays locked to the injected layout coordinate. */}
      <div
        style={{
          position: 'absolute',
          top: H + 6,
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--ig-font-mono)',
          fontSize: 11,
          color: 'var(--ig-text-secondary)',
          pointerEvents: 'none',
        }}
      >
        {data.label}
      </div>

      {/* Reasoning tag — ephemeral WHY caption (M2.5 Task 3). Real data only:
          stage label always; confidence phrase only when the store has
          actually resolved a confidence for this stage (usually not yet,
          for a stage still in progress — see mc-scratch wiring comment). */}
      <AnimatePresence>
        {active && data.reasoningTag && (
          <motion.div
            key={data.reasoningTag}
            initial={{ opacity: 0, y: 4 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: prefersReducedMotion
                ? { duration: 0 }
                : { delay: 0.2, duration: 0.3, ease: easing.out },
            }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            style={{
              position: 'absolute',
              top: H + 22,
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--ig-font-mono)',
              fontSize: 10,
              color: 'var(--ig-text-secondary)',
              pointerEvents: 'none',
            }}
          >
            {data.reasoningTag}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const HANDLE: React.CSSProperties = {
  opacity: 0,
  width: 1,
  height: 1,
  border: 'none',
  background: 'transparent',
  pointerEvents: 'none',
};

export default memo(CoordinatorNodeImpl);
