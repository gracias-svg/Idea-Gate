'use client';

// src/app/office/page.tsx
// IdeaGate — Orchestration Surface
// Navigation is handled by TopBar only — no duplicate nav in this page.
// Mission Control redesigned: Coordinator is the centerpiece of STATUS tab.
// Agent data model extended for richer observability.

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRuntime, ARTIFACT_DEPS } from '@/lib/RuntimeContext';
import { useGlobalStore, getModelMeta, isModelFree } from '@/lib/GlobalStore';
import type { AgentData, OfficeSceneConfig } from '../../game/OfficeScene';
import OrchestrationGraph from '@/components/office/OrchestrationGraph';
import ExecutionSummary   from '@/components/office/ExecutionSummary';
import LiveLogStream      from '@/components/office/LiveLogStream';

const PhaserGame = dynamic(() => import('./PhaserGame'), { ssr: false });

// ── Stage metadata ────────────────────────────────────────────────────────────
const STAGE_LABEL: Record<number,string> = {
   0:'Idea Intake', 1:'Discovery', 2:'Problem Definition', 3:'Solution Design',
   4:'MVP Hypothesis', 5:'Validation', 6:'Prioritization', 7:'PRD',
   8:'UX Design', 9:'Usability', 10:'Architecture', 11:'Backlog & Release',
  12:'Implementation', 13:'QA & Readiness', 14:'Prototype Prompt',
};

const STAGE_AGENT: Record<number, string> = {
   0:'CO', 1:'PS', 2:'RE', 3:'UX', 4:'AR', 5:'QA', 6:'CO',
   7:'PS', 8:'UX', 9:'RE', 10:'AR', 11:'CO', 12:'PS', 13:'QA', 14:'AR',
};

const ALL_ARTIFACTS = Object.keys(ARTIFACT_DEPS);

const AGENT_DEFS = [
  {
    id:'CO', name:'Coordinator', fullName:'PM Coordinator',
    color:'#34d399', stages:[0,6,11], zone:'STRATEGY',
    role:'Lifecycle orchestration · quality gating · stage advancement',
    isCoordinator: true,
  },
  {
    id:'PS', name:'Product Strat', fullName:'Product Strategist',
    color:'#818cf8', stages:[1,7,12], zone:'STRATEGY',
    role:'Discovery · PRD · implementation planning',
    isCoordinator: false,
  },
  {
    id:'RE', name:'Researcher', fullName:'Research Lead',
    color:'#38bdf8', stages:[2,9], zone:'STRATEGY',
    role:'Problem definition · usability planning',
    isCoordinator: false,
  },
  {
    id:'UX', name:'UX Designer', fullName:'UX Designer',
    color:'#f472b6', stages:[3,8], zone:'EXECUTION',
    role:'Solution design · UX specification',
    isCoordinator: false,
  },
  {
    id:'AR', name:'Architect', fullName:'Principal Architect',
    color:'#fb923c', stages:[4,10,14], zone:'EXECUTION',
    role:'MVP hypothesis · architecture · prototype prompt',
    isCoordinator: false,
  },
  {
    id:'QA', name:'QA Engineer', fullName:'QA Engineer',
    color:'#c084fc', stages:[5,13], zone:'QA',
    role:'Validation strategy · QA readiness',
    isCoordinator: false,
  },
] as const;

type DashTab = 'STATUS' | 'AGENTS' | 'FEED' | 'CONTROLS';
type OfficeView = 'analytics' | 'agent-activity';

// ── Derive agent state from real runtime data ─────────────────────────────────
function deriveAgentState(agentId: string, artifacts: string[], runtime: ReturnType<typeof useRuntime>): 'idle'|'done'|'working'|'stale'|'blocked' {
  const def = AGENT_DEFS.find(a => a.id === agentId);
  if (!def) return 'idle';
  const ownedArts = ALL_ARTIFACTS.filter(art => def.stages.includes(parseInt(art.split('-')[0],10) as never));
  const isStale   = ownedArts.some(art => runtime.state.staleArtifacts.has(art));
  const hasImproved=ownedArts.some(art => (runtime.state.artifactVersions[art]??0) > 0);
  const hasArtifact=ownedArts.some(art => artifacts.some(f => f === art || f.startsWith(art.split('.')[0])));
  if (isStale)      return 'stale';
  if (hasImproved)  return 'working';
  if (hasArtifact)  return 'done';
  return 'idle';
}

const STATE_COLOR: Record<string, string> = {
  done:    '#4ade80',
  working: '#818cf8',
  stale:   '#f59e0b',
  blocked: '#f87171',
  idle:    '#94a3b8',
};
const STATE_LABEL: Record<string, string> = {
  done: 'DONE', working: 'WORKING', stale: 'STALE', blocked: 'BLOCKED', idle: 'IDLE',
};

// ── Lifecycle graph SVG (bottom bar) ──────────────────────────────────────────
function LifecycleStrip({
  currentStage, versions, stale,
}: { currentStage:number; versions:Record<string,number>; stale:Set<string> }) {
  const stages = Array.from({length:15},(_,i)=>i);
  return (
    <svg viewBox="0 0 840 36" style={{width:'100%',height:'36px',overflow:'visible'}}>
      {stages.map(i=>{
        const art = ALL_ARTIFACTS.find(a=>parseInt(a.split('-')[0],10)===i);
        const isStale = art?stale.has(art):false;
        const ver     = art?(versions[art]??0):0;
        const active  = i===currentStage;
        const done    = i<currentStage;
        const x = i*(840/15)+(840/30);
        const col = isStale?'#f59e0b':ver>0?'#4ade80':done?'#22c55e55':active?'#818cf8':'#1e293b';
        return (
          <g key={i}>
            {i>0&&<line x1={x-840/15} y1={18} x2={x} y2={18} stroke="#1e293b" strokeWidth={1}/>}
            <circle cx={x} cy={18} r={active?7:5} fill={col} stroke={active?'#818cf8':'transparent'} strokeWidth={2}/>
            {ver>0&&<text x={x} y={8} fontSize="7" fill="#4ade8088" textAnchor="middle">v{ver}</text>}
            <text x={x} y={30} fontSize="6" fill={isStale?'#f59e0b':active?'#818cf8':done?'#94a3b8':'#1e293b'} textAnchor="middle">
              {STAGE_LABEL[i]?.split(' ')[0]?.slice(0,5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Coordinator station component (STATUS tab centerpiece) ────────────────────
function CoordinatorStation({
  currentStage, events, improvements, staleCount,
}: {
  currentStage:number; events: ReturnType<typeof useRuntime>['state']['events'];
  improvements:number; staleCount:number;
}) {
  const MONO: React.CSSProperties = {fontFamily:"'JetBrains Mono','Fira Code',monospace"};
  const agentId = STAGE_AGENT[currentStage] ?? 'CO';
  const agentColor = AGENT_DEFS.find(a=>a.id===agentId)?.color ?? '#4ade80';

  // Coordinator events from feed
  const coordEvents = events.filter(e =>
    e.type === 'ORCHESTRATION_STAGE' ||
    e.type === 'ORCHESTRATION_COMPLETE' ||
    e.type === 'ORCHESTRATION_STARTED'
  ).slice(0,3);

  return (
    <div style={{padding:'10px',backgroundColor:'#040b14',border:'1px solid #4ade8033',borderRadius:'4px',marginBottom:'10px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'8px'}}>
        <div style={{width:'8px',height:'8px',borderRadius:'2px',backgroundColor:'#4ade80'}}/>
        <div style={{fontSize:'12px',color:'#4ade80',fontWeight:700,letterSpacing:'0.1em'}}>COORDINATOR · CO</div>
        <div style={{flex:1}}/>
        <div style={{fontSize:'13px',color:'#4ade80',padding:'1px 6px',border:'1px solid #4ade8033',borderRadius:'2px'}}>ACTIVE</div>
      </div>

      <div style={{fontSize:'13px',color:'#818cf8',fontWeight:700,marginBottom:'4px',...MONO}}>
        Stage {currentStage}: {STAGE_LABEL[currentStage] ?? 'Complete'}
      </div>
      <div style={{fontSize:'12px',color:'#94a3b8',marginBottom:'8px'}}>
        Active agent: <span style={{color:agentColor}}>{agentId}</span>
        {currentStage >= 14 && <span style={{color:'#4ade80',marginLeft:'8px'}}>· Lifecycle complete</span>}
      </div>

      {/* Coordinator decision log */}
      <div style={{fontSize:'13px',color:'#2a5a30',letterSpacing:'0.08em',fontWeight:700,marginBottom:'5px'}}>LAST DECISIONS</div>
      {coordEvents.length > 0 ? coordEvents.map((ev,i)=>(
        <div key={ev.id??i} style={{fontSize:'13px',color:'#94a3b8',padding:'3px 0',borderBottom:'1px solid #060e09',display:'flex',gap:'7px'}}>
          <span style={{color:'#1a3a20'}}>{new Date(ev.timestamp).toLocaleTimeString('en',{hour12:false})}</span>
          <span style={{color:'#94a3b8'}}>{ev.type.replace(/_/g,' ')}</span>
          {ev.payload.stage!==undefined && <span style={{color:'#4ade8066'}}>→ Stage {String(ev.payload.stage)}</span>}
        </div>
      )) : (
        <div style={{fontSize:'13px',color:'#1e293b'}}>
          {currentStage >= 14
            ? '✓ All 14 stages complete · lifecycle cycle closed'
            : 'No coordinator events this session — run a lifecycle to see decisions'}
        </div>
      )}

      {/* Parse bug notice */}
      <div style={{marginTop:'8px',padding:'6px 8px',backgroundColor:'#0a0800',border:'1px solid #f59e0b22',borderRadius:'3px',fontSize:'13px',color:'#f59e0b88',lineHeight:1.5}}>
        ⚠ V3.2 FIX PENDING: Coordinator currently advances without quality signal (stages 1-14 parse bug). Decision log will become meaningful after tool_use migration.
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OfficePage() {
  const runtime = useRuntime();
  const { state:{ settings } } = useGlobalStore();
  const MONO: React.CSSProperties = {fontFamily:"'JetBrains Mono','Fira Code',monospace"};

  const [artifacts,    setArtifacts]    = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [activeTab,    setActiveTab]    = useState<DashTab>('STATUS');
  const [phaserConfig, setPhaserConfig] = useState<OfficeSceneConfig>({ agents: [] });
  const [officeView, setOfficeView] = useState<OfficeView>('analytics');
  const [journeyState, setJourneyState] = useState<{
    currentStage: number;
    stages: Record<string, any>;
    agentsByStage: Record<string, string[]>;
  }>({ currentStage: 0, stages: {}, agentsByStage: {} });
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const refresh = () => {
      fetch('/api/data').then(r=>r.json()).then(d=>{
        setArtifacts(d.artifacts??[]);
        setCurrentStage(d.currentStage??0);
      }).catch(()=>{});
    };
    refresh();
    const id = setInterval(refresh, 4000);
    return ()=>clearInterval(id);
  },[]);

  // Build Phaser agent config from real runtime data
  useEffect(()=>{
    const agents: AgentData[] = AGENT_DEFS.map(def => ({
      id:    def.id,
      name:  def.name,
      color: def.color,
      state: deriveAgentState(def.id, artifacts, runtime),
      stale: def.stages.some(s => {
        const art = ALL_ARTIFACTS.find(a=>parseInt(a.split('-')[0],10)===s);
        return art ? runtime.state.staleArtifacts.has(art) : false;
      }),
    }));
    setPhaserConfig({ agents });
  },[artifacts, runtime.state.staleArtifacts, runtime.state.artifactVersions]);

  // Auto-scroll event log
  useEffect(()=>{
    logEndRef.current?.scrollIntoView({ behavior:'smooth' });
  },[runtime.state.events.length]);

  // Journey-state polling (Mission 14 Phase 3 — Office Analytics)
  useEffect(()=>{
    const load = () => fetch('/api/journey-state').then(r=>r.json())
      .then(d => setJourneyState({ currentStage:d.currentStage??0, stages:d.stages??{},
                                   agentsByStage:d.agentsByStage??{} }))
      .catch(()=>{});
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  },[]);

  const staleCount    = runtime.state.staleArtifacts.size;
  const improvements  = runtime.state.improvementCount;
  const sessionTokens = runtime.state.sessionTokens;
  const sessionCost   = runtime.state.sessionCost;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',backgroundColor:'var(--ig-canvas)',overflow:'hidden',...MONO,color:'#94a3b8'}}>
      <style>{`
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      `}</style>

      {/* ── Agent operations strip (page-specific header, NOT nav) ── */}
      <div style={{display:'flex',alignItems:'center',padding:'0 14px',height:'44px',backgroundColor:'#020c06',borderBottom:'1px solid #0a1a2e',flexShrink:0,gap:'10px'}}>
        <div style={{fontSize:'13px',color:'#4ade80',fontWeight:700,letterSpacing:'0.12em'}}>AGENT OFFICE</div>
        <div style={{fontSize:'13px',color:'#1a3a20',letterSpacing:'0.06em'}}>IDEAGATE MOS</div>
        <div style={{width:'1px',height:'24px',backgroundColor:'#0a1a2e'}}/>

        {/* Agent health chips — derived from real data */}
        {AGENT_DEFS.map(def => {
          const state = deriveAgentState(def.id, artifacts, runtime);
          const col   = STATE_COLOR[state];
          return (
            <div key={def.id} title={`${def.fullName} — ${def.role}`}
              style={{display:'flex',alignItems:'center',gap:'5px',padding:'3px 8px',backgroundColor:'#040b14',border:`1px solid ${col}33`,borderRadius:'3px',cursor:'default'}}>
              <div style={{width:'5px',height:'5px',borderRadius:'50%',backgroundColor:col,
                ...(state==='stale'?{animation:'blink 2s infinite'}:state==='working'?{animation:'pulse 1.5s infinite'}:{})}}/>
              <span style={{fontSize:'12px',color:col,fontWeight:700}}>{def.id}</span>
              <span style={{fontSize:'13px',color:'#94a3b8'}}>{def.name}</span>
              <span style={{fontSize:'8px',color:`${col}88`,marginLeft:'2px'}}>● {STATE_LABEL[state]}</span>
            </div>
          );
        })}

        <div style={{flex:1}}/>

        {/* Compact runtime telemetry */}
        <div style={{display:'flex',gap:'10px',fontSize:'12px',color:'#94a3b8'}}>
          {improvements>0 && <span><span style={{color:'#4ade80',fontWeight:700}}>{improvements}</span> improved</span>}
          {staleCount>0   && <span style={{animation:'blink 2s infinite'}}><span style={{color:'#f59e0b',fontWeight:700}}>{staleCount}</span> stale</span>}
          {sessionTokens>0&& <span><span style={{color:'#818cf8'}}>{sessionTokens.toLocaleString()}</span>t · <span style={{color:'#4ade80'}}>${sessionCost.toFixed(3)}</span></span>}
        </div>

        {/* Analytics / Agent Activity view toggle — persistent in header strip */}
        <div style={{display:'flex', gap:'2px', marginRight:'8px'}}>
          {(['analytics','agent-activity'] as OfficeView[]).map(v => (
            <button key={v} onClick={()=>setOfficeView(v)}
              style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",
                      fontSize:'9px', letterSpacing:'0.06em', textTransform:'uppercase',
                      padding:'3px 8px', border:'none', borderRadius:'2px',
                      cursor:'pointer',
                      background: officeView===v ? '#0a1f0e' : 'transparent',
                      color: officeView===v ? '#4ade80' : '#94a3b8',
                      outline: officeView===v ? '1px solid #4ade8033' : 'none'}}>
              {v === 'analytics' ? 'Analytics' : 'Agent Activity'}
            </button>
          ))}
        </div>

        {/* LIFECYCLE indicator (compact, far right of strip) */}
        <div style={{fontSize:'12px',color:'#94a3b8',padding:'3px 8px',border:'1px solid #1e293b',borderRadius:'2px'}}>
          {currentStage}/14 · {currentStage >= 14 ? <span style={{color:'#4ade80'}}>COMPLETE</span> : <span style={{color:'#818cf8'}}>RUNNING</span>}
        </div>
      </div>

      {/* ── Analytics view (Mission 14 Phase 3 — Office Analytics) ── */}
      <div style={{display: officeView==='analytics' ? 'flex' : 'none',
                   flex:1, flexDirection:'column', overflow:'hidden',
                   backgroundColor:'#020c06'}}>
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden',
                     padding:'16px', gap:'12px'}}>
          <div style={{display:'flex', gap:'12px', flex:'0 0 auto'}}>
            <div style={{flex:2}}>
              <OrchestrationGraph
                agents={AGENT_DEFS as any}
                stages={journeyState.stages}
                currentStage={journeyState.currentStage}
                agentsByStage={journeyState.agentsByStage}
              />
            </div>
            <div style={{flex:1}}>
              <ExecutionSummary
                stages={journeyState.stages}
                currentStage={journeyState.currentStage}
              />
            </div>
          </div>
          <div style={{flex:1, overflow:'hidden'}}>
            <LiveLogStream events={runtime.state.events} maxItems={20} />
          </div>
        </div>
      </div>

      {/* ── Main: canvas + mission control ── */}
      <div style={{display: officeView==='agent-activity' ? 'flex' : 'none',
                   flex:1, flexDirection:'column', overflow:'hidden'}}>
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Phaser canvas */}
        <div style={{flex:1,position:'relative',overflow:'hidden'}}>
          <PhaserGame agents={phaserConfig.agents} currentStage={currentStage}/>

          {/* Bottom lifecycle overlay */}
          <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'6px 16px',backgroundColor:'#020c0699',backdropFilter:'blur(2px)',borderTop:'1px solid #0a1a2e'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
              <span style={{fontSize:'13px',color:'#2a5a30',letterSpacing:'0.1em',fontWeight:700}}>LIFECYCLE · {currentStage}/14 · {STAGE_LABEL[currentStage]}</span>
              <span style={{fontSize:'13px',color:'#94a3b8'}}>{artifacts.length} artifacts generated</span>
            </div>
            <LifecycleStrip
              currentStage={currentStage}
              versions={runtime.state.artifactVersions}
              stale={runtime.state.staleArtifacts}
            />
          </div>
        </div>

        {/* ── Mission Control panel ── */}
        <div style={{width:'295px',flexShrink:0,borderLeft:'1px solid #0a1a2e',display:'flex',flexDirection:'column',backgroundColor:'#020c06'}}>
          <div style={{padding:'10px 12px 0',borderBottom:'1px solid #0a1a2e',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <div style={{fontSize:'12px',color:'#2a5a30',letterSpacing:'0.12em',fontWeight:700}}>MISSION CONTROL</div>
              {/* Inline model display using component-level settings */}
              {(()=>{
                const key = settings.defaultModel;
                const meta = getModelMeta(key);
                const isFree = isModelFree(key);
                return (
                  <div style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'10px',color:'#94a3b8'}}>
                    <div style={{width:'5px',height:'5px',borderRadius:'50%',backgroundColor:isFree?'#84cc16':'#4ade80',flexShrink:0}}/>
                    <span style={{...MONO}}>{meta?.label ?? key}</span>
                    {isFree && <span style={{fontSize:'7px',color:'#4ade80',fontWeight:700}}>FREE</span>}
                  </div>
                );
              })()}
            </div>
            <div style={{display:'flex',gap:'0'}}>
              {(['STATUS','AGENTS','FEED','CONTROLS'] as DashTab[]).map(tab=>(
                <button key={tab} onClick={()=>setActiveTab(tab)}
                  style={{padding:'5px 8px',fontSize:'13px',borderRadius:0,border:'none',cursor:'pointer',...MONO,
                    backgroundColor:'transparent',
                    color:activeTab===tab?'#4ade80':'#94a3b8',
                    borderBottom:activeTab===tab?'1px solid #4ade80':'1px solid #1e293b',
                    letterSpacing:'0.06em'}}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>

            {/* ── STATUS TAB ── */}
            {activeTab==='STATUS'&&(
              <div>
                {/* Coordinator station — always at top of STATUS */}
                <CoordinatorStation
                  currentStage={currentStage}
                  events={runtime.state.events}
                  improvements={improvements}
                  staleCount={staleCount}
                />

                {/* System health grid */}
                <div style={{fontSize:'12px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'7px',fontWeight:700}}>SYSTEM HEALTH</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'12px'}}>
                  {[
                    {l:'Active',  v:'0/6',             c:'#94a3b8'},
                    {l:'Complete',v:'6/6',             c:'#4ade80'},
                    {l:'Stale',  v:String(staleCount), c:staleCount>0?'#f59e0b':'#94a3b8'},
                    {l:'Progress',v:currentStage>=14?'100%':`${Math.round((currentStage/14)*100)}%`, c:'#4ade80'},
                  ].map(x=>(
                    <div key={x.l} style={{padding:'7px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'3px',textAlign:'center' as const}}>
                      <div style={{fontSize:'17px',color:x.c,fontWeight:700,...MONO}}>{x.v}</div>
                      <div style={{fontSize:'8px',color:'#94a3b8',marginTop:'2px'}}>{x.l}</div>
                    </div>
                  ))}
                </div>

                {/* Lifecycle progress bar */}
                <div style={{fontSize:'13px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'5px',fontWeight:700}}>LIFECYCLE</div>
                <div style={{height:'5px',backgroundColor:'#0a1a2e',borderRadius:'3px',marginBottom:'10px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.min(100,(currentStage/14)*100)}%`,backgroundColor:'#4ade80',borderRadius:'3px',transition:'width 0.5s'}}/>
                </div>

                {/* Artifacts */}
                <div style={{fontSize:'13px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'5px',fontWeight:700}}>ARTIFACTS</div>
                <div style={{padding:'6px 8px',backgroundColor:'#040b14',border:'1px solid #4ade8022',borderRadius:'3px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'13px',color:'#4ade80',fontWeight:700}}>{artifacts.length} generated</span>
                  {improvements>0&&<span style={{fontSize:'13px',color:'#818cf8'}}>{improvements} improved</span>}
                </div>

                {/* Session telemetry */}
                {sessionTokens>0&&(
                  <>
                    <div style={{fontSize:'13px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'5px',fontWeight:700}}>SESSION TELEMETRY</div>
                    <div style={{padding:'8px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'3px',fontSize:'12px',lineHeight:1.9}}>
                      <div>Tokens: <span style={{color:'#818cf8'}}>{sessionTokens.toLocaleString()}</span></div>
                      <div>Cost: <span style={{color:'#4ade80'}}>${sessionCost.toFixed(4)}</span></div>
                      <div>Improvements: <span style={{color:'#4ade80'}}>{improvements}</span></div>
                      <div>Stale nodes: <span style={{color:staleCount>0?'#f59e0b':'#94a3b8'}}>{staleCount}</span></div>
                    </div>
                  </>
                )}

                {/* Overall status */}
                <div style={{marginTop:'10px',padding:'7px 8px',backgroundColor:'#040b14',border:'1px solid #4ade8022',borderRadius:'3px'}}>
                  <div style={{fontSize:'12px',color:'#4ade80',fontWeight:700}}>
                    ► {currentStage>=14?'LIFECYCLE COMPLETE':'ORCHESTRATION ACTIVE'}
                  </div>
                  {staleCount>0&&<div style={{fontSize:'13px',color:'#f59e0b',marginTop:'2px',animation:'blink 2s infinite'}}>△ {staleCount} artifact{staleCount>1?'s':''} stale — review in DESK or REFINE</div>}
                  {improvements>0&&<div style={{fontSize:'13px',color:'#818cf8',marginTop:'2px'}}>◈ {improvements} improvement{improvements>1?'s':''} — BroadcastChannel active</div>}
                </div>
              </div>
            )}

            {/* ── AGENTS TAB ── */}
            {activeTab==='AGENTS'&&(
              <div>
                {AGENT_DEFS.map(def => {
                  const state   = deriveAgentState(def.id, artifacts, runtime);
                  const col     = STATE_COLOR[state];
                  const ownedArts = ALL_ARTIFACTS.filter(a => def.stages.includes(parseInt(a.split('-')[0],10) as never));
                  const improved  = ownedArts.filter(a => (runtime.state.artifactVersions[a]??0)>0);
                  const stale     = ownedArts.filter(a => runtime.state.staleArtifacts.has(a));
                  const reasoning = ownedArts.flatMap(a => runtime.getReasoningFor(a)).slice(0,1)[0];

                  return (
                    <div key={def.id} style={{marginBottom:'8px',padding:'9px',backgroundColor:'#040b14',border:`1px solid ${col}22`,borderRadius:'4px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'5px'}}>
                        <div style={{width:'7px',height:'7px',borderRadius:'50%',backgroundColor:col,flexShrink:0,
                          ...(state==='stale'?{animation:'blink 2s infinite'}:state==='working'?{animation:'pulse 1.5s infinite'}:{})}}/>
                        <div style={{flex:1}}>
                          <span style={{fontSize:'13px',color:col,fontWeight:700}}>{def.id}</span>
                          <span style={{fontSize:'13px',color:'#94a3b8',marginLeft:'6px'}}>{def.fullName}</span>
                        </div>
                        <span style={{fontSize:'8px',color:`${col}99`,padding:'2px 5px',border:`1px solid ${col}33`,borderRadius:'2px'}}>{STATE_LABEL[state]}</span>
                      </div>

                      {/* Role description */}
                      <div style={{fontSize:'13px',color:'#94a3b8',marginBottom:'5px',lineHeight:1.5}}>{def.role}</div>

                      {/* Stage ownership */}
                      <div style={{fontSize:'13px',color:'#1e293b',marginBottom:'4px'}}>
                        Stages: {def.stages.join(', ')} · Zone: {def.zone}
                      </div>

                      {/* Artifact status */}
                      <div style={{display:'flex',gap:'8px',fontSize:'13px',marginBottom:'4px'}}>
                        {improved.length>0&&<span style={{color:'#4ade8066'}}>{improved.length} improved</span>}
                        {stale.length>0&&<span style={{color:'#f59e0b88'}}>{stale.length} stale</span>}
                        <span style={{color:'#1e293b'}}>{ownedArts.length} owned artifacts</span>
                      </div>

                      {/* Reasoning snippet */}
                      {reasoning&&(
                        <div style={{marginTop:'5px',padding:'5px 7px',backgroundColor:'#020c06',border:'1px solid #4ade8011',borderRadius:'3px',fontSize:'8px',color:'#4ade8077',lineHeight:1.5}}>
                          {reasoning.reasoning.slice(0,90)}…
                        </div>
                      )}

                      {/* Future: execution trace note */}
                      {!reasoning&&(
                        <div style={{marginTop:'4px',fontSize:'8px',color:'#1e293b'}}>
                          Execution trace available in V3.2 (requires tool_use migration)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── FEED TAB ── */}
            {activeTab==='FEED'&&(
              <div>
                <div style={{fontSize:'13px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'7px',fontWeight:700}}>
                  RUNTIME EVENT FEED · {runtime.state.events.length} events
                  <span style={{color:'#1e293b',fontWeight:400,marginLeft:'6px'}}>BroadcastChannel</span>
                </div>

                {runtime.state.events.length===0&&(
                  <div style={{fontSize:'12px',color:'#1e293b',lineHeight:1.7,padding:'6px 0'}}>
                    No events yet.<br/>
                    Improve an artifact in the REFINE view.<br/>
                    Events appear here in real-time — open REFINE in another tab.
                  </div>
                )}

                {runtime.state.events.map((ev,i)=>{
                  const art = ev.payload.artifact as string ?? '';
                  const artLabel = art ? art.replace('.md','').replace(/^\d+-/,'').replace(/-/g,' ') : '';
                  const evColor = ev.type==='ARTIFACT_IMPROVED'?'#4ade80':ev.type==='ARTIFACTS_STALE'?'#f59e0b':ev.type==='MODEL_ROUTED'?'#818cf8':'#94a3b8';
                  return (
                    <div key={ev.id??i} style={{padding:'5px 0',borderBottom:'1px solid #060e09',display:'flex',gap:'7px'}}>
                      <div style={{flexShrink:0}}>
                        <div style={{fontSize:'8px',color:'#1a3a20'}}>{new Date(ev.timestamp).toLocaleTimeString('en',{hour12:false})}</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'13px',color:evColor,fontWeight:700}}>{ev.type.replace(/_/g,' ')}</div>
                        {artLabel&&<div style={{fontSize:'13px',color:'#94a3b8',marginTop:'1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{artLabel}</div>}
                        {ev.payload.model!=null&&<div style={{fontSize:'8px',color:'#1e293b'}}>{String(ev.payload.model)}</div>}
                        {ev.payload.tokens!=null&&<div style={{fontSize:'8px',color:'#94a3b8'}}>{String(ev.payload.tokens).toLocaleString()}t</div>}
                      </div>
                    </div>
                  );
                })}
                <div ref={logEndRef}/>
              </div>
            )}

            {/* ── CONTROLS TAB ── */}
            {activeTab==='CONTROLS'&&(
              <div>
                <div style={{fontSize:'12px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'8px',fontWeight:700}}>RUNTIME CONTROLS</div>

                {staleCount>0&&(
                  <div style={{marginBottom:'10px',padding:'9px',backgroundColor:'#0a080022',border:'1px solid #f59e0b33',borderRadius:'3px'}}>
                    <div style={{fontSize:'12px',color:'#f59e0b',fontWeight:700,marginBottom:'5px',animation:'blink 2s infinite'}}>△ {staleCount} STALE ARTIFACTS</div>
                    <div style={{fontSize:'13px',color:'#94a3b8',marginBottom:'7px',lineHeight:1.6}}>Downstream artifacts marked stale following improvements.</div>
                    {Array.from(runtime.state.staleArtifacts).map(a=>(
                      <div key={a} style={{fontSize:'13px',color:'#f59e0b88',marginBottom:'2px'}}>△ {a.replace('.md','').replace(/^\d+-/,'').replace(/-/g,' ')}</div>
                    ))}
                    <button onClick={()=>runtime.clearStale()}
                      style={{marginTop:'7px',width:'100%',padding:'6px',fontSize:'13px',cursor:'pointer',...MONO,backgroundColor:'#0a0800',color:'#f59e0b',outline:'1px solid #f59e0b33',border:'none',borderRadius:'3px',letterSpacing:'0.06em'}}>
                      ○ CLEAR ALL STALE
                    </button>
                  </div>
                )}

                <div style={{marginBottom:'8px',padding:'8px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'3px'}}>
                  <div style={{fontSize:'13px',color:'#2a5a30',fontWeight:700,marginBottom:'5px',letterSpacing:'0.06em'}}>ARTIFACT GRAPH</div>
                  <div style={{fontSize:'13px',lineHeight:1.9,color:'#94a3b8'}}>
                    <div>Total nodes: <span style={{color:'#94a3b8'}}>15</span></div>
                    <div>Improved:    <span style={{color:'#4ade80'}}>{Object.keys(runtime.state.artifactVersions).length}</span></div>
                    <div>Stale:       <span style={{color:'#f59e0b'}}>{staleCount}</span></div>
                    <div>Reasoning:   <span style={{color:'#818cf8'}}>{runtime.state.reasoningChain.length} entries</span></div>
                    <div>Events:      <span style={{color:'#38bdf8'}}>{runtime.state.events.length}</span></div>
                  </div>
                </div>

                <div style={{marginBottom:'8px',padding:'8px',backgroundColor:'#040b14',border:'1px solid #4ade8022',borderRadius:'3px'}}>
                  <div style={{fontSize:'13px',color:'#4ade8088',marginBottom:'3px'}}>● ideagate-runtime active</div>
                  <div style={{fontSize:'8px',color:'#94a3b8',lineHeight:1.5}}>All open tabs receive events via BroadcastChannel. Improve in REFINE — this feed updates without refresh.</div>
                </div>

                <button onClick={()=>window.location.href='/improve'} style={{width:'100%',padding:'9px',fontSize:'12px',cursor:'pointer',...MONO,backgroundColor:'#0a1f0e',color:'#4ade80',outline:'1px solid #4ade8033',border:'none',borderRadius:'3px',letterSpacing:'0.08em',marginBottom:'5px'}}>
                  ◈ OPEN REFINE ENGINE
                </button>
                <button onClick={()=>window.location.href='/desk'} style={{width:'100%',padding:'9px',fontSize:'12px',cursor:'pointer',...MONO,backgroundColor:'#0a0f1e',color:'#818cf8',outline:'1px solid #818cf833',border:'none',borderRadius:'3px',letterSpacing:'0.08em'}}>
                  ◈ OPEN ARTIFACT DESK
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
