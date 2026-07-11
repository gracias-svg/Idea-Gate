'use client';

// Mission Control v1 — Batch M2 — AgentNode.
// A specialist is a circle. Identity is encoded by STROKE COLOUR (the agent's
// token); state is encoded separately — active adds an EMERALD glow + breathe.
// Two orthogonal encodings: colour = who, emerald = working. Presentation-only.
//
// Colour is always a Foundation TOKEN (var(--ig-agent-ps)), never the raw hex
// from agentDefs — the viz layer speaks tokens. Alpha blends use color-mix so a
// single token drives fill/stroke/text at different strengths.

import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { breathe } from '@/lib/motion/primitives';
import type { AgentNodeData } from '@/lib/execution/adapters/orchestration';

const SIZE = 56;

function AgentNodeImpl({ data, selected }: NodeProps<Node<AgentNodeData>>) {
  const { color, status, label, agentId } = data;
  const active = status === 'active';
  const done = status === 'done';

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

      {/* Emerald glow — state, not identity. Soft radial, only while alive. */}
      {active && (
        <div
          style={{
            position: 'absolute',
            inset: -14,
            borderRadius: '50%',
            background:
              'radial-gradient(closest-side, var(--ig-emerald-glow), transparent 72%)',
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
