'use client';

// Mission Control v1 — Batch M2 — FlowEdge.
// This is where premium is won or lost. A dashed line that scrolls is a barber
// pole and reads as cheap decoration. Instead: a TRAVELLING PULSE — two paths
// sharing one `d`. A faint always-on "wire", and a single short dash that
// sweeps a long gap along it (CSS animation, spec §0). That reads as a discrete
// packet of work handed CO → agent.
//
// Idle edges must RECEDE (low opacity, thin, dashed) so the one active edge
// sings. If the idle edges are as loud as the active one, the graph looks dead.
// Presentation-only: the edge knows a `variant`, never a runtime field.

import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps, type Edge } from '@xyflow/react';
import type { FlowEdgeData } from '@/lib/execution/adapters/orchestration';

const CURVATURE = 0.4; // gentle arcs; the 0.25 default reads mechanical.

function FlowEdgeImpl({
  sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data,
}: EdgeProps<Edge<FlowEdgeData>>) {
  const [path] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
    curvature: CURVATURE,
  });

  const variant = data?.variant ?? 'waiting';

  if (variant === 'active') {
    return (
      <>
        {/* the wire — always visible under the pulse */}
        <BaseEdge
          path={path}
          style={{ stroke: 'var(--ig-emerald)', strokeWidth: 1.5, opacity: 0.22, fill: 'none' }}
        />
        {/* the pulse — one short segment travelling the wire */}
        <path
          className="mc-edge-pulse"
          d={path}
          fill="none"
          stroke="var(--ig-emerald-bright)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </>
    );
  }

  if (variant === 'blocked') {
    // Severed: a gap in the middle of the path. Grammar reserved; unused now.
    return (
      <path
        d={path}
        fill="none"
        stroke="var(--ig-danger)"
        strokeWidth={1.5}
        pathLength={100}
        strokeDasharray="42 16 42"
      />
    );
  }

  // waiting — recede.
  return (
    <BaseEdge
      path={path}
      style={{
        stroke: 'var(--ig-border-default)',
        strokeWidth: 1,
        opacity: 0.35,
        strokeDasharray: '3 5',
        fill: 'none',
      }}
    />
  );
}

export default memo(FlowEdgeImpl);
