'use client';

// src/components/SettingsModal.tsx
// Changes from previous version:
// 1. createPortal into document.body → fixes modal centering regardless of parent layout
// 2. SEARCH_INDEX: 28 entries, one per setting — search now finds setting labels & descriptions
// 3. "✓ Saved" indicator in header — appears 2s after any setting change, fades out
// 4. No new settings, no UI redesign — wiring and polish only

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  useGlobalStore, DEFAULT_SETTINGS,
  MODEL_LABELS, COMPRESSION_LABELS, getModelMeta,
  OPERATING_MODE_META, OPERATING_MODE_PRESETS,
  AUTONOMY_META,
  type OperatingMode, type CoordinatorAutonomy, type ModelKey,
  type CompressionMode, type BuilderId,
} from '@/lib/GlobalStore';
import { useRuntime } from '@/lib/RuntimeContext';
// Mission 13 Batch C — parity with TopBar.tsx (Mission 12B reference implementation)
import { ModelSelector } from '@/components/ModelSelector';
import { STAGE_COUNT, formatStageDisplay } from '@/lib/execution/adapters/orchestration';
import { resolveModelId } from '@/lib/model-registry';
// MODEL_LABELS / ModelKey below are no longer used for the Default Model picker
// (replaced by the registry-driven ModelSelector) but are kept — still referenced
// by getModelMeta()'s legacy-key fallback path elsewhere in this file.
// @deprecated for model-picker purposes as of Mission 13 Batch C

// ── Design tokens ─────────────────────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
const S = {
  bg:'#020609', panel:'#020c06', card:'#040b14', border:'#0a1a2e', border2:'#1e293b',
  text:'#94a3b8', textDim:'#475569', textMute:'#334155', textMute2:'#1e293b',
  accent:'#4ade80', indigo:'#818cf8', amber:'#f59e0b', blue:'#38bdf8',
  orange:'#fb923c', pink:'#f472b6', red:'#f87171',
};

// ── Search index — one entry per setting ──────────────────────────────────────
// This is what makes search work at the setting level, not just category level.
type CategoryId =
  | 'appearance'|'ai-models'|'reading'|'accessibility'
  |'mode'|'coordinator'|'builder'|'intelligence'|'safety'
  |'health'|'advanced';

interface SearchEntry { label:string; description:string; category:CategoryId; categoryLabel:string; }

const SEARCH_INDEX: SearchEntry[] = [
  // Appearance
  { label:'Theme',              description:'Visual style of the application. Professional theme coming in V3.4.',                       category:'appearance',     categoryLabel:'Appearance'     },
  { label:'Font Size',          description:'Base font size across all reading surfaces.',                                               category:'appearance',     categoryLabel:'Appearance'     },
  { label:'Density',            description:'Spacing rhythm. Compact reduces padding; Spacious adds breathing room for long sessions.',  category:'appearance',     categoryLabel:'Appearance'     },
  { label:'Animations',         description:'UI transitions, pulse effects, and blinking states. Overridden by Reduce Motion.',          category:'appearance',     categoryLabel:'Appearance'     },
  { label:'Office CRT Intensity',description:'Scanline overlay on the Agent Office pixel art canvas.',                                  category:'appearance',     categoryLabel:'Appearance'     },
  // AI Models
  { label:'Default Model',      description:'Persists across Desk, Refine, and Office. Free tier models are rate-limited with no cost.',                         category:'ai-models',      categoryLabel:'AI Models'      },
  { label:'Token Budget',       description:'Hard ceiling on tokens per improvement call. Free models are automatically capped at 8K.',                           category:'ai-models',      categoryLabel:'AI Models'      },
  { label:'OpenRouter API Key', description:'Overrides OPENROUTER_API_KEY env var. Stored in browser localStorage. Used for all model improvement calls.',        category:'ai-models',      categoryLabel:'AI Models'      },
  { label:'Anthropic API Key',  description:'Overrides ANTHROPIC_API_KEY env var. Stored in browser localStorage. Used for Anthropic API artifact calls.',        category:'ai-models',      categoryLabel:'AI Models'      },
  { label:'Show Token Costs',   description:'Display token count and estimated USD cost after each improvement.',                       category:'ai-models',      categoryLabel:'AI Models'      },
  { label:'Prompt Tracing',     description:'Log full prompts to improvement history. Useful for debugging. Increases storage usage.',   category:'ai-models',      categoryLabel:'AI Models'      },
  // Reading
  { label:'Default Focus Mode', description:'Open Desk in focus mode by default. Sidebars hidden. Can always be toggled inline.',       category:'reading',        categoryLabel:'Reading'        },
  { label:'Line Height',        description:'Vertical rhythm for artifact reading. Tight for dense content; Relaxed for long documents.',category:'reading',        categoryLabel:'Reading'        },
  // Accessibility
  { label:'Reduce Motion',      description:'Disables all CSS transitions and animations. Also respects prefers-reduced-motion.',        category:'accessibility',  categoryLabel:'Accessibility'  },
  { label:'High Contrast',      description:'Increases text contrast ratios across all views. Also removes the CRT scanline overlay.',   category:'accessibility',  categoryLabel:'Accessibility'  },
  { label:'Keyboard Navigation',description:'Enable ↑↓ key navigation in artifact lists and table of contents. Also enables ⌘K.',      category:'accessibility',  categoryLabel:'Accessibility'  },
  // Operating Mode
  { label:'Operating Mode',     description:'Orchestrates model, token budget, and compression into intent-driven presets. Fast, Balanced, Deep, Research, Builder.', category:'mode', categoryLabel:'Operating Mode' },
  // Coordinator
  { label:'Coordinator Autonomy',description:'How much the lifecycle coordinator self-directs. Manual, Assisted, or Autonomous.',        category:'coordinator',    categoryLabel:'Coordinator'    },
  // Builder
  { label:'Default Builder',    description:'Pre-selected platform in the Build Destination panel. Claude, ChatGPT, Lovable, Bolt, v0.', category:'builder',       categoryLabel:'Builder'        },
  { label:'Package Compression',description:'How much content to include in builder packages. Complete, Balanced, Technical, Visual, Brief.', category:'builder',  categoryLabel:'Builder'        },
  { label:'Export Format',      description:'Default format when downloading individual artifacts from Desk. Markdown, text, JSON, ZIP.', category:'builder',       categoryLabel:'Builder'        },
  // Intelligence
  { label:'Remember Decisions', description:'Log coordinator decisions and stage progression. Required for Coordinator Autonomy tracking.', category:'intelligence', categoryLabel:'Intelligence'  },
  { label:'Store Reasoning Chain',description:'Persist improvement reasoning entries. Shown in Desk HISTORY and Office FEED.',            category:'intelligence',   categoryLabel:'Intelligence'  },
  { label:'Track Artifact Lineage',description:'Record which artifacts depend on which. Powers the Dependency Map in Desk OVERVIEW.',    category:'intelligence',   categoryLabel:'Intelligence'  },
  { label:'Cross-Artifact References',description:'Show cross-references in Desk OVERVIEW showing which upstream artifacts influenced this one.', category:'intelligence', categoryLabel:'Intelligence' },
  { label:'Auto Snapshot',      description:'Automatically save a project snapshot when the lifecycle completes Stage 14.',               category:'intelligence',   categoryLabel:'Intelligence'  },
  // Safety
  { label:'Session Cost Ceiling',description:'Hard stop on API spend per session in USD. Lifecycle will not start a new stage if exceeded. 0 = unlimited.', category:'safety', categoryLabel:'Safety' },
  { label:'Confirm Destructive Actions',description:'Show confirmation dialog before running a new lifecycle, clearing stale markers, or deleting snapshots.', category:'safety', categoryLabel:'Safety' },
  // Advanced
  { label:'Persistence Mode',   description:'Where settings are stored. Supabase becomes available in V3.4 after account creation.',      category:'advanced',       categoryLabel:'Advanced'       },
  { label:'Debug Mode',         description:'Show content parser method badges on artifacts and enable verbose console logging.',          category:'advanced',       categoryLabel:'Advanced'       },
  { label:'TipTap Renderer (Studio)', description:'Render Studio artifacts via TipTap instead of the legacy renderer. Read-only preview — Mission 1. Off by default.', category:'advanced',       categoryLabel:'Advanced'       },
];

// ── Category definitions ──────────────────────────────────────────────────────
interface Category { id:CategoryId; label:string; section:'personal'|'project'|'system'; icon:string; color:string; }
const CATEGORIES: Category[] = [
  { id:'appearance',   label:'Appearance',     section:'personal', icon:'◈', color:S.accent  },
  { id:'ai-models',    label:'AI Models',      section:'personal', icon:'◉', color:S.indigo  },
  { id:'reading',      label:'Reading',        section:'personal', icon:'◻', color:S.blue    },
  { id:'accessibility',label:'Accessibility',  section:'personal', icon:'⚑', color:S.amber   },
  { id:'mode',         label:'Operating Mode', section:'project',  icon:'⚡', color:S.amber   },
  { id:'coordinator',  label:'Coordinator',    section:'project',  icon:'⟳', color:S.accent  },
  { id:'builder',      label:'Builder',        section:'project',  icon:'▶', color:S.orange  },
  { id:'intelligence', label:'Intelligence',   section:'project',  icon:'◆', color:S.indigo  },
  { id:'safety',       label:'Safety',         section:'project',  icon:'⊕', color:S.red     },
  { id:'health',       label:'Health',         section:'system',   icon:'◑', color:S.blue    },
  { id:'advanced',     label:'Advanced',       section:'system',   icon:'⊙', color:S.textDim },
];

const SECTION_META: Record<string,{label:string;color:string}> = {
  personal:{ label:'PERSONAL', color:'#2a5a30' },
  project: { label:'PROJECT',  color:'#2a3a5a' },
  system:  { label:'SYSTEM',   color:S.textMute },
};

// ── Shared controls ───────────────────────────────────────────────────────────
const B = (extra?:React.CSSProperties):React.CSSProperties=>({...MONO,cursor:'pointer',border:'none',borderRadius:'3px',...(extra??{})});

function Toggle({value,onChange,disabled}:{value:boolean;onChange:(v:boolean)=>void;disabled?:boolean}){
  return(
    <button onClick={()=>!disabled&&onChange(!value)} disabled={disabled}
      style={{display:'flex',alignItems:'center',gap:'5px',padding:'3px 8px',...B(),
        backgroundColor:value?'#0a1f0e':S.card, outline:`1px solid ${value?S.accent+'44':S.border}`,
        color:value?S.accent:S.textMute, opacity:disabled?.4:1, fontSize:'10px',fontWeight:700,letterSpacing:'0.05em',flexShrink:0}}>
      <span style={{width:'24px',height:'12px',borderRadius:'6px',backgroundColor:value?S.accent+'44':S.border,
        position:'relative',display:'inline-block',flexShrink:0}}>
        <span style={{position:'absolute',top:'2px',left:value?'12px':'2px',width:'8px',height:'8px',
          borderRadius:'50%',backgroundColor:value?S.accent:S.textMute,transition:'left 0.15s'}}/>
      </span>
      {value?'ON':'OFF'}
    </button>
  );
}

function Row({label,description,children,future}:{label:string;description?:string;children:React.ReactNode;future?:string}){
  return(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'16px',
      padding:'10px 0',borderBottom:`1px solid ${S.border}`,opacity:future?.5:1}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'2px'}}>
          <span style={{fontSize:'12px',color:S.text,fontWeight:600,...MONO}}>{label}</span>
          {future&&<span style={{fontSize:'8px',color:S.amber,padding:'1px 5px',border:`1px solid ${S.amber}33`,borderRadius:'2px'}}>{future}</span>}
        </div>
        {description&&<div style={{fontSize:'10px',color:S.textDim,lineHeight:1.5}}>{description}</div>}
      </div>
      <div style={{flexShrink:0}}>{children}</div>
    </div>
  );
}

function Sel<T extends string>({value,onChange,options}:{value:T;onChange:(v:T)=>void;options:{value:T;label:string}[]}){
  return(
    <select value={value} onChange={e=>onChange(e.target.value as T)}
      style={{padding:'4px 8px',...MONO,fontSize:'11px',color:S.text,
        backgroundColor:S.card,border:`1px solid ${S.border2}`,borderRadius:'3px',outline:'none',cursor:'pointer'}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function NumInput({value,onChange,min,max,step,prefix,suffix}:{value:number;onChange:(v:number)=>void;min?:number;max?:number;step?:number;prefix?:string;suffix?:string}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
      {prefix&&<span style={{fontSize:'11px',color:S.textMute}}>{prefix}</span>}
      <input type="number" value={value} min={min} max={max} step={step??1}
        onChange={e=>onChange(Number(e.target.value))}
        style={{width:'72px',padding:'4px 8px',...MONO,fontSize:'11px',color:S.text,
          backgroundColor:S.card,border:`1px solid ${S.border2}`,borderRadius:'3px',outline:'none',textAlign:'right' as const}}/>
      {suffix&&<span style={{fontSize:'11px',color:S.textMute}}>{suffix}</span>}
    </div>
  );
}

// ── Category renderers ────────────────────────────────────────────────────────
function CAppearance(){
  const {state:{settings},updateSettings}=useGlobalStore();const s=settings;
  return(<div>
    <Row label="Theme" description="Visual style of the application. Professional theme coming in V3.4.">
      <Sel value={s.theme} onChange={v=>updateSettings({theme:v})} options={[{value:'retro',label:'Retro (current)'},{value:'professional',label:'Professional (V3.4)'}]}/>
    </Row>
    <Row label="Font Size" description="Base font size across all reading surfaces.">
      <Sel value={s.fontSize} onChange={v=>updateSettings({fontSize:v})} options={[{value:'sm',label:'Small (11.5px)'},{value:'md',label:'Medium (13.5px)'},{value:'lg',label:'Large (15px)'}]}/>
    </Row>
    <Row label="Density" description="Spacing rhythm. Compact reduces padding; Spacious adds breathing room for long reading sessions.">
      <Sel value={s.density} onChange={v=>updateSettings({density:v})} options={[{value:'compact',label:'Compact'},{value:'standard',label:'Standard'},{value:'spacious',label:'Spacious'}]}/>
    </Row>
    <Row label="Animations" description="UI transitions, pulse effects, and blinking states. Overridden by Reduce Motion in Accessibility.">
      <Toggle value={s.animationsEnabled} onChange={v=>updateSettings({animationsEnabled:v})} disabled={s.reduceMotion}/>
    </Row>
    <Row label="Office CRT Intensity" description="Scanline overlay on the Agent Office pixel art canvas.">
      <Sel value={s.crtIntensity} onChange={v=>updateSettings({crtIntensity:v})} options={[{value:'off',label:'Off'},{value:'subtle',label:'Subtle (default)'},{value:'strong',label:'Strong'}]}/>
    </Row>
  </div>);
}

function CAIModels(){
  const {state:{settings},updateSettings}=useGlobalStore();const s=settings;
  const active=getModelMeta(s.defaultModel);
  const isFree = active.free === true;
  return(<div>
    <div style={{marginBottom:'12px',padding:'10px',backgroundColor:S.card,border:`1px solid ${isFree?'#84cc1633':S.indigo+'33'}`,borderRadius:'4px',fontSize:'11px',color:S.textDim,lineHeight:1.8}}>
      <span style={{color:S.accent,fontWeight:700}}>Active: </span><span style={{color:S.text}}>{active.label}</span>
      {isFree && <span style={{fontSize:'9px',fontWeight:700,color:'#4ade80',marginLeft:'6px',padding:'1px 5px',border:'1px solid #4ade8033',borderRadius:'2px'}}>FREE</span>}
      <span style={{color:S.textMute,marginLeft:'8px'}}>· {active.provider} · {active.cost}</span><br/>
      <span style={{color:S.textMute,fontSize:'10px'}}>Best for: {active.best}</span><br/>
      <span style={{color:S.textMute2,fontSize:'9px',marginTop:'3px',display:'block'}}>Selected model persists across Desk, Refine, and Office. Token budget is applied as max_tokens in every LLM call.</span>
    </div>
    <Row label="Default Model" description="Persists across all views. Free tier models (marked FREE) use OpenRouter free tier — rate-limited, no cost.">
      <ModelSelector
        selectedModelId={resolveModelId(s.defaultModel)}
        onSelectModel={(modelId) => updateSettings({defaultModel: modelId})}
        disabled={false}
      />
    </Row>
    <Row label="Token Budget" description="Hard ceiling on tokens per improvement call. Passed as max_tokens to the LLM. Free models capped at 8K automatically.">
      <NumInput value={s.tokenBudgetPerCall} onChange={v=>updateSettings({tokenBudgetPerCall:Math.max(500,Math.min(8000,v))})} min={500} max={8000} step={500} suffix="tokens"/>
    </Row>

    {/* ── API Keys ─────────────────────────────────────────────────────────── */}
    <div style={{marginTop:'16px',paddingTop:'12px',borderTop:`1px solid ${S.border}`,marginBottom:'8px',fontSize:'10px',color:S.textDim,fontWeight:700,letterSpacing:'0.1em'}}>
      API KEYS
    </div>
    <div style={{marginBottom:'10px',padding:'8px 10px',backgroundColor:S.card,border:`1px solid ${S.amber}22`,borderRadius:'3px',fontSize:'10px',color:S.textMute,lineHeight:1.6}}>
      Keys entered here override the .env.local environment variables. Stored in localStorage — do not use on shared machines. Leave blank to use the env var.
    </div>
    <Row label="OpenRouter API Key" description="Used for all model improvement calls. Get your key at openrouter.ai/keys. Overrides OPENROUTER_API_KEY env var.">
      <input
        type="password"
        value={s.openRouterApiKey ?? ''}
        onChange={e=>updateSettings({openRouterApiKey:e.target.value})}
        placeholder="sk-or-v1-..."
        style={{...MONO,fontSize:'11px',padding:'4px 8px',width:'180px',
          backgroundColor:S.card,border:`1px solid ${S.border2}`,borderRadius:'3px',
          outline:'none',color:S.text,letterSpacing:'0.04em',textAlign:'right' as const}}
      />
    </Row>
    <Row label="Anthropic API Key" description="Used for Anthropic API calls (Artifacts, inline Claude). Overrides ANTHROPIC_API_KEY env var.">
      <input
        type="password"
        value={s.anthropicApiKey ?? ''}
        onChange={e=>updateSettings({anthropicApiKey:e.target.value})}
        placeholder="sk-ant-..."
        style={{...MONO,fontSize:'11px',padding:'4px 8px',width:'180px',
          backgroundColor:S.card,border:`1px solid ${S.border2}`,borderRadius:'3px',
          outline:'none',color:S.text,letterSpacing:'0.04em',textAlign:'right' as const}}
      />
    </Row>
    {(s.openRouterApiKey || s.anthropicApiKey) && (
      <div style={{marginTop:'6px',padding:'6px 8px',backgroundColor:'#0a1509',border:'1px solid #4ade8022',borderRadius:'3px',fontSize:'9px',color:'#4ade8088',display:'flex',alignItems:'center',gap:'6px'}}>
        <span>✓</span>
        <span>
          {s.openRouterApiKey ? 'OpenRouter key set' : ''}
          {s.openRouterApiKey && s.anthropicApiKey ? ' · ' : ''}
          {s.anthropicApiKey ? 'Anthropic key set' : ''}
        </span>
        <button onClick={()=>updateSettings({openRouterApiKey:'',anthropicApiKey:''})}
          style={{marginLeft:'auto',fontSize:'8px',color:S.textMute,background:'transparent',border:'none',cursor:'pointer',padding:'0'}}>
          Clear both
        </button>
      </div>
    )}

    <div style={{marginTop:'16px',paddingTop:'12px',borderTop:`1px solid ${S.border}`}}>
      <div style={{marginBottom:'8px',fontSize:'10px',color:S.textDim,fontWeight:700,letterSpacing:'0.1em'}}>
        CUSTOM MODEL ID
      </div>
      <div style={{marginBottom:'8px',padding:'8px 10px',backgroundColor:S.card,border:`1px solid ${S.amber}22`,borderRadius:'3px',fontSize:'10px',color:S.textMute,lineHeight:1.6}}>
        Paste any <span style={{color:S.amber}}>OpenRouter model ID</span> to override the dropdown for all improvement calls.
        Format: <span style={{color:S.text}}>provider/model-name</span><br/>
        Examples: <span style={{color:'#94a3b8'}}>deepseek/deepseek-r1 · google/gemini-2.5-flash · anthropic/claude-haiku-4-5 · x-ai/grok-4-fast</span><br/>
        Leave blank to use the Default Model dropdown above.
        {s.customModelId && s.customModelId.trim() && (
          <span style={{color:'#4ade80',marginLeft:'6px',fontWeight:700}}>✓ Active — overriding dropdown</span>
        )}
      </div>
      <Row label="Custom Model ID" description="Overrides the Default Model dropdown. Accepts any valid OpenRouter model string.">
        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
          <input
            type="text"
            value={s.customModelId ?? ''}
            onChange={e=>updateSettings({customModelId:e.target.value})}
            placeholder="e.g. deepseek/deepseek-r1"
            style={{...MONO,fontSize:'11px',padding:'4px 8px',width:'220px',
              backgroundColor:S.card,border:`1px solid ${s.customModelId?.trim()?S.amber+'66':S.border2}`,
              borderRadius:'3px',outline:'none',color:s.customModelId?.trim()?S.text:S.textMute}}
          />
          {s.customModelId?.trim() && (
            <button onClick={()=>updateSettings({customModelId:''})}
              style={{fontSize:'9px',color:S.textMute,background:'transparent',border:`1px solid ${S.border2}`,
                borderRadius:'2px',cursor:'pointer',padding:'3px 6px'}}>
              Clear
            </button>
          )}
        </div>
      </Row>
    </div>

    <div style={{marginTop:'16px',paddingTop:'12px',borderTop:`1px solid ${S.border}`}}>
      <div style={{marginBottom:'6px',fontSize:'10px',color:S.textDim,fontWeight:700,letterSpacing:'0.1em'}}>
        RECOMMENDED MODELS
      </div>
      <div style={{fontSize:'10px',color:S.textMute,lineHeight:2.0}}>
        <div><span style={{color:'#22c55e',fontWeight:700}}>Best for PM/PRD (paid):</span> <span style={{color:S.text}}>deepseek/deepseek-r1</span> — multi-step reasoning, $0.55/M</div>
        <div><span style={{color:'#22c55e',fontWeight:700}}>Fastest paid:</span> <span style={{color:S.text}}>anthropic/claude-haiku-4-5</span> — reliable, $0.25/M, works with V2 CLI</div>
        <div><span style={{color:'#22c55e',fontWeight:700}}>Cheapest quality:</span> <span style={{color:S.text}}>google/gemini-2.5-flash</span> — $0.15/M, long-context</div>
        <div><span style={{color:'#84cc16',fontWeight:700}}>Free options:</span> <span style={{color:S.text}}>openrouter/owl-alpha · nvidia/nemotron-3-super-120b-a12b:free</span></div>
      </div>
    </div>

    <div style={{marginTop:'16px',paddingTop:'12px',borderTop:`1px solid ${S.border}`}}>
      <Row label="Show Token Costs" description="Display token count and estimated USD cost after each improvement.">
        <Toggle value={s.showTokenCosts} onChange={v=>updateSettings({showTokenCosts:v})}/>
      </Row>
      <Row label="Prompt Tracing" description="Log full prompts to improvement history. Useful for debugging. Increases storage usage.">
        <Toggle value={s.promptTracing} onChange={v=>updateSettings({promptTracing:v})}/>
      </Row>
    </div>
  </div>);
}

function CReading(){
  const {state:{settings},updateSettings}=useGlobalStore();const s=settings;
  return(<div>
    <Row label="Default Focus Mode" description="Open Desk in focus mode by default (sidebars hidden). Initialized on every Desk page load. Can be toggled inline with the FOCUS button.">
      <Toggle value={s.defaultFocusMode} onChange={v=>updateSettings({defaultFocusMode:v})}/>
    </Row>
    <Row label="Line Height" description="Vertical rhythm for artifact reading. Applied to the Desk reading surface. Tight for technical/dense content; Relaxed for long narrative documents.">
      <Sel value={s.lineHeight} onChange={v=>updateSettings({lineHeight:v})}
        options={[{value:'tight',label:'Tight (1.6)'},{value:'normal',label:'Normal (1.9)'},{value:'relaxed',label:'Relaxed (2.2)'}]}/>
    </Row>
    <div style={{marginTop:'10px',padding:'8px',backgroundColor:S.card,border:`1px solid ${S.border}`,borderRadius:'3px',fontSize:'10px',color:S.textMute,lineHeight:1.7}}>
      These settings take effect the next time Desk is loaded or an artifact is opened.
    </div>
  </div>);
}

function CAccessibility(){
  const {state:{settings},updateSettings}=useGlobalStore();const s=settings;
  return(<div>
    <Row label="Reduce Motion" description="Disables all CSS transitions and animations. Overrides the Animations setting in Appearance. Also respects prefers-reduced-motion.">
      <Toggle value={s.reduceMotion} onChange={v=>updateSettings({reduceMotion:v})}/>
    </Row>
    <Row label="High Contrast" description="Increases text contrast ratios across all views. Also removes the CRT scanline overlay regardless of CRT Intensity setting.">
      <Toggle value={s.highContrast} onChange={v=>updateSettings({highContrast:v})}/>
    </Row>
    <Row label="Keyboard Navigation" description="Enable ↑↓ key navigation in artifact lists and table of contents. Also enables ⌘K command palette.">
      <Toggle value={s.keyboardNavEnabled} onChange={v=>updateSettings({keyboardNavEnabled:v})}/>
    </Row>
    {s.highContrast&&<div style={{marginTop:'8px',padding:'8px',backgroundColor:'#0a0f1e',border:`1px solid ${S.indigo}33`,borderRadius:'3px',fontSize:'10px',color:S.indigo,lineHeight:1.5}}>High Contrast active: CRT overlay disabled, text at #e2e8f0 minimum.</div>}
  </div>);
}

function COperatingMode(){
  const {state:{settings},applyMode}=useGlobalStore();
  const currentMode=settings.operatingMode;
  const isCustom=(Object.keys(OPERATING_MODE_PRESETS) as OperatingMode[]).every(mode=>{
    const p=OPERATING_MODE_PRESETS[mode];
    return!(settings.defaultModel===p.defaultModel&&settings.tokenBudgetPerCall===p.tokenBudgetPerCall&&settings.defaultCompression===p.defaultCompression);
  });
  return(<div>
    <div style={{marginBottom:'14px',fontSize:'11px',color:S.textDim,lineHeight:1.7}}>
      Operating Mode orchestrates model, token budget, and compression into intent-driven presets. Selecting a mode applies a preset. Individual settings can still be overridden in their categories.
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'16px'}}>
      {(Object.keys(OPERATING_MODE_META) as OperatingMode[]).map(mode=>{
        const meta=OPERATING_MODE_META[mode];const preset=OPERATING_MODE_PRESETS[mode];const active=currentMode===mode&&!isCustom;
        return(<button key={mode} onClick={()=>applyMode(mode)}
          style={{...B(),padding:'12px',backgroundColor:active?`${meta.color}11`:S.card,outline:`1px solid ${active?meta.color+'66':S.border}`,textAlign:'left' as const}}>
          <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
            <span style={{fontSize:'14px'}}>{meta.emoji}</span>
            <span style={{fontSize:'12px',color:active?meta.color:S.text,fontWeight:700,...MONO}}>{meta.label}</span>
            {active&&<span style={{fontSize:'8px',color:meta.color,marginLeft:'auto',padding:'1px 5px',border:`1px solid ${meta.color}44`,borderRadius:'2px'}}>ACTIVE</span>}
          </div>
          <div style={{fontSize:'10px',color:S.textDim,lineHeight:1.5,marginBottom:'6px'}}>{meta.description}</div>
          <div style={{fontSize:'9px',color:S.textMute,display:'flex',gap:'8px',flexWrap:'wrap' as const}}>
            <span>{getModelMeta(preset.defaultModel!).label}</span><span>·</span>
            <span>{((preset.tokenBudgetPerCall??4000)/1000).toFixed(1)}k tokens</span><span>·</span>
            <span>{COMPRESSION_LABELS[preset.defaultCompression!].label}</span>
          </div>
        </button>);
      })}
    </div>
    {isCustom&&<div style={{padding:'8px 10px',backgroundColor:'#0a0800',border:`1px solid ${S.amber}33`,borderRadius:'3px',fontSize:'10px',color:S.amber,lineHeight:1.5}}>Custom — individual settings modified from preset. Select a mode to re-apply.</div>}
  </div>);
}

function CCoordinator(){
  const {state:{settings},updateSettings}=useGlobalStore();const current=settings.coordinatorAutonomy;
  return(<div>
    <div style={{marginBottom:'14px',fontSize:'11px',color:S.textDim,lineHeight:1.7}}>Coordinator Autonomy controls how much the lifecycle coordinator self-directs through the 14-stage PM process.</div>
    <div style={{display:'flex',flexDirection:'column' as const,gap:'8px',marginBottom:'16px'}}>
      {(Object.keys(AUTONOMY_META) as CoordinatorAutonomy[]).map(mode=>{
        const meta=AUTONOMY_META[mode];const active=current===mode;
        return(<button key={mode} onClick={()=>meta.available&&updateSettings({coordinatorAutonomy:mode})}
          style={{...B(),padding:'12px',backgroundColor:active?'#0a1f0e':S.card,outline:`1px solid ${active?S.accent+'55':S.border}`,textAlign:'left' as const,opacity:meta.available?1:.5,cursor:meta.available?'pointer':'default'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
            <span style={{fontSize:'12px',color:active?S.accent:S.text,fontWeight:700,...MONO}}>{meta.label}</span>
            {active&&<span style={{fontSize:'8px',color:S.accent,padding:'1px 5px',border:`1px solid ${S.accent}44`,borderRadius:'2px'}}>ACTIVE</span>}
            {meta.badge&&<span style={{fontSize:'8px',color:S.amber,padding:'1px 5px',border:`1px solid ${S.amber}44`,borderRadius:'2px',marginLeft:'auto'}}>{meta.badge}</span>}
          </div>
          <div style={{fontSize:'10px',color:S.textDim,lineHeight:1.5}}>{meta.description}</div>
        </button>);
      })}
    </div>
    <div style={{padding:'8px 10px',backgroundColor:S.card,border:`1px solid ${S.amber}22`,borderRadius:'3px',fontSize:'9px',color:S.textMute,lineHeight:1.6}}>
      ⚠ V3.2 NOTE: Coordinator currently advances without quality signal (stages 1-14 parse bug). Manual mode will become meaningful after the tool_use migration in V3.2. Autonomous mode is architecturally ready but requires evaluator completion (V3.3).
    </div>
  </div>);
}

function CBuilder(){
  const {state:{settings},updateSettings}=useGlobalStore();const s=settings;
  const builders:{value:BuilderId;label:string}[]=[
    {value:'claude',label:'Claude'},{value:'chatgpt',label:'ChatGPT'},{value:'gemini',label:'Gemini'},
    {value:'lovable',label:'Lovable'},{value:'bolt',label:'Bolt'},{value:'v0',label:'v0'},
    {value:'replit',label:'Replit'},{value:'cursor',label:'Cursor'},{value:'windsurf',label:'Windsurf'},{value:'openhands',label:'OpenHands'},
  ];
  return(<div>
    <Row label="Default Builder" description="Pre-selected platform in the Build Destination panel. Can be changed per-build.">
      <Sel value={s.defaultBuilder} onChange={v=>updateSettings({defaultBuilder:v})} options={builders}/>
    </Row>
    <Row label="Package Compression" description="How much content to include in builder packages. Affects how well the builder understands the product.">
      <Sel value={s.defaultCompression} onChange={v=>updateSettings({defaultCompression:v as CompressionMode})}
        options={(Object.keys(COMPRESSION_LABELS) as CompressionMode[]).map(k=>({value:k,label:`${COMPRESSION_LABELS[k].label} (${COMPRESSION_LABELS[k].charCount})`}))}/>
    </Row>
    <div style={{padding:'9px',backgroundColor:S.card,border:`1px solid ${S.border}`,borderRadius:'3px',marginTop:'8px',fontSize:'10px',lineHeight:1.8,color:S.textDim}}>
      {(Object.keys(COMPRESSION_LABELS) as CompressionMode[]).map(k=>(
        <div key={k} style={{display:'flex',gap:'8px',padding:'2px 0',borderBottom:`1px solid ${S.border}`}}>
          <span style={{color:s.defaultCompression===k?S.accent:S.textMute,fontWeight:s.defaultCompression===k?700:400,minWidth:'80px',...MONO}}>{COMPRESSION_LABELS[k].label}</span>
          <span style={{color:S.textMute,fontSize:'9px',flex:1}}>{COMPRESSION_LABELS[k].description}</span>
          <span style={{color:S.textMute2,fontSize:'9px',flexShrink:0}}>{COMPRESSION_LABELS[k].charCount}</span>
        </div>
      ))}
    </div>
    <Row label="Export Format" description="Default format when downloading individual artifacts from Desk.">
      <Sel value={s.defaultExportFormat} onChange={v=>updateSettings({defaultExportFormat:v})}
        options={[{value:'md',label:'Markdown (.md)'},{value:'txt',label:'Plain text (.txt)'},{value:'json',label:'JSON (.json)'},{value:'zip',label:'ZIP archive (.zip)'}]}/>
    </Row>
  </div>);
}

function CIntelligence(){
  const {state:{settings,history,refDocs},updateSettings}=useGlobalStore();const s=settings;
  return(<div>
    <div style={{marginBottom:'12px',fontSize:'11px',color:S.textDim,lineHeight:1.7}}>Project Intelligence controls what the system remembers about this project — decisions made, reasoning applied, artifact relationships, and improvement history. This is project memory, not generic AI memory.</div>
    <div style={{marginBottom:'14px',padding:'10px',backgroundColor:S.card,border:`1px solid ${S.indigo}22`,borderRadius:'3px',fontSize:'10px',lineHeight:2,color:S.textDim}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
        <div>Reasoning entries: <span style={{color:s.storeReasoningChain?S.accent:S.textMute,fontWeight:700}}>{history.length}</span></div>
        <div>Reference docs: <span style={{color:refDocs.length>0?S.indigo:S.textMute,fontWeight:700}}>{refDocs.length}</span></div>
      </div>
    </div>
    <Row label="Remember Decisions" description="Log coordinator decisions and stage progression to session storage. Required for Coordinator Autonomy tracking."><Toggle value={s.rememberDecisions} onChange={v=>updateSettings({rememberDecisions:v})}/></Row>
    <Row label="Store Reasoning Chain" description="Persist improvement reasoning entries. Shown in Desk HISTORY and Office FEED. Stored in localStorage."><Toggle value={s.storeReasoningChain} onChange={v=>updateSettings({storeReasoningChain:v})}/></Row>
    <Row label="Track Artifact Lineage" description="Record which artifacts depend on which. Powers the Dependency Map in Desk OVERVIEW."><Toggle value={s.trackArtifactLineage} onChange={v=>updateSettings({trackArtifactLineage:v})}/></Row>
    <Row label="Cross-Artifact References" description="Show cross-references in Desk OVERVIEW — which upstream artifacts influenced this one."><Toggle value={s.crossArtifactReferences} onChange={v=>updateSettings({crossArtifactReferences:v})} disabled={!s.trackArtifactLineage}/></Row>
    <Row label="Auto Snapshot" description="Automatically save a project snapshot when the lifecycle completes Stage 14."><Toggle value={s.autoSnapshot} onChange={v=>updateSettings({autoSnapshot:v})}/></Row>
    <div style={{marginTop:'12px',fontSize:'9px',color:S.textMute2,lineHeight:1.6,borderTop:`1px solid ${S.border}`,paddingTop:'10px'}}>V3.1: Stored in localStorage. V3.4: Migrates to Supabase projects.intelligence (jsonb). No data loss — migration is additive.</div>
  </div>);
}

function CSafety(){
  const {state:{settings},updateSettings,clearHistory,clearRefDocs,resetSettings}=useGlobalStore();const s=settings;
  const [confirmReset,setConfirmReset]=useState(false);const[confirmClear,setConfirmClear]=useState(false);
  return(<div>
    <div style={{marginBottom:'12px',fontSize:'11px',color:S.textDim,lineHeight:1.7}}>Safety & Recovery is a first-class product capability. These settings prevent accidental data loss and control cost exposure.</div>
    <Row label="Session Cost Ceiling" description="Hard stop on API spend per session. The lifecycle will not start a new stage if this limit would be exceeded. Set to 0 for unlimited.">
      <NumInput value={s.sessionCostCeiling} onChange={v=>updateSettings({sessionCostCeiling:Math.max(0,v)})} min={0} max={50} step={0.5} prefix="$" suffix="USD"/>
    </Row>
    <Row label="Confirm Destructive Actions" description="Show a confirmation dialog before running a new lifecycle, clearing stale markers, or deleting snapshots.">
      <Toggle value={s.confirmDestructiveActions} onChange={v=>updateSettings({confirmDestructiveActions:v})}/>
    </Row>
    <div style={{marginTop:'18px',paddingTop:'14px',borderTop:`1px solid ${S.border}`}}>
      <div style={{fontSize:'10px',color:'#2a5a30',fontWeight:700,letterSpacing:'0.1em',marginBottom:'10px'}}>RECOVERY ACTIONS</div>
      <div style={{display:'flex',flexDirection:'column' as const,gap:'7px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px',backgroundColor:S.card,border:`1px solid ${S.border}`,borderRadius:'3px'}}>
          <div><div style={{fontSize:'11px',color:S.text}}>Clear improvement history</div><div style={{fontSize:'9px',color:S.textMute}}>Removes reasoning chain entries. Does not affect artifacts.</div></div>
          {confirmClear
            ?<div style={{display:'flex',gap:'4px'}}>
               <button onClick={()=>{clearHistory();setConfirmClear(false);}} style={{...B(),padding:'4px 10px',fontSize:'10px',backgroundColor:'#1a0808',color:S.red,outline:`1px solid ${S.red}44`}}>Confirm</button>
               <button onClick={()=>setConfirmClear(false)} style={{...B(),padding:'4px 10px',fontSize:'10px',backgroundColor:'transparent',color:S.textDim,outline:`1px solid ${S.border}`}}>Cancel</button>
             </div>
            :<button onClick={()=>s.confirmDestructiveActions?setConfirmClear(true):clearHistory()} style={{...B(),padding:'5px 11px',fontSize:'10px',backgroundColor:'transparent',color:S.textDim,outline:`1px solid ${S.border2}`}}>Clear</button>}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px',backgroundColor:S.card,border:`1px solid ${S.border}`,borderRadius:'3px'}}>
          <div><div style={{fontSize:'11px',color:S.text}}>Clear reference documents</div><div style={{fontSize:'9px',color:S.textMute}}>Removes uploaded reference documents from the Refine engine.</div></div>
          <button onClick={clearRefDocs} style={{...B(),padding:'5px 11px',fontSize:'10px',backgroundColor:'transparent',color:S.textDim,outline:`1px solid ${S.border2}`}}>Clear</button>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px',backgroundColor:'#0a0808',border:`1px solid ${S.red}22`,borderRadius:'3px'}}>
          <div><div style={{fontSize:'11px',color:S.text}}>Reset all settings to defaults</div><div style={{fontSize:'9px',color:S.textMute}}>Restores all settings to V3.1 defaults. History and ref docs are preserved.</div></div>
          {confirmReset
            ?<div style={{display:'flex',gap:'4px'}}>
               <button onClick={()=>{resetSettings();setConfirmReset(false);}} style={{...B(),padding:'4px 10px',fontSize:'10px',backgroundColor:'#1a0808',color:S.red,outline:`1px solid ${S.red}44`}}>Confirm</button>
               <button onClick={()=>setConfirmReset(false)} style={{...B(),padding:'4px 10px',fontSize:'10px',backgroundColor:'transparent',color:S.textDim,outline:`1px solid ${S.border}`}}>Cancel</button>
             </div>
            :<button onClick={()=>setConfirmReset(true)} style={{...B(),padding:'5px 11px',fontSize:'10px',backgroundColor:'transparent',color:S.red,outline:`1px solid ${S.red}33`}}>Reset</button>}
        </div>
      </div>
    </div>
  </div>);
}

function CHealth(){
  const runtime=useRuntime();const{state:{history,refDocs}}=useGlobalStore();
  const[artifactCount,setArtifactCount]=useState(0);const[stage,setStage]=useState(0);
  useEffect(()=>{fetch('/api/data').then(r=>r.json()).then(d=>{setArtifactCount(d.artifacts?.length??0);setStage(d.currentStage??0);}).catch(()=>{});},[]);
  const staleCount=runtime.state.staleArtifacts.size;
  const rows=[
    {label:'Lifecycle stage',value:formatStageDisplay(stage),color:stage>=STAGE_COUNT-1?S.accent:S.indigo},
    {label:'Artifacts',value:artifactCount,color:artifactCount>0?S.accent:S.textMute},
    {label:'Stale artifacts',value:staleCount,color:staleCount>0?S.amber:S.textMute},
    {label:'Improvements this session',value:runtime.state.improvementCount,color:runtime.state.improvementCount>0?S.indigo:S.textMute},
    {label:'Reasoning chain',value:history.length,color:history.length>0?S.indigo:S.textMute,note:'entries'},
    {label:'Reference documents',value:refDocs.length,color:refDocs.length>0?S.blue:S.textMute},
    {label:'Runtime events',value:runtime.state.events.length,color:S.textMute},
    {label:'Session tokens used',value:runtime.state.sessionTokens.toLocaleString(),color:S.textMute,note:'tokens'},
    {label:'Session cost',value:`$${runtime.state.sessionCost.toFixed(4)}`,color:runtime.state.sessionCost>0?S.indigo:S.textMute},
  ];
  return(<div>
    <div style={{marginBottom:'12px',fontSize:'11px',color:S.textDim,lineHeight:1.7}}>Read-only system health snapshot. Reflects current session state. Cannot be edited here.</div>
    <div style={{backgroundColor:S.card,border:`1px solid ${S.border}`,borderRadius:'4px',overflow:'hidden'}}>
      {rows.map((r,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 12px',borderBottom:i<rows.length-1?`1px solid ${S.border}`:'none'}}>
          <span style={{fontSize:'11px',color:S.textDim}}>{r.label}</span>
          <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
            <span style={{fontSize:'13px',color:r.color,fontWeight:700,...MONO}}>{String(r.value)}</span>
            {r.note&&<span style={{fontSize:'9px',color:S.textMute}}>{r.note}</span>}
          </div>
        </div>
      ))}
    </div>
    <div style={{marginTop:'10px',fontSize:'9px',color:S.textMute2,lineHeight:1.6}}>Lifecycle status · {stage>=STAGE_COUNT-1?'COMPLETE':'ACTIVE'} · {artifactCount} artifact{artifactCount!==1?'s':''} generated</div>
  </div>);
}

function CAdvanced(){
  const{state:{settings},updateSettings,exportSettings,importSettings}=useGlobalStore();const s=settings;
  const fileRef=useRef<HTMLInputElement>(null);
  const handleImport=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();reader.onload=ev=>{const text=ev.target?.result as string;if(text)importSettings(text);};reader.readAsText(file);
  };
  return(<div>
    <Row label="Persistence Mode" description="Where settings are stored. Supabase becomes available in V3.4 after account creation.">
      <Sel value={s.persistenceMode} onChange={v=>updateSettings({persistenceMode:v})} options={[{value:'local',label:'Local storage'},{value:'supabase',label:'Supabase (V3.4)'}]}/>
    </Row>
    <Row label="Debug Mode" description="Show content parser method badges on artifacts and enable verbose console logging.">
      <Toggle value={s.debugMode} onChange={v=>updateSettings({debugMode:v})}/>
    </Row>
    <Row label="TipTap Renderer (Studio)" description="Render Studio artifacts via TipTap instead of the legacy renderer. Read-only preview — Mission 1. Off by default.">
      <Toggle value={s.useTipTapRenderer} onChange={v=>updateSettings({useTipTapRenderer:v})}/>
    </Row>
    <div style={{marginTop:'18px',paddingTop:'14px',borderTop:`1px solid ${S.border}`}}>
      <div style={{fontSize:'10px',color:'#2a5a30',fontWeight:700,letterSpacing:'0.1em',marginBottom:'10px'}}>BACKUP & MIGRATION</div>
      <div style={{display:'flex',gap:'7px',flexWrap:'wrap' as const}}>
        <button onClick={exportSettings} style={{...B(),padding:'8px 14px',fontSize:'11px',backgroundColor:'#0a0f1e',color:S.indigo,outline:`1px solid ${S.indigo}33`}}>↓ Export settings</button>
        <button onClick={()=>fileRef.current?.click()} style={{...B(),padding:'8px 14px',fontSize:'11px',backgroundColor:S.card,color:S.textDim,outline:`1px solid ${S.border2}`}}>↑ Import settings</button>
      </div>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{display:'none'}}/>
      <div style={{marginTop:'8px',fontSize:'9px',color:S.textMute2,lineHeight:1.6}}>Export saves all settings to ideagate-settings.json. Import validates against the V3.1 schema before applying. Invalid files are rejected without corrupting existing settings.</div>
    </div>
  </div>);
}

// ── Main modal ────────────────────────────────────────────────────────────────
interface Props { onClose:()=>void; }

export default function SettingsModal({ onClose }:Props) {
  // Portal: renders into document.body to bypass any parent overflow/transform
  const [mounted, setMounted] = useState(false);
  useEffect(()=>{ setMounted(true); },[]);

  const [activeId, setActiveId] = useState<CategoryId>('appearance');
  const [search,   setSearch]   = useState('');
  const searchRef  = useRef<HTMLInputElement>(null);

  // ── Save feedback: watches settings object reference changes ─────────────
  const { state:{ settings } } = useGlobalStore();
  const prevSettingsRef = useRef(settings);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    if (prevSettingsRef.current !== settings) {
      prevSettingsRef.current = settings;
      setShowSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(()=>setShowSaved(false), 2000);
    }
  },[settings]);

  // ── Keyboard handlers ─────────────────────────────────────────────────────
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key==='f'){e.preventDefault();searchRef.current?.focus();}
      if(e.key==='Escape') onClose();
    };
    document.addEventListener('keydown',handler);
    return()=>document.removeEventListener('keydown',handler);
  },[onClose]);

  // ── Search: filter against SEARCH_INDEX (setting labels + descriptions) ───
  const trimmed = search.trim().toLowerCase();
  const searchResults = trimmed
    ? SEARCH_INDEX.filter(s =>
        s.label.toLowerCase().includes(trimmed) ||
        s.description.toLowerCase().includes(trimmed)
      )
    : [];
  const isSearching = trimmed.length > 0;

  // Sidebar: when searching, bold categories that have hits; otherwise show all
  const hitCategories = new Set(searchResults.map(r=>r.category));

  function renderContent(){
    // Search results panel
    if (isSearching) {
      return(
        <div>
          <div style={{marginBottom:'12px',fontSize:'10px',color:S.textMute,letterSpacing:'0.06em'}}>
            {searchResults.length} result{searchResults.length!==1?'s':''} for "{search.trim()}"
          </div>
          {searchResults.length === 0
            ? <div style={{fontSize:'11px',color:S.textMute,lineHeight:1.8}}>No settings match this query.<br/>Try searching by setting label or description.</div>
            : searchResults.map((r,i)=>(
                <div key={i} onClick={()=>{setActiveId(r.category);setSearch('');}}
                  style={{padding:'10px',marginBottom:'7px',backgroundColor:S.card,border:`1px solid ${S.border}`,borderRadius:'4px',cursor:'pointer'}}
                  onMouseOver={e=>(e.currentTarget.style.borderColor=S.border2)}
                  onMouseOut={e=>(e.currentTarget.style.borderColor=S.border)}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'3px'}}>
                    <span style={{fontSize:'9px',color:CATEGORIES.find(c=>c.id===r.category)?.color??S.textMute,padding:'1px 6px',border:`1px solid ${CATEGORIES.find(c=>c.id===r.category)?.color??S.textMute}33`,borderRadius:'2px'}}>
                      {r.categoryLabel}
                    </span>
                    <span style={{fontSize:'12px',color:S.text,fontWeight:600,...MONO}}>{r.label}</span>
                  </div>
                  <div style={{fontSize:'10px',color:S.textDim,lineHeight:1.5}}>{r.description}</div>
                  <div style={{fontSize:'9px',color:S.textMute,marginTop:'5px'}}>Click to go to {r.categoryLabel} →</div>
                </div>
              ))
          }
        </div>
      );
    }
    if(activeId==='appearance')    return <CAppearance/>;
    if(activeId==='ai-models')     return <CAIModels/>;
    if(activeId==='reading')       return <CReading/>;
    if(activeId==='accessibility') return <CAccessibility/>;
    if(activeId==='mode')          return <COperatingMode/>;
    if(activeId==='coordinator')   return <CCoordinator/>;
    if(activeId==='builder')       return <CBuilder/>;
    if(activeId==='intelligence')  return <CIntelligence/>;
    if(activeId==='safety')        return <CSafety/>;
    if(activeId==='health')        return <CHealth/>;
    if(activeId==='advanced')      return <CAdvanced/>;
    return null;
  }

  const activeCategory = CATEGORIES.find(c=>c.id===activeId)!;
  let lastSection = '';

  const modal = (
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.75)',backdropFilter:'blur(3px)'}}>
      <div style={{width:'840px',maxWidth:'95vw',height:'620px',maxHeight:'90vh',display:'flex',flexDirection:'column',backgroundColor:S.bg,border:`1px solid #334155`,borderRadius:'6px',overflow:'hidden',...MONO,boxShadow:'0 24px 80px rgba(0,0,0,0.7)'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',padding:'0 16px',height:'48px',borderBottom:`1px solid ${S.border}`,flexShrink:0,gap:'10px'}}>
          <span style={{fontSize:'12px',color:S.accent,fontWeight:700,letterSpacing:'0.12em'}}>IDEAGATE SETTINGS</span>
          <div style={{flex:1}}/>
          {/* Save feedback — fades in/out on settings change */}
          <span style={{fontSize:'10px',color:S.accent,transition:'opacity 0.4s',opacity:showSaved?1:0,pointerEvents:'none',letterSpacing:'0.05em'}}>✓ Saved</span>
          <span style={{fontSize:'10px',color:S.textMute}}>⌘F search · Esc close</span>
          <button onClick={onClose} style={{...B(),padding:'4px 10px',fontSize:'11px',color:S.textMute,backgroundColor:'transparent',outline:`1px solid ${S.border}`}}>✕</button>
        </div>

        {/* Body */}
        <div style={{flex:1,display:'flex',overflow:'hidden'}}>
          {/* Left sidebar */}
          <div style={{width:'188px',flexShrink:0,borderRight:`1px solid ${S.border}`,display:'flex',flexDirection:'column',backgroundColor:S.panel}}>
            {/* Search */}
            <div style={{padding:'10px 10px 8px',borderBottom:`1px solid ${S.border}`}}>
              <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="⌕  Search settings…"
                style={{width:'100%',padding:'6px 8px',...MONO,fontSize:'11px',color:S.textDim,backgroundColor:S.card,border:`1px solid ${S.border}`,borderRadius:'3px',outline:'none',boxSizing:'border-box' as const}}/>
            </div>

            {/* Category nav */}
            <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
              {CATEGORIES.map(cat=>{
                const isNewSection = cat.section !== lastSection;
                if(isNewSection) lastSection = cat.section;
                const active    = activeId === cat.id && !isSearching;
                const hasHits   = isSearching && hitCategories.has(cat.id);
                const col       = active ? cat.color : hasHits ? cat.color : S.textDim;
                return(
                  <React.Fragment key={cat.id}>
                    {isNewSection&&(
                      <div style={{padding:'10px 12px 4px',fontSize:'9px',color:SECTION_META[cat.section].color,letterSpacing:'0.1em',fontWeight:700}}>
                        {SECTION_META[cat.section].label}
                      </div>
                    )}
                    <button onClick={()=>{setActiveId(cat.id);setSearch('');}}
                      style={{...B(),display:'flex',alignItems:'center',gap:'8px',width:'100%',padding:'7px 12px',borderRadius:0,backgroundColor:active?'#0a1509':'transparent',borderLeft:`2px solid ${active?cat.color:'transparent'}`,color:col,fontSize:'11px',fontWeight:active||hasHits?700:400}}>
                      <span style={{fontSize:'12px',flexShrink:0}}>{cat.icon}</span>
                      <span>{cat.label}</span>
                      {hasHits&&<span style={{marginLeft:'auto',fontSize:'9px',color:cat.color,padding:'0 4px',border:`1px solid ${cat.color}44`,borderRadius:'2px'}}>
                        {searchResults.filter(r=>r.category===cat.id).length}
                      </span>}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{padding:'10px',borderTop:`1px solid ${S.border}`,fontSize:'9px',color:S.textMute2,lineHeight:1.5}}>
              V3.1 · localStorage · 28 settings
            </div>
          </div>

          {/* Right content */}
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'14px 20px 12px',borderBottom:`1px solid ${S.border}`,flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                {isSearching
                  ? <><span style={{fontSize:'13px'}}>⌕</span><span style={{fontSize:'13px',color:S.text,fontWeight:700}}>Search Results</span></>
                  : <><span style={{fontSize:'15px'}}>{activeCategory.icon}</span><span style={{fontSize:'13px',color:activeCategory.color,fontWeight:700}}>{activeCategory.label}</span>
                      <span style={{fontSize:'9px',color:S.textMute,padding:'1px 7px',border:`1px solid ${S.border}`,borderRadius:'2px',marginLeft:'4px'}}>{SECTION_META[activeCategory.section].label}</span></>
                }
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'8px 20px 16px'}}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        input::placeholder{color:#334155} button:disabled{opacity:.4;cursor:not-allowed!important}
      `}</style>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
