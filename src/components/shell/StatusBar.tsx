'use client';

// src/components/shell/StatusBar.tsx
// Mission 14 Phase 1 — Global Shell.
// Mission 8 S2 — SSE subscription for real-time stage updates.
//
// Architecture:
//   - Polling (existing): GET /api/data every 2-4s for currentStage.
//     GET /api/run every 2-4s for isRunning. These remain as the
//     fallback/recovery mechanism and for all state that SSE doesn't cover.
//   - SSE (new): EventSource to /api/stream when isRunning is true.
//     Updates currentStage and currentAgent in real-time from coordinator
//     log events. Closes cleanly on run_complete / run_stopped / unmount.
//
// The SSE subscription is ADDITIVE — it does not replace polling. If the
// SSE stream fails, polling continues to provide correct (slightly delayed)
// state. This preserves the existing behavior as a reliable fallback.
//
// The isRunning → true transition (detected by polling) is the SSE trigger.
// The SSE stream closes itself on run_complete; polling detects the final
// isRunning → false after the coordinator exits.

import { useEffect, useRef, useState } from 'react';
import { useGlobalStore } from '@/lib/GlobalStore';
import { getModelById, resolveModelId } from '@/lib/model-registry';
import { STAGE_COUNT, formatStageDisplay } from '@/lib/execution/adapters/orchestration';

type RunStatus = 'idle' | 'running' | 'done' | 'error';

// SSE event shapes (matches /api/stream/route.ts)
interface StreamEvent {
  type:    'connected' | 'stage_start' | 'agent_active' | 'stage_retry' | 'agent_error' | 'run_complete' | 'run_stopped' | 'error';
  stage?:  number;
  name?:   string;
  agent?:  string;
  message?: string;
}

export default function StatusBar() {
  const { state: { settings } } = useGlobalStore();

  const [currentStage,  setCurrentStage]  = useState<number | null>(null);
  const [isRunning,     setIsRunning]     = useState<boolean | null>(null);
  const [hasError,      setHasError]      = useState(false);
  // S2 — real-time agent name from SSE stream (shown while run is active)
  const [currentAgent,  setCurrentAgent]  = useState<string | null>(null);

  // Ref to the active EventSource so we can close it from multiple effects
  const esRef = useRef<EventSource | null>(null);

  // ── Existing polling ──────────────────────────────────────────────────────
  // Unchanged from pre-Mission-8 — SSE adds real-time updates on top;
  // polling provides recovery after page refresh and final state cleanup.
  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      fetch('/api/data')
        .then(r => r.json())
        .then(d => { if (!cancelled) setCurrentStage(d.currentStage ?? 0); })
        .catch(() => { if (!cancelled) setHasError(true); });

      fetch('/api/run')
        .then(r => r.json())
        .then(d => {
          if (!cancelled) {
            setIsRunning(d.isRunning ?? false);
            setHasError(false);
            // S3 — restore real-time state on page refresh from .current-run.json
            // fields written by the SSE route. Only applied when a run is active
            // so we don't overwrite the post-run idle display with stale values.
            if (d.isRunning) {
              if (d.currentStage != null) setCurrentStage(d.currentStage);
              if (d.currentAgent != null) setCurrentAgent(d.currentAgent);
            }
          }
        })
        .catch(() => { if (!cancelled) setHasError(true); });
    };

    poll();
    const id = setInterval(poll, isRunning ? 2000 : 4000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isRunning]);

  // ── S2 — SSE subscription ─────────────────────────────────────────────────
  // Open an EventSource when isRunning transitions to true.
  // Close it when isRunning transitions back to false, or when the stream
  // itself emits run_complete / run_stopped.
  useEffect(() => {
    // Only open SSE when we know the run is active.
    // isRunning === null means data not yet loaded — wait.
    if (!isRunning) {
      // Run ended or not started — close any existing stream
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      // Clear transient SSE-only state when run ends
      setCurrentAgent(null);
      return;
    }

    // Run is active — open EventSource if not already open
    if (esRef.current) return; // already open from a previous effect run

    const es = new EventSource('/api/stream');
    esRef.current = es;

    es.onmessage = (evt) => {
      let data: StreamEvent;
      try { data = JSON.parse(evt.data) as StreamEvent; }
      catch { return; }

      switch (data.type) {
        case 'stage_start':
          // Real-time stage update — faster than waiting for the next poll
          if (typeof data.stage === 'number') setCurrentStage(data.stage);
          setCurrentAgent(null); // agent will be announced on next event
          break;

        case 'agent_active':
          setCurrentAgent(data.agent ?? null);
          break;

        case 'stage_retry':
          // Stage is being re-run — keep currentStage as-is
          setCurrentAgent(null);
          break;

        case 'run_complete':
        case 'run_stopped':
          // Stream will close itself; we clear agent state here
          setCurrentAgent(null);
          es.close();
          esRef.current = null;
          break;

        case 'error':
          // Non-fatal: log to console, don't set hasError (that's for polling failures)
          console.warn('[StatusBar SSE] coordinator error:', data.message);
          break;

        case 'connected':
        case 'agent_error':
        default:
          break;
      }
    };

    es.onerror = () => {
      // Do NOT call es.close() here. The EventSource spec provides built-in
      // automatic reconnection (3 s retry) when a connection drops. Calling
      // close() disables that retry permanently. In development, Next.js hot-
      // reloads terminate open connections — without auto-reconnect the agent
      // name would vanish after the first file save and never recover.
      //
      // esRef.current intentionally left pointing to the reconnecting EventSource
      // so the `if (esRef.current) return` guard above prevents a duplicate.
      // When the run ends, the !isRunning branch closes it properly.
      //
      // Polling continues to provide currentStage during the 3 s retry window.
    };

    // Cleanup: close EventSource on effect teardown (component unmount,
    // or isRunning changing — the latter is handled by the 'if (!isRunning)'
    // branch above, but we close defensively here too).
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [isRunning]);

  // ── Derived display state ─────────────────────────────────────────────────
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

  // Agent suffix — shown while a run is active and we know which agent is working
  const agentSuffix = isRunning && currentAgent ? ` · ${currentAgent}` : '';

  const statusLabel: Record<RunStatus, string> = {
    idle:    'Ready',
    running: `Running Stage ${currentStage ?? 0}${agentSuffix}`,
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
      {/* Left slot — run status (includes real-time agent name via SSE) */}
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
