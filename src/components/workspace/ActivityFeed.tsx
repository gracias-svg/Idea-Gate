'use client';

// src/components/workspace/ActivityFeed.tsx
// Sprint 07 (W6) — Workspace panel activity feed.
//
// Reads runtime.state.events read-only (RuntimeContext.tsx is the single
// source of truth and cross-tab sync — this component never dispatches).
// Newest first is already the array's own order (see RuntimeContext reducer:
// every case does `[ev, ...state.events]`), so no re-sort is needed here.

import React from 'react';
import { RuntimeEvent } from '@/lib/RuntimeContext';
import { humanName } from '@/lib/artifactDisplay';

function describeEvent(ev: RuntimeEvent): string {
  const p = ev.payload;
  const artifact = typeof p.artifact === 'string' ? humanName(p.artifact) : null;
  switch (ev.type) {
    case 'ARTIFACT_IMPROVED':
      return `${p.model ?? 'Model'} updated ${artifact ?? 'an artifact'}`;
    case 'ARTIFACTS_STALE': {
      const list = Array.isArray(p.artifacts) ? p.artifacts : [];
      const trigger = typeof p.triggeredBy === 'string' ? humanName(p.triggeredBy) : null;
      return trigger
        ? `${list.length} artifact${list.length === 1 ? '' : 's'} marked stale by ${trigger}`
        : `${list.length} artifact${list.length === 1 ? '' : 's'} marked stale`;
    }
    case 'ARTIFACT_VIEWED':
      return `${artifact ?? 'An artifact'} viewed`;
    case 'ORCHESTRATION_STARTED':
      return 'Lifecycle run started';
    case 'ORCHESTRATION_STAGE':
      return `Stage ${typeof p.stage === 'number' ? p.stage + 1 : '?'} reached`;
    case 'ORCHESTRATION_COMPLETE':
      return 'Lifecycle run complete';
    case 'MODEL_ROUTED':
      return `${p.model ?? 'Model'} routed to ${artifact ?? 'an artifact'}`;
    case 'AGENT_ACTIVATED':
      return `${p.agent ?? 'Agent'} activated`;
    case 'AGENT_COMPLETED':
      return `${p.agent ?? 'Agent'} completed`;
    case 'STALE_CLEARED':
      return `Stale cleared${typeof p.count === 'number' ? ` · ${p.count}` : ''}`;
    case 'SNAPSHOT_TAKEN':
      return 'Snapshot saved';
    default:
      return String(ev.type).replace(/_/g, ' ').toLowerCase();
  }
}

interface ActivityFeedProps {
  events: RuntimeEvent[];
  reducedMotion: boolean;
  maxRows?: number;
}

export default function ActivityFeed({ events, reducedMotion, maxRows = 6 }: ActivityFeedProps) {
  const rows = events.slice(0, maxRows);

  return (
    <div>
      <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 'var(--ig-t-label-size)', fontWeight: 600, letterSpacing: 'var(--ig-t-label-tracking)', textTransform: 'uppercase' as const, color: '#2a5a30', padding: '0 14px', marginBottom: '6px' }}>
        ACTIVITY
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '0 14px 10px', fontSize: '11px', color: '#1e293b', lineHeight: 1.6 }}>
          No activity yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map(ev => (
            <div
              key={ev.id}
              className={reducedMotion ? undefined : 'ig-ws-row-in'}
              style={{ padding: '4px 14px', display: 'flex', gap: '8px', alignItems: 'baseline' }}
            >
              <span style={{ fontSize: '11px', color: '#1a3a20', flexShrink: 0, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
                {new Date(ev.timestamp).toLocaleTimeString('en', { hour12: false })}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                {describeEvent(ev)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
