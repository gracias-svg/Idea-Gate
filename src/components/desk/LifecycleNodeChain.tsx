'use client';

// src/components/desk/LifecycleNodeChain.tsx
// Mission 14 Phase 2 — Desk Command Center.
// Horizontal node chain rendering the lifecycle's stages, driven entirely by
// the `stages` prop (real journey.json shape — see StageData below). No
// hardcoded stage names/content; the only fixed number is TOTAL_STAGES,
// used purely to size the empty-state placeholder chain and to guarantee
// the chain never renders shorter than the current lifecycle length.
//
// This project has no Tailwind configured — styling uses inline style
// objects + CSS custom properties (globals.css), matching TopBar.tsx /
// NavRail.tsx convention.

import { useMemo } from 'react';
import { motion } from 'framer-motion';

// Real field names confirmed by reading a production journey.json
// (workspace/<run>/journey.json → stages["0"] etc.) — do not rename these
// to guessed alternatives.
export interface StageData {
  summary?:     string;
  output?:      string;
  decision?:    string;   // 'go' | 'iterate' | 'kill' | 'reshape' (free text in practice)
  reasoning?:   string;
  confidence?:  string;   // 'high' | 'medium' | 'low'
  conflicts?:   string;
  startedAt?:   string;
  completedAt?: string;
  durationMs?:  number;
  outputFile?:  string;
  artifacts?:   string[];
  // Not present in journey.json itself — callers that already resolve
  // staleness via RuntimeContext.isStale(artifactFile) may attach it here
  // so this component stays a pure prop consumer (no store access).
  isStale?:     boolean;
}

export interface LifecycleNodeChainProps {
  stages:        Record<string, StageData>;
  currentStage:  number | null;
  onSelectStage?: (id: string) => void;
  /** Optional — shows skeleton nodes instead of real data while a fetch is in flight. */
  isLoading?:    boolean;
}

// Current lifecycle length. Used only to size the placeholder/empty chain
// and as a floor for the rendered range — if a run ever produces more
// stages than this, the chain still renders every one of them.
const TOTAL_STAGES = 15;

type NodeStatus = 'pending' | 'current' | 'complete' | 'low-confidence';

function getNodeStatus(stageNum: number, data: StageData | undefined, currentStage: number | null): NodeStatus {
  if (!data) return 'pending';
  if (currentStage !== null && stageNum === currentStage && !data.completedAt) return 'current';
  if (data.confidence === 'low') return 'low-confidence';
  if (data.completedAt) return 'complete';
  return 'pending';
}

const DOT_COLOR: Record<NodeStatus, string> = {
  pending:         'var(--text-secondary)',
  current:         'var(--accent-primary)',
  complete:        'var(--accent-primary)',
  'low-confidence':'var(--status-error)',
};

export default function LifecycleNodeChain({
  stages, currentStage, onSelectStage, isLoading = false,
}: LifecycleNodeChainProps) {
  const stageIds = useMemo(() => {
    const keys = Object.keys(stages)
      .map(k => parseInt(k, 10))
      .filter(n => !Number.isNaN(n));
    const maxKey = keys.length ? Math.max(...keys) : -1;
    const upper = Math.max(TOTAL_STAGES - 1, maxKey);
    return Array.from({ length: upper + 1 }, (_, i) => String(i));
  }, [stages]);

  // Loading state — skeleton chain, same length as it would otherwise render.
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 4px' }}>
        {stageIds.map((id, i) => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', flex: i < stageIds.length - 1 ? 1 : undefined }}>
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%',
              background: 'var(--surface-raised)', opacity: 0.5 + (i % 3) * 0.1,
            }} />
            {i < stageIds.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)', margin: '0 4px' }} />
            )}
          </div>
        ))}
      </div>
    );
  }

  const isEmpty = Object.keys(stages).length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 4px' }}>
        {stageIds.map((id, i) => {
          const stageNum = parseInt(id, 10);
          const data = stages[id];
          const status = getNodeStatus(stageNum, data, currentStage);
          const isCurrent = status === 'current';
          const isLast = i === stageIds.length - 1;

          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', flex: isLast ? undefined : 1 }}>
              <button
                onClick={() => onSelectStage?.(id)}
                title={`Stage ${id}${data?.confidence ? ` · confidence: ${data.confidence}` : ''}`}
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  background: 'transparent', border: 'none', cursor: onSelectStage ? 'pointer' : 'default',
                  padding: '2px', flexShrink: 0,
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                }}
              >
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={isCurrent ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
                  style={{
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: DOT_COLOR[status],
                    boxShadow: data?.isStale ? '0 0 0 3px var(--border-strong)' : 'none',
                  }}
                />
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                  {id}
                </span>
              </button>

              {!isLast && (
                <div style={{ flex: 1, height: '1px', background: 'var(--border-default)', margin: '0 2px', marginBottom: '18px' }} />
              )}
            </div>
          );
        })}
      </div>

      {isEmpty && (
        <div style={{
          textAlign: 'center', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)',
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
        }}>
          Run an idea to begin
        </div>
      )}
    </div>
  );
}
