'use client';

// src/app/improve/page.tsx
// IdeaGate — Artifact Refinement with 8-model OpenRouter routing + Settings panel

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Model catalog (matches route) ─────────────────────────────────────────────
const MODEL_CATALOG = [
  { key: 'haiku',    label: 'Haiku',        provider: 'Anthropic', color: '#22c55e', cost: '$0.25/1M', speed: 3, bestFor: 'Fast edits'         },
  { key: 'sonnet',   label: 'Sonnet',       provider: 'Anthropic', color: '#818cf8', cost: '$3/1M',    speed: 2, bestFor: 'PM reasoning'        },
  { key: 'deepseek', label: 'DeepSeek R1',  provider: 'DeepSeek',  color: '#38bdf8', cost: '$0.55/1M', speed: 1, bestFor: 'Technical depth'     },
  { key: 'llama',    label: 'Llama 3.3',    provider: 'Meta',      color: '#f59e0b', cost: '$0.59/1M', speed: 3, bestFor: 'Ultra-fast drafts'   },
  { key: 'qwen',     label: 'Qwen 2.5',     provider: 'Alibaba',   color: '#fde047', cost: '$0.13/1M', speed: 2, bestFor: 'Low-cost volume'     },
  { key: 'mistral',  label: 'Mistral',      provider: 'Mistral',   color: '#f472b6', cost: '$2/1M',    speed: 2, bestFor: 'Structured output'   },
  { key: 'gpt4o',    label: 'GPT-4o',       provider: 'OpenAI',    color: '#4ade80', cost: '$2.5/1M',  speed: 2, bestFor: 'PM evaluation'       },
  { key: 'gemini',   label: 'Gemini Flash', provider: 'Google',    color: '#fb923c', cost: '$0.075/1M',speed: 3, bestFor: 'Long context'        },
] as const;

type ModelKey = typeof MODEL_CATALOG[number]['key'];

// ── Lifecycle constants ───────────────────────────────────────────────────────
const STAGE_LABELS: Record<number,string> = {
   0:'Idea Intake',    1:'Discovery',      2:'Problem Definition', 3:'Solution Design',
   4:'MVP Hypothesis', 5:'Validation',     6:'Prioritization',    7:'PRD',
   8:'UX Design',      9:'Usability',     10:'Architecture',     11:'Backlog & Release',
  12:'Implementation',13:'QA & Readiness',14:'Prototype',
};
const DOWNSTREAM: Record<number,number[]> = {
   0:[1,2,3,4,5,6,7,8,9,10,11,12,13,14], 1:[2,3,4,5,6,7,8,9,10,11],
   2:[3,4,5,6,7,8,9],  3:[4,5,6,7,8,9,10], 4:[5,6,7,10,11], 5:[6,7,11,12,13],
   6:[7,11,12], 7:[8,9,10,11,12,13,14],  8:[9,10,11,14], 9:[13],
  10:[11,12,13,14], 11:[12,13], 12:[13,14], 13:[14], 14:[],
};

type Extent  = 'light'|'medium'|'strong';
type Scope   = 'block'|'stage'|'project';
type UIState = 'idle'|'loading'|'previewed'|'accepted';

interface Result {
  original: string; improved: string; reasoning: string;
  impactWarnings: string[]; modelKey: string; modelId: string;
  tokens: { input:number; output:number; total:number }; cost: number; refDocs: number;
}
interface UploadedDoc { name:string; text:string; chars:number; }
interface HistEntry { file:string; intent:string; model:string; tokens:number; cost:number; time:string; }

const PRESETS = [
  { label:'More concise',           intent:'Make this more concise — remove redundancy, preserve all key PM insights' },
  { label:'More technical',         intent:'Add technical depth — precise implementation details, API rationale, tradeoffs' },
  { label:'More strategic',         intent:'Strengthen strategic reasoning — sharper market framing, competitive logic, positioning' },
  { label:'More MVP-focused',       intent:'Sharpen MVP scope — be opinionated about what ships first and why other features wait' },
  { label:'Competitive moat',       intent:'Strengthen the moat — defensible advantage, why it holds, what makes it hard to replicate' },
  { label:'Market positioning',     intent:'Improve positioning — precise segment, positioning statement, specific differentiation' },
  { label:'Long-term implications', intent:'Expand long-term implications — second-order effects, platform potential, ecosystem dynamics' },
  { label:'Sharpen summary',        intent:'Rewrite summary/overview to be crisper and interview-ready — one PM insight per sentence' },
  { label:'Add evidence',           intent:'Ground every claim in frameworks, data, or explicitly labelled assumptions' },
  { label:'Clarify problem',        intent:'Sharpen problem definition — user pain and market gap more specific and quantified' },
  { label:'Stronger recommendation',intent:'Make recommendations more decisive — clearer rationale, explicit tradeoffs, concrete next steps' },
  { label:'Improve structure',      intent:'Reorganise for PM logic flow — problem → insight → decision → artifact' },
];

// ── Content parser: V2 artifact format ───────────────────────────────────────
function parseContent(raw: string): string {
  if (!raw) return '';
  const sep = raw.indexOf('\n---\n');
  if (sep > -1) {
    const after = raw.slice(sep+5).trim();
    try {
      const o = JSON.parse(after);
      if (typeof o.output==='string' && o.output.length>10) return o.output;
    } catch {}
    const m = after.match(/"output"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"[a-z]|"\s*})/);
    if (m) { try { const u=JSON.parse(`"${m[1]}"`); if(u.length>10) return u; } catch {} }
  }
  const t = raw.trim();
  if (t.startsWith('{')) {
    try { const o=JSON.parse(t); if(typeof o.output==='string') return o.output; } catch {}
  }
  if (t.startsWith('#') && !t.includes('"output"')) return raw;
  return raw;
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function ir(text: string, k: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p,i)=>{
    const key=`${k}-${i}`;
    if(p.startsWith('**')&&p.endsWith('**')) return <strong key={key} style={{color:'#94a3b8',fontWeight:700}}>{p.slice(2,-2)}</strong>;
    if(p.startsWith('`')&&p.endsWith('`')&&p.length>2) return <code key={key} style={{backgroundColor:'#0d1117',color:'#4ade80',padding:'1px 5px',borderRadius:'3px',fontSize:'11px'}}>{p.slice(1,-1)}</code>;
    return <React.Fragment key={key}>{p}</React.Fragment>;
  });
}

function MD({ content, fs=12 }: { content:string; fs?:number }) {
  const MONO: React.CSSProperties = { fontFamily:"'JetBrains Mono','Fira Code',monospace" };
  return (
    <div>
      {content.split('\n').map((line,i)=>{
        const t=line.trim(),k=`l${i}`;
        if(!t) return <div key={k} style={{height:'8px'}}/>;
        if(t==='---'||t==='***') return <div key={k} style={{borderTop:'1px solid #1e293b',margin:'18px 0'}}/>;
        if(t.startsWith('# '))   return <div key={k} style={{marginTop:i===0?0:'26px',marginBottom:'12px',paddingBottom:'8px',borderBottom:'1px solid #1e293b',fontSize:'17px',color:'#e2e8f0',fontWeight:700,...MONO}}>{ir(t.slice(2),k)}</div>;
        if(t.startsWith('## '))  return <div key={k} style={{marginTop:'20px',marginBottom:'8px',fontSize:'14px',color:'#94a3b8',fontWeight:700,...MONO}}>{ir(t.slice(3),k)}</div>;
        if(t.startsWith('### ')) return <div key={k} style={{marginTop:'14px',marginBottom:'5px',fontSize:'12px',color:'#64748b',fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.05em',...MONO}}>{ir(t.slice(4),k)}</div>;
        if(t.startsWith('> '))   return <div key={k} style={{margin:'8px 0',padding:'7px 12px',borderLeft:'3px solid #4ade8033',backgroundColor:'#040f08',fontSize:`${fs}px`,color:'#4ade8088',...MONO}}>{ir(t.slice(2),k)}</div>;
        const bm=line.match(/^(\s*)([-*])\s+(.+)/);
        if(bm) return <div key={k} style={{display:'flex',gap:'7px',marginLeft:Math.floor(bm[1].length/2)*14,margin:'2px 0'}}><span style={{color:'#4ade8055',flexShrink:0,fontSize:'12px'}}>▸</span><span style={{fontSize:`${fs}px`,color:'#64748b',lineHeight:1.7,...MONO}}>{ir(bm[3],k)}</span></div>;
        const om=line.match(/^(\s*)(\d+)\.\s+(.+)/);
        if(om) return <div key={k} style={{display:'flex',gap:'8px',margin:'2px 0'}}><span style={{fontSize:`${fs}px`,color:'#475569',flexShrink:0,minWidth:'20px',textAlign:'right' as const,...MONO}}>{om[2]}.</span><span style={{fontSize:`${fs}px`,color:'#64748b',lineHeight:1.7,...MONO}}>{ir(om[3],k)}</span></div>;
        return <div key={k} style={{fontSize:`${fs}px`,color:'#64748b',lineHeight:1.8,...MONO}}>{ir(t,k)}</div>;
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const stageNum   = (f:string) => parseInt(f.split('-')[0],10)||0;
const stageColor = (f:string) => { const n=stageNum(f); return n<=2?'#22c55e':n<=5?'#38bdf8':n<=9?'#a78bfa':n<=11?'#fb923c':'#fde047'; };
const humanName  = (f:string) => f.replace('.md','').replace(/^\d+-/,'').replace(/-/g,' ');

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ImprovePage() {
  const MONO: React.CSSProperties = { fontFamily:"'JetBrains Mono','Fira Code',monospace" };

  const [artifacts,   setArtifacts]  = useState<string[]>([]);
  const [stage,       setStage]      = useState(0);
  const [selected,    setSelected]   = useState<string|null>(null);
  const [rawContent,  setRawContent] = useState<string|null>(null);
  const [loading,     setLoading]    = useState(false);

  const [intent,  setIntent]  = useState('');
  const [extent,  setExtent]  = useState<Extent>('medium');
  const [scope,   setScope]   = useState<Scope>('stage');
  const [modelKey,setModelKey]= useState<ModelKey>('haiku');

  const [docs,       setDocs]       = useState<UploadedDoc[]>([]);
  const [uplLoading, setUplLoading] = useState(false);
  const [uplError,   setUplError]   = useState<string|null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [uiState, setUiState] = useState<UIState>('idle');
  const [result,  setResult]  = useState<Result|null>(null);
  const [error,   setError]   = useState<string|null>(null);
  const [view,    setView]    = useState<'original'|'split'|'improved'>('split');

  const [history, setHistory] = useState<HistEntry[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Settings (persisted)
  const [settings, setSettings] = useState({
    tokenBudget: 4000,
    reasoningDepth: 'detailed' as 'brief'|'detailed',
    autoAccept: false,
    showCosts: true,
  });

  // Load
  useEffect(()=>{
    fetch('/api/data').then(r=>r.json()).then(d=>{ setArtifacts(d.artifacts??[]); setStage(d.currentStage??0); }).catch(()=>{});
    try { const h=localStorage.getItem('ig_hist'); if(h) setHistory(JSON.parse(h)); } catch {}
    try { const s=localStorage.getItem('ig_settings'); if(s) setSettings(JSON.parse(s)); } catch {}
  },[]);

  // Load artifact content
  useEffect(()=>{
    setResult(null); setUiState('idle'); setError(null); setRawContent(null);
    if (!selected) return;
    setLoading(true);
    fetch(`/api/improve?file=${encodeURIComponent(selected)}`).then(r=>r.json())
      .then(d=>setRawContent(d.content??'[No content]'))
      .catch(e=>setRawContent(`[Error: ${e.message}]`))
      .finally(()=>setLoading(false));
  },[selected]);

  const displayContent = rawContent ? parseContent(rawContent) : null;

  const saveSettings = (s: typeof settings) => {
    setSettings(s);
    try { localStorage.setItem('ig_settings',JSON.stringify(s)); } catch {}
  };

  // ── Improve ───────────────────────────────────────────────────────────────
  const handleImprove = useCallback(async()=>{
    if (!selected || !intent.trim()) return;
    setUiState('loading'); setError(null); setResult(null);
    try {
      const res = await fetch('/api/improve',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          action:'preview', artifactName:selected,
          intent:intent.trim(), extent, scope, modelKey,
          extractedDocuments: docs.length>0 ? docs.map(d=>`[${d.name}]\n${d.text}`) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok||data.error) throw new Error(data.error??'Failed');
      setResult(data); setUiState('previewed'); setView('split');
    } catch(e:any){ setError(e.message); setUiState('idle'); }
  },[selected,intent,extent,scope,modelKey,docs]);

  // ── Accept ────────────────────────────────────────────────────────────────
  const handleAccept = useCallback(async()=>{
    if (!result||!selected) return;
    setUiState('loading');
    try {
      const res = await fetch('/api/improve',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({action:'accept',artifactName:selected,content:result.improved}),
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error??'Accept failed');
      const entry: HistEntry = {
        file: selected,
        intent: intent.slice(0,60)+(intent.length>60?'…':''),
        model: result.modelKey,
        tokens: result.tokens?.total??0,
        cost: result.cost??0,
        time: new Date().toLocaleTimeString(),
      };
      const newH=[entry,...history].slice(0,30);
      setHistory(newH);
      try{ localStorage.setItem('ig_hist',JSON.stringify(newH)); }catch{}
      setRawContent(result.improved);
      setUiState('accepted');
    } catch(e:any){ setError(e.message); setUiState('previewed'); }
  },[result,selected,intent,history]);

  const handleDiscard = ()=>{ setResult(null); setUiState('idle'); setError(null); };

  const handleDownload = (name:string, content:string|null)=>{
    if (!content) return;
    const a=Object.assign(document.createElement('a'),{ href:URL.createObjectURL(new Blob([content],{type:'text/markdown'})), download:name });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const handleUpload = async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const files=Array.from(e.target.files??[]);
    if(!files.length) return;
    setUplLoading(true); setUplError(null);
    for (const file of files) {
      const form=new FormData(); form.append('file',file);
      try {
        const res=await fetch('/api/improve/extract',{method:'POST',body:form});
        const ct=res.headers.get('content-type')??'';
        if(!ct.includes('application/json')) throw new Error('Extract route not found. Run: npm install pdf-parse mammoth');
        const data=await res.json();
        if(!res.ok||data.error) throw new Error(data.error??'Failed');
        setDocs(p=>[...p.filter(d=>d.name!==data.fileName),{name:data.fileName,text:data.text,chars:data.charCount}]);
      } catch(e:any){ setUplError(`${file.name}: ${e.message}`); }
    }
    setUplLoading(false);
    if(uploadRef.current) uploadRef.current.value='';
  };

  const selectedStage    = selected ? stageNum(selected) : -1;
  const downstreamStages = selectedStage>=0 ? (DOWNSTREAM[selectedStage]??[]) : [];
  const activeModel      = MODEL_CATALOG.find(m=>m.key===modelKey)!;

  const B: React.CSSProperties = { ...MONO, cursor:'pointer', border:'none', borderRadius:'3px' };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',backgroundColor:'#020609',overflow:'hidden',...MONO,color:'#94a3b8'}}>
      <style>{`
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        ::-webkit-scrollbar-track{background:transparent} textarea::placeholder{color:#334155}
        button:disabled{opacity:.35;cursor:not-allowed!important}
      `}</style>

      {/* ── Header ── */}
      <div style={{display:'flex',alignItems:'center',padding:'0 16px',height:'52px',backgroundColor:'#020c06',borderBottom:'1px solid #0a1a2e',flexShrink:0,gap:'12px'}}>
        <div>
          <div style={{fontSize:'14px',color:'#818cf8',fontWeight:700,letterSpacing:'0.1em'}}>REFINE</div>
          <div style={{fontSize:'9px',color:'#1a1a3a',letterSpacing:'0.08em'}}>ARTIFACT IMPROVEMENT</div>
        </div>
        <div style={{width:'1px',height:'28px',backgroundColor:'#0a1a2e'}}/>
        <div style={{fontSize:'12px',color:'#475569'}}>
          Stage <span style={{color:'#4ade80',fontWeight:700}}>{stage}</span>/14
          <span style={{color:'#1e293b',margin:'0 8px'}}>·</span>
          <span>{artifacts.length} artifacts</span>
          {docs.length>0 && <span style={{color:'#818cf888',marginLeft:'8px'}}>· {docs.length} ref doc{docs.length>1?'s':''}</span>}
        </div>
        <div style={{flex:1}}/>

        {/* ── Model selector ── */}
        <div style={{display:'flex',gap:'3px',alignItems:'center',overflow:'hidden'}}>
          <span style={{fontSize:'9px',color:'#334155',flexShrink:0,marginRight:'2px'}}>MODEL</span>
          <div style={{display:'flex',gap:'3px',overflowX:'auto'}}>
            {MODEL_CATALOG.map(m=>(
              <button key={m.key} onClick={()=>setModelKey(m.key)} title={`${m.provider} — ${m.bestFor} — ${m.cost}`}
                style={{...B,padding:'3px 8px',fontSize:'9px',whiteSpace:'nowrap',
                  backgroundColor: modelKey===m.key ? `${m.color}22` : '#0d1117',
                  color:           modelKey===m.key ? m.color : '#334155',
                  outline:         modelKey===m.key ? `1px solid ${m.color}55` : '1px solid #1e293b',
                }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{width:'1px',height:'28px',backgroundColor:'#0a1a2e'}}/>

        {/* Settings + Download */}
        <button onClick={()=>setShowSettings(!showSettings)} title="Settings"
          style={{...B,padding:'5px 8px',fontSize:'14px',backgroundColor:showSettings?'#0a0f1e':'transparent',color:'#475569',outline:'1px solid #1e293b'}}>
          ⚙
        </button>
        {selected && displayContent && uiState==='idle' && (
          <button onClick={()=>handleDownload(selected,displayContent)}
            style={{...B,padding:'5px 12px',fontSize:'11px',backgroundColor:'#0a1509',color:'#4ade80',outline:'1px solid #1a3a20'}}>
            ↓ MD
          </button>
        )}
      </div>

      {/* ── Settings panel (slide-in) ── */}
      {showSettings && (
        <div style={{position:'absolute',top:'52px',right:0,width:'300px',backgroundColor:'#020c06',borderLeft:'1px solid #0a1a2e',borderBottom:'1px solid #0a1a2e',padding:'14px',zIndex:100,boxShadow:'-4px 4px 20px #00000088'}}>
          <div style={{fontSize:'11px',color:'#2a5a30',letterSpacing:'0.12em',fontWeight:700,marginBottom:'12px'}}>OPERATIONAL SETTINGS</div>

          <div style={{marginBottom:'12px'}}>
            <div style={{fontSize:'10px',color:'#475569',marginBottom:'5px'}}>TOKEN BUDGET PER CALL</div>
            <div style={{display:'flex',gap:'5px'}}>
              {[1000,2000,4000,8000].map(v=>(
                <button key={v} onClick={()=>saveSettings({...settings,tokenBudget:v})}
                  style={{...B,padding:'4px 8px',fontSize:'10px',
                    backgroundColor:settings.tokenBudget===v?'#0a0f1e':'#0d1117',
                    color:settings.tokenBudget===v?'#818cf8':'#334155',
                    outline:settings.tokenBudget===v?'1px solid #818cf833':'1px solid #1e293b'}}>
                  {v>=1000?`${v/1000}k`:v}
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:'12px'}}>
            <div style={{fontSize:'10px',color:'#475569',marginBottom:'5px'}}>REASONING DEPTH</div>
            <div style={{display:'flex',gap:'5px'}}>
              {(['brief','detailed'] as const).map(v=>(
                <button key={v} onClick={()=>saveSettings({...settings,reasoningDepth:v})}
                  style={{...B,padding:'4px 10px',fontSize:'10px',
                    backgroundColor:settings.reasoningDepth===v?'#0a1f0e':'#0d1117',
                    color:settings.reasoningDepth===v?'#4ade80':'#334155',
                    outline:settings.reasoningDepth===v?'1px solid #4ade8033':'1px solid #1e293b'}}>
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:'12px'}}>
            <div style={{fontSize:'10px',color:'#475569',marginBottom:'5px'}}>TOKEN COSTS VISIBLE</div>
            <button onClick={()=>saveSettings({...settings,showCosts:!settings.showCosts})}
              style={{...B,padding:'4px 10px',fontSize:'10px',
                backgroundColor:settings.showCosts?'#0a1f0e':'#0d1117',
                color:settings.showCosts?'#4ade80':'#334155',
                outline:`1px solid ${settings.showCosts?'#4ade8033':'#1e293b'}`}}>
              {settings.showCosts?'ON':'OFF'}
            </button>
          </div>

          <div style={{padding:'10px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'4px',fontSize:'10px',color:'#334155',lineHeight:1.7}}>
            <div style={{color:'#475569',fontWeight:700,marginBottom:'4px'}}>ACTIVE MODEL</div>
            <div style={{color:activeModel.color,fontWeight:700}}>{activeModel.label}</div>
            <div>{activeModel.provider} · {activeModel.cost}</div>
            <div style={{color:'#1e293b',marginTop:'2px'}}>{activeModel.bestFor}</div>
            <div style={{marginTop:'6px',color:'#475569'}}>{'⚡'.repeat(activeModel.speed)} {activeModel.speed===3?'ultra-fast':activeModel.speed===2?'standard':'deep'}</div>
          </div>

          <button onClick={()=>setShowSettings(false)}
            style={{...B,width:'100%',marginTop:'10px',padding:'7px',fontSize:'11px',backgroundColor:'transparent',color:'#334155',outline:'1px solid #1e293b'}}>
            Close Settings
          </button>
        </div>
      )}

      {/* ── Main layout ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left sidebar */}
        <div style={{width:'215px',flexShrink:0,borderRight:'1px solid #0a1a2e',backgroundColor:'#020c06',overflowY:'auto',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'12px 14px 8px',fontSize:'10px',color:'#2a5a30',letterSpacing:'0.12em',fontWeight:700}}>ARTIFACTS · {artifacts.length}</div>
          {artifacts.map(f=>{
            const active=selected===f, col=stageColor(f);
            return (
              <div key={f} style={{display:'flex',alignItems:'center',borderLeft:`2px solid ${active?col:'transparent'}`,backgroundColor:active?'#0a1509':'transparent'}}>
                <button onClick={()=>setSelected(f)} style={{flex:1,padding:'8px 12px',textAlign:'left',cursor:'pointer',border:'none',...MONO,fontSize:'11px',backgroundColor:'transparent',color:active?col:'#475569'}}>
                  <span style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:col,display:'inline-block',marginRight:'7px',verticalAlign:'middle'}}/>
                  {humanName(f)}
                </button>
              </div>
            );
          })}
          {artifacts.length===0 && <div style={{padding:'14px',fontSize:'11px',color:'#334155',lineHeight:1.7}}>No artifacts yet.<br/>Run an idea first.</div>}

          {selected && downstreamStages.length>0 && (
            <div style={{margin:'10px 14px',padding:'10px',backgroundColor:'#040b14',border:'1px solid #0a2a14',borderRadius:'4px'}}>
              <div style={{fontSize:'10px',color:'#2a5a30',marginBottom:'6px',letterSpacing:'0.1em',fontWeight:700}}>DOWNSTREAM · {downstreamStages.length}</div>
              {downstreamStages.slice(0,5).map(n=><div key={n} style={{fontSize:'10px',color:'#475569',marginBottom:'3px'}}>↓ {STAGE_LABELS[n]}</div>)}
              {downstreamStages.length>5 && <div style={{fontSize:'10px',color:'#334155'}}>+ {downstreamStages.length-5} more</div>}
            </div>
          )}

          {history.length>0 && (
            <>
              <div style={{padding:'10px 14px 6px',marginTop:'8px',fontSize:'10px',color:'#2a5a30',letterSpacing:'0.12em',fontWeight:700,borderTop:'1px solid #0a1a2e'}}>HISTORY · {history.length}</div>
              {history.slice(0,8).map((h,i)=>(
                <div key={i} style={{padding:'6px 14px',fontSize:'10px',lineHeight:1.5,borderBottom:'1px solid #060e09'}}>
                  <div style={{color:'#475569'}}>{humanName(h.file+'.md')}</div>
                  <div style={{color:'#334155',marginTop:'1px',fontSize:'9px'}}>{h.time} · {h.model} · {h.tokens.toLocaleString()}t{settings.showCosts?` · $${h.cost.toFixed(4)}`:''}</div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Centre */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {result && uiState==='previewed' && (
            <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 14px',backgroundColor:'#020c06',borderBottom:'1px solid #0a1a2e',flexShrink:0}}>
              {(['original','split','improved'] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)} style={{...B,padding:'4px 10px',fontSize:'10px',
                  backgroundColor:view===v?'#0a1f0e':'transparent',
                  color:view===v?'#4ade80':'#475569',
                  outline:view===v?'1px solid #4ade8033':'1px solid #1e293b'}}>
                  {v.toUpperCase()}
                </button>
              ))}
              <div style={{flex:1}}/>
              {settings.showCosts && result && (
                <span style={{fontSize:'11px',color:'#475569'}}>
                  <span style={{color:activeModel.color}}>{result.modelKey}</span> ·{' '}
                  <span style={{color:'#818cf8'}}>{result.tokens?.total?.toLocaleString()} tok</span> ·{' '}
                  <span style={{color:'#4ade80'}}>${result.cost?.toFixed(4)}</span>
                </span>
              )}
              <button onClick={()=>handleDownload(selected!,result.improved)} style={{...B,padding:'4px 9px',fontSize:'10px',backgroundColor:'#0a0f1e',color:'#818cf8',outline:'1px solid #818cf833'}}>↓ Improved</button>
            </div>
          )}

          {!selected && (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'14px',padding:'40px'}}>
              <div style={{fontSize:'28px',opacity:.1}}>◈</div>
              <div style={{fontSize:'14px',color:'#334155'}}>Select an artifact to begin</div>
              <div style={{padding:'14px 18px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'4px',fontSize:'12px',color:'#334155',lineHeight:1.9,maxWidth:'360px'}}>
                <div style={{color:'#475569',marginBottom:'6px',fontWeight:700,fontSize:'11px',letterSpacing:'0.08em'}}>WORKFLOW</div>
                <div>① Select an artifact from the left rail</div>
                <div>② Choose your model (8 providers available)</div>
                <div>③ Describe improvement intent or use a preset</div>
                <div>④ Choose Extent and Scope</div>
                <div>⑤ Upload reference docs (optional)</div>
                <div>⑥ Click ◈ IMPROVE NOW → before/after split view</div>
                <div>⑦ Accept to save · Discard to cancel</div>
              </div>
            </div>
          )}

          {selected && loading && <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:'12px',color:'#475569'}}>Loading artifact…</span></div>}

          {selected && !loading && uiState==='idle' && displayContent && (
            <div style={{flex:1,overflowY:'auto',padding:'22px 26px'}}>
              <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'14px',fontWeight:700}}>CURRENT · {selected}</div>
              <MD content={displayContent} fs={12}/>
            </div>
          )}

          {uiState==='loading' && (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'12px'}}>
              <div style={{fontSize:'12px',color:'#475569',letterSpacing:'0.1em'}}>GENERATING…</div>
              <div style={{fontSize:'11px',color:activeModel.color}}>{activeModel.label} · {activeModel.provider}</div>
              <div style={{fontSize:'10px',color:'#334155'}}>{activeModel.bestFor}{docs.length>0?` · ${docs.length} ref doc${docs.length>1?'s':''} injected`:''}</div>
            </div>
          )}

          {uiState==='accepted' && (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'12px'}}>
              <div style={{fontSize:'28px',color:'#4ade80'}}>✓</div>
              <div style={{fontSize:'14px',color:'#4ade80',fontWeight:700}}>Improvement accepted and saved</div>
              <div style={{fontSize:'11px',color:'#475569'}}>{selected} updated on disk</div>
              {result && settings.showCosts && <div style={{fontSize:'11px',color:'#334155'}}>{result.tokens?.total?.toLocaleString()} tokens · ${result.cost?.toFixed(4)}</div>}
              <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                <button onClick={handleDiscard} style={{...B,padding:'7px 16px',fontSize:'11px',backgroundColor:'#0a1509',color:'#4ade80',outline:'1px solid #1a3a20'}}>Improve again</button>
                <button onClick={()=>handleDownload(selected!,displayContent)} style={{...B,padding:'7px 16px',fontSize:'11px',backgroundColor:'#0a0f1e',color:'#818cf8',outline:'1px solid #818cf833'}}>↓ Download</button>
              </div>
            </div>
          )}

          {result && uiState==='previewed' && view==='split' && (
            <div style={{flex:1,display:'flex',overflow:'hidden'}}>
              <div style={{flex:1,overflowY:'auto',padding:'18px 22px',borderRight:'1px solid #0a1a2e'}}>
                <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'12px',fontWeight:700}}>ORIGINAL</div>
                <MD content={parseContent(result.original)} fs={12}/>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
                <div style={{fontSize:'10px',color:'#4ade8077',letterSpacing:'0.1em',marginBottom:'12px',fontWeight:700}}>IMPROVED · {result.modelKey}</div>
                <MD content={result.improved} fs={12}/>
              </div>
            </div>
          )}
          {result && uiState==='previewed' && view==='original' && (
            <div style={{flex:1,overflowY:'auto',padding:'18px 26px'}}><div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'12px',fontWeight:700}}>ORIGINAL · {selected}</div><MD content={parseContent(result.original)} fs={12}/></div>
          )}
          {result && uiState==='previewed' && view==='improved' && (
            <div style={{flex:1,overflowY:'auto',padding:'18px 26px'}}><div style={{fontSize:'10px',color:'#4ade8077',letterSpacing:'0.1em',marginBottom:'12px',fontWeight:700}}>IMPROVED · {selected}</div><MD content={result.improved} fs={13}/></div>
          )}

          {error && <div style={{padding:'9px 16px',backgroundColor:'#150005',borderTop:'1px solid #f8717133',flexShrink:0}}><span style={{fontSize:'11px',color:'#f87171'}}>⚠ {error}</span></div>}
        </div>

        {/* Right panel */}
        <div style={{width:'272px',flexShrink:0,borderLeft:'1px solid #0a1a2e',backgroundColor:'#020c06',display:'flex',flexDirection:'column',overflowY:'auto'}}>
          <div style={{padding:'14px'}}>
            <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.12em',marginBottom:'7px',fontWeight:700}}>IMPROVEMENT INTENT</div>
            <textarea value={intent} onChange={e=>setIntent(e.target.value)}
              placeholder='e.g. "Strengthen competitive moat with defensible advantage and long-term implications"'
              style={{width:'100%',minHeight:'80px',padding:'9px',...MONO,fontSize:'11px',color:'#64748b',backgroundColor:'#040b14',border:'1px solid #0f1923',borderRadius:'4px',resize:'vertical',outline:'none',lineHeight:1.65,boxSizing:'border-box' as const}}/>

            {/* Model info bar */}
            <div style={{display:'flex',alignItems:'center',gap:'6px',margin:'8px 0',padding:'6px 9px',backgroundColor:'#040b14',border:`1px solid ${activeModel.color}22`,borderRadius:'4px'}}>
              <div style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:activeModel.color,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:'10px',color:activeModel.color,fontWeight:700}}>{activeModel.label}</div>
                <div style={{fontSize:'9px',color:'#334155'}}>{activeModel.provider} · {activeModel.cost} · {activeModel.bestFor}</div>
              </div>
              <div style={{fontSize:'10px',color:'#334155'}}>{'⚡'.repeat(activeModel.speed)}</div>
            </div>

            <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'6px',marginTop:'10px',fontWeight:700}}>QUICK PRESETS</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'12px'}}>
              {PRESETS.map(p=><button key={p.label} onClick={()=>setIntent(p.intent)} style={{...B,padding:'3px 8px',fontSize:'10px',backgroundColor:'#040b14',color:'#475569',outline:'1px solid #1e293b'}}>{p.label}</button>)}
            </div>

            {/* Reference docs */}
            <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'6px',fontWeight:700}}>
              REFERENCE DOCUMENTS{docs.length>0 && <span style={{color:'#818cf855',fontWeight:400,marginLeft:'6px'}}>{docs.length} loaded</span>}
            </div>
            {docs.map(d=>(
              <div key={d.name} style={{padding:'7px 9px',backgroundColor:'#040b14',border:'1px solid #818cf822',borderRadius:'4px',marginBottom:'5px',display:'flex',alignItems:'center',gap:'7px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'10px',color:'#818cf8',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>◆ {d.name}</div>
                  <div style={{fontSize:'9px',color:'#475569',marginTop:'1px'}}>{d.chars.toLocaleString()} chars</div>
                </div>
                <button onClick={()=>setDocs(p=>p.filter(x=>x.name!==d.name))} style={{background:'none',border:'none',color:'#334155',cursor:'pointer',fontSize:'15px',lineHeight:1}}>×</button>
              </div>
            ))}
            <label style={{display:'block',padding:'10px',backgroundColor:'#040b14',border:'1px dashed #1e293b',borderRadius:'4px',cursor:'pointer',marginBottom:'10px',textAlign:'center' as const}}>
              <div style={{fontSize:'11px',color:uplLoading?'#475569':'#64748b'}}>{uplLoading?'⟳ Extracting…':'+ Upload Reference Document'}</div>
              <div style={{fontSize:'9px',color:'#334155',marginTop:'2px'}}>PDF · DOCX · TXT · MD · multiple allowed</div>
              <input ref={uploadRef} type="file" accept=".pdf,.docx,.txt,.md,.csv" multiple onChange={handleUpload} style={{display:'none'}}/>
            </label>
            {uplError && <div style={{fontSize:'10px',color:'#f87171',marginBottom:'8px',lineHeight:1.5}}>⚠ {uplError}</div>}

            {/* Extent */}
            <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'5px',fontWeight:700}}>EXTENT</div>
            <div style={{display:'flex',gap:'4px',marginBottom:'4px'}}>
              {([['light','#4ade80','Polish wording'],['medium','#f59e0b','Improve sections'],['strong','#f87171','Restructure']] as const).map(([e,c,sub])=>(
                <button key={e} onClick={()=>setExtent(e as Extent)} style={{...B,padding:'5px 8px',fontSize:'10px',
                  backgroundColor:extent===e?'#0a1f0e':'#0d1117',color:extent===e?c:'#475569',outline:extent===e?`1px solid ${c}55`:'1px solid #1e293b'}}>
                  {e.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{fontSize:'10px',color:'#334155',marginBottom:'12px'}}>
              {extent==='light'?<span style={{color:'#4ade80'}}>Polish wording</span>:extent==='medium'?<span style={{color:'#f59e0b'}}>Improve sections</span>:<span style={{color:'#f87171'}}>Restructure artifact</span>}
            </div>

            {/* Scope */}
            <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'5px',fontWeight:700}}>SCOPE</div>
            <div style={{display:'flex',gap:'4px',marginBottom:'4px'}}>
              {(['block','stage','project'] as Scope[]).map(s=>(
                <button key={s} onClick={()=>setScope(s)} style={{...B,padding:'5px 8px',fontSize:'10px',
                  backgroundColor:scope===s?'#0a0f1e':'#0d1117',color:scope===s?'#818cf8':'#475569',outline:scope===s?'1px solid #818cf855':'1px solid #1e293b'}}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{fontSize:'10px',color:'#334155',marginBottom:'16px'}}>
              {scope==='block'?'Selected section only':scope==='stage'?'Full artifact for this stage':'Cross-artifact PM consistency'}
            </div>

            {/* Improve button */}
            <button onClick={handleImprove} disabled={!selected||!intent.trim()||uiState==='loading'}
              style={{width:'100%',padding:'12px 0',fontSize:'13px',...MONO,cursor:'pointer',borderRadius:'4px',border:'none',letterSpacing:'0.1em',fontWeight:700,
                backgroundColor:(!selected||!intent.trim())?'#0a1509':'#0d2a10',
                color:(!selected||!intent.trim())?'#1a3a20':'#4ade80',
                outline:'1px solid #1a3a20'}}>
              {uiState==='loading'?'⟳ GENERATING…':'◈ IMPROVE NOW'}
            </button>
            <div style={{fontSize:'9px',color:'#1e293b',textAlign:'center' as const,marginTop:'5px'}}>{activeModel.label} · {activeModel.provider} · {activeModel.cost}</div>
          </div>

          {/* Result panel */}
          {result && uiState==='previewed' && (
            <div style={{padding:'0 14px 14px',borderTop:'1px solid #0a1a2e'}}>
              <div style={{display:'flex',gap:'7px',padding:'12px 0 10px'}}>
                <button onClick={handleAccept} style={{flex:2,padding:'9px 0',fontSize:'12px',cursor:'pointer',...MONO,borderRadius:'3px',border:'none',fontWeight:700,backgroundColor:'#0a1f0e',color:'#4ade80',outline:'1px solid #4ade8033',letterSpacing:'0.08em'}}>✓ ACCEPT & SAVE</button>
                <button onClick={handleDiscard} style={{flex:1,padding:'9px 0',fontSize:'11px',cursor:'pointer',...MONO,borderRadius:'3px',border:'none',backgroundColor:'transparent',color:'#475569',outline:'1px solid #1e293b'}}>DISCARD</button>
              </div>

              {settings.showCosts && (
                <div style={{padding:'9px',backgroundColor:'#040b14',border:'1px solid #0f1923',borderRadius:'4px',marginBottom:'10px'}}>
                  <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'8px',fontWeight:700}}>USAGE · {result.modelKey}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'5px',textAlign:'center' as const}}>
                    {[{l:'Input',v:result.tokens?.input?.toLocaleString()??'—',c:'#475569'},{l:'Output',v:result.tokens?.output?.toLocaleString()??'—',c:'#818cf8'},{l:'Cost',v:`$${result.cost?.toFixed(4)??'—'}`,c:'#4ade80'}].map(x=>(
                      <div key={x.l}><div style={{fontSize:'13px',color:x.c,fontWeight:700}}>{x.v}</div><div style={{fontSize:'8px',color:'#334155',marginTop:'2px'}}>{x.l}</div></div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'6px',fontWeight:700}}>PM REASONING</div>
              <div style={{padding:'9px',backgroundColor:'#040b14',border:'1px solid #0a2a14',borderRadius:'4px',fontSize:'11px',color:'#4ade8099',lineHeight:1.75,marginBottom:'10px'}}>
                {result.reasoning||'No reasoning returned.'}
              </div>

              {(result.impactWarnings?.length??0)>0 && (
                <>
                  <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'6px',fontWeight:700}}>DOWNSTREAM IMPACT</div>
                  {result.impactWarnings.map((w,i)=><div key={i} style={{padding:'7px 9px',backgroundColor:'#0a0800',border:'1px solid #f59e0b33',borderRadius:'4px',fontSize:'10px',color:'#f59e0b99',lineHeight:1.6,marginBottom:'5px'}}>▲ {w}</div>)}
                </>
              )}
              {(result.impactWarnings?.length??0)===0 && <div style={{padding:'7px 9px',backgroundColor:'#040b14',border:'1px solid #0a2a14',borderRadius:'4px',fontSize:'10px',color:'#2a5a30'}}>✓ No downstream impacts identified</div>}

              {downstreamStages.length>0 && (
                <div style={{marginTop:'10px',padding:'9px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'4px'}}>
                  <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'6px',fontWeight:700}}>POTENTIALLY STALE</div>
                  {downstreamStages.map(n=><div key={n} style={{fontSize:'10px',color:'#475569',marginBottom:'2px'}}>↓ Stage {n}: {STAGE_LABELS[n]}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
