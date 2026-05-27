'use client';

// src/app/office/page.tsx
// Agent Office — Phaser simulation + Mission Control dashboard.
// Nav: office | improve | desk

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { LiveAgent, LogEntry, DashTab } from './types';

// ── Constants ─────────────────────────────────────────────────────────────────
const STAGE_LABELS: Record<number, string> = {
  0:'Idea Intake',    1:'Discovery',        2:'Problem Definition', 3:'Solution Design',
  4:'MVP Hypothesis', 5:'Validation',       6:'Prioritization',     7:'PRD',
  8:'UX Design',      9:'Usability',       10:'Architecture',      11:'Backlog',
 12:'Implementation', 13:'QA & Readiness', 14:'Prototype',
};

const AGENT_COLOR: Record<string, string> = {
  CO:'#22c55e', PS:'#a78bfa', RE:'#38bdf8', UX:'#f472b6', AR:'#fb923c', QA:'#fde047',
};
const STATUS_COLOR: Record<string, string> = {
  idle:'#475569', working:'#f59e0b', reviewing:'#818cf8', done:'#22c55e', blocked:'#f87171',
};

// ── Dynamic Phaser import (client-only) ───────────────────────────────────────
const PhaserGame = dynamic(() => import('./PhaserGame'), {
  ssr: false,
  loading: () => (
    <div style={{
      width:'100%', height:'100%', display:'flex', alignItems:'center',
      justifyContent:'center', backgroundColor:'#020609',
      fontFamily:'monospace', fontSize:'11px', color:'#1e3a2a',
    }}>
      ◈ initialising office simulation…
    </div>
  ),
});

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OfficePage() {
  const [agents,       setAgents]    = useState<LiveAgent[]>([]);
  const [currentStage, setStage]     = useState(0);
  const [artifacts,    setArtifacts] = useState<string[]>([]);
  const [isRunning,    setRunning]   = useState(false);
  const [logs,         setLogs]      = useState<LogEntry[]>([]);
  const [activeMsg,    setActiveMsg] = useState<{ agent: string; msg: string } | null>(null);
  const [dashTab,      setDashTab]   = useState<DashTab>('status');
  const prevRef = useRef<LiveAgent[]>([]);

  // ── Polling ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const [agRes, dtRes] = await Promise.all([fetch('/api/agents'), fetch('/api/data')]);
        const agData = await agRes.json();
        const dtData = await dtRes.json();

        if (agData.agents?.length) {
          agData.agents.forEach((a: LiveAgent) => {
            const prev = prevRef.current.find(p => p.name === a.name);
            if (prev && prev.status !== a.status) {
              setLogs(l => [{
                time:  new Date().toLocaleTimeString('en-US', { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' }),
                agent: a.name,
                msg:   `${a.role} → ${a.status}`,
                color: AGENT_COLOR[a.name] || '#64748b',
              }, ...l].slice(0, 10));
            }
            if (a.status === 'working' || a.status === 'reviewing') {
              setActiveMsg({ agent: `${a.name} (${a.role})`, msg: a.message || '…' });
            }
          });
          prevRef.current = agData.agents;
          setAgents(agData.agents);
          setRunning(agData.isRunning || false);
        }
        setStage(dtData.currentStage || 0);
        setArtifacts(dtData.artifacts || []);
      } catch { /* silent */ }
    };

    poll();
    const iv = setInterval(poll, 2500);
    return () => clearInterval(iv);
  }, []);

  const progress      = Math.round((currentStage / 14) * 100);
  const activeAgents  = agents.filter(a => a.status !== 'idle' && a.status !== 'done');
  const doneAgents    = agents.filter(a => a.status === 'done');
  const blockedAgents = agents.filter(a => a.status === 'blocked');

  const tabBtn = (tab: DashTab) => ({
    padding: '5px 10px', fontSize: '9px', fontFamily: 'inherit',
    border: 'none', cursor: 'pointer', letterSpacing: '0.08em',
    backgroundColor: dashTab === tab ? '#0a1f0e' : 'transparent',
    color:           dashTab === tab ? '#4ade80' : '#334155',
    borderBottom:    dashTab === tab ? '1px solid #4ade8044' : '1px solid transparent',
  } as const);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100vh',
      backgroundColor:'#020609', overflow:'hidden',
      fontFamily:"'JetBrains Mono','Fira Code',monospace",
    }}>

      {/* ── Header ── */}
      <div style={{
        display:'flex', alignItems:'center', padding:'0 16px',
        height:'54px', backgroundColor:'#020c06',
        borderBottom:'1px solid #0a2a14', flexShrink:0, gap:'10px',
      }}>
        {/* Logo */}
        <div style={{ display:'flex', flexDirection:'column', flexShrink:0 }}>
          <span style={{ fontSize:'13px', color:'#4ade80', fontWeight:700, letterSpacing:'0.15em' }}>
            AGENT OFFICE
          </span>
          <span style={{ fontSize:'8px', color:'#1a3a20', letterSpacing:'0.1em' }}>
            IDEA GATE HQ
          </span>
        </div>

        <div style={{ width:'1px', height:'30px', backgroundColor:'#0a2a14' }} />

        {/* Agent strip */}
        <div style={{ display:'flex', gap:'6px', flex:1, overflowX:'auto' }}>
          {agents.map(a => (
            <div key={a.name} style={{
              display:'flex', alignItems:'center', gap:'6px',
              padding:'4px 10px', borderRadius:'4px', flexShrink:0,
              backgroundColor:'#0a0f0e',
              border:`1px solid ${AGENT_COLOR[a.name] || '#1e293b'}22`,
            }}>
              <div style={{
                width:'26px', height:'26px', borderRadius:'3px',
                backgroundColor:`${AGENT_COLOR[a.name] || '#334155'}22`,
                border:`1px solid ${AGENT_COLOR[a.name] || '#334155'}44`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'10px', color:AGENT_COLOR[a.name] || '#64748b', fontWeight:700,
              }}>{a.name}</div>
              <div>
                <div style={{ fontSize:'9px', color:AGENT_COLOR[a.name] || '#94a3b8', fontWeight:700 }}>
                  {a.role.split(' ')[0]}
                </div>
                <div style={{
                  fontSize:'7px', color:STATUS_COLOR[a.status],
                  padding:'1px 5px', borderRadius:'2px', marginTop:'1px',
                  backgroundColor:`${STATUS_COLOR[a.status]}11`,
                  border:`1px solid ${STATUS_COLOR[a.status]}33`,
                }}>
                  ● {a.status.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <span style={{ fontSize:'9px', color:'#1e293b', alignSelf:'center' }}>
              No agents active — run an idea to initialise the lifecycle
            </span>
          )}
        </div>

        <div style={{ width:'1px', height:'30px', backgroundColor:'#0a2a14' }} />

        {/* Lifecycle bar */}
        <div style={{ display:'flex', flexDirection:'column', gap:'3px', minWidth:'180px' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:'8px', color:'#1a3a20', letterSpacing:'0.08em' }}>LIFECYCLE</span>
            <span style={{ fontSize:'8px', color:'#4ade80' }}>
              {currentStage}/14 · {STAGE_LABELS[currentStage]}
            </span>
          </div>
          <div style={{ height:'4px', backgroundColor:'#0a1509', borderRadius:'2px', overflow:'hidden' }}>
            <div style={{
              height:'100%', width:`${progress}%`,
              background:'linear-gradient(90deg,#1a3a20,#4ade80)',
              boxShadow:'0 0 6px #4ade8066', transition:'width 1s ease',
            }} />
          </div>
        </div>

        <div style={{ width:'1px', height:'30px', backgroundColor:'#0a2a14' }} />

        {/* Nav — office | improve | desk */}
        <div style={{ display:'flex', gap:'4px', flexShrink:0, alignItems:'center' }}>
          {isRunning && <span style={{ fontSize:'9px', color:'#f59e0b', marginRight:'6px' }}>⟳ RUNNING</span>}
          {(['/office', '/improve', '/desk'] as const).map(r => (
            <Link key={r} href={r} style={{
              padding:'4px 10px', fontSize:'9px', borderRadius:'2px',
              textDecoration:'none', fontFamily:'inherit', letterSpacing:'0.08em',
              border:          r === '/office' ? '1px solid #4ade8044' : '1px solid #1e293b',
              backgroundColor: r === '/office' ? '#0a1f0e'            : 'transparent',
              color:           r === '/office' ? '#4ade80'             : '#334155',
            }}>
              {r.replace('/', '').toUpperCase()}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Canvas */}
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          <PhaserGame agents={agents} currentStage={currentStage} />
        </div>

        {/* Mission Control */}
        <div style={{
          width:'240px', display:'flex', flexDirection:'column',
          borderLeft:'1px solid #0a2a14', backgroundColor:'#020c06', flexShrink:0,
        }}>
          {/* Tabs */}
          <div style={{ padding:'10px 12px 0', borderBottom:'1px solid #0a2a14', flexShrink:0 }}>
            <div style={{ fontSize:'9px', color:'#1a3a20', letterSpacing:'0.15em', marginBottom:'8px' }}>
              MISSION CONTROL
            </div>
            <div style={{ display:'flex' }}>
              {(['status','agents','feed','controls'] as DashTab[]).map(t => (
                <button key={t} onClick={() => setDashTab(t)} style={tabBtn(t)}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>

            {/* STATUS */}
            {dashTab === 'status' && (
              <>
                <div style={{ marginBottom:'10px' }}>
                  <div style={{ fontSize:'8px', color:'#1a3a20', letterSpacing:'0.1em', marginBottom:'5px' }}>
                    CURRENT OBJECTIVE
                  </div>
                  <div style={{ padding:'8px', backgroundColor:'#040f08', border:'1px solid #0a2a14', borderRadius:'3px' }}>
                    <div style={{ fontSize:'10px', color:'#4ade80', fontWeight:700, marginBottom:'3px' }}>
                      Stage {currentStage}: {STAGE_LABELS[currentStage]}
                    </div>
                    <div style={{ fontSize:'9px', color:'#334155' }}>
                      {activeMsg ? `${activeMsg.agent}: ${activeMsg.msg}` : 'Waiting for agent activity…'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize:'8px', color:'#1a3a20', letterSpacing:'0.1em', marginBottom:'5px' }}>SYSTEM STATUS</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px', marginBottom:'10px' }}>
                  {[
                    { label:'Active',   value:`${activeAgents.length}/${agents.length}`,  color:'#4ade80' },
                    { label:'Complete', value:`${doneAgents.length}/${agents.length}`,    color:'#818cf8' },
                    { label:'Blocked',  value:`${blockedAgents.length}`,                  color:'#f87171' },
                    { label:'Progress', value:`${progress}%`,                             color:'#f59e0b' },
                  ].map(kpi => (
                    <div key={kpi.label} style={{
                      padding:'7px', backgroundColor:'#040b14',
                      border:'1px solid #0f1923', borderRadius:'3px', textAlign:'center',
                    }}>
                      <div style={{ fontSize:'14px', color:kpi.color, fontWeight:700, lineHeight:1 }}>{kpi.value}</div>
                      <div style={{ fontSize:'7px', color:'#334155', marginTop:'3px' }}>{kpi.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:'8px', color:'#1a3a20', letterSpacing:'0.1em', marginBottom:'5px' }}>LIFECYCLE</div>
                <div style={{
                  height:'7px', backgroundColor:'#040b14', borderRadius:'3px',
                  overflow:'hidden', marginBottom:'3px', border:'1px solid #0f1923',
                }}>
                  <div style={{
                    height:'100%', width:`${progress}%`,
                    background:'linear-gradient(90deg,#1a3a20,#4ade80)',
                    boxShadow:'0 0 6px #4ade8044',
                  }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'7px', color:'#334155', marginBottom:'10px' }}>
                  <span>0</span><span>14</span>
                </div>

                <div style={{ fontSize:'8px', color:'#1a3a20', letterSpacing:'0.1em', marginBottom:'5px' }}>ARTIFACTS</div>
                <div style={{ padding:'7px', backgroundColor:'#040b14', border:'1px solid #0f1923', borderRadius:'3px', marginBottom:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'10px', color:'#818cf8' }}>◆ {artifacts.length} generated</span>
                    <span style={{ fontSize:'9px', color:'#334155' }}>{14 - artifacts.length} pending</span>
                  </div>
                  <div style={{ height:'2px', backgroundColor:'#0f1923', borderRadius:'1px', marginTop:'5px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(artifacts.length / 14) * 100}%`, backgroundColor:'#818cf8' }} />
                  </div>
                </div>

                <div style={{ padding:'7px', backgroundColor:'#040b14', border:'1px solid #0f1923', borderRadius:'3px' }}>
                  <div style={{ fontSize:'7px', color:'#334155', marginBottom:'2px' }}>NEXT STAGE</div>
                  <div style={{ fontSize:'10px', color:'#f59e0b' }}>
                    ▶ {STAGE_LABELS[currentStage + 1] || 'COMPLETE'}
                  </div>
                </div>
              </>
            )}

            {/* AGENTS */}
            {dashTab === 'agents' && agents.map(a => (
              <div key={a.name} style={{
                padding:'9px', marginBottom:'5px', backgroundColor:'#040b14',
                border:`1px solid ${AGENT_COLOR[a.name] || '#1e293b'}22`, borderRadius:'3px',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'3px' }}>
                  <span style={{ fontSize:'11px', color:AGENT_COLOR[a.name] || '#94a3b8', fontWeight:700 }}>{a.name}</span>
                  <span style={{
                    fontSize:'7px', color:STATUS_COLOR[a.status],
                    padding:'1px 5px', borderRadius:'2px',
                    border:`1px solid ${STATUS_COLOR[a.status]}33`,
                    backgroundColor:`${STATUS_COLOR[a.status]}11`,
                  }}>● {a.status}</span>
                </div>
                <div style={{ fontSize:'8px', color:'#475569', marginBottom:'2px' }}>{a.role}</div>
                <div style={{ fontSize:'8px', color:'#334155' }}>Stage {a.stage}</div>
                {(a.status === 'working' || a.status === 'reviewing') && (
                  <div style={{ marginTop:'5px', height:'2px', backgroundColor:'#0f1923', borderRadius:'1px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:'60%', background:`linear-gradient(90deg,transparent,${AGENT_COLOR[a.name] || '#4ade80'})` }} />
                  </div>
                )}
                {a.message && (
                  <div style={{ fontSize:'8px', color:`${AGENT_COLOR[a.name] || '#475569'}99`, marginTop:'3px', fontStyle:'italic' }}>
                    "{a.message}"
                  </div>
                )}
              </div>
            ))}
            {dashTab === 'agents' && agents.length === 0 && (
              <div style={{ fontSize:'9px', color:'#1e293b', lineHeight:1.7 }}>
                No agents active.<br />Run an idea to<br />initialise the lifecycle.
              </div>
            )}

            {/* FEED */}
            {dashTab === 'feed' && (
              <>
                <div style={{ fontSize:'8px', color:'#1a3a20', letterSpacing:'0.1em', marginBottom:'7px' }}>LIVE ACTIVITY</div>
                {logs.length === 0 ? (
                  <div style={{ fontSize:'9px', color:'#1e293b', lineHeight:1.7 }}>
                    No active message yet —<br />the next agent activation<br />will appear here.
                  </div>
                ) : logs.map((l, i) => (
                  <div key={i} style={{ padding:'5px 0', borderBottom:'1px solid #0a1520', display:'flex', gap:'7px' }}>
                    <span style={{ fontSize:'7px', color:'#1a3a20', flexShrink:0, marginTop:'1px' }}>{l.time}</span>
                    <div>
                      <span style={{ fontSize:'9px', color:l.color, fontWeight:700 }}>{l.agent}</span>
                      <div style={{ fontSize:'8px', color:'#334155' }}>{l.msg}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* CONTROLS */}
            {dashTab === 'controls' && (
              <>
                <div style={{ fontSize:'8px', color:'#1a3a20', letterSpacing:'0.1em', marginBottom:'7px' }}>NAVIGATION</div>
                {[
                  { label:'◈ Improve', href:'/improve', desc:'Artifact refinement + LLM improvement' },
                  { label:'⊞ Desk',    href:'/desk',    desc:'Artifact explorer and reader'         },
                ].map(ctrl => (
                  <Link key={ctrl.href} href={ctrl.href} style={{
                    display:'block', padding:'9px', marginBottom:'5px',
                    backgroundColor:'#040b14', border:'1px solid #0f1923',
                    borderRadius:'3px', textDecoration:'none',
                  }}>
                    <div style={{ fontSize:'10px', color:'#4ade80', marginBottom:'2px' }}>{ctrl.label}</div>
                    <div style={{ fontSize:'8px', color:'#334155' }}>{ctrl.desc}</div>
                  </Link>
                ))}
                <div style={{ marginTop:'10px', padding:'9px', backgroundColor:'#040b14', border:'1px solid #0f1923', borderRadius:'3px' }}>
                  <div style={{ fontSize:'8px', color:'#1a3a20', marginBottom:'6px' }}>KEYBOARD</div>
                  {[['⌘K','Jump to stage'],['← →','Navigate nodes'],['Esc','Close panel']].map(([k, v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'8px', marginBottom:'3px' }}>
                      <span style={{ color:'#4ade8066' }}>{k}</span>
                      <span style={{ color:'#334155' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding:'8px 12px', borderTop:'1px solid #0a2a14', flexShrink:0 }}>
            <div style={{ fontSize:'8px', color:'#1a3a20', marginBottom:'2px' }}>HQ STATUS</div>
            <div style={{ fontSize:'9px', color:'#4ade80', marginBottom:'2px' }}>
              ● {agents.filter(a => a.status !== 'idle').length}/{agents.length} ACTIVE
            </div>
            <div style={{ fontSize:'9px', color:'#818cf8', marginBottom:'2px' }}>◆ {artifacts.length} ARTIFACTS</div>
            <div style={{ fontSize:'9px', color:'#f59e0b' }}>▶ {STAGE_LABELS[currentStage + 1] || 'COMPLETE'}</div>
          </div>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1e293b; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
