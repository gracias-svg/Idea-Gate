'use client';

// Mission Control v1 — Batch M2 — AgentNode.
// A specialist is a circle. Identity is encoded by STROKE COLOUR (the agent's
// token); state is encoded separately — active adds an EMERALD glow + breathe.
// Two orthogonal encodings: colour = who, emerald = working. Presentation-only.
//
// Colour is always a Foundation TOKEN (var(--ig-agent-ps)), never the raw hex
// from agentDefs — the viz layer speaks tokens. Alpha blends use color-mix so a
// single token drives fill/stroke/text at different strengths.

import { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { breathe, propagate, easing } from '@/lib/motion/primitives';
import type { AgentNodeData } from '@/lib/execution/adapters/orchestration';

const SIZE = 56;

function AgentNodeImpl({ data, selected }: NodeProps<Node<AgentNodeData>>) {
  const { color, status, label, agentId } = data;
  const active = status === 'active';
  const done = status === 'done';
  const prefersReducedMotion = useReducedMotion();

  // M2.5 Task 2 — one-shot confidence ripple, see CoordinatorNode for the
  // full rationale (adapter never sets this; composition layer overlays it).
  const [rippling, setRippling] = useState(false);
  const seenNonce = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (data.rippleNonce === undefined || data.rippleNonce === seenNonce.current) return;
    seenNonce.current = data.rippleNonce;
    if (prefersReducedMotion) return;
    setRippling(true);
    const t = setTimeout(() => setRippling(false), 950);
    return () => clearTimeout(t);
  }, [data.rippleNonce, prefersReducedMotion]);
  const rippleColor = data.rippleTone === 'caution' ? 'var(--ig-caution)' : 'var(--ig-emerald)';

  // Grammar (spec §3): active = fill@15 + 2px full stroke; done = raised fill +
  // 1px stroke@40 + code@60; waiting = outline only, tertiary code.
  const fill = active
    ? `color-mix(in oklch, ${color} 15%, transparent)`
    : done
      ? 'var(--ig-surface-raised)'
      : 'transparent';
  const borderColor = active
    ? color
    : done
      ? `color-mix(in oklch, ${color} 40%, transparent)`
      : 'var(--ig-border-default)';
  const borderWidth = active ? 2 : 1;
  const codeColor = active
    ? color
    : done
      ? `color-mix(in oklch, ${color} 60%, transparent)`
      : 'var(--ig-text-tertiary)';

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
      <Handle type="target" position={Position.Top} style={HANDLE} />
      <Handle type="source" position={Position.Bottom} style={HANDLE} />

      {/* Emerald glow — state, not identity. Layered: soft wide falloff +
          a tighter bright core, only while alive. */}
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

      {/* Persistent selection ring — distinct from hover/focus/active-work. */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            inset: -5,
            borderRadius: '50%',
            border: '2px solid var(--ig-emerald-muted)',
            pointerEvents: 'none',
          }}
        />
      )}

      <motion.div
        variants={breathe}
        animate={active ? 'active' : 'idle'}
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: '50%',
          background: fill,
          border: `${borderWidth}px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformOrigin: 'center',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--ig-font-mono)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: codeColor,
          }}
        >
          {agentId}
        </span>
      </motion.div>

      <div
        style={{
          position: 'absolute',
          top: SIZE + 5,
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--ig-font-mono)',
          fontSize: 11,
          color: active ? 'var(--ig-text-secondary)' : 'var(--ig-text-tertiary)',
          pointerEvents: 'none',
        }}
      >
        {label}
      </div>

      {/* Reasoning tag — ephemeral WHY caption (M2.5 Task 3). See
          CoordinatorNode for the data-availability note. */}
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
              top: SIZE + 21,
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

export default memo(AgentNodeImpl);
