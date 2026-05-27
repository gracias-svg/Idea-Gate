'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/lib/DataProvider';

// ─── Types ────────────────────────────────────────────────────────────────────
type RightTab = 'improve' | 'snapshots' | 'context';
type Extent = 'light' | 'medium' | 'strong';
type AgentStatus = 'idle' | 'working' | 'reviewing' | 'done' | 'blocked';

interface LiveAgent {
  name: string;
  role: string;
  stage: number;
  status: AgentStatus;
  message: string;
}

interface Snapshot {
  id: string; name: string; date: string;
  stage: number; artifacts: string[]; tag: string; summary: string;
}

interface ImproveFeedback {
  id: string; intent: string; extent: Extent; target: string;
  timestamp: string; status: 'queued' | 'applying' | 'applied';
}

interface Settings {
  brightness: 'low' | 'medium' | 'high';
  fontSize: 'sm' | 'md' | 'lg';
  showAgents: boolean;
  showAnimations: boolean;
  density: 'compact' | 'normal';
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FALLBACK_AGENTS: LiveAgent[] = [
  { name: 'CO', role: 'Coordinator',        stage: 0,  status: 'idle', message: 'standby'  },
  { name: 'PS', role: 'Product Strategist', stage: 1,  status: 'idle', message: 'waiting'  },
  { name: 'RE', role: 'Researcher',         stage: 2,  status: 'idle', message: 'waiting'  },
  { name: 'UX', role: 'UX Designer',        stage: 7,  status: 'idle', message: 'waiting'  },
  { name: 'AR', role: 'Architect',          stage: 10, status: 'idle', message: 'waiting'  },
  { name: 'QA', role: 'QA',                 stage: 13, status: 'idle', message: 'waiting'  },
];

const STAGE_LABELS: Record<number, string> = {
  0:'Idea Intake', 1:'Discovery', 2:'Problem Definition', 3:'Solution Design',
  4:'MVP Hypothesis', 5:'Validation', 6:'Prioritization', 7:'PRD',
  8:'UX Design', 9:'Usability', 10:'Architecture', 11:'Backlog & Release',
  12:'Implementation', 13:'QA & Readiness', 14:'Prototype Prompt',
};

const IMPROVE_PRESETS = [
  'More concise','More technical','More strategic','More MVP-focused',
  'Sharpen summary','Add evidence','Reduce repetition','Clarify problem',
  'Stronger recommendation','Improve structure',
];

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle:'#64748b', working:'#f59e0b', reviewing:'#818cf8', done:'#4ade80', blocked:'#f87171',
};

const DEFAULT_SETTINGS: Settings = {
  brightness:'high', fontSize:'md', showAgents:true, showAnimations:true, density:'normal',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseContent(raw: string) {
  try {
    const p = JSON.parse(raw);
    return { type: 'json' as const, summary: p.summary || '', output: p.output || raw };
  } catch { return { type: 'text' as const, output: raw }; }
}

function getTC(b: Settings['brightness']) {
  if (b === 'high')   return { primary:'#f1f5f9', secondary:'#cbd5e1', muted:'#94a3b8', dim:'#64748b' };
  if (b === 'medium') return { primary:'#cbd5e1', secondary:'#94a3b8', muted:'#64748b', dim:'#475569' };
  return                     { primary:'#94a3b8', secondary:'#64748b', muted:'#475569', dim:'#334155' };
}

function getFS(s: Settings['fontSize']) {
  if (s === 'lg') return { base:'15px', sm:'13px', xs:'11px' };
  if (s === 'sm') return { base:'12px', sm:'10px', xs:'9px' };
  return                 { base:'13px', sm:'11px', xs:'10px' };
}

function renderMd(text: string, tc: ReturnType<typeof getTC>, fs: ReturnType<typeof getFS>) {
  return text.split('\n').map((line, k) => {
    if (line.startsWith('# '))  return <h1 key={k} style={{fontSize:'20px',fontWeight:700,color:tc.primary,margin:'20px 0 8px',borderBottom:'1px solid #1e293b',paddingBottom:'6px'}}>{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={k} style={{fontSize:'13px',fontWeight:700,color:'#4ade80',margin:'18px 0 6px',textTransform:'uppercase',letterSpacing:'0.08em'}}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={k} style={{fontSize:fs.base,fontWeight:600,color:tc.secondary,margin:'14px 0 4px'}}>{line.slice(4)}</h3>;
    if (line.startsWith('- ')||line.startsWith('* ')) return <div key={k} style={{display:'flex',gap:'8px',margin:'4px 0',paddingLeft:'8px'}}><span style={{color:'#4ade80',flexShrink:0}}>›</span><span style={{fontSize:fs.base,color:tc.secondary,lineHeight:1.7}}>{line.slice(2)}</span></div>;
    if (line.startsWith('---')) return <hr key={k} style={{border:'none',borderTop:'1px solid #1e293b',margin:'14px 0'}} />;
    if (line.trim()==='')       return <div key={k} style={{height:'8px'}} />;
    return <p key={k} style={{fontSize:fs.base,color:tc.secondary,lineHeight:1.8,margin:'4px 0'}}>{line}</p>;
  });
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ settings, onChange, onClose }: { settings: Settings; onChange: (s: Settings) => void; onClose: () => void }) {
  const row: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #0f1923' };
  const optBtn = (active: boolean): React.CSSProperties => ({
    padding:'3px 10px', fontSize:'10px', fontFamily:'inherit', borderRadius:'3px', cursor:'pointer',
    border: active ? '1px solid #4ade8066' : '1px solid #0f1923',
    backgroundColor: active ? '#0a1f0e' : '#060a0f',
    color: active ? '#4ade80' : '#475569',
  });
  const toggle = (active: boolean): React.CSSProperties => ({
    width:'32px', height:'16px', borderRadius:'8px', cursor:'pointer', border:'none', flexShrink:0,
    backgroundColor: active ? '#4ade80' : '#1e293b', transition:'background 0.2s',
  });
  return (
    <div style={{
      position:'absolute', top:'42px', right:'12px', zIndex:200,
      width:'280px', backgroundColor:'#080c12', border:'1px solid #1e293b',
      borderRadius:'6px', padding:'16px', boxShadow:'0 8px 32px #000c',
      fontFamily:"'JetBrains Mono',monospace",
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
        <span style={{fontSize:'11px',color:'#4ade80',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase'}}>⚙ Settings</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:'16px'}}>✕</button>
      </div>
      {([
        {label:'Brightness', key:'brightness', opts:['low','medium','high']},
        {label:'Font size',  key:'fontSize',   opts:['sm','md','lg']},
        {label:'Density',    key:'density',    opts:['compact','normal']},
      ] as const).map(({label,key,opts})=>(
        <div key={key} style={row}>
          <span style={{fontSize:'11px',color:'#cbd5e1',fontFamily:'inherit'}}>{label}</span>
          <div style={{display:'flex',gap:'3px'}}>
            {opts.map((v:string)=>(
              <button key={v} style={optBtn((settings as any)[key]===v)} onClick={()=>onChange({...settings,[key]:v})}>{v}</button>
            ))}
          </div>
        </div>
      ))}
      <div style={row}>
        <span style={{fontSize:'11px',color:'#cbd5e1',fontFamily:'inherit'}}>Agent strip</span>
        <button style={toggle(settings.showAgents)} onClick={()=>onChange({...settings,showAgents:!settings.showAgents})} />
      </div>
      <div style={{...row,borderBottom:'none'}}>
        <span style={{fontSize:'11px',color:'#cbd5e1',fontFamily:'inherit'}}>Animations</span>
        <button style={toggle(settings.showAnimations)} onClick={()=>onChange({...settings,showAnimations:!settings.showAnimations})} />
      </div>
      <div style={{marginTop:'12px',padding:'8px',backgroundColor:'#060a0f',borderRadius:'3px',fontSize:'10px',color:'#334155'}}>
        Settings saved automatically · Persists across sessions
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DeskPage() {
  const { state, setSelectedArtifact } = useData();

  const [settings, setSettings]         = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [rightTab, setRightTab]         = useState<RightTab>('improve');
  const [rightOpen, setRightOpen]       = useState(true);

  // ── LIVE AGENTS (real data from /api/agents) ──
  const [liveAgents, setLiveAgents]     = useState<LiveAgent[]>([]);
  const [isRunning, setIsRunning]       = useState(false);

  const [improveIntent, setImproveIntent]             = useState('');
  const [improveExtent, setImproveExtent]             = useState<Extent>('medium');
  const [improveTarget, setImproveTarget]             = useState<'block'|'stage'|'project'>('stage');
  const [improveFeedbacks, setImproveFeedbacks]       = useState<ImproveFeedback[]>([]);
  const [improveAppliedBadge, setImproveAppliedBadge] = useState<string|null>(null);
  const [pulseActive, setPulseActive]                 = useState(false);

  const [snapshots, setSnapshots]         = useState<Snapshot[]>([]);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotName, setSnapshotName]   = useState('');
  const [savedConfirm, setSavedConfirm]   = useState(false);

  // Persist settings + snapshots
  useEffect(() => {
    try {
      const s = localStorage.getItem('ig_settings');
      if (s) setSettings(JSON.parse(s));
      const sn = localStorage.getItem('ig_snapshots');
      if (sn) setSnapshots(JSON.parse(sn));
    } catch {}
  }, []);

  // ── Poll /api/agents every 2.5s ──
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res  = await fetch('/api/agents');
        const data = await res.json();
        if (data.agents?.length) setLiveAgents(data.agents);
        setIsRunning(data.isRunning || false);
      } catch {}
    };
    fetchAgents();
    const iv = setInterval(fetchAgents, 2500);
    return () => clearInterval(iv);
  }, []);

  const handleSettingsChange = (s: Settings) => {
    setSettings(s);
    try { localStorage.setItem('ig_settings', JSON.stringify(s)); } catch {}
  };

  const parsed = state.selectedContent ? parseContent(state.selectedContent) : null;
  const tc  = getTC(settings.brightness);
  const fs  = getFS(settings.fontSize);
  const pad = settings.density === 'compact' ? '8px' : '12px';

  const stageOf = (name: string) => { const m = name.match(/^(\d+)-/); return m ? parseInt(m[1]) : -1; };
  const curStage = state.selectedArtifact ? stageOf(state.selectedArtifact) : -1;

  const previewSentence = () => {
    if (!improveIntent) return 'Describe what to improve above.';
    const tl = improveTarget==='block' ? 'selected block' : improveTarget==='stage' ? 'this stage' : 'full project';
    const el = improveExtent==='light'  ? 'light polish'  : improveExtent==='medium' ? 'moderate refinement' : 'aggressive rewrite';
    return `→ "${improveIntent}" · ${el} · ${tl}`;
  };

  const handleImprove = () => {
    if (!improveIntent.trim()) return;
    const fb: ImproveFeedback = {
      id: Date.now().toString(), intent: improveIntent, extent: improveExtent,
      target: improveTarget==='block' ? state.selectedArtifact||'selection' : improveTarget,
      timestamp: new Date().toLocaleTimeString(), status: 'applying',
    };
    setImproveFeedbacks(p => [fb,...p]);
    if (settings.showAnimations) { setPulseActive(true); setTimeout(()=>setPulseActive(false),1200); }
    setImproveIntent('');
    setTimeout(()=>{
      setImproveFeedbacks(p => p.map(f => f.id===fb.id ? {...f,status:'applied'} : f));
      setImproveAppliedBadge(`${fb.extent} · applied`);
      setTimeout(()=>setImproveAppliedBadge(null),4000);
    },2000);
  };

  const handleSaveSnapshot = () => {
    if (!snapshotName.trim()) return;
    const snap: Snapshot = {
      id: Date.now().toString(), name: snapshotName.trim(), date: new Date().toLocaleString(),
      stage: state.currentStage, artifacts: [...state.artifacts],
      tag: state.currentStage>=12 ? 'Ready' : state.currentStage>=7 ? 'In Progress' : 'Early',
      summary: parsed?.type==='json' ? parsed.summary.slice(0,120)+'…' : `Stage ${state.currentStage} snapshot`,
    };
    const updated = [snap,...snapshots];
    setSnapshots(updated);
    try { localStorage.setItem('ig_snapshots', JSON.stringify(updated)); } catch {}
    setSnapshotName(''); setSavingSnapshot(false);
    setSavedConfirm(true); setTimeout(()=>setSavedConfirm(false),3000);
  };

  const deleteSnapshot = (id: string) => {
    const updated = snapshots.filter(s=>s.id!==id);
    setSnapshots(updated);
    try { localStorage.setItem('ig_snapshots', JSON.stringify(updated)); } catch {}
  };

  // Style helpers
  const btn = (v: 'accent'|'dim'|'ghost'): React.CSSProperties => ({
    padding:'4px 12px', fontSize:fs.xs, fontFamily:'inherit', borderRadius:'3px', cursor:'pointer',
    border: v==='accent' ? '1px solid #4ade8044' : '1px solid #1e293b',
    backgroundColor: v==='accent' ? '#0a1f0e' : v==='dim' ? '#0d1520' : 'transparent',
    color: v==='accent' ? '#4ade80' : tc.muted, transition:'all 0.15s',
  });
  const tagS = (tag: string): React.CSSProperties => ({
    display:'inline-block', padding:'1px 7px', borderRadius:'2px', fontSize:'9px',
    backgroundColor: tag==='Ready'?'#0a1f0e':tag==='In Progress'?'#1a1206':'#0d1520',
    color: tag==='Ready'?'#4ade80':tag==='In Progress'?'#f59e0b':'#818cf8',
    border:'1px solid currentColor', opacity:0.85,
  });
  const sLabel: React.CSSProperties = {
    fontSize:'9px', color:tc.dim, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'6px',
  };

  const agents = liveAgents.length ? liveAgents : FALLBACK_AGENTS;

  return (
    <>
      <style>{`
        @keyframes pulseOut { 0%{transform:translate(-50%,-50%) scale(0.3);opacity:1} 100%{transform:translate(-50%,-50%) scale(4);opacity:0} }
        @keyframes fadeIn   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .rail-item:hover  { background-color:#0d1a10 !important; color:#4ade8099 !important; }
        .preset-btn:hover { border-color:#4ade8044 !important; color:#4ade80 !important; background-color:#0a1f0e !important; }
        .icon-btn:hover   { color:#94a3b8 !important; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px} ::-webkit-scrollbar-track{background:transparent}
      `}</style>

      {pulseActive && <div style={{position:'fixed',top:'50%',left:'50%',width:'100px',height:'100px',borderRadius:'50%',border:'2px solid #4ade80',pointerEvents:'none',zIndex:999,animation:'pulseOut 1.2s ease-out forwards'}} />}

      <div style={{display:'flex',flexDirection:'column',height:'100vh',backgroundColor:'#060a0f',fontFamily:"'JetBrains Mono','Fira Code',monospace",color:tc.secondary,overflow:'hidden',position:'relative'}}>

        {/* Agent Strip */}
        {settings.showAgents && (
          <div style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 16px',backgroundColor:'#080c12',borderBottom:'1px solid #0f1923',flexShrink:0}}>
            <span style={{fontSize:'9px',color:tc.dim,marginRight:'4px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Team</span>
            {agents.map(a=>(
              <div key={a.name} title={`${a.role}: ${a.status}`} style={{
                display:'flex',alignItems:'center',gap:'4px',padding:'2px 8px',
                borderRadius:'3px',backgroundColor:'#0d1520',
                border:`1px solid ${STATUS_COLOR[a.status]}33`,
                fontSize:'10px',color:STATUS_COLOR[a.status],
              }}>
                <span style={{fontWeight:700}}>{a.name}</span>
                <span style={{fontSize:'8px',opacity:0.8}}>{a.message||a.status}</span>
              </div>
            ))}
            <div style={{flex:1}} />
            {isRunning && <span style={{fontSize:'9px',color:'#f59e0b',animation:'blink 1s infinite',marginRight:'8px'}}>⟳ running</span>}
            <span style={{fontSize:'10px',color:tc.dim}}>
              Stage <span style={{color:'#4ade80',fontWeight:700}}>{state.currentStage}</span> / 14
            </span>
          </div>
        )}

        <div style={{display:'flex',flex:1,overflow:'hidden'}}>

          {/* Left Rail */}
          <div style={{width:'196px',flexShrink:0,backgroundColor:'#080c12',borderRight:'1px solid #0f1923',overflowY:'auto',padding:'8px 0'}}>
            <div style={{fontSize:'9px',color:tc.dim,padding:`4px 12px 8px`,textTransform:'uppercase',letterSpacing:'0.12em'}}>
              Artifacts · {state.artifacts.length}
            </div>
            {state.artifacts.length===0
              ? <div style={{padding:'12px',fontSize:fs.xs,color:tc.dim}}>No artifacts yet</div>
              : state.artifacts.map(file=>{
                  const sn=stageOf(file), active=state.selectedArtifact===file, done=sn<state.currentStage;
                  return (
                    <div key={file} className="rail-item"
                      style={{padding:`${pad} 12px`,cursor:'pointer',fontSize:fs.xs,backgroundColor:active?'#0f1f12':'transparent',color:active?'#4ade80':done?tc.muted:tc.dim,borderLeft:active?'2px solid #4ade80':'2px solid transparent',display:'flex',alignItems:'center',gap:'7px',transition:'all 0.12s'}}
                      onClick={()=>setSelectedArtifact(file)}>
                      <span style={{width:'5px',height:'5px',borderRadius:'50%',flexShrink:0,backgroundColor:active?'#4ade80':done?'#1a3a20':sn===state.currentStage?'#f59e0b':'#0f1923',boxShadow:active?'0 0 5px #4ade80':'none'}} />
                      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.replace('.md','')}</span>
                      {done&&!active&&<span style={{marginLeft:'auto',color:'#1a3a20',fontSize:'8px'}}>✓</span>}
                    </div>
                  );
                })
            }
          </div>

          {/* Center */}
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'10px 20px',borderBottom:'1px solid #0f1923',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,gap:'10px',position:'relative'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',minWidth:0}}>
                {state.selectedArtifact && (
                  <>
                    <span style={{fontSize:'10px',color:'#4ade80',backgroundColor:'#0a1f0e',border:'1px solid #1a3a20',padding:'2px 8px',borderRadius:'3px',textTransform:'uppercase',letterSpacing:'0.1em',flexShrink:0}}>
                      {curStage>=0 ? STAGE_LABELS[curStage] : 'Artifact'}
                    </span>
                    <span style={{fontSize:fs.xs,color:tc.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{state.selectedArtifact}</span>
                    {improveAppliedBadge && <span style={{fontSize:'9px',color:'#4ade80',backgroundColor:'#0a1f0e',border:'1px solid #4ade8044',padding:'2px 8px',borderRadius:'10px',animation:'fadeIn 0.3s ease'}}>✦ {improveAppliedBadge}</span>}
                  </>
                )}
              </div>
              <div style={{display:'flex',gap:'6px',alignItems:'center',flexShrink:0}}>
                <button style={btn('dim')} onClick={()=>{setRightTab('improve');setRightOpen(true);}}>✦ Improve</button>
                <button style={btn('dim')} onClick={()=>{setRightTab('snapshots');setRightOpen(true);setSavingSnapshot(true);}}>⊡ Save</button>
                <button className="icon-btn" onClick={()=>setShowSettings(!showSettings)} style={{background:'none',border:'none',cursor:'pointer',color:tc.dim,fontSize:'14px',fontFamily:'inherit',padding:'2px 4px'}}>⚙</button>
              </div>
              {showSettings && <SettingsPanel settings={settings} onChange={handleSettingsChange} onClose={()=>setShowSettings(false)} />}
            </div>

            <div style={{flex:1,overflowY:'auto',padding:settings.density==='compact'?'16px':'24px'}}>
              {!state.selectedArtifact ? (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:'12px'}}>
                  <div style={{fontSize:'28px',opacity:0.2}}>◈</div>
                  <div style={{fontSize:fs.sm,color:tc.dim}}>Select an artifact from the left rail</div>
                </div>
              ) : !parsed ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
                  <div style={{fontSize:fs.sm,color:tc.dim}}>Loading…</div>
                </div>
              ) : (
                <>
                  {parsed.type==='json'&&parsed.summary&&(
                    <div style={{backgroundColor:'#080c12',border:'1px solid #1e293b',borderRadius:'4px',padding:'14px 16px',marginBottom:'24px'}}>
                      <div style={{...sLabel,marginBottom:'8px'}}>Summary</div>
                      <div style={{fontSize:fs.sm,color:tc.secondary,lineHeight:1.7}}>{parsed.summary}</div>
                    </div>
                  )}
                  <div>{renderMd(parsed.output,tc,fs)}</div>
                </>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div style={{width:rightOpen?'276px':'36px',flexShrink:0,borderLeft:'1px solid #0f1923',backgroundColor:'#080c12',display:'flex',flexDirection:'column',transition:'width 0.2s ease',overflow:'hidden'}}>
            <button onClick={()=>setRightOpen(!rightOpen)} style={{padding:'8px',cursor:'pointer',color:tc.dim,textAlign:'center',backgroundColor:'transparent',border:'none',borderBottom:'1px solid #0f1923',width:'100%',fontFamily:'inherit',fontSize:'14px',flexShrink:0}}>
              {rightOpen?'›':'‹'}
            </button>

            {rightOpen&&(
              <>
                <div style={{display:'flex',borderBottom:'1px solid #0f1923',flexShrink:0}}>
                  {(['improve','snapshots','context'] as RightTab[]).map(tab=>(
                    <button key={tab} onClick={()=>setRightTab(tab)} style={{flex:1,padding:'8px 4px',fontSize:'9px',cursor:'pointer',color:rightTab===tab?'#4ade80':tc.dim,backgroundColor:'transparent',border:'none',borderBottom:rightTab===tab?'1px solid #4ade80':'1px solid transparent',fontFamily:'inherit',textTransform:'uppercase',letterSpacing:'0.1em'}}>
                      {tab}
                    </button>
                  ))}
                </div>

                <div style={{flex:1,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:'12px'}}>

                  {rightTab==='improve'&&(
                    <>
                      <div>
                        <div style={sLabel}>Improve Snippet</div>
                        <textarea style={{width:'100%',height:'64px',backgroundColor:'#060a0f',border:'1px solid #1e293b',borderRadius:'3px',padding:'8px',color:tc.primary,fontSize:fs.xs,fontFamily:'inherit',resize:'none',outline:'none',boxSizing:'border-box'}}
                          placeholder='"more concise", "stronger PM framing"…' value={improveIntent} onChange={e=>setImproveIntent(e.target.value)} />
                        <div style={{...sLabel,marginTop:'8px'}}>Extent</div>
                        <div style={{display:'flex',gap:'3px'}}>
                          {(['light','medium','strong'] as Extent[]).map(lvl=>{
                            const c=lvl==='light'?'#818cf8':lvl==='medium'?'#f59e0b':'#f87171', active=improveExtent===lvl;
                            return <button key={lvl} onClick={()=>setImproveExtent(lvl)} style={{flex:1,padding:'4px',fontSize:fs.xs,fontFamily:'inherit',borderRadius:'3px',cursor:'pointer',border:active?`1px solid ${c}66`:'1px solid #1e293b',backgroundColor:active?`${c}11`:'#060a0f',color:active?c:tc.dim}}>{lvl}</button>;
                          })}
                        </div>
                        <div style={{...sLabel,marginTop:'8px'}}>Apply to</div>
                        <div style={{display:'flex',gap:'3px'}}>
                          {[{k:'block' as const,l:'Block'},{k:'stage' as const,l:'Stage'},{k:'project' as const,l:'Project'}].map(({k,l})=>(
                            <button key={k} onClick={()=>setImproveTarget(k)} style={{flex:1,padding:'4px',fontSize:'9px',fontFamily:'inherit',borderRadius:'3px',cursor:'pointer',textTransform:'uppercase',letterSpacing:'0.05em',border:improveTarget===k?'1px solid #4ade8044':'1px solid #1e293b',backgroundColor:improveTarget===k?'#0a1f0e':'#060a0f',color:improveTarget===k?'#4ade80':tc.dim}}>{l}</button>
                          ))}
                        </div>
                        <div style={{marginTop:'8px',padding:'8px',backgroundColor:'#060a0f',border:'1px solid #1e293b',borderRadius:'3px',fontSize:'10px',color:'#4ade8077',lineHeight:1.5,fontStyle:'italic'}}>{previewSentence()}</div>
                        <div style={{display:'flex',gap:'4px',marginTop:'8px'}}>
                          <button style={{...btn('accent'),flex:1,padding:'7px'}} onClick={handleImprove}>✦ Improve now</button>
                          <button style={{...btn('dim'),flex:1,padding:'7px'}} onClick={()=>{
                            if(!improveIntent.trim())return;
                            setImproveFeedbacks(p=>[{id:Date.now().toString(),intent:improveIntent,extent:improveExtent,target:improveTarget,timestamp:new Date().toLocaleTimeString(),status:'queued'},...p]);
                            setImproveIntent('');
                          }}>Queue</button>
                        </div>
                      </div>
                      <div>
                        <div style={sLabel}>Quick presets</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                          {IMPROVE_PRESETS.map(p=>(
                            <button key={p} className="preset-btn" onClick={()=>setImproveIntent(p.toLowerCase())} style={{padding:'3px 8px',fontSize:'10px',fontFamily:'inherit',borderRadius:'2px',cursor:'pointer',border:'1px solid #1e293b',backgroundColor:'#060a0f',color:tc.muted}}>{p}</button>
                          ))}
                        </div>
                      </div>
                      {improveFeedbacks.length>0&&(
                        <div>
                          <div style={sLabel}>Recent · {improveFeedbacks.length}</div>
                          {improveFeedbacks.slice(0,6).map(fb=>(
                            <div key={fb.id} style={{padding:'8px',marginBottom:'4px',backgroundColor:'#060a0f',border:`1px solid ${fb.status==='applied'?'#1a3a20':fb.status==='applying'?'#1a1206':'#0f1923'}`,borderRadius:'3px',animation:'fadeIn 0.3s ease'}}>
                              <div style={{color:tc.secondary,fontSize:fs.xs,marginBottom:'3px'}}>"{fb.intent}"</div>
                              <div style={{color:tc.dim,fontSize:'9px',display:'flex',gap:'6px'}}>
                                <span>{fb.extent}</span><span>·</span><span>{fb.target}</span><span>·</span>
                                <span style={{color:fb.status==='applied'?'#4ade80':fb.status==='applying'?'#f59e0b':tc.dim}}>
                                  {fb.status==='applying'?'⟳ applying…':fb.status==='applied'?'✓ applied':'queued'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {rightTab==='snapshots'&&(
                    <>
                      <div>
                        <div style={sLabel}>Save current run</div>
                        {savingSnapshot?(
                          <>
                            <input autoFocus style={{width:'100%',backgroundColor:'#060a0f',border:'1px solid #4ade8044',borderRadius:'3px',padding:'7px 8px',color:tc.primary,fontSize:fs.xs,fontFamily:'inherit',outline:'none',boxSizing:'border-box',marginBottom:'6px'}}
                              placeholder="Name this snapshot…" value={snapshotName} onChange={e=>setSnapshotName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSaveSnapshot()} />
                            <div style={{display:'flex',gap:'4px'}}>
                              <button style={{...btn('accent'),flex:1,padding:'6px'}} onClick={handleSaveSnapshot}>⊡ Save</button>
                              <button style={{...btn('dim'),padding:'6px 10px'}} onClick={()=>setSavingSnapshot(false)}>✕</button>
                            </div>
                          </>
                        ):(
                          <button style={{...btn('accent'),width:'100%',padding:'8px',fontSize:fs.xs}} onClick={()=>setSavingSnapshot(true)}>
                            {savedConfirm?'✓ Saved!':'⊡ Save snapshot'}
                          </button>
                        )}
                        {savedConfirm&&<div style={{fontSize:'10px',color:'#4ade80',textAlign:'center',marginTop:'5px',animation:'fadeIn 0.3s ease'}}>Persisted ✓</div>}
                      </div>
                      <div>
                        <div style={sLabel}>Saved runs {snapshots.length>0&&`(${snapshots.length})`}</div>
                        {snapshots.length===0
                          ? <div style={{fontSize:fs.xs,color:tc.dim,padding:'8px 0'}}>No snapshots saved yet.</div>
                          : snapshots.map(snap=>(
                            <div key={snap.id} style={{padding:'10px',marginBottom:'6px',backgroundColor:'#060a0f',border:'1px solid #1e293b',borderRadius:'3px',fontSize:fs.xs}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'4px'}}>
                                <span style={{color:tc.primary,fontWeight:600}}>{snap.name}</span>
                                <span style={tagS(snap.tag)}>{snap.tag}</span>
                              </div>
                              <div style={{color:tc.dim,fontSize:'9px',marginBottom:'6px'}}>{snap.date} · Stage {snap.stage} · {snap.artifacts.length} artifacts</div>
                              {snap.summary&&<div style={{color:tc.muted,fontSize:'9px',lineHeight:1.5,marginBottom:'8px',borderLeft:'2px solid #1e293b',paddingLeft:'6px'}}>{snap.summary.slice(0,100)}…</div>}
                              <div style={{display:'flex',gap:'4px'}}>
                                <button style={{...btn('dim'),fontSize:'9px',padding:'2px 8px'}}>Restore</button>
                                <button style={{...btn('dim'),fontSize:'9px',padding:'2px 8px'}}>Compare</button>
                                <button onClick={()=>deleteSnapshot(snap.id)} style={{...btn('dim'),fontSize:'9px',padding:'2px 6px',marginLeft:'auto',color:'#f87171'}}>✕</button>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </>
                  )}

                  {rightTab==='context'&&(
                    <>
                      <div>
                        <div style={sLabel}>Project</div>
                        <div style={{padding:'10px',backgroundColor:'#060a0f',border:'1px solid #1e293b',borderRadius:'3px'}}>
                          <div style={{color:tc.secondary,fontSize:fs.xs,marginBottom:'6px',fontWeight:600}}>Active workspace</div>
                          <div style={{color:tc.muted,fontSize:'10px',lineHeight:1.8}}>
                            Stage {state.currentStage} of 14<br/>
                            {state.artifacts.length} artifacts generated<br/>
                            {state.currentStage>=14?'✓ Lifecycle complete':`Next: ${STAGE_LABELS[state.currentStage+1]||'—'}`}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div style={sLabel}>Stage map</div>
                        {Object.entries(STAGE_LABELS).map(([num,label])=>{
                          const n=parseInt(num),done=n<state.currentStage,current=n===state.currentStage;
                          return (
                            <div key={num} style={{display:'flex',alignItems:'center',gap:'7px',padding:'3px 0',fontSize:'10px',color:current?'#4ade80':done?tc.muted:tc.dim}}>
                              <span style={{width:'14px',textAlign:'right',flexShrink:0,color:tc.dim}}>{n}</span>
                              <span style={{width:'4px',height:'4px',borderRadius:'50%',flexShrink:0,backgroundColor:current?'#4ade80':done?'#1a3a20':'#0f1923',boxShadow:current?'0 0 4px #4ade80':'none'}} />
                              <span>{label}</span>
                              {done&&<span style={{marginLeft:'auto',color:'#1a3a20'}}>✓</span>}
                              {current&&<span style={{marginLeft:'auto',fontSize:'8px',color:'#f59e0b'}}>← now</span>}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}