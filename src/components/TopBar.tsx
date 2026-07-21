'use client';

// src/components/TopBar.tsx
// IdeaGate — Global TopBar
// Navigation: desk | improve | office  (left to right: reader → editor → watcher)
// Single settings entry point: ⚙ gear icon (rightmost, opens SettingsModal)
// No other settings surfaces exist anywhere else in the product.

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useRuntime } from '@/lib/RuntimeContext';
import { useGlobalStore } from '@/lib/GlobalStore';
// DEPRECATED as of Mission 12B — TopBar now uses ModelSelector. ModelDropdown.tsx is
// kept for SettingsModal.tsx and office/page.tsx, which still reference it directly.
import { ModelSelector } from '@/components/ModelSelector';
import { resolveModelId } from '@/lib/model-registry';
import { STAGE_COUNT, stageDisplayNumber, formatStageDisplay } from '@/lib/execution/adapters/orchestration';
// Mission 14 Phase 1 — desk/improve/office tab navigation moved to NavRail.
// TopBar keeps the command surface (Run/Stop/New Idea/model) and now exposes
// a Cmd+K trigger instead of owning navigation.
import { useCommandPalette } from '@/components/shell/CommandPalette';
import { Command } from 'lucide-react';

// Lazy-load the settings modal — it's heavy, only load when opened
const SettingsModal = lazy(() => import('./SettingsModal'));

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

const STAGE_LABELS: Record<number, string> = {
  0: 'Idea Intake', 1: 'Discovery', 2: 'Problem Definition', 3: 'Solution Design',
  4: 'MVP Hypothesis', 5: 'Validation', 6: 'Prioritization', 7: 'PRD',
  8: 'UX Design', 9: 'Usability Planning', 10: 'Architecture',
  11: 'Backlog & Release', 12: 'Implementation', 13: 'QA & Readiness', 14: 'Prototype Prompt',
};

export default function TopBar() {
  const router    = useRouter();
  const runtime   = useRuntime();
  const { state:{ settings }, updateSettings } = useGlobalStore();
  const { open: openCommandPalette } = useCommandPalette();

  const [idea,          setIdea]          = useState('');
  const [currentStage,  setCurrentStage]  = useState(0);
  const [isRunning,     setIsRunning]     = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [artifactCount, setArtifactCount] = useState(0);
  const [runningIdea,   setRunningIdea]   = useState('');
  const [runError,      setRunError]      = useState('');

  // Poll project state — faster cadence while a lifecycle is actively running.
  // Uses /api/data (journey.json → currentStage + artifacts) and
  // /api/run GET (isRunning flag from the spawn guard) — not /api/generate.
  useEffect(() => {
    const refresh = () => {
      fetch('/api/data').then(r=>r.json()).then(d=>{
        setCurrentStage(d.currentStage ?? 0);
        setArtifactCount(Array.isArray(d.artifacts) ? d.artifacts.length : 0);
      }).catch(()=>{});
      fetch('/api/run').then(r=>r.json()).then(d=>{
        setIsRunning(d.isRunning ?? false);
        // Restore idea text after browser refresh — GET now returns it from .current-run.json
        if (d.isRunning && d.idea && !idea) setIdea(d.idea);
      }).catch(()=>{});
    };
    refresh();
    const id = setInterval(refresh, isRunning ? 2000 : 4000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Global ⌘K handler (keyboard-nav setting gates this)
  useEffect(() => {
    if (!settings.keyboardNavEnabled) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(v => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [settings.keyboardNavEnabled]);

  const handleRun = useCallback(async () => {
    if (!idea.trim() || isRunning) return;
    setIsRunning(true);
    setRunningIdea(idea.trim());
    setRunError('');
    runtime.emitEvent({ type: 'ORCHESTRATION_STARTED', payload: { idea: idea.trim() } });
    try {
      // POST to /api/run — spawns the V2 CLI coordinator as a background process.
      // Returns immediately with { started: true } or an error.
      // Running state is tracked by polling GET /api/run above.
      const res = await fetch('/api/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea:          idea.trim(),
          model:         settings.defaultModel,
          customModelId: settings.customModelId ?? '',
          openRouterKey: settings.openRouterApiKey ?? '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setRunError(data.error ?? `Failed to start lifecycle (HTTP ${res.status})`);
        setIsRunning(false);
      }
      // On success: CLI is now running in background. Polling (above) detects
      // when it finishes and sets isRunning = false automatically.
    } catch (err) {
      setRunError((err as Error).message || 'Network error — could not reach the server');
      setIsRunning(false);
    }
  }, [idea, isRunning, runtime, settings]);

  const handleStop = useCallback(async () => {
    try {
      await fetch('/api/run', { method: 'DELETE' });
    } catch { /* ignore network errors */ }
    setIsRunning(false);
    setRunError('Run stopped.');
  }, []);

  // Manual refresh — forces immediate data poll on all three tabs
  // TODO P-NEW-11: Refresh root cause requires improve/page.tsx and office/page.tsx — deferred Mission 14
  const handleRefresh = useCallback(() => {
    fetch('/api/data').then(r=>r.json()).then(d=>{
      setCurrentStage(d.currentStage ?? 0);
      setArtifactCount(Array.isArray(d.artifacts) ? d.artifacts.length : 0);
    }).catch(()=>{});
    fetch('/api/run').then(r=>r.json()).then(d=>{
      setIsRunning(d.isRunning ?? false);
    }).catch(()=>{});
    window.dispatchEvent(new Event('ideagate:refresh'));
  }, []);

  const staleCount   = runtime.state.staleArtifacts.size;
  const improvements = runtime.state.improvementCount;
  const sessionCost  = runtime.state.sessionCost;

  return (
    <>
      <div style={{
        display:         'flex',
        alignItems:      'center',
        height:          '44px',
        padding:         '0 var(--ig-space-4)',
        gap:             'var(--ig-space-2)',
        backgroundColor: '#020c06',
        borderBottom:    '1px solid #0a1a2e',
        flexShrink:      0,
        ...MONO,
      }}>
        {/* Stage indicator + refresh — Sprint 06 T1: stage text now wrapped in its
            own pill container so the "one radius scale" is visible at rest (it had
            no container at all before). No box-shadow here — T3's elevation list
            doesn't name the stage indicator, only the controls a user acts on. */}
        <div style={{ display:'flex', alignItems:'center', gap:'var(--ig-space-1)', flexShrink:0 }}>
          <div style={{
            fontSize:'12px', color:'#475569',
            padding:'4px 10px',
            backgroundColor:'#040b14',
            borderRadius:'var(--ig-radius-full)',
          }}>
            Stage{' '}
            <span style={{ color:'#4ade80', fontWeight:700 }}>{stageDisplayNumber(currentStage)}</span>
            {' / '}
            <span style={{ color:'#334155' }}>{STAGE_COUNT}</span>
          </div>
          {/* Refresh button — forces artifact list update on all pages */}
          <button
            onClick={handleRefresh}
            title="Refresh artifacts (reload from filesystem)"
            style={{
              width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'13px', cursor:'pointer', border:'1px solid #1e293b', borderRadius:'3px',
              backgroundColor:'transparent', color:'#334155', flexShrink:0, lineHeight:1,
              transition:'all 0.1s',
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='#4ade80';(e.currentTarget as HTMLElement).style.borderColor='#4ade8033';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='#334155';(e.currentTarget as HTMLElement).style.borderColor='#1e293b';}}
          >
            ↻
          </button>
        </div>

        <div style={{ width:'1px', height:'24px', backgroundColor:'#0a1a2e', flexShrink:0 }} />

        {/* Idea input */}
        <input
          value={idea}
          onChange={e => setIdea(e.target.value)}
          onKeyDown={e => e.key==='Enter' && handleRun()}
          placeholder="Enter idea to run lifecycle…"
          disabled={isRunning}
          style={{
            flex:1, minWidth:0, padding:'5px 10px', ...MONO,
            fontSize:'12px', color:'#64748b',
            backgroundColor:'#040b14', border:'1px solid #0f1923',
            borderRadius:'3px', outline:'none',
            boxShadow:'var(--ig-elev-1)',
          }}
        />

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={!idea.trim() || isRunning}
          title={`Run lifecycle with: ${settings.customModelId?.trim() || settings.defaultModel}`}
          style={{
            padding:'6px 16px', ...MONO, fontSize:'12px', fontWeight:700, letterSpacing:'0.06em',
            cursor: (!idea.trim() || isRunning) ? 'not-allowed' : 'pointer',
            border:'none', borderRadius:'var(--ig-radius-full)',
            backgroundColor: isRunning ? '#0a1f0e' : '#4ade80',
            color:           isRunning ? '#4ade8066' : '#020609',
            flexShrink:0,
            opacity: (!idea.trim() || isRunning) ? 0.6 : 1,
            animation: isRunning ? 'topbar-pulse 1.5s infinite' : 'none',
            boxShadow:'var(--ig-elev-1)',
          }}
        >
          {isRunning ? '⟳ Running…' : '▶ Run'}
        </button>

        {/* New Idea button — only visible after a run completes */}
        {!isRunning && artifactCount > 0 && (
          <button
            onClick={() => {
              setIdea('');
              setRunningIdea('');
              setRunError('');
              setCurrentStage(0);
              setArtifactCount(0);
              runtime.resetWorkspace();
              window.dispatchEvent(new Event('ideagate:clearArtifact'));
              window.dispatchEvent(new Event('ideagate:refresh'));
              setTimeout(() => router.push('/desk'), 50);
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.4)',
              padding: '4px 10px',
              borderRadius: 'var(--ig-radius-full)',
              cursor: 'pointer',
              fontSize: '11px',
              flexShrink: 0,
              ...MONO,
              boxShadow:'var(--ig-elev-1)',
            }}
            title="Clear current run and start a new idea"
          >
            + New Idea
          </button>
        )}

        {/* Model selector — Mission 12B: replaced inline text indicator with full ModelSelector */}
        <ModelSelector
          selectedModelId={resolveModelId(settings.defaultModel)}
          onSelectModel={(modelId) => updateSettings({ defaultModel: modelId })}
          disabled={isRunning}
        />

        {/* Runtime indicators */}
        {staleCount > 0 && (
          <div style={{ fontSize:'10px', color:'#f59e0b', padding:'2px 7px', border:'1px solid #f59e0b33', borderRadius:'2px', flexShrink:0 }}>
            △ {staleCount}
          </div>
        )}
        {improvements > 0 && (
          <div style={{ fontSize:'10px', color:'#4ade8077', flexShrink:0 }}>
            {improvements} improved
          </div>
        )}
        {sessionCost > 0 && (
          <div style={{ fontSize:'10px', color:'#818cf866', flexShrink:0 }}>
            ${sessionCost.toFixed(3)}
          </div>
        )}

        <div style={{ width:'1px', height:'24px', backgroundColor:'#0a1a2e', flexShrink:0 }} />

        {/* Cmd+K trigger — navigation moved to NavRail (Mission 14 Phase 1) */}
        <button
          onClick={openCommandPalette}
          title="Command palette (⌘K)"
          style={{
            display:'flex', alignItems:'center', gap:'4px',
            padding:'4px 9px', ...MONO, fontSize:'11px',
            cursor:'pointer', border:'1px solid #1e293b', borderRadius:'var(--ig-radius-full)',
            backgroundColor:'transparent', color:'#334155', flexShrink:0,
            transition:'all 0.1s',
          }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='#4ade80';(e.currentTarget as HTMLElement).style.borderColor='#4ade8033';}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='#334155';(e.currentTarget as HTMLElement).style.borderColor='#1e293b';}}
        >
          <Command size={12} strokeWidth={1.5} />
          <span>K</span>
        </button>

        <div style={{ width:'1px', height:'24px', backgroundColor:'#0a1a2e', flexShrink:0 }} />

        {/* Settings entry point — ONE gear icon, the only settings surface in the product */}
        <button
          onClick={() => setSettingsOpen(true)}
          title="Settings (⌘,)"
          style={{
            width:'32px', height:'32px',
            display:'flex', alignItems:'center', justifyContent:'center',
            ...MONO, fontSize:'14px', cursor:'pointer', border:'none', borderRadius:'3px',
            backgroundColor: settingsOpen ? '#0a1f0e' : 'transparent',
            color:            settingsOpen ? '#4ade80' : '#334155',
            outline:          settingsOpen ? '1px solid #4ade8033' : '1px solid #1e293b',
            flexShrink:0,
            transition:'all 0.1s',
          }}
        >
          ⚙
        </button>
      </div>

      {/* Global lifecycle running banner — appears on Desk, Improve, AND Office */}
      {isRunning && (
        <div style={{
          display:         'flex',
          alignItems:      'center',
          gap:             '10px',
          padding:         '6px 14px',
          backgroundColor: '#0a1f0e',
          borderBottom:    '1px solid #1a3a1e',
          ...MONO,
        }}>
          <span style={{
            width:'7px', height:'7px', borderRadius:'50%',
            backgroundColor:'#4ade80', flexShrink:0,
            animation:'topbar-pulse 1.2s infinite',
          }} />
          <span style={{ fontSize:'11px', color:'#4ade80', fontWeight:700, flexShrink:0 }}>
            ⟳ Generating
          </span>
          <span style={{ fontSize:'11px', color:'#4ade8088', flexShrink:0 }}>
            · Stage {formatStageDisplay(currentStage)} · {STAGE_LABELS[currentStage] ?? `Stage ${currentStage}`}
          </span>
          <span style={{ fontSize:'11px', color:'#4ade8088', flexShrink:0 }}>
            · {artifactCount} artifact{artifactCount === 1 ? '' : 's'} so far
          </span>
          {runningIdea && (
            <span style={{
              fontSize:'11px', color:'#4ade8055', flexShrink:1, minWidth:0,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              · "{runningIdea}"
            </span>
          )}
          <span style={{ fontSize:'10px', color:'#4ade8044', marginLeft:'auto', flexShrink:0 }}>
            this can take a minute or two on free models
          </span>
          <button
            onClick={handleStop}
            title="Stop lifecycle"
            style={{
              fontSize:'11px', color:'#f87171', cursor:'pointer', flexShrink:0,
              border:'1px solid #f8717144', borderRadius:'3px', padding:'2px 8px',
              background:'transparent', ...MONO,
            }}
          >
            ✕ Stop
          </button>
        </div>
      )}

      {/* Error banner — surfaces failures directly instead of failing silently */}
      {!isRunning && runError && (
        <div style={{
          display:         'flex',
          alignItems:      'center',
          gap:             '10px',
          padding:         '6px 14px',
          backgroundColor: '#1f0a0a',
          borderBottom:    '1px solid #3a1a1a',
          ...MONO,
        }}>
          <span style={{ fontSize:'11px', color:'#f87171', fontWeight:700, flexShrink:0 }}>
            ✕ Generation failed
          </span>
          <span style={{
            fontSize:'11px', color:'#f8717188', flexShrink:1, minWidth:0,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>
            {runError}
          </span>
          <button
            onClick={() => setRunError('')}
            style={{
              marginLeft:'auto', fontSize:'10px', color:'#f8717166', cursor:'pointer',
              border:'none', background:'transparent', flexShrink:0, ...MONO,
            }}
          >
            dismiss
          </button>
        </div>
      )}

      {/* Settings modal — rendered as overlay, not a separate route */}
      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal onClose={() => setSettingsOpen(false)} />
        </Suspense>
      )}

      <style>{`
        @keyframes topbar-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        input::placeholder { color: #334155; }
        button:disabled { opacity:.4; cursor:not-allowed!important; }
      `}</style>
    </>
  );
}
