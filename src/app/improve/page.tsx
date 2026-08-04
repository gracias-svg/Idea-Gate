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
import { CheckCircle2, Moon, Sun, ChevronLeft, ChevronRight, MoreHorizontal, FileText, Kanban } from 'lucide-react';
import KanbanView from '@/components/studio/KanbanView';
import { usePanelState } from '@/lib/usePanelState';
import { useGlobalStore, getModelMeta, isModelFree } from '@/lib/GlobalStore';
import { parseContent, parseContentDetailed } from '@/lib/parseContent';
import { useRuntime, getTransitiveDownstream } from '@/lib/RuntimeContext';
import { MODEL_REGISTRY } from '@/lib/model-registry';
import Panel from '@/components/ui/Panel';
import { stageDisplayNumber } from '@/lib/execution/adapters/orchestration';
import ViewSwitcher from '@/components/improve/ViewSwitcher';
import TipTapRenderer from '@/components/improve/TipTapRenderer';
import { humanName, stageNum } from '@/lib/artifactDisplay';
import WorkspaceExplorer, { type WorkspaceNode } from '@/components/shared/WorkspaceExplorer';
import { parseSections } from '@/lib/parseSections';
import { scrollElementIntoView } from '@/lib/smoothScroll';
import { workspaceMotion } from '@/components/workspace/motion';
// WorkspacePanel + AttachmentsPanel are entirely client-only (localStorage,
// browser APIs throughout their component trees). Skipping SSR for these two
// eliminates hydration mismatches from any browser-only initialization inside
// them or their children (ProjectHeader, ArtifactTree, etc.).
import dynamic from 'next/dynamic';
// WorkspacePanel replaced by WorkspaceExplorer in Mission 16 (W6)
const AttachmentsPanel = dynamic(() => import('@/components/workspace/AttachmentsPanel'), { ssr: false });
import { CollaboratorSlot } from '@/components/workspace/CollaboratorSlots';
import { LocalProjectRepository, ensureDefaultProject, Project, ProjectRepository } from '@/lib/projectRepository';

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

type Extent    = 'light'|'medium'|'strong';
type Scope     = 'block'|'stage'|'project';
type UIState   = 'idle'|'loading'|'previewed'|'accepted';
type SaveState = 'clean'|'dirty'|'saving'|'saved'|'error';

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

// ── Type scale (Design Direction §4 · Grammar --ig-t-* tokens) ─────────────────
// The Two Voices (Ledger #5): FONT_SANS = human thinking (prose, identity, reasoning,
// headings); FONT_MONO = machine state (codes, versions, tokens, timestamps, labels).
// Editorial Hierarchy (Ledger #6): four scannable levels — identity / section /
// content / metadata. All sizes/weights/tracking read from the design-system tokens;
// nothing is invented here.
const FONT_SANS = 'var(--ig-font-sans)';
const FONT_MONO = 'var(--ig-font-mono)';
const T: Record<'hero'|'display'|'title'|'body'|'label'|'caption', React.CSSProperties> = {
  hero:    { fontFamily:FONT_SANS, fontSize:'var(--ig-t-hero-size)',    fontWeight:700, letterSpacing:'var(--ig-t-hero-tracking)' },
  display: { fontFamily:FONT_SANS, fontSize:'var(--ig-t-display-size)', fontWeight:700, letterSpacing:'var(--ig-t-display-tracking)' },
  title:   { fontFamily:FONT_SANS, fontSize:'var(--ig-t-title-size)',   fontWeight:600 },
  body:    { fontFamily:FONT_SANS, fontSize:'var(--ig-t-body-size)',    fontWeight:400, lineHeight:'var(--ig-t-body-leading)' },
  label:   { fontFamily:FONT_MONO, fontSize:'var(--ig-t-label-size)',   fontWeight:600, letterSpacing:'var(--ig-t-label-tracking)', textTransform:'uppercase' as const },
  caption: { fontFamily:FONT_MONO, fontSize:'var(--ig-t-caption-size)', fontWeight:500 },
};

// ── Hero surface + reading measure (Design Direction §1.5 · §2 · §3.1) ─────────
// The hero is a SLOT, not a type. `heroSurface` is the outer container that fills the
// full central region for ANY tenant (prose today; diagram / comparison / reasoning
// trace later) — it carries NO prose-specific constraint. `readingMeasure` is a
// DISTINCT, addressable inner layer that caps ONLY running prose to a comfortable
// measure and centres it, so whitespace becomes editorial margin rather than an empty
// gutter. The two are never fused: a non-prose tenant uses heroSurface alone.
// `fontSize` is pinned to the body rung so `68ch` resolves against the reading size
// (without it, ch collapses against an inherited 8px and the measure halves).
const heroSurface: React.CSSProperties = { flex:1, overflowY:'auto' };
const readingMeasure: React.CSSProperties = {
  maxWidth:'var(--ig-reading-max)', width:'100%', margin:'0 auto',
  fontSize:'var(--ig-t-body-size)',
};

// ── Markdown renderer ─────────────────────────────────────────────────────────
function ir(text:string,k:string):React.ReactNode[]{
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p,i)=>{
    const key=`${k}-${i}`;
    // Bold emphasis rides the human voice (inherits Sans from the paragraph); lifted
    // luminance carries the emphasis (Ledger #4 — Luminance Leads).
    if(p.startsWith('**')&&p.endsWith('**'))return<strong key={key}style={{color:'#e2e8f0',fontWeight:700}}>{p.slice(2,-2)}</strong>;
    // Inline code is machine state → stays mono.
    if(p.startsWith('`')&&p.endsWith('`')&&p.length>2)return<code key={key}style={{fontFamily:FONT_MONO,background:'#0d1117',color:'#4ade80',padding:'1px 5px',borderRadius:'3px',fontSize:'0.85em'}}>{p.slice(1,-1)}</code>;
    return<React.Fragment key={key}>{p}</React.Fragment>;
  });
}
// Editorial reading surface (Design Direction §4.2): artifact prose is *reading matter* —
// Geist Sans, comfortable line-height, real paragraph rhythm. Headings collapse onto the
// --ig-t-* scale (display / title / content). Tabular rows stay mono (machine voice).
// `fs` is retained for call-site compatibility but the body reads from the type scale.
// `anchors` (Sprint 07 W3): when true, H2 headings get an `id` computed via
// parseSections — the SAME function/order the Workspace tree uses to cache
// per-file sections, so ids always match the tree's scroll-click targets.
// Only passed for the single primary reading pane (never split/original/
// improved previews) to avoid duplicate DOM ids when the same heading text
// renders twice on screen. `arrivalId` briefly highlights the just-scrolled-to
// heading (workspaceMotion.arrivalAccentMs), honouring reducedMotion.
function MD({content,fs=12,anchors=false,arrivalId=null,reducedMotion=false}:{content:string;fs?:number;anchors?:boolean;arrivalId?:string|null;reducedMotion?:boolean}){
  void fs;
  const sectionIds = anchors ? parseSections(content) : null;
  let h2Cursor = 0;
  return(
    <div>{content.split('\n').map((line,i)=>{
      const t=line.trim(),k=`l${i}`;
      if(!t)return<div key={k}style={{height:'10px'}}/>;
      if(t==='---'||t==='***')return<div key={k}style={{borderTop:'1px solid #1e293b',margin:'20px 0'}}/>;
      if(t.startsWith('# '))return<div key={k}style={{...T.display,marginTop:i===0?0:'30px',marginBottom:'14px',paddingBottom:'10px',borderBottom:'1px solid #1e293b',color:'#f1f5f9'}}>{ir(t.slice(2),k)}</div>;
      if(t.startsWith('## ')){
        const id = sectionIds ? sectionIds[h2Cursor++]?.anchorId : undefined;
        const lit = !!id && id===arrivalId;
        return<div key={k} id={id} style={{...T.title,marginTop:'24px',marginBottom:'8px',padding:'2px 6px',marginLeft:'-6px',borderRadius:'3px',color:'#e2e8f0',backgroundColor:lit?'#0d1a10':'transparent',transition:reducedMotion?'none':`background-color ${workspaceMotion.arrivalAccentMs}ms ease-out`}}>{ir(t.slice(3),k)}</div>;
      }
      if(t.startsWith('### '))return<div key={k}style={{...T.body,fontWeight:700,marginTop:'18px',marginBottom:'5px',color:'#cbd5e1'}}>{ir(t.slice(4),k)}</div>;
      if(t.startsWith('#### '))return<div key={k}style={{...T.body,fontWeight:600,marginTop:'12px',marginBottom:'3px',color:'#94a3b8'}}>{ir(t.slice(5),k)}</div>;
      if(t.startsWith('> '))return<div key={k}style={{...T.body,margin:'10px 0',padding:'8px 14px',borderLeft:'3px solid #4ade8044',background:'#040f08',color:'#94a3b8'}}>{ir(t.slice(2),k)}</div>;
      const bm=line.match(/^(\s*)([-*])\s+(.+)/);
      if(bm)return<div key={k}style={{display:'flex',gap:'9px',marginLeft:Math.floor(bm[1].length/2)*16,margin:'4px 0'}}><span style={{color:'#4ade8066',flexShrink:0,fontSize:'13px',lineHeight:'var(--ig-t-body-leading)'}}>▸</span><span style={{...T.body,color:'#cbd5e1'}}>{ir(bm[3],k)}</span></div>;
      const om=line.match(/^(\s*)(\d+)\.\s+(.+)/);
      if(om)return<div key={k}style={{display:'flex',gap:'10px',margin:'4px 0'}}><span style={{fontFamily:FONT_MONO,fontSize:'13px',color:'#64748b',flexShrink:0,minWidth:'22px',textAlign:'right' as const,lineHeight:'var(--ig-t-body-leading)'}}>{om[2]}.</span><span style={{...T.body,color:'#cbd5e1'}}>{ir(om[3],k)}</span></div>;
      if(t.startsWith('|')){return<div key={k}style={{fontFamily:FONT_MONO,fontSize:'11px',color:'#64748b',borderBottom:'1px solid #0f1923',padding:'4px 0'}}>{t}</div>;}
      return<div key={k}style={{...T.body,color:'#cbd5e1',margin:'8px 0'}}>{ir(t,k)}</div>;
    })}</div>
  );
}

// ── Renderer switch (Mission 1 — Document Render Swap, read-only) ──────────────
// Drop-in for every <MD .../> call site. Reads GlobalSettings.useTipTapRenderer
// (default false) and picks the renderer; same props either way, so this is the
// ONLY change any call site needs. MD()/ir() above are untouched — when the flag
// is off (default), behavior is byte-for-byte what shipped before this mission.
// Mission 2: `onPresetSelect` is additive — MD() ignores it (never destructured),
// TipTapRenderer treats it as optional (bubble simply doesn't render without it).
// Only the primary reading pane call site below passes it.
function Doc(props:{content:string;fs?:number;anchors?:boolean;arrivalId?:string|null;reducedMotion?:boolean;onPresetSelect?:(intent:string)=>void;editable?:boolean;onContentChange?:(md:string)=>void;onSave?:(md:string)=>Promise<void>}){
  const{state:{settings}}=useGlobalStore();
  return settings.useTipTapRenderer ? <TipTapRenderer {...props}/> : <MD {...props}/>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
// stageNum/stageColor/humanName now live in @/lib/artifactDisplay (Sprint 07 —
// shared with the Workspace tree so the two never drift). humanName imported above.

// Static collaborator-slot shell (Sprint 07 W7) — no real multi-collaborator
// backend exists yet, so these are generic unassigned slots only, never named
// fake people. Count is a placeholder judgment call, not derived from data.
const COLLABORATOR_SLOTS: CollaboratorSlot[] = [
  { id:'slot-1', collaborator:null },
  { id:'slot-2', collaborator:null },
  { id:'slot-3', collaborator:null },
];

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

  // Hydration guard — WorkspacePanel and its children (ProjectHeader, ArtifactTree
  // etc.) contain browser-only initialisation that causes SSR/client divergence.
  // Gating on `mounted` ensures they never appear in the server-rendered HTML at all;
  // React hydrates the left-panel container as an empty div, then WorkspacePanel
  // mounts client-side without any mismatch. The 'use client' boundary doesn't
  // prevent SSR; only this guard does.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // C2 — collapsible panels (usePanelState persists to localStorage)
  const leftPanel  = usePanelState('left',  210, false);
  const rightPanel = usePanelState('right', 270, false);

  // C3 — workspace view switcher (list | grid), persisted
  // Hydration-safe: always start with 'list' (matches SSR), sync from localStorage after mount.
  const [workspaceView, setWorkspaceView] = useState<'list'|'grid'>('list');
  useEffect(() => {
    const stored = localStorage.getItem('ig_workspace_view') as 'list'|'grid'|null;
    if (stored === 'list' || stored === 'grid') setWorkspaceView(stored);
  }, []);
  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  const setWorkspaceViewPersist = (v: 'list'|'grid') => {
    setWorkspaceView(v);
    try { localStorage.setItem('ig_workspace_view', v); } catch { /* quota */ }
    setWsMenuOpen(false);
  };

  // K1 — Studio view mode (document | kanban). Session-only but persisted to
  // localStorage under 'ig_studio_view' for convenience across tab refreshes.
  // Hydration-safe: always start 'document' (matches SSR), sync after mount.
  const [studioView, setStudioView] = useState<'document' | 'kanban'>('document');
  useEffect(() => {
    const stored = localStorage.getItem('ig_studio_view') as 'document' | 'kanban' | null;
    if (stored === 'document' || stored === 'kanban') setStudioView(stored);
  }, []);
  const setStudioViewPersist = (v: 'document' | 'kanban') => {
    setStudioView(v);
    try { localStorage.setItem('ig_studio_view', v); } catch { /* quota */ }
  };

  // Lifecycle rail — hover focus + reduced-motion honouring (DIL 15 accessibility)
  const [hoveredStage,  setHoveredStage]  = useState<number|null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(()=>{
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = ()=>setReducedMotion(m.matches);
    sync();
    m.addEventListener?.('change', sync);
    return ()=>m.removeEventListener?.('change', sync);
  },[]);

  // ── Mission 3: Save state machine (Constitution §7) ───────────────────────
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const isSavingRef      = useRef(false);
  const queuedSaveRef    = useRef<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref to currently-selected artifact — safe to capture in async callbacks
  const selectedRef      = useRef<string | null>(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  // Self-ref to allow recursive queued save without circular useCallback deps
  const handleSaveRef    = useRef<(md: string) => Promise<void>>(async () => {});

  // ── Workspace panel (Sprint 07) ──────────────────────────────────────────
  // Project selector — thin local name registry (see projectRepository.ts).
  // Never touches the actual lifecycle run; that stays TopBar "New Idea".
  const [projectRepo] = useState<ProjectRepository>(() => new LocalProjectRepository());
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  useEffect(() => { setActiveProject(ensureDefaultProject(projectRepo, 'Untitled Project')); }, [projectRepo]);
  const handleRenameProject = useCallback((name: string) => {
    if (!activeProject) return;
    const updated = projectRepo.rename(activeProject.id, name);
    if (updated) setActiveProject(updated);
  }, [activeProject, projectRepo]);

  // Scroll-spy + click-to-scroll (W3) — scoped to the single primary reading
  // pane only (uiState==='idle'). readingContainerRef is the scroll root;
  // pendingScrollAnchorRef defers a click-triggered scroll until the target
  // artifact's content has actually loaded (async fetch on selection change).
  const [activeSectionId,  setActiveSectionId]  = useState<string|null>(null);
  const [arrivalSectionId, setArrivalSectionId] = useState<string|null>(null);
  const readingContainerRef = useRef<HTMLDivElement>(null);
  const pendingScrollAnchorRef = useRef<string|null>(null);

  const performScrollToAnchor = useCallback((anchorId: string) => {
    const container = readingContainerRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(`#${CSS.escape(anchorId)}`);
    if (!target) return;
    scrollElementIntoView(container, target, workspaceMotion.scrollToSectionMs, reducedMotion).then(() => {
      setArrivalSectionId(anchorId);
      window.setTimeout(() => setArrivalSectionId(id => (id === anchorId ? null : id)), workspaceMotion.arrivalAccentMs);
    });
  }, [reducedMotion]);

  const handleSectionClick = useCallback((file: string, anchorId: string) => {
    if (selected !== file) {
      pendingScrollAnchorRef.current = anchorId;
      setSelected(file);
    } else {
      performScrollToAnchor(anchorId);
    }
  }, [selected, performScrollToAnchor]);

  // Resolve a deferred scroll once the newly-selected artifact's content has loaded
  useEffect(() => {
    if (fileLoading || !rawContent) return;
    const anchor = pendingScrollAnchorRef.current;
    if (!anchor) return;
    pendingScrollAnchorRef.current = null;
    requestAnimationFrame(() => performScrollToAnchor(anchor));
  }, [fileLoading, rawContent, performScrollToAnchor]);

  // Scroll-spy — highlight the tree's active section as the reader scrolls manually
  useEffect(() => {
    if (uiState !== 'idle' || !rawContent) return;
    const container = readingContainerRef.current;
    if (!container) return;
    const headings = Array.from(container.querySelectorAll<HTMLElement>('[id]'));
    if (headings.length === 0) { setActiveSectionId(null); return; }
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSectionId(visible[0].target.id);
      },
      { root: container, rootMargin: '0px 0px -70% 0px', threshold: 0 },
    );
    headings.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [uiState, rawContent]);

  useEffect(()=>{
    // Poll every 4 s so the lifecycle rail and artifact tree update automatically
    // during a run — without this, stage and artifacts were frozen at page-load.
    const load = () => {
      fetch('/api/data').then(r=>r.json()).then(d=>{
        setArtifacts(d.artifacts??[]);
        setStage(d.currentStage??0);
      }).catch(()=>{});
    };
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  },[]);

  // Workflow Proof (Cmd+K) — "jump to artifact" entry point. The palette
  // lives outside this page's component tree (rendered globally in
  // layout.tsx), so it can't call setSelected directly; it navigates here
  // with ?artifact=<file> instead, reusing the exact same setSelected this
  // page's own tree/click already calls. No new selection capability.
  // Reads window.location directly (not next/navigation's useSearchParams)
  // to avoid forcing this whole page into a Suspense boundary for one
  // one-shot param read.
  useEffect(() => {
    if (artifacts.length === 0) return;
    const requested = new URLSearchParams(window.location.search).get('artifact');
    if (requested && artifacts.includes(requested)) setSelected(requested);
  }, [artifacts]);

  // Load artifact — now uses parseContentDetailed for warning visibility
  useEffect(()=>{
    setResult(null); setUiState('idle'); setError(null); setRawContent(null); setParseWarn(null); setActiveSectionId(null);
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

  // ── W6: Studio workspace tree for WorkspaceExplorer ────────────────────────
  // Simpler health than Desk: isStale → stale, else trustworthy (no 'questionable').
  const studioTree = React.useMemo((): WorkspaceNode[] => {
    const STUDIO_PHASES = [
      { id: 'discover',  label: 'Discover',  color: '#4ade80', stages: [0, 1, 2]        },
      { id: 'decide',    label: 'Decide',    color: '#38bdf8', stages: [3, 4, 5, 6]     },
      { id: 'specify',   label: 'Specify',   color: '#818cf8', stages: [7, 8, 9]        },
      { id: 'architect', label: 'Architect', color: '#fb923c', stages: [10, 11]         },
      { id: 'ship',      label: 'Ship',      color: '#fde047', stages: [12, 13, 14]     },
    ];
    return [{
      id:    'documents',
      kind:  'folder',
      label: 'Documents',
      count: artifacts.length,
      children: STUDIO_PHASES.map(phase => ({
        id:         `phase-${phase.id}`,
        kind:       'folder' as const,
        label:      phase.label,
        phaseColor: phase.color,
        count:      phase.stages.filter(n => artifacts.some(f => stageNum(f) === n)).length,
        children:   phase.stages.map(n => {
          const file   = artifacts.find(f => stageNum(f) === n);
          const health = file ? (runtime.isStale(file) ? 'stale' : 'trustworthy') : 'queued';
          return {
            id:          `stage-${n}`,
            kind:        (file ? 'file' : 'disabled') as 'file' | 'disabled',
            label:       STAGE_LABELS[n] ?? `Stage ${n}`,
            file:        file,
            stageIndex:  n,
            healthState: health as WorkspaceNode['healthState'],
            version:     file ? runtime.getVersion(file) : 0,
          } satisfies WorkspaceNode;
        }),
      })),
    }];
  }, [artifacts, runtime]);

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

  // ── Mission 3: Save pipeline (Constitution §7) ────────────────────────────
  // Reset save state and cancel any pending autosave when the artifact switches.
  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = null;
    setSaveState('clean');
    isSavingRef.current = false;
    queuedSaveRef.current = null;
  }, [selected]);

  const handleSave = useCallback(async (md: string): Promise<void> => {
    if (!selectedRef.current) return;
    if (isSavingRef.current) { queuedSaveRef.current = md; return; }
    isSavingRef.current = true;
    setSaveState('saving');
    try {
      const res = await fetch('/api/artifact', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactName: selectedRef.current, content: md }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? 'Save failed');
      setSaveState('saved');
      setTimeout(() => setSaveState(s => s === 'saved' ? 'clean' : s), 2000);
    } catch {
      setSaveState('error');
    } finally {
      isSavingRef.current = false;
      const queued = queuedSaveRef.current;
      if (queued !== null) {
        queuedSaveRef.current = null;
        void handleSaveRef.current(queued); // replay queued save through stable ref
      }
    }
  }, []);

  // Keep the stable ref up to date with the memoized function
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  // 8-second autosave debounce (Constitution §7 — NOT 3s)
  const handleContentChange = useCallback((md: string) => {
    setSaveState('dirty');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => void handleSave(md), 8000);
  }, [handleSave]);

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
    <div style={{display:'flex',flexDirection:'column',height:'100vh',backgroundColor:'var(--ig-canvas)',overflow:'hidden',...MONO,color:'#94a3b8'}}>
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
        <div style={{display:'flex',gap:'10px',fontSize:'10px'}}>
          {runtime.state.sessionTokens>0&&<span style={{color:'#334155'}}><span style={{color:'#818cf8'}}>{runtime.state.sessionTokens.toLocaleString()}</span>t <span style={{color:'#4ade80'}}>${runtime.state.sessionCost.toFixed(4)}</span></span>}
        </div>

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

        {/* K2 — Studio view mode switcher: [Document] [Kanban] */}
        <div style={{ display:'flex', alignItems:'center', gap:'2px', border:'1px solid #1e293b', borderRadius:'5px', padding:'2px', flexShrink:0 }}>
          {([
            { view: 'document' as const, Icon: FileText,  label: 'Document' },
            { view: 'kanban'   as const, Icon: Kanban,    label: 'Kanban'   },
          ] as const).map(({ view, Icon, label }) => {
            const isActive = studioView === view;
            return (
              <button
                key={view}
                onClick={() => setStudioViewPersist(view)}
                aria-label={`Switch to ${label} view`}
                title={`${label} view`}
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  gap:             '5px',
                  padding:         '4px 9px',
                  fontSize:        '10px',
                  fontFamily:      "'JetBrains Mono','Fira Code',monospace",
                  fontWeight:      isActive ? 600 : 400,
                  letterSpacing:   '0.04em',
                  borderRadius:    '3px',
                  border:          'none',
                  cursor:          'pointer',
                  backgroundColor: isActive ? '#0a1f0e' : 'transparent',
                  color:           isActive ? '#4ade80' : '#475569',
                  outline:         isActive ? '1px solid #4ade8033' : 'none',
                  transition:      'color 120ms ease-out, background-color 120ms ease-out',
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </div>

        <div style={{display:'flex',gap:'4px'}}>
          {staleCount>0&&<button onClick={()=>runtime.clearStale()} style={{...B,padding:'4px 8px',fontSize:'9px',backgroundColor:'#0a0800',color:'#f59e0b',outline:'1px solid #f59e0b33'}}>△ {staleCount} stale</button>}
          {selected&&rawContent&&uiState==='idle'&&<button onClick={()=>handleDownload(selected,rawContent)} style={{...B,padding:'5px 10px',fontSize:'10px',backgroundColor:'#0a1509',color:'#4ade80',outline:'1px solid #1a3a20'}}>↓ MD</button>}
        </div>
      </div>

      {/* ── Graph/Events/Reasoning tab bar ── */}
      <div style={{borderBottom:'1px solid #0a1a2e',flexShrink:0,backgroundColor:'#020c06'}}>
        <div style={{display:'flex'}}>
          <ViewSwitcher panel={panel} setPanel={setPanel} />
          <div style={{flex:1}}/>
          <span style={{fontSize:'9px',color:'#94a3b8',alignSelf:'center',marginRight:'12px'}}>
            {panel==='graph'&&`15 nodes · ${staleCount} stale · ${Object.keys(runtime.state.artifactVersions).length} improved`}
            {panel==='events'&&`${runtime.state.events.length} events · BroadcastChannel active`}
            {panel==='reasoning'&&`${runtime.state.reasoningChain.length} entries`}
          </span>
        </div>

        {/* ── Lifecycle rail — the enforced 15-stage lifecycle, IdeaGate's signature.
             Progress reads left→right: completed · current · pending (DIL 09). Numbers
             identify each stage; full names on hover (15 names cannot fit inline at
             1440px). Idle is still; motion only on hover, and never under reduced-motion. ── */}
        {panel==='graph'&&(
          <div style={{padding:'8px 16px',height:'100px',overflow:'hidden'}}>
            <svg width="100%" height="84" style={{display:'block',overflow:'visible'}} role="img" aria-label="Lifecycle stage progress">
              {/* Pass 1 — connector as progress track: filled up to the current stage, muted after */}
              {Array.from({length:14},(_,k)=>{
                const i = k+1;                         // segment joins node i-1 → node i
                const completed = i <= stage;
                return (
                  <line key={`seg-${i}`}
                    x1={`${(i-0.5)*(100/15)}%`} y1={38} x2={`${(i+0.5)*(100/15)}%`} y2={38}
                    stroke={completed?'#4ade80':'#1e293b'} strokeOpacity={completed?0.5:1}
                    strokeWidth={completed?2:1.5}/>
                );
              })}
              {/* Pass 2 — stage nodes */}
              {Array.from({length:15},(_,i)=>{
                const art = artifacts.find(a=>parseInt(a.split('-')[0],10)===i);
                const isStale     = art?runtime.state.staleArtifacts.has(art):false;
                const ver         = art?(runtime.state.artifactVersions[art]??0):0;
                const isSelected  = !!art && selected===art;
                const isCompleted = i < stage;
                const isCurrent   = i === stage;
                const isHovered   = hoveredStage===i;
                const cx    = `${(i+0.5)*(100/15)}%`;
                const rBase = isCurrent?12:10;
                const fill  = isStale?'#f59e0b':(isCompleted||isCurrent)?'#4ade80':'#334155';
                const numColor = isStale?'#020c06':(isCompleted||isCurrent)?'#04140b':'#cbd5e1';
                const label = STAGE_LABELS[i] ?? `Stage ${i}`;
                return (
                  <g key={i}
                     onMouseEnter={()=>setHoveredStage(i)}
                     onMouseLeave={()=>setHoveredStage(null)}
                     onClick={()=>art&&setSelected(art)}
                     style={{cursor:art?'pointer':'default'}}>
                    <title>{label}</title>
                    {/* enlarged invisible hit/hover target */}
                    <circle cx={cx} cy={38} r={16} fill="transparent"/>
                    {/* lifting group — node + number + status badge rise together on hover */}
                    <g style={{transform:(isHovered&&!reducedMotion)?'translateY(-2px)':'none',
                               transition:reducedMotion?'none':'transform 140ms ease-out'}}>
                      {isCurrent&&(
                        <circle cx={cx} cy={38} r={rBase+5} fill="none" stroke="#4ade80" strokeOpacity={0.45} strokeWidth={1.5}/>
                      )}
                      <circle cx={cx} cy={38} r={rBase} fill={fill}
                        stroke={isSelected?'#818cf8':'none'} strokeWidth={isSelected?2:0}/>
                      <text x={cx} y={38} fontSize={10.5} fontWeight={600} fill={numColor}
                        textAnchor="middle" dominantBaseline="central"
                        style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",pointerEvents:'none'}}>
                        {stageDisplayNumber(i)}
                      </text>
                      {isStale
                        ? <text x={cx} y={16} fontSize={8} fill="#f59e0b" textAnchor="middle" style={{pointerEvents:'none'}}>△</text>
                        : ver>0 && <text x={cx} y={16} fontSize={8} fill="#4ade8099" textAnchor="middle" style={{pointerEvents:'none'}}>v{ver}</text>}
                    </g>
                    {/* hover tooltip — full stage name, dark outline keeps it legible over any node */}
                    <text x={cx} y={66} fontSize={10.5} fill="#e2e8f0" textAnchor="middle"
                      stroke="#020c06" strokeWidth={3} paintOrder="stroke"
                      opacity={isHovered?1:0}
                      style={{transition:reducedMotion?'none':'opacity 140ms ease-out',pointerEvents:'none'}}>
                      {label}
                    </text>
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

        {/* C2 — Left sidebar: collapsible, 200ms ease-in-out (Constitution §13 motion) */}
        <div style={{
          width: leftPanel.collapsed ? '0px' : '210px',
          flexShrink: 0,
          borderRight: leftPanel.collapsed ? 'none' : '1px solid #0a1a2e',
          backgroundColor: '#020c06',
          overflow: 'hidden',
          transition: 'width 200ms ease-in-out, border-right 200ms ease-in-out',
        }}>
          {/* W6: WorkspaceExplorer replaces WorkspacePanel */}
          <WorkspaceExplorer
            tree={studioTree}
            activeNodeId={selected ? `stage-${stageNum(selected)}` : null}
            onNodeSelect={(node) => { if (node.file) setSelected(node.file); }}
            width={210}
            headerLabel="WORKSPACE"
          />
        </div>

        {/* C2 — Left panel toggle tab (zero-width boundary, tab hangs outside) */}
        <div style={{ position: 'relative', flexShrink: 0, width: '0px', zIndex: 5 }}>
          <button
            onClick={leftPanel.toggle}
            aria-label={leftPanel.collapsed ? 'Expand workspace panel' : 'Collapse workspace panel'}
            title={leftPanel.collapsed ? 'Expand workspace' : 'Collapse workspace'}
            style={{
              position: 'absolute', left: '0px', top: '50%',
              transform: 'translateY(-50%)',
              width: '20px', height: '48px',
              background: 'var(--ig-surface-raised)',
              borderRadius: '0 6px 6px 0',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#475569',
            }}
          >
            {leftPanel.collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Centre content */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {/* K5 — Kanban view: replaces document surface when studioView === 'kanban' */}
          {studioView === 'kanban' && (
            <KanbanView
              artifacts={artifacts}
              onSelectArtifact={(file) => {
                setSelected(file);
                setStudioViewPersist('document');
              }}
              isStale={(f) => runtime.isStale(f)}
              getVersion={(f) => runtime.getVersion(f)}
            />
          )}

          {/* Document view — rendered only when studioView === 'document' */}
          {studioView === 'document' && result&&uiState==='previewed'&&(
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

          {studioView === 'document' && !selected&&(
            <div style={{...heroSurface,display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 56px'}}>
              <div style={{...readingMeasure,display:'flex',flexDirection:'column',gap:'32px'}}>
                <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                  <div style={{...T.display,color:'#e2e8f0'}}>Choose an artifact to refine</div>
                  <div style={{...T.body,color:'#64748b',maxWidth:'56ch'}}>
                    Each artifact is a stage in the product lifecycle. Open one to read it as a
                    working document, then brief the model on how to improve it — every change is
                    previewed before you accept it, and its downstream impact is shown before you commit.
                  </div>
                </div>
                {artifacts.length>0&&STAGE_SUGGESTIONS.filter(s=>artifacts.includes(s.file)).length>0&&(
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div style={{...T.label,color:'#2a5a30'}}>Suggested starting points</div>
                    <div style={{display:'flex',flexDirection:'column'}}>
                      {STAGE_SUGGESTIONS.filter(s=>artifacts.includes(s.file)).map(s=>(
                        <button key={s.file} onClick={()=>setSelected(s.file)}
                          style={{display:'flex',flexDirection:'column',gap:'4px',alignItems:'flex-start',textAlign:'left' as const,
                            padding:'14px 4px',background:'transparent',border:'none',borderBottom:'1px solid #0a1a2e',cursor:'pointer'}}>
                          <span style={{...T.title,color:'#cbd5e1',textTransform:'capitalize' as const}}>{humanName(s.file)}</span>
                          <span style={{...T.body,color:'#64748b'}}>{s.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {studioView === 'document' && selected&&fileLoading&&<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:'11px',color:'#475569'}}>Loading artifact…</span></div>}

          {studioView === 'document' && selected&&!fileLoading&&uiState==='idle'&&rawContent&&(
            <div
              ref={readingContainerRef}
              data-document-theme={gs.documentTheme}
              style={{
                ...heroSurface,
                // F3 — paper mode: 8px top (card anchored close to toolbar); dark: keep 32px breathing room
                padding: gs.documentTheme === 'paper' ? '8px 40px 32px' : '32px 40px',
                // C1 — paper mode: deeper warm tone creates intentional depth gap between
                // outer field and card surface, softening the hard canvas→white seam
                backgroundColor: gs.documentTheme === 'paper' ? '#D5CFC9' : undefined,
                // F4 — paper mode: flex column so card can flex-grow to fill viewport
                display: gs.documentTheme === 'paper' ? 'flex' : undefined,
                flexDirection: gs.documentTheme === 'paper' ? 'column' as const : undefined,
                alignItems: gs.documentTheme === 'paper' ? 'center' : undefined,
              }}
            >
              {/* V1 — paper mode: inner card lifts off the warm field */}
              <div style={{
                ...readingMeasure,
                ...(gs.documentTheme === 'paper' ? {
                  maxWidth:'760px',
                  width:'100%',
                  background:'#FDF8F3',
                  // C1 — softer shadow (was 4px 32px dramatic drop); 8px radius reads
                  // as integrated rather than a distinct widget (12px was too card-like)
                  borderRadius:'8px',
                  boxShadow:'0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
                  padding:'40px 48px',
                  // F4 — paper card fills remaining viewport height (min), scrolls for long docs
                  flexGrow: 1,
                  boxSizing: 'border-box' as const,
                } : {}),
              }}>
                {/* B4 — Document Identity Header (Constitution §4) */}
                <div style={{marginBottom:'16px'}}>
                  {/* Title row: parsed H1 or humanName fallback + V2 pill + save state */}
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
                    {/* F7 — title: 24px / 800 / -0.5px tracking, stronger authority */}
                    <div style={{
                      fontFamily:'var(--ig-font-sans)',fontSize:'24px',fontWeight:800,
                      letterSpacing:'-0.5px',lineHeight:1.2,flex:1,
                      color: gs.documentTheme === 'paper' ? '#111827' : 'var(--ig-text-primary)',
                    }}>
                      {/^#\s+(.+)/m.exec(rawContent)?.[1] ?? humanName(selected)}
                    </div>
                    {/* V2 — Moon/Sun theme toggle pill (56 × 22 px) */}
                    <button
                      type="button"
                      onClick={() => updateSettings({ documentTheme: gs.documentTheme === 'paper' ? 'dark' : 'paper' })}
                      aria-label={gs.documentTheme === 'paper' ? 'Switch to dark theme' : 'Switch to paper theme'}
                      title={gs.documentTheme === 'paper' ? 'Dark mode' : 'Paper mode'}
                      style={{
                        flexShrink:0,display:'flex',alignItems:'center',gap:'4px',
                        width:'56px',height:'22px',
                        borderRadius:'var(--ig-radius-full)',
                        border:'1px solid rgba(74,222,128,0.2)',
                        background: gs.documentTheme === 'paper' ? 'rgba(253,248,243,0.6)' : 'rgba(255,255,255,0.04)',
                        cursor:'pointer',padding:'0 6px',
                      }}
                    >
                      <Moon size={11} color={gs.documentTheme === 'dark' ? '#4ade80' : '#94a3b8'} />
                      <div style={{flex:1}}/>
                      <Sun size={11} color={gs.documentTheme === 'paper' ? '#f59e0b' : '#64748b'} />
                    </button>
                    {/* Save state indicator — right-aligned (§7) */}
                    <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:'5px'}}>
                      {saveState==='dirty'&&(
                        <div style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:'#f59e0b'}} title="Unsaved changes"/>
                      )}
                      {saveState==='saving'&&(
                        <div style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:'#4ade80',animation:'pulse 800ms ease-in-out infinite'}} title="Saving…"/>
                      )}
                      {saveState==='saved'&&(
                        <CheckCircle2 size={12} color="#4ade80" aria-label="Saved"/>
                      )}
                      {saveState==='error'&&(<>
                        <div style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:'#f87171'}}/>
                        <span style={{fontSize:'11px',color:'#f87171'}}>Save failed</span>
                      </>)}
                    </div>
                  </div>
                  {/* F7 — stage label: 1.2px tracking (up from 0.8px), 0.5 opacity (more recessive) */}
                  <div style={{
                    fontFamily:FONT_MONO,fontSize:'11px',fontWeight:500,
                    textTransform:'uppercase',letterSpacing:'1.2px',
                    color: gs.documentTheme === 'paper' ? '#4a5568' : '#64748b',
                    opacity:0.5,marginBottom:'4px',
                  }}>
                    {STAGE_LABELS[parseInt(selected.split('-')[0],10)] ?? ''}
                  </div>
                </div>
                {/* V5 — kicker: 10.5px / JetBrains Mono / 0.5 opacity */}
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'20px'}}>
                  <div style={{fontFamily:FONT_MONO,fontSize:'10.5px',fontWeight:500,textTransform:'uppercase',letterSpacing:'var(--ig-t-label-tracking)',color:'#2a5a30',opacity:0.5}}>
                    CURRENT · {selected}
                  </div>
                  {runtime.isStale(selected)&&<div style={{...T.caption,color:'#f59e0b',padding:'1px 6px',border:'1px solid #f59e0b33',borderRadius:'2px'}}>△ STALE</div>}
                  {runtime.getVersion(selected)>0&&<div style={{...T.caption,color:'#4ade80',padding:'1px 6px',border:'1px solid #4ade8033',borderRadius:'2px'}}>v{runtime.getVersion(selected)}</div>}
                </div>
                {/* F1 — suppress parse banner when TipTap is active: TipTap renders raw markdown
                    directly and doesn't use the V2 parse result — the warning is meaningless here */}
                {parseWarn&&!gs.useTipTapRenderer&&<div style={{marginBottom:'16px',padding:'7px 10px',backgroundColor:'#0a0a00',border:'1px solid #f59e0b33',borderRadius:'3px',...T.caption,color:'#f59e0b88'}}>{parseWarn}</div>}
                {/* B3 — main reading pane is editable; split/preview panes remain read-only */}
                <Doc content={rawContent} fs={12} anchors arrivalId={arrivalSectionId} reducedMotion={reducedMotion} onPresetSelect={setIntent} editable onSave={handleSave} onContentChange={handleContentChange}/>
              </div>
            </div>
          )}

          {studioView === 'document' && uiState==='loading'&&(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'12px'}}>
              <div style={{...T.label,color:'#475569',animation:'pulse 1.5s infinite'}}>GENERATING…</div>
              <div style={{...T.caption,color:activeModel.color}}>{activeModel.label} · {activeModel.provider} · {activeModel.cost}</div>
              {docs.length>0&&<div style={{...T.caption,color:'#818cf8'}}>{docs.length} reference doc{docs.length>1?'s':''} injected into context</div>}
            </div>
          )}

          {studioView === 'document' && uiState==='accepted'&&(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'14px'}}>
              <div style={{fontSize:'24px',color:'#4ade80'}}>✓</div>
              <div style={{...T.title,color:'#4ade80'}}>Improvement accepted · graph updated</div>
              <div style={{...T.body,color:'#64748b',textAlign:'center' as const,maxWidth:'52ch'}}>{selected} saved to disk · {getTransitiveDownstream(selected!).length} downstream artifacts marked stale</div>
              {result&&<div style={{...T.caption,color:'#334155'}}>{result.tokens?.total?.toLocaleString()} tokens · ${result.cost?.toFixed(4)} · {result.modelKey}</div>}
              <div style={{display:'flex',gap:'8px',marginTop:'6px'}}>
                <button onClick={handleDiscard} style={{...B,padding:'7px 14px',fontSize:'11px',backgroundColor:'#0a1509',color:'#4ade80',outline:'1px solid #1a3a20'}}>Improve again</button>
                <button onClick={()=>setShowBuild(true)} style={{...B,padding:'7px 14px',fontSize:'11px',backgroundColor:'#0a0f1e',color:'#818cf8',outline:'1px solid #818cf833'}}>Generate build package</button>
              </div>
            </div>
          )}

          {studioView === 'document' && result&&uiState==='previewed'&&view==='split'&&(
            <div style={{flex:1,display:'flex',overflow:'hidden'}}>
              <div style={{flex:1,overflowY:'auto',padding:'24px 28px',borderRight:'1px solid #0a1a2e'}}>
                <div style={{...T.label,color:'#2a5a30',marginBottom:'16px'}}>ORIGINAL</div>
                <Doc content={result.original} fs={12}/>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'24px 28px'}}>
                <div style={{...T.label,color:'#4ade8099',marginBottom:'16px'}}>IMPROVED · {result.modelKey}</div>
                <Doc content={result.improved} fs={12}/>
              </div>
            </div>
          )}
          {studioView === 'document' && result&&uiState==='previewed'&&view==='original'&&<div style={{...heroSurface,padding:'24px 32px'}}><div style={readingMeasure}><Doc content={result.original} fs={12}/></div></div>}
          {studioView === 'document' && result&&uiState==='previewed'&&view==='improved'&&<div style={{...heroSurface,padding:'24px 32px'}}><div style={readingMeasure}><Doc content={result.improved} fs={13}/></div></div>}

          {error&&<div style={{padding:'8px 16px',backgroundColor:'#150005',borderTop:'1px solid #f8717133',flexShrink:0,fontSize:'11px',color:'#f87171'}}>⚠ {error}</div>}
        </div>

        {/* C2 — Right panel toggle tab (mirrored: tab hangs to the left) */}
        <div style={{ position: 'relative', flexShrink: 0, width: '0px', zIndex: 5 }}>
          <button
            onClick={rightPanel.toggle}
            aria-label={rightPanel.collapsed ? 'Expand AI panel' : 'Collapse AI panel'}
            title={rightPanel.collapsed ? 'Expand AI panel' : 'Collapse AI panel'}
            style={{
              position: 'absolute', right: '0px', top: '50%',
              transform: 'translateY(-50%)',
              width: '20px', height: '48px',
              background: 'var(--ig-surface-raised)',
              borderRadius: '6px 0 0 6px',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#475569',
            }}
          >
            {rightPanel.collapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* C2 — Right panel: collapsible */}
        <div style={{
          width: rightPanel.collapsed ? '0px' : '270px',
          flexShrink: 0,
          borderLeft: rightPanel.collapsed ? 'none' : '1px solid #0a1a2e',
          backgroundColor: '#020c06',
          overflow: 'hidden',
          transition: 'width 200ms ease-in-out, border-left 200ms ease-in-out',
        }}>
          {/* Inner fixed-width wrapper so content doesn't reflow during animation */}
          <div style={{width:'270px',flexShrink:0,display:'flex',flexDirection:'column',overflowY:'auto',height:'100%'}}>
          <div style={{padding:'16px 14px'}}>
            {/* Primary act of the Direct aide: brief the collaborator (human voice). */}
            <div style={{...T.label,color:'#2a5a30',marginBottom:'8px'}}>IMPROVEMENT INTENT</div>
            <textarea value={intent} onChange={e=>setIntent(e.target.value)}
              placeholder='Describe what to improve — e.g. "Strengthen competitive moat with a defensible advantage and long-term implications"'
              style={{width:'100%',minHeight:'120px',padding:'11px',fontFamily:FONT_SANS,fontSize:'13px',color:'#cbd5e1',backgroundColor:'#040b14',border:'1px solid #0f1923',borderRadius:'4px',resize:'vertical',outline:'none',lineHeight:1.55,boxSizing:'border-box' as const}}/>

            {/* Active model badge — machine metadata */}
            <div style={{margin:'8px 0'}}>
              <Panel elevation={1} density="compact" className="relative overflow-hidden rounded-sm">
                {/* Identity signal — a 2px left edge in the active model's colour.
                    A quiet marker on Panel's own material, not a tinted fill: it
                    identifies the active collaborator without advertising it (DIL 05). */}
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:'2px',backgroundColor:activeModel.color}}/>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <div style={{width:'5px',height:'5px',borderRadius:'50%',backgroundColor:activeModel.color,flexShrink:0}}/>
                  <div style={{flex:1,...T.caption}}>
                    <span style={{color:activeModel.color,fontWeight:700}}>{activeModel.label}</span>
                    <span style={{color:'#334155'}}> · {activeModel.provider} · {activeModel.cost} · {activeModel.use}</span>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Refinements below recede — quieter labels, more whitespace between groups. */}
            <div style={{...T.label,color:'#2a5a30',marginTop:'22px',marginBottom:'7px'}}>PRESETS</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
              {PRESETS.map(p=><button key={p.label} onClick={()=>setIntent(p.intent)} className="ig-preset-chip ig-interactive-row" style={{...MONO,padding:'3px 7px',fontSize:'var(--ig-t-caption-size)',fontWeight:500}}>{p.label}</button>)}
            </div>

            {/* Reference docs — Sprint 07 (W5): same uploader/state, now with real per-type chips */}
            <div style={{marginTop:'22px'}}>
              <AttachmentsPanel
                docs={docs}
                uplLoading={uplLoading}
                uplError={uplError}
                uploadRef={uploadRef}
                onUpload={handleUpload}
                onRemove={name=>setDocs(p=>p.filter(x=>x.name!==name))}
                reducedMotion={reducedMotion}
              />
            </div>

            {/* Extent */}
            <div style={{...T.label,color:'#2a5a30',marginTop:'22px',marginBottom:'6px'}}>EXTENT</div>
            <div style={{display:'flex',gap:'4px',marginBottom:'4px'}}>
              {([['light','#4ade80','Polish wording'],['medium','#f59e0b','Improve sections'],['strong','#f87171','Restructure']] as const).map(([e,c])=>(
                <button key={e} onClick={()=>setExtent(e as Extent)} style={{...B,padding:'4px 7px',fontSize:'var(--ig-t-caption-size)',fontWeight:500,
                  backgroundColor:extent===e?'#0a1f0e':'#0d1117',color:extent===e?c:'#64748b',outline:extent===e?`1px solid ${c}55`:'1px solid #1e293b'}}>
                  {e.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{...T.caption,color:'#334155'}}>{extent==='light'?'Minor wording polish':extent==='medium'?'Rewrite sections':'Restructure artifact'}</div>

            {/* Scope */}
            <div style={{...T.label,color:'#2a5a30',marginTop:'22px',marginBottom:'6px'}}>SCOPE</div>
            <div style={{display:'flex',gap:'4px',marginBottom:'4px'}}>
              {(['block','stage','project'] as Scope[]).map(s=>(
                <button key={s} onClick={()=>setScope(s)} style={{...B,padding:'4px 7px',fontSize:'var(--ig-t-caption-size)',fontWeight:500,
                  backgroundColor:scope===s?'#0a0f1e':'#0d1117',color:scope===s?'#818cf8':'#64748b',outline:scope===s?'1px solid #818cf855':'1px solid #1e293b'}}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{...T.caption,color:'#334155',marginBottom:'22px'}}>{scope==='block'?'Selected section only':scope==='stage'?'Full artifact for this stage':'Cross-artifact PM consistency'}</div>

            {/* Improve button — the Direct aide's single prominent action. */}
            <button onClick={handleImprove} disabled={!selected||!intent.trim()||uiState==='loading'} className="ig-primary-btn"
              style={{width:'100%',padding:'11px 0',fontSize:'12px',...MONO,cursor:'pointer',borderRadius:'4px',border:'none',letterSpacing:'0.1em',fontWeight:700,
                backgroundColor:(!selected||!intent.trim())?'#0a1509':'#0d2a10',
                color:(!selected||!intent.trim())?'#1a3a20':'#4ade80',outline:'1px solid #1a3a20'}}>
              {uiState==='loading'?'⟳ GENERATING…':'◈ IMPROVE NOW'}
            </button>
            <div style={{...T.caption,color:'#1e293b',textAlign:'center' as const,marginTop:'5px'}}>{activeModel.label} · OpenRouter · {activeModel.cost}</div>

            {/* ── BUILD DESTINATION ── */}
            <div style={{marginTop:'22px',paddingTop:'16px',borderTop:'1px solid #0a1a2e'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                <div style={{...T.label,color:'#2a5a30'}}>BUILD DESTINATION</div>
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
                        style={{...B,padding:'5px 8px',fontSize:'var(--ig-t-caption-size)',textAlign:'left' as const,display:'flex',alignItems:'center',gap:'5px',
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
                <div style={{...T.label,color:'#2a5a30',marginBottom:'6px'}}>USAGE</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px',textAlign:'center' as const}}>
                  {[{l:'Input',v:result.tokens?.input?.toLocaleString()??'—',c:'#475569'},{l:'Output',v:result.tokens?.output?.toLocaleString()??'—',c:'#818cf8'},{l:'Cost',v:`$${result.cost?.toFixed(4)??'—'}`,c:'#4ade80'}].map(x=>(
                    <div key={x.l}><div style={{fontFamily:FONT_MONO,fontSize:'12px',color:x.c,fontWeight:700}}>{x.v}</div><div style={{...T.caption,fontSize:'8px',color:'#334155',marginTop:'1px'}}>{x.l}</div></div>
                  ))}
                </div>
              </div>
              {/* AI reasoning is first-class thinking → human voice (Design Direction §7, P3). */}
              <div style={{...T.label,color:'#2a5a30',marginBottom:'6px'}}>PM REASONING</div>
              <div style={{padding:'10px',backgroundColor:'#040b14',border:'1px solid #0a2a14',borderRadius:'3px',fontFamily:FONT_SANS,fontSize:'var(--ig-t-body-size)',color:'#94a3b8',lineHeight:1.6,marginBottom:'8px'}}>
                {result.reasoning||'No reasoning returned from model.'}
              </div>
              {(result.impactWarnings?.length??0)>0&&result.impactWarnings.map((w,i)=><div key={i} style={{padding:'6px 8px',backgroundColor:'#0a0800',border:'1px solid #f59e0b33',borderRadius:'3px',fontSize:'var(--ig-t-caption-size)',color:'#f59e0b99',lineHeight:1.6,marginBottom:'4px'}}>▲ {w}</div>)}
            </div>
          )}
          </div>{/* end inner fixed-width right panel wrapper */}
        </div>{/* end collapsible right panel */}
      </div>
    </div>
  );
}
