'use client';

// src/components/TopBar.tsx
// IdeaGate — Global TopBar
// Navigation: desk | improve | office  (left to right: reader → editor → watcher)
// Single settings entry point: ⚙ gear icon (rightmost, opens SettingsModal)
// No other settings surfaces exist anywhere else in the product.

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useRuntime } from '@/lib/RuntimeContext';
import { useGlobalStore } from '@/lib/GlobalStore';

// Lazy-load the settings modal — it's heavy, only load when opened
const SettingsModal = lazy(() => import('./SettingsModal'));

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

export default function TopBar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const runtime   = useRuntime();
  const { state:{ settings } } = useGlobalStore();

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

  // Nav: desk first (reader), improve second (editor), office last (watcher)
  const NAV = [
    { label: 'desk',    path: '/desk'    },
    { label: 'improve', path: '/improve' },
    { label: 'office',  path: '/office'  },
  ] as const;

  const activeNav = NAV.find(n => pathname.startsWith(n.path))?.label ?? 'desk';

  const navStyles = (label: string) => ({
    color:           label === activeNav ? (label==='desk'?'#818cf8':label==='improve'?'#4ade80':'#f59e0b') : '#334155',
    backgroundColor: label === activeNav ? (label==='desk'?'#0a0f1e':label==='improve'?'#0a1f0e':'#1a0f00') : 'transparent',
    outline:         label === activeNav ? `1px solid ${label==='desk'?'#818cf833':label==='improve'?'#4ade8033':'#f59e0b33'}` : '1px solid #1e293b',
    fontWeight:      label === activeNav ? 700 : 400,
  });

  const staleCount   = runtime.state.staleArtifacts.size;
  const improvements = runtime.state.improvementCount;
  const sessionCost  = runtime.state.sessionCost;

  return (
    <>
      <div style={{
        display:         'flex',
        alignItems:      'center',
        height:          '44px',
        padding:         '0 14px',
        gap:             '10px',
        backgroundColor: '#020c06',
        borderBottom:    '1px solid #0a1a2e',
        flexShrink:      0,
        ...MONO,
      }}>
        {/* Stage indicator + refresh */}
        <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
          <div style={{ fontSize:'12px', color:'#475569' }}>
            Stage{' '}
            <span style={{ color:'#4ade80', fontWeight:700 }}>{currentStage}</span>
            {' / '}
            <span style={{ color:'#334155' }}>14</span>
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
            border:'none', borderRadius:'3px',
            backgroundColor: isRunning ? '#0a1f0e' : '#4ade80',
            color:           isRunning ? '#4ade8066' : '#020609',
            flexShrink:0,
            opacity: (!idea.trim() || isRunning) ? 0.6 : 1,
            animation: isRunning ? 'topbar-pulse 1.5s infinite' : 'none',
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
              window.dispatchEvent(new Event('ideagate:clearArtifact'));
              window.dispatchEvent(new Event('ideagate:refresh'));
              setTimeout(() => router.push('/desk'), 50);
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.4)',
              padding: '4px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
              flexShrink: 0,
              ...MONO,
            }}
            title="Clear current run and start a new idea"
          >
            + New Idea
          </button>
        )}

        {/* Active run model indicator — shows which model the lifecycle will use */}
        {(() => {
          const label = settings.customModelId?.trim()
            ? settings.customModelId.split('/').pop() ?? settings.customModelId  // e.g. "claude-haiku-4-5"
            : settings.defaultModel;
          return (
            <div
              title={`Lifecycle will run using: ${settings.customModelId?.trim() || settings.defaultModel}. Change in Settings → AI Models.`}
              style={{ fontSize:'9px', color:'#334155', flexShrink:0, cursor:'help', ...MONO }}
            >
              {label.length > 14 ? label.slice(0, 14) + '…' : label}
            </div>
          );
        })()}

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

        {/* Navigation — desk | improve | office */}
        <div style={{ display:'flex', gap:'3px', flexShrink:0 }}>
          {NAV.map(({ label, path }) => (
            <button
              key={label}
              onClick={() => router.push(path)}
              style={{
                padding:'4px 11px', ...MONO, fontSize:'11px',
                cursor:'pointer', border:'none', borderRadius:'3px',
                letterSpacing:'0.04em',
                ...navStyles(label),
              }}
            >
              {label}
            </button>
          ))}
        </div>

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
            · Stage {currentStage}/14
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
