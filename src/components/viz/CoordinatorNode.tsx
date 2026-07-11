'use client';

// Mission Control v1 — Batch M2 — CoordinatorNode.
// The Coordinator, and ONLY the Coordinator, is a hexagon. It is the single
// hexagon in the entire product — unmistakably not-a-circle from across the
// room. Presentation-only: it reads `status`, never a runtime field.
//
// XYFlow owns the node wrapper's transform (positioning). Framer Motion must
// never touch that transform, or it fights XYFlow and jitters. `breathe`
// animates an INNER element's scale only (spec §6).

import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { breathe } from '@/lib/motion/primitives';
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

  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      {/* XYFlow needs handles to route edges; kept invisible. */}
      <Handle type="target" position={Position.Top} style={HANDLE} />
      <Handle type="source" position={Position.Bottom} style={HANDLE} />

      {/* Soft radial glow — only while alive. A glow, not a hard ring. */}
      {active && (
        <div
          style={{
            position: 'absolute',
            inset: -18,
            borderRadius: '50%',
            background:
              'radial-gradient(closest-side, var(--ig-emerald-glow), transparent 72%)',
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
