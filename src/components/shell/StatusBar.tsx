'use client';

// src/components/shell/StatusBar.tsx
// Mission 14 Phase 1 — Global Shell.
//
// EP-3 (all displayed values trace to real sources): there is no single
// shared "runtimeState" for isRunning/currentStage in this codebase today —
// TopBar.tsx tracks it via local polling of GET /api/data and GET /api/run.
// StatusBar polls the same two endpoints directly (same source of truth,
// same cadence convention) rather than inventing a new store field.
// Model display resolves settings.defaultModel through the model registry,
// exactly as TopBar/SettingsModal do.

import { useEffect, useState } from 'react';
import { useGlobalStore } from '@/lib/GlobalStore';
import { getModelById, resolveModelId } from '@/lib/model-registry';
import { STAGE_COUNT, formatStageDisplay } from '@/lib/execution/adapters/orchestration';

type RunStatus = 'idle' | 'running' | 'done' | 'error';

export default function StatusBar() {
  const { state: { settings } } = useGlobalStore();

  const [currentStage, setCurrentStage] = useState<number | null>(null);
  const [isRunning,    setIsRunning]    = useState<boolean | null>(null);
  const [hasError,     setHasError]     = useState(false);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      fetch('/api/data')
        .then(r => r.json())
        .then(d => { if (!cancelled) setCurrentStage(d.currentStage ?? 0); })
        .catch(() => { if (!cancelled) setHasError(true); });

      fetch('/api/run')
        .then(r => r.json())
        .then(d => { if (!cancelled) { setIsRunning(d.isRunning ?? false); setHasError(false); } })
        .catch(() => { if (!cancelled) setHasError(true); });
    };

    poll();
    const id = setInterval(poll, isRunning ? 2000 : 4000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isRunning]);

  // Empty state — store/poll data not yet available on first paint.
  const dataReady = currentStage !== null && isRunning !== null;

  const status: RunStatus = hasError
    ? 'error'
    : !dataReady
      ? 'idle'
      : isRunning
        ? 'running'
        : (currentStage ?? 0) >= STAGE_COUNT - 1
          ? 'done'
          : 'idle';

  const statusLabel: Record<RunStatus, string> = {
    idle:    'Ready',
    running: `Running Stage ${currentStage ?? 0}`,
    done:    'Complete',
    error:   'Error',
  };

  const statusColor = status === 'error'
    ? 'var(--status-error)'
    : status === 'running'
      ? 'var(--accent-primary)'
      : 'var(--text-secondary)';

  const modelEntry = getModelById(resolveModelId(settings.defaultModel));
  const modelLabel = modelEntry?.displayName ?? '--';

  const stageProgress = dataReady && isRunning ? `Stage ${formatStageDisplay(currentStage ?? 0)}` : '';

  const barStyle: React.CSSProperties = {
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    background: 'var(--surface-base)',
    borderTop: '1px solid var(--border-default)',
    fontFamily: "'JetBrains Mono','Fira Code',monospace",
    fontSize: 'var(--text-caption)',
    color: 'var(--text-secondary)',
    flexShrink: 0,
  };

  return (
    <div style={barStyle}>
      {/* Left slot — run status */}
      <span style={{ color: statusColor }}>
        {dataReady ? statusLabel[status] : '--'}
      </span>

      {/* Center slot — active model */}
      <span style={{ color: 'var(--text-secondary)' }}>
        {modelLabel}
      </span>

      {/* Right slot — stage progress */}
      <span style={{ color: 'var(--text-secondary)', minWidth: '70px', textAlign: 'right' }}>
        {dataReady ? stageProgress : '--'}
      </span>
    </div>
  );
}
