'use client';

// src/components/office/LiveLogStream.tsx
// Mission 14 Phase 3 — Office Analytics (Stage A, standalone).
// Presentation layer only — same runtime.state.events data source the
// existing office/page.tsx FEED tab already reads (events are already
// newest-first, per RuntimeContext.tsx's `[ev, ...state.events]` reducers).
// This component introduces no new data source, just design-token styling
// in place of the FEED tab's raw inline hex.
//
// No Tailwind in this project — inline style objects + CSS custom
// properties, matching TopBar.tsx / desk component convention.

import type { RuntimeEvent } from '@/lib/RuntimeContext';

export interface LiveLogStreamProps {
  events:     RuntimeEvent[];
  /** Defaults to 20 most recent events. */
  maxItems?:  number;
  /** Optional — shows skeleton rows instead of real data while a fetch is in flight. */
  isLoading?: boolean;
}

const EVENT_COLOR: Record<string, string> = {
  ARTIFACT_IMPROVED:   'var(--accent-primary)',
  ARTIFACTS_STALE:     'var(--status-error)',
  ORCHESTRATION_STAGE: 'var(--text-secondary)',
};

function eventColor(type: string): string {
  return EVENT_COLOR[type] ?? 'var(--text-secondary)';
}

function summarizePayload(payload: Record<string, unknown>): string {
  const artifact = payload.artifact as string | undefined;
  if (artifact) return artifact.replace('.md','').replace(/^\d+-/,'').replace(/-/g,' ');
  if (payload.stage !== undefined) return `Stage ${String(payload.stage)}`;
  if (payload.model != null) return String(payload.model);
  return '';
}

const BASE_STYLE: React.CSSProperties = {
  display:'flex', flexDirection:'column', gap:'2px',
  fontFamily:"'JetBrains Mono','Fira Code',monospace",
};

export default function LiveLogStream({ events, maxItems = 20, isLoading = false }: LiveLogStreamProps) {
  if (isLoading) {
    return (
      <div style={BASE_STYLE}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{
            height:'28px', borderRadius:'var(--radius-sm)',
            background:'var(--surface-raised)', opacity: 0.5 - i * 0.05,
          }} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ ...BASE_STYLE, color:'var(--text-secondary)', fontSize:'var(--text-body)', padding:'8px 0' }}>
        Events appear here during a lifecycle run.
      </div>
    );
  }

  const recent = events.slice(0, maxItems);

  return (
    <div style={BASE_STYLE}>
      {recent.map((ev, i) => (
        <div key={ev.id ?? i} style={{
          display:'flex', alignItems:'baseline', gap:'8px',
          padding:'5px 6px', borderBottom:'1px solid var(--border-subtle)',
        }}>
          <span style={{ fontSize:'var(--text-caption)', color:'var(--text-tertiary)', flexShrink:0 }}>
            {new Date(ev.timestamp).toLocaleTimeString('en', { hour12:false })}
          </span>
          <span style={{ fontSize:'var(--text-label)', color: eventColor(ev.type), fontWeight:600, flexShrink:0 }}>
            {ev.type.replace(/_/g,' ')}
          </span>
          <span style={{
            fontSize:'var(--text-caption)', color:'var(--text-secondary)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1,
          }}>
            {summarizePayload(ev.payload)}
          </span>
        </div>
      ))}
    </div>
  );
}
