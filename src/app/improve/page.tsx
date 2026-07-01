'use client';

// src/app/improve/page.tsx
// IdeaGate V3.1 — Artifact Refinement + Builder Package Export
//
// Key changes from previous version:
// - Uses parseContent from @/lib/parseContent (robust 3-strategy parser)
// - Dead states replaced with guidance
// - Build destination section added at bottom of right panel
// - 11 models: 8 paid (OpenRouter) + 3 free tier (OpenRouter :free)
//   Free tier: Nemotron 3 Super · Ring 2.6 1T · GPT-OSS 120B
// - RuntimeContext integration preserved

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGlobalStore, getModelMeta, isModelFree } from '@/lib/GlobalStore';
import { parseContent, parseContentDetailed } from '@/lib/parseContent';
import { useRuntime, getTransitiveDownstream } from '@/lib/RuntimeContext';
import { MODEL_REGISTRY } from '@/lib/model-registry';

// ── Model catalog ─────────────────────────────────────────────────────────────
// tier: 'paid'  = billed per token via OpenRouter
// tier: 'free'  = OpenRouter free tier — rate-limited, $0 cost
// Recommended free priority: owlalpha → nemotron → ring → gptoss
const MODELS = [
  // ── Paid models ───────────────────────────────────────────────────────────
  { key:'haiku',    label:'Haiku',             tier:'paid', provider:'Anthropic',   color:'#22c55e', cost:'$0.25/M',  speed:3, use:'Fast edits'                    },
  { key:'sonnet',   label:'Sonnet',            tier:'paid', provider:'Anthropic',   color:'#818cf8', cost:'$3/M',     speed:2, use:'PM reasoning'                  },
  { key:'deepseek', label:'DeepSeek R1',       tier:'paid', provider:'DeepSeek',    color:'#38bdf8', cost:'$0.55/M',  speed:1, use:'Technical depth'               },
  { key:'llama',    label:'Llama 3.3',         tier:'paid', provider:'Meta',         color:'#f59e0b', cost:'$0.59/M',  speed:3, use:'Fast drafts'                   },
  { key:'qwen',     label:'Qwen 2.5',          tier:'paid', provider:'Alibaba',      color:'#fde047', cost:'$0.13/M',  speed:2, use:'Low-cost'                      },
  { key:'mistral',  label:'Mistral',           tier:'paid', provider:'Mistral',      color:'#f472b6', cost:'$2/M',     speed:2, use:'Structured output'             },
  { key:'gpt4o',    label:'GPT-4o',            tier:'paid', provider:'OpenAI',       color:'#4ade80', cost:'$2.5/M',   speed:2, use:'PM evaluation'                },
  // gemini removed: google/gemini-flash-1.5 → OpenRouter 404 (confirmed 2026-06-27)
  // ── Free tier models (OpenRouter :free suffix) ────────────────────────────
  { key:'nemotron', label:'Nemotron 3 Super',  tier:'free', provider:'NVIDIA',       color:'#84cc16', cost:'Free',     speed:2, use:'Large doc generation · 1M ctx' },
  // ring removed: inclusionai/ring-2.6-1t:free → OpenRouter 404 "no longer free" (confirmed 2026-06-27)
  { key:'gptoss',   label:'GPT-OSS 120B',      tier:'free', provider:'OpenAI',       color:'#22d3ee', cost:'Free',     speed:2, use:'PRD drafting · structured PM'  },
  { key:'owlalpha', label:'Owl Alpha',          tier:'free', provider:'OpenRouter',   color:'#a78bfa', cost:'Free',     speed:2, use:'Agentic · tool use · 1M ctx'    },
] as const;
type ModelKey = typeof MODELS[number]['key']; // 10 models: 7 paid + 3 free

// Registry-derived model list — available for Mission 12 dropdown components
// Original MODELS constant kept unchanged for backward compatibility
const REGISTRY_MODELS = MODEL_REGISTRY.filter(m => m.enabled && !m.comingSoon);

const STAGE_LABELS: Record<number,string> = {
   0:'Idea Intake',1:'Discovery',2:'Problem Def',3:'Solution Design',4:'MVP Hypothesis',
   5:'Validation',6:'Prioritization',7:'PRD',8:'UX Design',9:'Usability',
  10:'Architecture',11:'Backlog',12:'Implementation',13:'QA & Readiness',14:'Prototype',
};

type Extent  = 'light'|'medium'|'strong';
type Scope   = 'block'|'stage'|'project';
type UIState = 'idle'|'loading'|'previewed'|'accepted';

interface Result {
  original:string; improved:string; reasoning:string;
  impactWarnings:string[]; modelKey:string; modelId:string;
  tokens:{input:number;output:number;total:number}; cost:number; refDocs:number;
}
interface UpDoc { name:string; text:string; chars:number; }

const PRESETS = [
  { label:'More concise',            intent:'Make this more concise — remove redundancy, preserve all PM insights' },
  { label:'More strategic',          intent:'Strengthen strategic reasoning — sharper market framing, competitive logic, positioning' },
  { label:'More technical',          intent:'Add technical depth — implementation details, API rationale, engineering tradeoffs' },
  { label:'More MVP-focused',        intent:'Sharpen MVP scope — be opinionated about what ships first and explicitly why' },
  { label:'Competitive moat',        intent:'Strengthen moat — defensible advantage, durability, replication difficulty' },
  { label:'Market positioning',      intent:'Improve positioning — precise segment, positioning statement, differentiation evidence' },
  { label:'Long-term implications',  intent:'Expand long-term implications — compounding effects, platform potential, ecosystem dynamics' },
  { label:'Sharpen summary',         intent:'Rewrite summary to be crisper and interview-ready — one PM insight per sentence' },
  { label:'Add evidence',            intent:'Ground every claim in frameworks, data, or explicitly labelled assumptions' },
  { label:'Stronger recommendation', intent:'Make recommendations decisive — clear rationale, explicit tradeoffs, concrete next steps' },
  { label:'Improve structure',       intent:'Reorganise for PM logic — problem → insight → decision → artifact' },
];

// ── Builder platforms ─────────────────────────────────────────────────────────
const BUILDERS = [
  { id:'claude',     label:'Claude',       icon:'◆', color:'#818cf8', deepLink:'https://claude.ai/new' },
  { id:'chatgpt',    label:'ChatGPT',      icon:'◉', color:'#4ade80', deepLink:'https://chatgpt.com' },
  { id:'gemini',     label:'Gemini',       icon:'◈', color:'#38bdf8', deepLink:'https://gemini.google.com' },
  { id:'lovable',    label:'Lovable',      icon:'♥', color:'#f472b6', deepLink:'https://lovable.dev/projects/new' },
  { id:'bolt',       label:'Bolt',         icon:'⚡', color:'#f59e0b', deepLink:'https://bolt.new' },
  { id:'v0',         label:'v0',           icon:'▲', color:'#94a3b8', deepLink:'https://v0.dev/chat' },
  { id:'replit',     label:'Replit',       icon:'◎', color:'#22c55e', deepLink:'https://replit.com/new' },
  { id:'cursor',     label:'Cursor',       icon:'▸', color:'#64748b', deepLink:null },
  { id:'windsurf',   label:'Windsurf',     icon:'◌', color:'#64748b', deepLink:null },
  { id:'openhands',  label:'OpenHands',    icon:'◐', color:'#a78bfa', deepLink:'https://app.openhands.ai' },
] as const;

// ── Markdown renderer ─────────────────────────────────────────────────────────
function ir(text:string,k:string):React.ReactNode[]{
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p,i)=>{
    const key=`${k}-${i}`;
    if(p.startsWith('**')&&p.endsWith('**'))return<strong key={key}style={{color:'#94a3b8',fontWeight:700}}>{p.slice(2,-2)}</strong>;
    if(p.startsWith('`')&&p.endsWith('`')&&p.length>2)return<code key={key}style={{background:'#0d1117',color:'#4ade80',padding:'1px 5px',borderRadius:'3px',fontSize:'11px'}}>{p.slice(1,-1)}</code>;
    return<React.Fragment key={key}>{p}</React.Fragment>;
  });
}
function MD({content,fs=12}:{content:string;fs?:number}){
  const M:React.CSSProperties={fontFamily:"'JetBrains Mono','Fira Code',monospace"};
  return(
    <div>{content.split('\n').map((line,i)=>{
      const t=line.trim(),k=`l${i}`;
      if(!t)return<div key={k}style={{height:'7px'}}/>;
      if(t==='---'||t==='***')return<div key={k}style={{borderTop:'1px solid #1e293b',margin:'14px 0'}}/>;
      if(t.startsWith('# '))return<div key={k}style={{marginTop:i===0?0:'22px',marginBottom:'10px',paddingBottom:'8px',borderBottom:'1px solid #1e293b',fontSize:'17px',color:'#e2e8f0',fontWeight:700,...M}}>{ir(t.slice(2),k)}</div>;
      if(t.startsWith('## '))return<div key={k}style={{marginTop:'16px',marginBottom:'6px',fontSize:'13px',color:'#94a3b8',fontWeight:700,...M}}>{ir(t.slice(3),k)}</div>;
      if(t.startsWith('### '))return<div key={k}style={{marginTop:'12px',marginBottom:'4px',fontSize:'11px',color:'#64748b',fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.05em',...M}}>{ir(t.slice(4),k)}</div>;
      if(t.startsWith('#### '))return<div key={k}style={{marginTop:'9px',marginBottom:'3px',fontSize:'11px',color:'#475569',fontWeight:600,...M}}>{ir(t.slice(5),k)}</div>;
      if(t.startsWith('> '))return<div key={k}style={{margin:'6px 0',padding:'6px 12px',borderLeft:'3px solid #4ade8033',background:'#040f08',fontSize:`${fs}px`,color:'#4ade8088',...M}}>{ir(t.slice(2),k)}</div>;
      const bm=line.match(/^(\s*)([-*])\s+(.+)/);
      if(bm)return<div key={k}style={{display:'flex',gap:'7px',marginLeft:Math.floor(bm[1].length/2)*14,margin:'2px 0'}}><span style={{color:'#4ade8055',flexShrink:0,fontSize:'11px'}}>▸</span><span style={{fontSize:`${fs}px`,color:'#64748b',lineHeight:1.7,...M}}>{ir(bm[3],k)}</span></div>;
      const om=line.match(/^(\s*)(\d+)\.\s+(.+)/);
      if(om)return<div key={k}style={{display:'flex',gap:'8px',margin:'2px 0'}}><span style={{fontSize:`${fs}px`,color:'#475569',flexShrink:0,minWidth:'20px',textAlign:'right' as const,...M}}>{om[2]}.</span><span style={{fontSize:`${fs}px`,color:'#64748b',lineHeight:1.7,...M}}>{ir(om[3],k)}</span></div>;
      if(t.startsWith('|')){return<div key={k}style={{fontSize:`${Math.max(fs-1,10)}px`,color:'#475569',borderBottom:'1px solid #0f1923',padding:'3px 0',...M}}>{t}</div>;}
      return<div key={k}style={{fontSize:`${fs}px`,color:'#64748b',lineHeight:1.8,...M}}>{ir(t,k)}</div>;
    })}</div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const stageNum   = (f:string) => parseInt(f.split('-')[0],10)||0;
const stageColor = (f:string) => { const n=stageNum(f); return n<=2?'#22c55e':n<=5?'#38bdf8':n<=9?'#a78bfa':n<=11?'#fb923c':'#fde047'; };
const humanName  = (f:string) => f.replace('.md','').replace(/^\d+-/,'').replace(/-/g,' ');

// Stage-based improvement suggestions (replaces dead "select an artifact" state)
const STAGE_SUGGESTIONS = [
  { file:'1-discovery.md',    hint:'Start here — strongest foundation for the build package' },
  { file:'7-prd.md',          hint:'Most complex artifact — highest improvement value' },
  { file:'4-mvp-hypothesis.md',hint:'Highest downstream impact — changes propagate to 10 artifacts' },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ImprovePage() {
  const runtime = useRuntime();
  const MONO: React.CSSProperties = { fontFamily:"'JetBrains Mono','Fira Code',monospace" };

  const [artifacts,  setArtifacts]  = useState<string[]>([]);
  const [stage,      setStage]      = useState(0);
  const [selected,   setSelected]   = useState<string|null>(null);
  const [rawContent, setRawContent] = useState<string|null>(null);
  const [parseWarn,  setParseWarn]  = useState<string|null>(null);
  const [fileLoading,setFileLoading]= useState(false);

  const [intent,   setIntent]   = useState('');
  const [extent,   setExtent]   = useState<Extent>('medium');
  const [scope,    setScope]    = useState<Scope>('stage');
  // Model key is driven by GlobalStore settings — persists across pages and reloads
  const { state: { settings: gs }, updateSettings } = useGlobalStore();
  const modelKey = gs.defaultModel as ModelKey;
  const setModelKey = (k: ModelKey) => updateSettings({ defaultModel: k });

  const [docs,       setDocs]       = useState<UpDoc[]>([]);
  const [uplLoading, setUplLoading] = useState(false);
  const [uplError,   setUplError]   = useState<string|null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [uiState, setUiState] = useState<UIState>('idle');
  const [result,  setResult]  = useState<Result|null>(null);
  const [error,   setError]   = useState<string|null>(null);
  const [view,    setView]    = useState<'original'|'split'|'improved'>('split');

  // Build section state
  const [showBuild,   setShowBuild]   = useState(false);
  const [buildTarget, setBuildTarget] = useState<string>('claude');
  const [buildLoading,setBuildLoading]= useState(false);
  const [buildPackage,setBuildPackage]= useState<Record<string,{content:string;deepLink:string|null;chars:number;emphasis:string}>|null>(null);
  const [copied,      setCopied]      = useState<string|null>(null);

  // Panel tabs
  const [panel, setPanel] = useState<'graph'|'events'|'reasoning'>('graph');

  useEffect(()=>{
    fetch('/api/data').then(r=>r.json()).then(d=>{
      setArtifacts(d.artifacts??[]);
      setStage(d.currentStage??0);
    }).catch(()=>{});
  },[]);

  // Load artifact — now uses parseContentDetailed for warning visibility
  useEffect(()=>{
    setResult(null); setUiState('idle'); setError(null); setRawContent(null); setParseWarn(null);
    if (!selected) return;
    setFileLoading(true);
    fetch(`/api/improve?file=${encodeURIComponent(selected)}`).then(r=>r.json())
      .then(d => {
        const raw = d.content ?? '[No content]';
        const { content, method, warning } = parseContentDetailed(raw);
        setRawContent(content);
        if (warning) setParseWarn(`${warning} (method: ${method})`);
        else if (method === 'raw_fallback') setParseWarn('Content displayed as raw — V2 parse may have partially failed');
        else setParseWarn(null);
      })
      .catch(e => { setRawContent(`[Error loading: ${e.message}]`); })
      .finally(() => setFileLoading(false));
  },[selected]);

  const activeModel = MODELS.find(m => m.key === modelKey) ?? (() => {
    const meta = getModelMeta(modelKey);
    return {
      key: modelKey,
      label: meta.label,
      tier: (isModelFree(modelKey) ? 'free' : 'paid') as 'free' | 'paid',
      provider: meta.provider,
      color: '#818cf8',
      cost: meta.cost,
      speed: 2,
      use: meta.best,
    };
  })();

  // ── Improve ───────────────────────────────────────────────────────────────
  const handleImprove = useCallback(async()=>{
    if (!selected || !intent.trim()) return;
    setUiState('loading'); setError(null); setResult(null);
    runtime.emitEvent({ type:'MODEL_ROUTED', payload:{ model:modelKey, artifact:selected, intent:intent.slice(0,60) } });
    try {
      const res = await fetch('/api/improve',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          action:'preview', artifactName:selected, intent:intent.trim(),
          extent, scope,
          model: modelKey,                           // key mapped to OpenRouter model ID in route
          apiKey: gs.openRouterApiKey ?? '',
          customModelId: gs.customModelId ?? '', // raw model ID if set in Settings → AI Models
          maxTokens: gs.tokenBudgetPerCall ?? 4000,
          extractedDocuments: docs.length>0 ? docs.map(d=>`[${d.name}]\n${d.text}`) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'LLM call failed');
      setResult(data); setUiState('previewed'); setView('split');
    } catch(e:any){
      setError(e.message); setUiState('idle');
    }
  },[selected,intent,extent,scope,modelKey,docs,runtime]);

  // ── Accept ────────────────────────────────────────────────────────────────
  const handleAccept = useCallback(async()=>{
    if (!result || !selected) return;
    setUiState('loading');
    try {
      const res = await fetch('/api/improve',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({action:'accept',artifactName:selected,content:result.improved}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Accept failed');
      runtime.markImproved(selected,{
        artifactName: selected, intent: intent.slice(0,80),
        reasoning: result.reasoning ?? '', model: result.modelKey,
        impactWarnings: result.impactWarnings ?? [], timestamp: new Date().toISOString(),
      }, result.tokens?.total??0, result.cost??0);
      setRawContent(result.improved);
      setUiState('accepted');
    } catch(e:any){ setError(e.message); setUiState('previewed'); }
  },[result,selected,intent,runtime]);

  const handleDiscard = ()=>{ setResult(null); setUiState('idle'); setError(null); };

  const handleDownload = (name:string, content:string|null)=>{
    if (!content) return;
    const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([content],{type:'text/markdown'})),download:name});
    a.click(); URL.revokeObjectURL(a.href);
  };

  const handleUpload = async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const files=Array.from(e.target.files??[]);
    if (!files.length) return;
    setUplLoading(true); setUplError(null);
    for (const file of files) {
      const form=new FormData(); form.append('file',file);
      try {
        const res=await fetch('/api/improve/extract',{method:'POST',body:form});
        const ct=res.headers.get('content-type')??'';
        if (!ct.includes('application/json')) throw new Error('Run: npm install pdf-parse mammoth');
        const data=await res.json();
        if (!res.ok||data.error) throw new Error(data.error??'Extraction failed');
        setDocs(p=>[...p.filter(d=>d.name!==data.fileName),{name:data.fileName,text:data.text,chars:data.charCount}]);
      } catch(e:any){ setUplError(`${file.name}: ${e.message}`); }
    }
    setUplLoading(false);
    if (uploadRef.current) uploadRef.current.value='';
  };

  // ── Build package ─────────────────────────────────────────────────────────
  const handleGenerateBuild = async()=>{
    setBuildLoading(true);
    try {
      const res = await fetch('/api/build', { method:'POST' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Build generation failed');
      setBuildPackage(data.adapters ?? null);
    } catch(e:any){ setError(`Build failed: ${(e as Error).message}`); }
    finally { setBuildLoading(false); }
  };

  const handleCopy = async(content:string, id:string)=>{
    try {
      await navigator.clipboard.writeText(content);
      setCopied(id);
      setTimeout(()=>setCopied(null),2000);
    } catch { setError('Clipboard write failed — please copy manually'); }
  };

  const handleOpenBuilder = (deepLink:string|null, content:string, id:string)=>{
    handleCopy(content, id);
    if (deepLink) { setTimeout(()=>window.open(deepLink,'_blank'),300); }
  };

  const downstreamCount = selected ? getTransitiveDownstream(selected).length : 0;
  const staleCount      = runtime.state.staleArtifacts.size;
  const B: React.CSSProperties = { ...MONO, cursor:'pointer', border:'none', borderRadius:'3px' };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',backgroundColor:'#020609',overflow:'hidden',...MONO,color:'#94a3b8'}}>
      <style>{`
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        ::-webkit-scrollbar-track{background:transparent} textarea::placeholder{color:#334155}
        button:disabled{opacity:.35;cursor:not-allowed!important}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
      `}</style>

      {/* ── Header ── */}
      <div style={{display:'flex',alignItems:'center',padding:'0 16px',height:'52px',backgroundColor:'#020c06',borderBottom:'1px solid #0a1a2e',flexShrink:0,gap:'10px'}}>
        <div>
          <div style={{fontSize:'14px',color:'#818cf8',fontWeight:700,letterSpacing:'0.1em'}}>REFINE</div>
          <div style={{fontSize:'9px',color:'#1a1a3a',letterSpacing:'0.08em'}}>ARTIFACT IMPROVEMENT ENGINE</div>
        </div>
        <div style={{width:'1px',height:'28px',backgroundColor:'#0a1a2e'}}/>
        <div style={{display:'flex',gap:'10px',fontSize:'10px'}}>
          <span style={{color:'#334155'}}><span style={{color:'#4ade80',fontWeight:700}}>{runtime.state.improvementCount}</span> improved</span>
          <span style={{color:'#334155'}}><span style={{color:staleCount>0?'#f59e0b':'#334155',fontWeight:700}}>{staleCount}</span> stale</span>
          {runtime.state.sessionTokens>0&&<span style={{color:'#334155'}}><span style={{color:'#818cf8'}}>{runtime.state.sessionTokens.toLocaleString()}</span>t <span style={{color:'#4ade80'}}>${runtime.state.sessionCost.toFixed(4)}</span></span>}
        </div>
        <div style={{width:'1px',height:'28px',backgroundColor:'#0a1a2e'}}/>

        {/* Local model picker removed Mission 12C — TopBar's ModelSelector is now the
            single source of model selection across all pages. */}
        <div style={{display:'flex',alignItems:'center',gap:'6px',flex:1}}>
          {/* Active model meta */}
          {(() => {
            const m = MODELS.find(x => x.key === modelKey);
            if (!m) return null;
            return (
              <span style={{fontSize:'10px',color:'#334155'}}>
                · {m.provider} · {m.cost} · {m.use}
              </span>
            );
          })()}
        </div>

        <div style={{display:'flex',gap:'4px'}}>
          {staleCount>0&&<button onClick={()=>runtime.clearStale()} style={{...B,padding:'4px 8px',fontSize:'9px',backgroundColor:'#0a0800',color:'#f59e0b',outline:'1px solid #f59e0b33'}}>△ {staleCount} stale</button>}
          {selected&&rawContent&&uiState==='idle'&&<button onClick={()=>handleDownload(selected,rawContent)} style={{...B,padding:'5px 10px',fontSize:'10px',backgroundColor:'#0a1509',color:'#4ade80',outline:'1px solid #1a3a20'}}>↓ MD</button>}
        </div>
      </div>

      {/* ── Graph/Events/Reasoning tab bar ── */}
      <div style={{borderBottom:'1px solid #0a1a2e',flexShrink:0,backgroundColor:'#020c06'}}>
        <div style={{display:'flex'}}>
          {(['graph','events','reasoning'] as const).map(p=>(
            <button key={p} onClick={()=>setPanel(p)} style={{...B,padding:'6px 12px',fontSize:'9px',borderRadius:0,
              backgroundColor:panel===p?'#040b14':'transparent',color:panel===p?'#4ade80':'#334155',
              borderBottom:panel===p?'1px solid #4ade80':'1px solid transparent',letterSpacing:'0.08em'}}>
              {p==='graph'?'◈ ARTIFACT GRAPH':p==='events'?'▶ EVENT FEED':'⟳ REASONING CHAIN'}
            </button>
          ))}
          <div style={{flex:1}}/>
          <span style={{fontSize:'9px',color:'#1e293b',alignSelf:'center',marginRight:'12px'}}>
            {panel==='graph'&&`15 nodes · ${staleCount} stale · ${Object.keys(runtime.state.artifactVersions).length} improved`}
            {panel==='events'&&`${runtime.state.events.length} events · BroadcastChannel active`}
            {panel==='reasoning'&&`${runtime.state.reasoningChain.length} entries`}
          </span>
        </div>

        {/* Mini artifact graph — inline, compact */}
        {panel==='graph'&&(
          <div style={{padding:'8px 16px',height:'100px',overflow:'hidden'}}>
            <svg viewBox="0 0 700 80" style={{width:'100%',height:'100%'}}>
              {/* Simple linear stage display */}
              {Array.from({length:15},(_,i)=>{
                const art = artifacts.find(a=>parseInt(a.split('-')[0],10)===i);
                const isStale = art?runtime.state.staleArtifacts.has(art):false;
                const ver = art?(runtime.state.artifactVersions[art]??0):0;
                const isSelected = art&&selected===art;
                const x = i*(700/15)+(700/30);
                const col = isStale?'#f59e0b':isSelected?'#818cf8':ver>0?'#4ade80':'#1e293b';
                const r = isSelected?8:5;
                return(
                  <g key={i} onClick={()=>art&&setSelected(art)} style={{cursor:art?'pointer':'default'}}>
                    {i>0&&<line x1={x-700/15} y1={40} x2={x} y2={40} stroke="#1e293b" strokeWidth={1}/>}
                    <circle cx={x} cy={40} r={r} fill={col} stroke={isSelected?'#818cf8':'transparent'} strokeWidth={2}/>
                    {ver>0&&<text x={x} y={28} fontSize="7" fill="#4ade8088" textAnchor="middle">v{ver}</text>}
                    <text x={x} y={60} fontSize="6.5" fill={isSelected?'#818cf8':isStale?'#f59e0b':'#334155'} textAnchor="middle">
                      {STAGE_LABELS[i]?.split(' ')[0]?.slice(0,7)}
                    </text>
                    {isStale&&<text x={x} y={72} fontSize="7" fill="#f59e0b" textAnchor="middle">△</text>}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {panel==='events'&&(
          <div style={{maxHeight:'100px',overflowY:'auto',backgroundColor:'#020c06'}}>
            {runtime.state.events.length===0?(
              <div style={{padding:'10px 16px',fontSize:'10px',color:'#1e293b',lineHeight:1.7}}>
                No events yet. Improve an artifact to see runtime activity.
                <span style={{display:'block',color:'#334155',marginTop:'4px'}}>Events propagate here in real-time via BroadcastChannel — open Office in another tab to see cross-view sync.</span>
              </div>
            ):(
              runtime.state.events.slice(0,8).map((ev,i)=>(
                <div key={ev.id??i} style={{padding:'5px 16px',borderBottom:'1px solid #060e09',display:'flex',gap:'8px'}}>
                  <span style={{fontSize:'8px',color:'#1a3a20',flexShrink:0}}>{new Date(ev.timestamp).toLocaleTimeString('en',{hour12:false})}</span>
                  <span style={{fontSize:'9px',color:ev.type==='ARTIFACT_IMPROVED'?'#4ade80':ev.type==='ARTIFACTS_STALE'?'#f59e0b':'#475569'}}>
                    {ev.type.replace(/_/g,' ')}
                    {ev.payload.artifact!=null&&<span style={{color:'#334155',marginLeft:'6px'}}>{String(ev.payload.artifact).replace('.md','')}</span>}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {panel==='reasoning'&&(
          <div style={{maxHeight:'100px',overflowY:'auto',padding:'8px 16px',backgroundColor:'#020c06'}}>
            {runtime.state.reasoningChain.length===0?(
              <div style={{fontSize:'10px',color:'#1e293b',lineHeight:1.7}}>
                No improvements yet. Suggested start:
                {STAGE_SUGGESTIONS.map(s=>(
                  <span key={s.file} onClick={()=>setSelected(s.file)}
                    style={{display:'block',color:'#334155',cursor:'pointer',marginTop:'3px',padding:'3px 6px',border:'1px solid #1e293b',borderRadius:'2px'}}>
                    → {humanName(s.file)} — {s.hint}
                  </span>
                ))}
              </div>
            ):(
              runtime.state.reasoningChain.slice(0,5).map((r,i)=>(
                <div key={i} style={{padding:'5px 0',borderBottom:'1px solid #060e09'}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:'9px',color:'#4ade80',fontWeight:700}}>{humanName(r.artifactName+'.md')}</span>
                    <span style={{fontSize:'8px',color:'#334155'}}>{r.model} · {new Date(r.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{fontSize:'9px',color:'#64748b',lineHeight:1.5,marginTop:'2px'}}>{r.reasoning.slice(0,100)}…</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Main layout ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left sidebar */}
        <div style={{width:'210px',flexShrink:0,borderRight:'1px solid #0a1a2e',backgroundColor:'#020c06',overflowY:'auto',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'10px 14px 6px',fontSize:'10px',color:'#2a5a30',letterSpacing:'0.12em',fontWeight:700}}>ARTIFACTS · {artifacts.length}</div>

          {/* Suggested starting points when nothing selected */}
          {!selected&&artifacts.length>0&&(
            <div style={{margin:'6px 12px 10px',padding:'8px',backgroundColor:'#040b14',border:'1px solid #4ade8022',borderRadius:'3px'}}>
              <div style={{fontSize:'9px',color:'#2a5a30',fontWeight:700,marginBottom:'5px',letterSpacing:'0.08em'}}>SUGGESTED START</div>
              {STAGE_SUGGESTIONS.filter(s=>artifacts.includes(s.file)).map(s=>(
                <div key={s.file} onClick={()=>setSelected(s.file)}
                  style={{fontSize:'9px',color:'#4ade8077',cursor:'pointer',padding:'3px 0',lineHeight:1.5,borderBottom:'1px solid #060e09'}}>
                  <span style={{color:'#4ade80'}}>→ {humanName(s.file)}</span>
                  <span style={{display:'block',color:'#334155'}}>{s.hint}</span>
                </div>
              ))}
            </div>
          )}

          {artifacts.map(f=>{
            const active=selected===f,col=stageColor(f);
            const isStale=runtime.isStale(f), ver=runtime.getVersion(f);
            return(
              <div key={f} style={{display:'flex',borderLeft:`2px solid ${active?col:isStale?'#f59e0b33':'transparent'}`,backgroundColor:active?'#0a1509':'transparent'}}>
                <button onClick={()=>setSelected(f)} style={{flex:1,padding:'7px 12px',textAlign:'left',cursor:'pointer',border:'none',...MONO,fontSize:'10px',backgroundColor:'transparent',color:active?col:isStale?'#f59e0b':'#475569'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{width:'5px',height:'5px',borderRadius:'50%',backgroundColor:isStale?'#f59e0b':ver>0?'#4ade80':col,flexShrink:0,display:'inline-block'}}/>
                    <span style={{lineHeight:1.4}}>{humanName(f)}</span>
                    {ver>0&&<span style={{fontSize:'8px',color:'#4ade8066'}}>v{ver}</span>}
                    {isStale&&<span style={{fontSize:'7px',color:'#f59e0b88'}}>△</span>}
                  </div>
                </button>
              </div>
            );
          })}

          {selected&&downstreamCount>0&&(
            <div style={{margin:'8px 12px',padding:'8px',backgroundColor:'#040b14',border:'1px solid #0a2a14',borderRadius:'3px'}}>
              <div style={{fontSize:'9px',color:'#2a5a30',marginBottom:'5px',fontWeight:700,letterSpacing:'0.08em'}}>DOWNSTREAM · {downstreamCount}</div>
              {getTransitiveDownstream(selected).slice(0,5).map(n=>(
                <div key={n} style={{fontSize:'9px',color:runtime.isStale(n)?'#f59e0b':'#475569',marginBottom:'2px'}}>
                  ↓ {humanName(n)} {runtime.isStale(n)?'△':''}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Centre content */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {result&&uiState==='previewed'&&(
            <div style={{display:'flex',alignItems:'center',gap:'5px',padding:'7px 14px',backgroundColor:'#020c06',borderBottom:'1px solid #0a1a2e',flexShrink:0}}>
              {(['original','split','improved'] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)} style={{...B,padding:'4px 9px',fontSize:'9px',
                  backgroundColor:view===v?'#0a1f0e':'transparent',color:view===v?'#4ade80':'#475569',
                  outline:view===v?'1px solid #4ade8033':'1px solid #1e293b'}}>
                  {v.toUpperCase()}
                </button>
              ))}
              <div style={{flex:1}}/>
              <span style={{fontSize:'10px',color:'#475569'}}>
                <span style={{color:activeModel.color}}>{result.modelKey}</span> · <span style={{color:'#818cf8'}}>{result.tokens?.total?.toLocaleString()} tok</span> · <span style={{color:'#4ade80'}}>${result.cost?.toFixed(4)}</span>
              </span>
              <button onClick={()=>handleDownload(selected!,result.improved)} style={{...B,padding:'4px 8px',fontSize:'9px',backgroundColor:'#0a0f1e',color:'#818cf8',outline:'1px solid #818cf833'}}>↓ Improved</button>
            </div>
          )}

          {!selected&&(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'14px',padding:'32px'}}>
              <div style={{fontSize:'22px',opacity:.1}}>◈</div>
              <div style={{fontSize:'13px',color:'#334155'}}>Select an artifact from the left rail or click a node in the graph</div>
              <div style={{padding:'12px 16px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'4px',fontSize:'11px',color:'#334155',lineHeight:1.9,maxWidth:'340px'}}>
                <div style={{color:'#475569',marginBottom:'6px',fontWeight:700,fontSize:'10px',letterSpacing:'0.08em'}}>RUNTIME WORKFLOW</div>
                <div>① Click a stage node in the graph above</div>
                <div>② OR select from the artifact list on the left</div>
                <div>③ Choose your model (8 providers via OpenRouter)</div>
                <div>④ Describe your improvement intent or use a preset</div>
                <div>⑤ Click ◈ IMPROVE NOW — this makes a real LLM call</div>
                <div>⑥ Accept → artifact saved + stale state propagates</div>
                <div>⑦ Generate build package to send to any builder platform</div>
              </div>
            </div>
          )}

          {selected&&fileLoading&&<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:'11px',color:'#475569'}}>Loading artifact…</span></div>}

          {selected&&!fileLoading&&uiState==='idle'&&rawContent&&(
            <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',fontWeight:700}}>CURRENT · {selected}</div>
                {runtime.isStale(selected)&&<div style={{fontSize:'9px',color:'#f59e0b',padding:'1px 6px',border:'1px solid #f59e0b33',borderRadius:'2px'}}>△ STALE</div>}
                {runtime.getVersion(selected)>0&&<div style={{fontSize:'9px',color:'#4ade80',padding:'1px 6px',border:'1px solid #4ade8033',borderRadius:'2px'}}>v{runtime.getVersion(selected)}</div>}
              </div>
              {parseWarn&&<div style={{marginBottom:'10px',padding:'7px 10px',backgroundColor:'#0a0a00',border:'1px solid #f59e0b33',borderRadius:'3px',fontSize:'9px',color:'#f59e0b88'}}>{parseWarn}</div>}
              <MD content={rawContent} fs={12}/>
            </div>
          )}

          {uiState==='loading'&&(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'12px'}}>
              <div style={{fontSize:'12px',color:'#475569',letterSpacing:'0.1em',animation:'pulse 1.5s infinite'}}>GENERATING…</div>
              <div style={{fontSize:'11px',color:activeModel.color}}>{activeModel.label} · {activeModel.provider} · {activeModel.cost}</div>
              {docs.length>0&&<div style={{fontSize:'10px',color:'#818cf8'}}>{docs.length} reference doc{docs.length>1?'s':''} injected into context</div>}
            </div>
          )}

          {uiState==='accepted'&&(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'12px'}}>
              <div style={{fontSize:'24px',color:'#4ade80'}}>✓</div>
              <div style={{fontSize:'14px',color:'#4ade80',fontWeight:700}}>Improvement accepted · graph updated</div>
              <div style={{fontSize:'11px',color:'#475569'}}>{selected} saved to disk · {getTransitiveDownstream(selected!).length} downstream artifacts marked stale</div>
              {result&&<div style={{fontSize:'10px',color:'#334155'}}>{result.tokens?.total?.toLocaleString()} tokens · ${result.cost?.toFixed(4)} · {result.modelKey}</div>}
              <div style={{display:'flex',gap:'8px',marginTop:'6px'}}>
                <button onClick={handleDiscard} style={{...B,padding:'7px 14px',fontSize:'11px',backgroundColor:'#0a1509',color:'#4ade80',outline:'1px solid #1a3a20'}}>Improve again</button>
                <button onClick={()=>setShowBuild(true)} style={{...B,padding:'7px 14px',fontSize:'11px',backgroundColor:'#0a0f1e',color:'#818cf8',outline:'1px solid #818cf833'}}>Generate build package</button>
              </div>
            </div>
          )}

          {result&&uiState==='previewed'&&view==='split'&&(
            <div style={{flex:1,display:'flex',overflow:'hidden'}}>
              <div style={{flex:1,overflowY:'auto',padding:'16px 20px',borderRight:'1px solid #0a1a2e'}}>
                <div style={{fontSize:'9px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'10px',fontWeight:700}}>ORIGINAL</div>
                <MD content={result.original} fs={12}/>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
                <div style={{fontSize:'9px',color:'#4ade8077',letterSpacing:'0.1em',marginBottom:'10px',fontWeight:700}}>IMPROVED · {result.modelKey}</div>
                <MD content={result.improved} fs={12}/>
              </div>
            </div>
          )}
          {result&&uiState==='previewed'&&view==='original'&&<div style={{flex:1,overflowY:'auto',padding:'16px 24px'}}><MD content={result.original} fs={12}/></div>}
          {result&&uiState==='previewed'&&view==='improved'&&<div style={{flex:1,overflowY:'auto',padding:'16px 24px'}}><MD content={result.improved} fs={13}/></div>}

          {error&&<div style={{padding:'8px 16px',backgroundColor:'#150005',borderTop:'1px solid #f8717133',flexShrink:0,fontSize:'11px',color:'#f87171'}}>⚠ {error}</div>}
        </div>

        {/* Right panel */}
        <div style={{width:'270px',flexShrink:0,borderLeft:'1px solid #0a1a2e',backgroundColor:'#020c06',display:'flex',flexDirection:'column',overflowY:'auto'}}>
          <div style={{padding:'12px'}}>
            <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.12em',marginBottom:'6px',fontWeight:700}}>IMPROVEMENT INTENT</div>
            <textarea value={intent} onChange={e=>setIntent(e.target.value)}
              placeholder='Describe what to improve — e.g. "Strengthen competitive moat with a defensible advantage and long-term implications"'
              style={{width:'100%',minHeight:'76px',padding:'9px',...MONO,fontSize:'10px',color:'#64748b',backgroundColor:'#040b14',border:'1px solid #0f1923',borderRadius:'4px',resize:'vertical',outline:'none',lineHeight:1.65,boxSizing:'border-box' as const}}/>

            {/* Active model badge */}
            <div style={{padding:'5px 8px',backgroundColor:`${activeModel.color}11`,border:`1px solid ${activeModel.color}22`,borderRadius:'3px',margin:'6px 0',display:'flex',alignItems:'center',gap:'6px'}}>
              <div style={{width:'5px',height:'5px',borderRadius:'50%',backgroundColor:activeModel.color,flexShrink:0}}/>
              <div style={{flex:1,fontSize:'9px'}}>
                <span style={{color:activeModel.color,fontWeight:700}}>{activeModel.label}</span>
                <span style={{color:'#334155'}}> · {activeModel.provider} · {activeModel.cost} · {activeModel.use}</span>
              </div>
            </div>

            <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'5px',fontWeight:700}}>PRESETS</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'12px'}}>
              {PRESETS.map(p=><button key={p.label} onClick={()=>setIntent(p.intent)} style={{...B,padding:'3px 7px',fontSize:'9px',backgroundColor:'#040b14',color:'#475569',outline:'1px solid #1e293b'}}>{p.label}</button>)}
            </div>

            {/* Reference docs */}
            <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'5px',fontWeight:700}}>
              REFERENCE DOCS{docs.length>0&&<span style={{color:'#818cf855',marginLeft:'6px'}}>{docs.length} loaded</span>}
            </div>
            {docs.map(d=>(
              <div key={d.name} style={{padding:'5px 8px',backgroundColor:'#040b14',border:'1px solid #818cf822',borderRadius:'3px',marginBottom:'4px',display:'flex',alignItems:'center',gap:'6px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'9px',color:'#818cf8',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>◆ {d.name}</div>
                  <div style={{fontSize:'8px',color:'#475569'}}>{d.chars.toLocaleString()} chars</div>
                </div>
                <button onClick={()=>setDocs(p=>p.filter(x=>x.name!==d.name))} style={{background:'none',border:'none',color:'#334155',cursor:'pointer',fontSize:'14px',lineHeight:1}}>×</button>
              </div>
            ))}
            <label style={{display:'block',padding:'8px',backgroundColor:'#040b14',border:'1px dashed #1e293b',borderRadius:'3px',cursor:'pointer',marginBottom:'10px',textAlign:'center' as const}}>
              <div style={{fontSize:'10px',color:uplLoading?'#475569':'#64748b'}}>{uplLoading?'⟳ Extracting…':'+ Upload Reference Document'}</div>
              <div style={{fontSize:'8px',color:'#334155',marginTop:'2px'}}>PDF · DOCX · TXT · MD · multiple allowed</div>
              <input ref={uploadRef} type="file" accept=".pdf,.docx,.txt,.md,.csv" multiple onChange={handleUpload} style={{display:'none'}}/>
            </label>
            {uplError&&<div style={{fontSize:'9px',color:'#f87171',marginBottom:'7px',lineHeight:1.5}}>⚠ {uplError}</div>}

            {/* Extent */}
            <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'4px',fontWeight:700}}>EXTENT</div>
            <div style={{display:'flex',gap:'4px',marginBottom:'4px'}}>
              {([['light','#4ade80','Polish wording'],['medium','#f59e0b','Improve sections'],['strong','#f87171','Restructure']] as const).map(([e,c])=>(
                <button key={e} onClick={()=>setExtent(e as Extent)} style={{...B,padding:'4px 7px',fontSize:'9px',
                  backgroundColor:extent===e?'#0a1f0e':'#0d1117',color:extent===e?c:'#475569',outline:extent===e?`1px solid ${c}55`:'1px solid #1e293b'}}>
                  {e.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{fontSize:'9px',color:'#334155',marginBottom:'10px'}}>{extent==='light'?'Minor wording polish':extent==='medium'?'Rewrite sections':'Restructure artifact'}</div>

            {/* Scope */}
            <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'4px',fontWeight:700}}>SCOPE</div>
            <div style={{display:'flex',gap:'4px',marginBottom:'4px'}}>
              {(['block','stage','project'] as Scope[]).map(s=>(
                <button key={s} onClick={()=>setScope(s)} style={{...B,padding:'4px 7px',fontSize:'9px',
                  backgroundColor:scope===s?'#0a0f1e':'#0d1117',color:scope===s?'#818cf8':'#475569',outline:scope===s?'1px solid #818cf855':'1px solid #1e293b'}}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{fontSize:'9px',color:'#334155',marginBottom:'14px'}}>{scope==='block'?'Selected section only':scope==='stage'?'Full artifact for this stage':'Cross-artifact PM consistency'}</div>

            {/* Improve button */}
            <button onClick={handleImprove} disabled={!selected||!intent.trim()||uiState==='loading'}
              style={{width:'100%',padding:'11px 0',fontSize:'12px',...MONO,cursor:'pointer',borderRadius:'4px',border:'none',letterSpacing:'0.1em',fontWeight:700,
                backgroundColor:(!selected||!intent.trim())?'#0a1509':'#0d2a10',
                color:(!selected||!intent.trim())?'#1a3a20':'#4ade80',outline:'1px solid #1a3a20'}}>
              {uiState==='loading'?'⟳ GENERATING…':'◈ IMPROVE NOW'}
            </button>
            <div style={{fontSize:'9px',color:'#1e293b',textAlign:'center' as const,marginTop:'4px'}}>{activeModel.label} · OpenRouter · {activeModel.cost}</div>

            {/* ── BUILD DESTINATION ── */}
            <div style={{marginTop:'16px',paddingTop:'14px',borderTop:'1px solid #0a1a2e'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.12em',fontWeight:700}}>BUILD DESTINATION</div>
                <button onClick={()=>setShowBuild(!showBuild)} style={{...B,padding:'2px 6px',fontSize:'9px',backgroundColor:'transparent',color:'#334155',outline:'1px solid #1e293b'}}>
                  {showBuild?'▲':'▼'}
                </button>
              </div>

              {showBuild&&(
                <div>
                  {/* Builder grid */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginBottom:'10px'}}>
                    {BUILDERS.map(b=>(
                      <button key={b.id} onClick={()=>setBuildTarget(b.id)}
                        style={{...B,padding:'5px 8px',fontSize:'9px',textAlign:'left' as const,display:'flex',alignItems:'center',gap:'5px',
                          backgroundColor:buildTarget===b.id?`${b.color}22`:'#040b14',
                          color:buildTarget===b.id?b.color:'#475569',
                          outline:buildTarget===b.id?`1px solid ${b.color}55`:'1px solid #1e293b'}}>
                        <span style={{fontSize:'11px'}}>{b.icon}</span>
                        <span>{b.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Generate button */}
                  {!buildPackage?(
                    <button onClick={handleGenerateBuild} disabled={buildLoading}
                      style={{width:'100%',padding:'9px 0',fontSize:'11px',...MONO,cursor:'pointer',borderRadius:'4px',border:'none',fontWeight:700,letterSpacing:'0.08em',backgroundColor:'#0a0f1e',color:'#818cf8',outline:'1px solid #818cf833'}}>
                      {buildLoading?'⟳ ASSEMBLING PACKAGE…':'◈ GENERATE BUILDER PACKAGE'}
                    </button>
                  ):(
                    <div>
                      {/* Package for selected builder */}
                      {buildPackage[buildTarget]&&(
                        <div style={{padding:'8px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'3px',marginBottom:'8px'}}>
                          <div style={{fontSize:'9px',color:'#2a5a30',fontWeight:700,marginBottom:'4px',letterSpacing:'0.08em'}}>{BUILDERS.find(b=>b.id===buildTarget)?.label?.toUpperCase()} PACKAGE</div>
                          <div style={{fontSize:'9px',color:'#334155',marginBottom:'6px'}}>{buildPackage[buildTarget].chars.toLocaleString()} chars · {buildPackage[buildTarget].emphasis}</div>
                          <div style={{display:'flex',gap:'5px'}}>
                            <button onClick={()=>handleCopy(buildPackage[buildTarget].content, buildTarget)}
                              style={{...B,flex:1,padding:'6px 0',fontSize:'10px',backgroundColor:'#0a0f1e',color:'#818cf8',outline:'1px solid #818cf833',textAlign:'center' as const}}>
                              {copied===buildTarget?'✓ Copied!':'Copy package'}
                            </button>
                            {BUILDERS.find(b=>b.id===buildTarget)?.deepLink&&(
                              <button onClick={()=>handleOpenBuilder(BUILDERS.find(b=>b.id===buildTarget)!.deepLink,buildPackage[buildTarget].content,buildTarget)}
                                style={{...B,flex:1,padding:'6px 0',fontSize:'10px',backgroundColor:'#0a1509',color:'#4ade80',outline:'1px solid #1a3a20',textAlign:'center' as const}}>
                                Copy + Open ↗
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Download full context */}
                      <button onClick={()=>setBuildPackage(null)}
                        style={{...B,width:'100%',padding:'5px 0',fontSize:'9px',backgroundColor:'transparent',color:'#334155',outline:'1px solid #1e293b',marginBottom:'4px'}}>
                        Regenerate package
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Accept/discard panel */}
          {result&&uiState==='previewed'&&(
            <div style={{padding:'0 12px 12px',borderTop:'1px solid #0a1a2e',flexShrink:0}}>
              <div style={{display:'flex',gap:'6px',padding:'10px 0'}}>
                <button onClick={handleAccept} style={{flex:2,padding:'9px 0',fontSize:'11px',cursor:'pointer',...MONO,borderRadius:'3px',border:'none',fontWeight:700,backgroundColor:'#0a1f0e',color:'#4ade80',outline:'1px solid #4ade8033',letterSpacing:'0.08em'}}>✓ ACCEPT</button>
                <button onClick={handleDiscard} style={{flex:1,padding:'9px 0',fontSize:'10px',cursor:'pointer',...MONO,borderRadius:'3px',border:'none',backgroundColor:'transparent',color:'#475569',outline:'1px solid #1e293b'}}>DISCARD</button>
              </div>
              <div style={{padding:'8px',backgroundColor:'#040b14',border:'1px solid #0f1923',borderRadius:'3px',marginBottom:'8px'}}>
                <div style={{fontSize:'9px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'6px',fontWeight:700}}>USAGE</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px',textAlign:'center' as const}}>
                  {[{l:'Input',v:result.tokens?.input?.toLocaleString()??'—',c:'#475569'},{l:'Output',v:result.tokens?.output?.toLocaleString()??'—',c:'#818cf8'},{l:'Cost',v:`$${result.cost?.toFixed(4)??'—'}`,c:'#4ade80'}].map(x=>(
                    <div key={x.l}><div style={{fontSize:'12px',color:x.c,fontWeight:700}}>{x.v}</div><div style={{fontSize:'8px',color:'#334155',marginTop:'1px'}}>{x.l}</div></div>
                  ))}
                </div>
              </div>
              <div style={{fontSize:'9px',color:'#2a5a30',letterSpacing:'0.1em',marginBottom:'5px',fontWeight:700}}>PM REASONING</div>
              <div style={{padding:'8px',backgroundColor:'#040b14',border:'1px solid #0a2a14',borderRadius:'3px',fontSize:'10px',color:'#4ade8099',lineHeight:1.75,marginBottom:'8px'}}>
                {result.reasoning||'No reasoning returned from model.'}
              </div>
              {(result.impactWarnings?.length??0)>0&&result.impactWarnings.map((w,i)=><div key={i} style={{padding:'6px 8px',backgroundColor:'#0a0800',border:'1px solid #f59e0b33',borderRadius:'3px',fontSize:'9px',color:'#f59e0b99',lineHeight:1.6,marginBottom:'4px'}}>▲ {w}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
