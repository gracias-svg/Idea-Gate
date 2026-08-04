'use client';

// src/app/desk/page.tsx
// IdeaGate — Artifact Reading Desk
// Mission 15-D: Orientation rail + hero center + no permanent right panel.
// B1: Right panel removed. B2: Left rail = orientation only (220px / 60px collapsed).
// B3: Center = 860px max-width hero. B4: Reader gains upstreamItems. B5: height 100%.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useGlobalStore } from '@/lib/GlobalStore';
import { useRuntime } from '@/lib/RuntimeContext';
import { parseContent } from '@/lib/parseContent';
import { type StageData } from '@/components/desk/LifecycleNodeChain';
import ArtifactReaderOverlay, { type ReaderArtifact } from '@/components/desk/ArtifactReader';
import WorkspaceExplorer, { type WorkspaceNode } from '@/components/shared/WorkspaceExplorer';
import AttentionDrawer from '@/components/desk/AttentionDrawer';
import ArtifactInspector from '@/components/desk/ArtifactInspector';

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
const SANS: React.CSSProperties = { fontFamily: "'Geist Sans', 'Geist', system-ui, -apple-system, sans-serif" };
const BASE_FONT = 17;

// ── Stage intelligence ────────────────────────────────────────────────────────
const STAGE_INTEL: Record<number, { purpose:string; agentId:string; agentFull:string; agentColor:string; framework:string; interview:string }> = {
   0: { purpose:'Initial idea framing, scope boundary-setting, and NSM validation. Establishes the hypothesis governing all subsequent lifecycle decisions.', agentId:'CO', agentFull:'Coordinator (CO)', agentColor:'#4ade80', framework:'NSM lens', interview:'Idea clarity + testability assessment' },
   1: { purpose:'Market discovery, competitive landscape, PESTEL and Porter\'s Five Forces. Establishes strategic context for all downstream product decisions.', agentId:'PS', agentFull:'Product Strategist (PS)', agentColor:'#818cf8', framework:'PESTEL · Porter\'s · JTBD', interview:'Market sizing + competitive differentiation' },
   2: { purpose:'User problem framing, evidence collection, Jobs-to-be-Done analysis. Validates the problem is real, frequent, and worth solving.', agentId:'RE', agentFull:'Researcher (RE)', agentColor:'#38bdf8', framework:'JTBD · Empathy Mapping · 5W1H', interview:'Problem validation depth' },
   3: { purpose:'Solution concept, user flows, and interaction logic. Translates validated problem into a coherent product experience.', agentId:'UX', agentFull:'UX Designer (UX)', agentColor:'#f59e0b', framework:'OST · User Journey Mapping', interview:'Solution-problem fit reasoning' },
   4: { purpose:'MVP scope compression, feature prioritization, test cards. Defines the minimum to ship that tests the riskiest assumption.', agentId:'AR', agentFull:'Architect (AR)', agentColor:'#fb923c', framework:'MVP Test Cards · RICE · MoSCoW', interview:'Scope discipline + tradeoff reasoning' },
   5: { purpose:'Validation experiment design, AARRR metrics, evidence-based go/no-go criteria. Makes the success bar explicit before building.', agentId:'QA', agentFull:'QA Engineer (QA)', agentColor:'#f472b6', framework:'AARRR · Experiment Design', interview:'Validation rigor + metric design' },
   6: { purpose:'Feature prioritization with multiple frameworks simultaneously. Resolves competing PM priorities into a defensible ordered backlog.', agentId:'CO', agentFull:'Coordinator (CO)', agentColor:'#4ade80', framework:'RICE · Kano · Value vs Effort', interview:'Prioritization logic + stakeholder alignment' },
   7: { purpose:'Full product requirements with acceptance criteria, edge cases, delivery dependencies. The execution blueprint for engineering.', agentId:'PS', agentFull:'Product Strategist (PS)', agentColor:'#818cf8', framework:'PRD structure · DoR/DoD · AC', interview:'Requirements completeness + clarity' },
   8: { purpose:'UX specification, information architecture, interaction design. Translates PRD requirements into a buildable UX layer.', agentId:'UX', agentFull:'UX Designer (UX)', agentColor:'#f59e0b', framework:'UX Heuristics · IA · Cognitive Load', interview:'Design thinking + UX rigor' },
   9: { purpose:'Usability testing plan, accessibility considerations, UX quality criteria. Ensures the product is testable before prototype handoff.', agentId:'RE', agentFull:'Researcher (RE)', agentColor:'#38bdf8', framework:'Usability Testing · WCAG', interview:'User research methodology' },
  10: { purpose:'System architecture, tech stack decisions, scalability planning. Technical constraints bounding the implementation space.', agentId:'AR', agentFull:'Architect (AR)', agentColor:'#fb923c', framework:'System Design · API contracts', interview:'Technical depth + architectural judgment' },
  11: { purpose:'Sprint backlog, release sequencing, Definition of Ready/Done. Operationalizes the PRD into engineering work units.', agentId:'CO', agentFull:'Coordinator (CO)', agentColor:'#4ade80', framework:'Agile · Scrum · Critical Path', interview:'Delivery planning + sprint discipline' },
  12: { purpose:'Implementation roadmap, dependency mapping, engineering timeline. Bridges PRD to the development team\'s execution plan.', agentId:'PS', agentFull:'Product Strategist (PS)', agentColor:'#818cf8', framework:'Delivery Planning · Risk Map', interview:'Project planning + dependency awareness' },
  13: { purpose:'QA strategy, readiness criteria, launch checklist. Defines what "production ready" means before the prototype prompt.', agentId:'QA', agentFull:'QA Engineer (QA)', agentColor:'#f472b6', framework:'QA Strategy · Readiness Gate', interview:'Quality standards + launch readiness' },
  14: { purpose:'Complete prototype prompt for Lovable, Bolt, v0, Cursor, or Claude. Packages all lifecycle intelligence into a single buildable context.', agentId:'AR', agentFull:'Architect (AR)', agentColor:'#fb923c', framework:'Builder Context Package', interview:'End-to-end lifecycle synthesis' },
};

const STAGE_DEPS: Record<number,number[]> = {
   0:[], 1:[0], 2:[1], 3:[2], 4:[3,2], 5:[4], 6:[5,4], 7:[6,3],
   8:[7,3], 9:[8], 10:[7,4], 11:[10,6], 12:[11,7], 13:[12,9], 14:[13,10],
};
const STAGE_LABEL: Record<number,string> = {
   0:'Idea Intake',1:'Discovery',2:'Problem Definition',3:'Solution Design',
   4:'MVP Hypothesis',5:'Validation',6:'Prioritization',7:'PRD',8:'UX Design',
   9:'Usability',10:'Architecture',11:'Backlog & Release',12:'Implementation',
  13:'QA & Readiness',14:'Prototype Prompt',
};
const STAGE_COLOR: Record<number,string> = {
  0:'#22c55e',1:'#22c55e',2:'#22c55e',3:'#38bdf8',4:'#38bdf8',5:'#38bdf8',
  6:'#a78bfa',7:'#a78bfa',8:'#a78bfa',9:'#a78bfa',10:'#fb923c',11:'#fb923c',
  12:'#fde047',13:'#fde047',14:'#fde047',
};

// ── B1: 5-phase lifecycle grouping with PM questions ─────────────────────────
const LIFECYCLE_PHASES: { id: string; label: string; question: string; stages: number[]; color: string }[] = [
  { id: 'discover',  label: 'Discover',  question: 'What problem is real and worth solving?', stages: [0, 1, 2],        color: '#4ade80' },
  { id: 'decide',    label: 'Decide',    question: 'What should we build, and why now?',       stages: [3, 4, 5, 6],     color: '#38bdf8' },
  { id: 'specify',   label: 'Specify',   question: 'What exactly does it need to do?',         stages: [7, 8, 9],        color: '#818cf8' },
  { id: 'architect', label: 'Architect', question: 'How should it be built?',                  stages: [10, 11],         color: '#fb923c' },
  { id: 'ship',      label: 'Ship',      question: 'Is it ready, and can we build it now?',    stages: [12, 13, 14],     color: '#fde047' },
];

// ── B2: Health state system ───────────────────────────────────────────────────
type HealthState = 'trustworthy' | 'questionable' | 'stale' | 'generating' | 'queued';

const HEALTH_COLOR: Record<HealthState, string> = {
  trustworthy: '#4ade80',
  questionable: '#f59e0b',
  stale: '#ef4444',
  generating: '#818cf8',
  queued: '#1e293b',
};
const HEALTH_LABEL: Record<HealthState, string> = {
  trustworthy: 'SOLID',
  questionable: 'REVIEW',
  stale: 'STALE',
  generating: 'RUNNING',
  queued: 'QUEUED',
};

function getHealthState(
  file: string | undefined,
  stageN: number,
  journeyStages: Record<string, any>,
  runtime: ReturnType<typeof useRuntime>,
  isRunning: boolean,
  currentStage: number,
): HealthState {
  if (!file) {
    if (isRunning && stageN === currentStage) return 'generating';
    return 'queued';
  }
  if (runtime.isStale(file)) return 'stale';
  const confidence = journeyStages[String(stageN)]?.confidence as string | undefined;
  if (confidence === 'low' || confidence === 'medium') return 'questionable';
  return 'trustworthy';
}

const stageNum  = (f:string) => parseInt(f.split('-')[0],10)||0;
const humanName = (f:string) => f.replace('.md','').replace(/^\d+-/,'').replace(/-/g,' ');
const titleCase = (s:string) => s.replace(/\b\w/g,c=>c.toUpperCase());
const wordCount = (t:string) => t.split(/\s+/).filter(Boolean).length;
const readTime  = (t:string) => { const m=Math.ceil(wordCount(t)/220); return m<=1?'<1 min':`~${m} min`; };

// ── B3: Artifact card — health-aware, hover-reactive ─────────────────────────
function ArtifactCard({
  stageN, artifacts, journeyStages, summaries, runtime, isRunning, currentStage, onSelect, onOpenStudio,
}: {
  stageN: number;
  artifacts: string[];
  journeyStages: Record<string, any>;
  summaries: Record<string, string>;
  runtime: ReturnType<typeof useRuntime>;
  isRunning: boolean;
  currentStage: number;
  onSelect: (f: string) => void;
  onOpenStudio: (f: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const file   = artifacts.find(a => stageNum(a) === stageN);
  const isGen  = !!file;
  const health = getHealthState(file, stageN, journeyStages, runtime, isRunning, currentStage);
  const hColor = HEALTH_COLOR[health];
  const hLabel = HEALTH_LABEL[health];
  const summary = file ? (summaries[file] ?? '') : '';
  const ver    = file ? runtime.getVersion(file) : 0;
  const jStage = journeyStages[String(stageN)];

  const isGenerating = health === 'generating';
  const nameColor = health === 'stale' ? '#ef4444' : health === 'questionable' ? '#f59e0b' : isGen ? '#cbd5e1' : '#334155';

  return (
    <div
      onClick={() => file && onSelect(file)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 12px',
        backgroundColor: isGen ? '#040b14' : '#020609',
        border: `1px solid ${hovered && isGen ? '#1e293b' : '#0a1a2e'}`,
        borderLeft: `3px solid ${hColor}`,
        borderRadius: '3px',
        cursor: isGen ? 'pointer' : 'default',
        opacity: health === 'queued' ? 0.38 : 1,
        display: 'flex', flexDirection: 'column', gap: '5px',
        minHeight: '90px',
        ...MONO,
      }}
    >
      {/* Health badge + stage number */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: hColor, letterSpacing: '0.08em', fontWeight: 700, opacity: 0.55 }}>
          {hLabel}
        </span>
        <span style={{ fontSize: '11px', color: '#334155', opacity: 0.55 }}>{stageN}</span>
      </div>

      {/* Stage name — Fix 4: 15px min, weight 600 */}
      {isGenerating ? (
        <div className="shimmer-bar" style={{ height: '12px', borderRadius: '2px', width: '70%' }} />
      ) : (
        <div style={{ fontSize: '15px', color: nameColor, fontWeight: 600, lineHeight: 1.2 }}>
          {STAGE_LABEL[stageN]}
        </div>
      )}

      {/* Summary — Fix 4: 13px, 1.65 line-height, var(--ig-text-secondary) */}
      {isGenerating ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <div className="shimmer-bar" style={{ height: '9px', borderRadius: '2px', width: '100%' }} />
          <div className="shimmer-bar" style={{ height: '9px', borderRadius: '2px', width: '80%' }} />
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: isGen ? 'var(--ig-text-secondary,#64748b)' : '#1e293b', lineHeight: 1.65, flex: 1 }}>
          {isGen
            ? summary
              ? `${summary.slice(0, 120)}${summary.length >= 120 ? '…' : ''}`
              : (jStage?.reasoning ? `${String(jStage.reasoning).slice(0, 120)}…` : '')
            : 'Not yet generated'}
        </div>
      )}

      {/* Footer: version tag + Studio → */}
      {isGen && !isGenerating && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
          <span style={{ fontSize: '11px', color: ver > 0 ? '#4ade80' : '#334155', opacity: 0.55 }}>
            {ver > 0 ? `v${ver}` : 'v1'}
            {health === 'stale' && ' · stale'}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onOpenStudio(file!); }}
            style={{
              padding: '2px 7px', fontSize: '9px', letterSpacing: '0.04em',
              backgroundColor: 'transparent', border: '1px solid #818cf833',
              borderRadius: '2px', color: '#818cf8', cursor: 'pointer',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 150ms ease',
              pointerEvents: hovered ? 'auto' : 'none',
              ...MONO,
            }}
          >
            Studio →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DeskPage() {
  const runtime = useRuntime();
  const router  = useRouter();
  const { state: { settings }, updateSettings } = useGlobalStore();

  // ── Core artifact state ────────────────────────────────────────────────────
  const [artifacts,    setArtifacts]    = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [projectName,  setProjectName]  = useState('Project');
  const [focusMode,    setFocusMode]    = useState(false);
  const [summaries,    setSummaries]    = useState<Record<string, string>>({});
  const [isRunning,    setIsRunning]    = useState(false);

  // ── Inspector state (W4) ─────────────────────────────────────────────────
  const [inspectorArtifact, setInspectorArtifact] = useState<ReaderArtifact | null>(null);
  const [inspectorContent,  setInspectorContent]  = useState<string | null>(null);
  const [inspectorLoading,  setInspectorLoading]  = useState(false);
  const [inspectorIndex,    setInspectorIndex]    = useState(0); // Fix 3 — position in sortedArtifacts

  // ── ArtifactReader overlay state ──────────────────────────────────────────
  const [readerIndex,    setReaderIndex]    = useState(-1);
  const [readerArtifact, setReaderArtifact] = useState<ReaderArtifact | null>(null);
  const [readerContent,  setReaderContent]  = useState<string | null>(null);
  const [readerLoading,  setReaderLoading]  = useState(false);

  // ── Journey state — real run reasoning data ───────────────────────────────
  const [journeyState, setJourneyState] = useState<{
    currentStage: number;
    stages: Record<string, StageData>;
    agentsByStage: Record<string, string[]>;
  }>({ currentStage: 0, stages: {}, agentsByStage: {} });

  // (windowWidth removed — left rail replaced by WorkspaceExplorer in Mission 16)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const fetchedRef          = useRef<Set<string>>(new Set());
  const dismissedRef        = useRef(false);
  const dismissedProjectRef = useRef<string|null>(null);
  const latestProjectRef    = useRef<string|null>(null);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(()=>{
    const loadData = () => fetch('/api/data').then(r=>r.json()).then(d=>{
      const proj = d.projectPath ?? null;
      if (dismissedRef.current) {
        if (proj !== dismissedProjectRef.current) dismissedRef.current = false;
        else return;
      }
      latestProjectRef.current = proj;
      setArtifacts(d.artifacts??[]);
      setCurrentStage(d.currentStage??0);
      // B2: derive project name from path
      if (proj) {
        const segs = String(proj).replace(/\\/g,'/').split('/').filter(Boolean);
        const raw = segs[segs.length-1] ?? '';
        const name = titleCase(raw.replace(/-/g,' ').replace(/_/g,' '));
        if (name && name !== 'Workspace' && name !== 'Idea Gate Ui Safe') setProjectName(name);
      }
    }).catch(()=>{});
    loadData();
    const poll = setInterval(loadData, 4000);
    const clearArtifact = () => {
      dismissedRef.current = true;
      dismissedProjectRef.current = latestProjectRef.current;
      setArtifacts([]);
    };
    window.addEventListener('ideagate:refresh', loadData);
    window.addEventListener('ideagate:clearArtifact', clearArtifact);
    return () => {
      clearInterval(poll);
      window.removeEventListener('ideagate:refresh', loadData);
      window.removeEventListener('ideagate:clearArtifact', clearArtifact);
    };
  },[]);

  useEffect(()=>{
    const loadJourneyState = () => fetch('/api/journey-state').then(r=>r.json())
      .then(d=>setJourneyState({ currentStage:d.currentStage??0, stages:d.stages??{}, agentsByStage:d.agentsByStage??{} }))
      .catch(()=>{});
    loadJourneyState();
    const poll = setInterval(loadJourneyState, 4000);
    return () => clearInterval(poll);
  },[]);

  useEffect(()=>{
    const check = () => fetch('/api/run').then(r=>r.json())
      .then(d=>setIsRunning(!!(d.running??false)))
      .catch(()=>setIsRunning(false));
    check();
    const t = setInterval(check, 2000);
    return () => clearInterval(t);
  },[]);

  // Fetch 150-char summaries for card grid
  useEffect(()=>{
    for (const f of artifacts) {
      if (fetchedRef.current.has(f)) continue;
      fetchedRef.current.add(f);
      fetch(`/api/data?file=${encodeURIComponent(f)}`)
        .then(r=>r.json())
        .then(d=>{
          const raw = (d.content ?? '') as string;
          const text = raw.split('\n')
            .filter(l => { const t=l.trim(); return t && !t.startsWith('#') && t !== '---' && t !== '***'; })
            .join(' ').trim();
          setSummaries(prev => ({ ...prev, [f]: text.slice(0, 150) }));
        })
        .catch(()=>{});
    }
  },[artifacts]);

  // Fetch full content for ArtifactReader overlay
  useEffect(()=>{
    setReaderContent(null);
    if (!readerArtifact) return;
    setReaderLoading(true);
    fetch(`/api/improve?file=${encodeURIComponent(readerArtifact.file)}`).then(r=>r.json())
      .then(d=>setReaderContent(parseContent(d.content??'')))
      .catch(()=>setReaderContent(null))
      .finally(()=>setReaderLoading(false));
  },[readerArtifact?.file]);

  // Fetch full content for ArtifactInspector (W4)
  useEffect(()=>{
    setInspectorContent(null);
    if (!inspectorArtifact) return;
    setInspectorLoading(true);
    fetch(`/api/improve?file=${encodeURIComponent(inspectorArtifact.file)}`).then(r=>r.json())
      .then(d=>setInspectorContent(parseContent(d.content??'')))
      .catch(()=>setInspectorContent(null))
      .finally(()=>setInspectorLoading(false));
  },[inspectorArtifact?.file]);

  // ── Derived state ─────────────────────────────────────────────────────────

  // ── Memos ─────────────────────────────────────────────────────────────────
  const weakestLink = useMemo(()=>{
    if (isRunning) return null;
    let maxDown = -1;
    let result: { file:string; health:'stale'|'questionable'; downstreams:number; name:string } | null = null;
    for (const f of artifacts) {
      const n = stageNum(f);
      const isStaleFile = runtime.isStale(f);
      const conf = journeyState.stages[String(n)]?.confidence as string|undefined;
      const isQuestionable = !isStaleFile && (conf === 'low' || conf === 'medium');
      if (!isStaleFile && !isQuestionable) continue;
      const downs = Object.entries(STAGE_DEPS).filter(([,deps])=>deps.includes(n)).length;
      if (downs > maxDown) {
        maxDown = downs;
        result = { file:f, health: isStaleFile?'stale':'questionable', downstreams:downs, name:titleCase(humanName(f)) };
      }
    }
    return result;
  },[artifacts, journeyState.stages, runtime, isRunning]);

  const priorityQueue = useMemo(()=>{
    if (isRunning) return [] as { file:string; health:'stale'|'questionable'; downstreams:number; name:string }[];
    const items: { file:string; health:'stale'|'questionable'; downstreams:number; name:string }[] = [];
    for (const f of artifacts) {
      const n = stageNum(f);
      const isStaleFile = runtime.isStale(f);
      const conf = journeyState.stages[String(n)]?.confidence as string|undefined;
      const isQuestionable = !isStaleFile && (conf==='low'||conf==='medium');
      if (!isStaleFile && !isQuestionable) continue;
      const downs = Object.entries(STAGE_DEPS).filter(([,deps])=>deps.includes(n)).length;
      items.push({ file:f, health:isStaleFile?'stale':'questionable', downstreams:downs, name:titleCase(humanName(f)) });
    }
    return items.sort((a,b)=>b.downstreams-a.downstreams).slice(0,3);
  },[artifacts, journeyState.stages, runtime, isRunning]);

  const sortedArtifacts = useMemo(()=>
    [...artifacts].sort((a,b)=>stageNum(a)-stageNum(b))
  ,[artifacts]);

  const dailyBrief = useMemo(()=>{
    if (!artifacts.length) return null;
    const sc = runtime.state.staleArtifacts.size;
    const highConfCount = artifacts.filter(f=>{
      const conf = journeyState.stages[String(stageNum(f))]?.confidence as string|undefined;
      return conf==='high';
    }).length;
    if (isRunning) {
      const agentId = STAGE_INTEL[currentStage]?.agentId ?? '?';
      return {
        text: `Generating Stage ${currentStage} of 15: ${STAGE_LABEL[currentStage]??'…'}. ${artifacts.length} artifact${artifacts.length!==1?'s':''} produced so far. ${agentId} is working now.`,
        actionFile: null as string|null,
        actionLabel: null as string|null,
      };
    }
    if (sc>0 && weakestLink) {
      return {
        text: `Your ${weakestLink.name} affects ${weakestLink.downstreams} downstream artifact${weakestLink.downstreams!==1?'s':''} and needs attention. ${sc} artifact${sc!==1?'s':''} marked stale after a recent improvement.`,
        actionFile: weakestLink.file as string|null,
        actionLabel: `Review ${weakestLink.name} →` as string|null,
      };
    }
    if (priorityQueue.length>0) {
      const top = priorityQueue[0];
      return {
        text: `One or more artifacts have medium or low confidence scores. Review ${top.name} before continuing.`,
        actionFile: top.file as string|null,
        actionLabel: `Review ${top.name} →` as string|null,
      };
    }
    return {
      text: `Your product thinking is complete. ${artifacts.length} artifact${artifacts.length!==1?'s':''} generated with ${highConfCount} at high confidence. Ready for Studio refinement or export.`,
      actionFile: null as string|null,
      actionLabel: null as string|null,
    };
  },[artifacts, isRunning, currentStage, weakestLink, priorityQueue, journeyState.stages, runtime]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenInStudio = useCallback((f:string)=>{
    window.location.href = `/improve?artifact=${encodeURIComponent(f)}`;
  },[]);


  // Open ArtifactReader overlay — B4: now includes upstreamItems
  const handleOpenReader = useCallback((f: string) => {
    const n = stageNum(f);
    const phase = LIFECYCLE_PHASES.find(p => p.stages.includes(n));
    const jStage = journeyState.stages[String(n)];
    const upstreamNums   = STAGE_DEPS[n] ?? [];
    const downstreamNums = Object.entries(STAGE_DEPS)
      .filter(([, deps]) => deps.includes(n))
      .map(([k]) => parseInt(k, 10));
    const upstreamItems = upstreamNums.map(u => ({
      name: STAGE_LABEL[u] ?? `Stage ${u}`,
      healthState: getHealthState(artifacts.find(a=>stageNum(a)===u), u, journeyState.stages, runtime, isRunning, currentStage),
    }));
    const downstreamItems = downstreamNums.slice(0, 4).map(d => ({
      name: STAGE_LABEL[d] ?? `Stage ${d}`,
      healthState: getHealthState(artifacts.find(a=>stageNum(a)===d), d, journeyState.stages, runtime, isRunning, currentStage),
    }));
    setReaderIndex(sortedArtifacts.indexOf(f));
    setReaderArtifact({
      file: f,
      stageIndex: n,
      stageName: STAGE_LABEL[n] ?? `Stage ${n}`,
      phase: phase?.label ?? '',
      phaseColor: phase?.color ?? '#94a3b8',
      healthState: getHealthState(f, n, journeyState.stages, runtime, isRunning, currentStage),
      confidence: jStage?.confidence as string | undefined,
      version: runtime.getVersion(f),
      summary: summaries[f] ?? '',
      downstreamCount: downstreamNums.length,
      agentId: STAGE_INTEL[n]?.agentId,
      downstreamItems,
      upstreamItems,
    });
  }, [journeyState.stages, runtime, isRunning, currentStage, summaries, artifacts, sortedArtifacts]);

  const handleReaderPrev = useCallback(()=>{
    if (readerIndex <= 0) return;
    handleOpenReader(sortedArtifacts[readerIndex - 1]);
  },[readerIndex, sortedArtifacts, handleOpenReader]);

  const handleReaderNext = useCallback(()=>{
    if (readerIndex >= sortedArtifacts.length - 1) return;
    handleOpenReader(sortedArtifacts[readerIndex + 1]);
  },[readerIndex, sortedArtifacts, handleOpenReader]);

  // Open ArtifactInspector (W4) for a given file — shared by node-click and nav
  const openInspectorForFile = useCallback((f: string) => {
    const n = stageNum(f);
    const phase = LIFECYCLE_PHASES.find(p => p.stages.includes(n));
    const jStage = journeyState.stages[String(n)];
    const upstreamNums   = STAGE_DEPS[n] ?? [];
    const downstreamNums = Object.entries(STAGE_DEPS)
      .filter(([, deps]) => deps.includes(n))
      .map(([k]) => parseInt(k, 10));
    const upstreamItems = upstreamNums.map(u => ({
      name: STAGE_LABEL[u] ?? `Stage ${u}`,
      healthState: getHealthState(artifacts.find(a=>stageNum(a)===u), u, journeyState.stages, runtime, isRunning, currentStage),
    }));
    const downstreamItems = downstreamNums.slice(0, 4).map(d => ({
      name: STAGE_LABEL[d] ?? `Stage ${d}`,
      healthState: getHealthState(artifacts.find(a=>stageNum(a)===d), d, journeyState.stages, runtime, isRunning, currentStage),
    }));
    const idx = sortedArtifacts.indexOf(f);
    setInspectorIndex(idx >= 0 ? idx : 0);
    setInspectorArtifact({
      file: f,
      stageIndex: n,
      stageName: STAGE_LABEL[n] ?? `Stage ${n}`,
      phase: phase?.label ?? '',
      phaseColor: phase?.color ?? '#94a3b8',
      healthState: getHealthState(f, n, journeyState.stages, runtime, isRunning, currentStage),
      confidence: jStage?.confidence as string | undefined,
      version: runtime.getVersion(f),
      summary: summaries[f] ?? '',
      downstreamCount: downstreamNums.length,
      agentId: STAGE_INTEL[n]?.agentId,
      downstreamItems,
      upstreamItems,
    });
  }, [journeyState.stages, runtime, isRunning, currentStage, summaries, artifacts, sortedArtifacts]);

  // Triggered by WorkspaceExplorer file node click
  const handleOpenInspector = useCallback((node: WorkspaceNode) => {
    if (!node.file) return;
    openInspectorForFile(node.file);
  }, [openInspectorForFile]);

  // Fix 3 — Inspector prev/next navigation
  const handleInspectorNavigate = useCallback((direction: 'prev' | 'next') => {
    const newIdx = direction === 'prev' ? inspectorIndex - 1 : inspectorIndex + 1;
    if (newIdx < 0 || newIdx >= sortedArtifacts.length) return;
    openInspectorForFile(sortedArtifacts[newIdx]);
  }, [inspectorIndex, sortedArtifacts, openInspectorForFile]);

  // Workspace tree for WorkspaceExplorer (W1/W2)
  // R2 (Mission 17): All nodes wrapped inside a project root derived from projectPath.
  const workspaceTree = useMemo((): WorkspaceNode[] => {
    const phaseFolder = (phase: typeof LIFECYCLE_PHASES[0]): WorkspaceNode => ({
      id:         `phase-${phase.id}`,
      kind:       'folder',
      label:      phase.label,
      phaseColor: phase.color,
      count:      phase.stages.filter(n => artifacts.some(a => stageNum(a) === n)).length,
      children:   phase.stages.map(n => {
        const file   = artifacts.find(a => stageNum(a) === n);
        const health = getHealthState(file, n, journeyState.stages, runtime, isRunning, currentStage);
        return {
          id:          `stage-${n}`,
          kind:        file ? ('file' as const) : ('disabled' as const),
          label:       STAGE_LABEL[n] ?? `Stage ${n}`,
          file:        file,
          stageIndex:  n,
          healthState: health,
          version:     file ? runtime.getVersion(file) : 0,
        } as WorkspaceNode;
      }),
    });
    // Inner nodes (Documents, History, coming-soon placeholders)
    const innerNodes: WorkspaceNode[] = [
      {
        id:       'documents',
        kind:     'folder',
        label:    'Documents',
        count:    artifacts.length,
        children: LIFECYCLE_PHASES.map(phaseFolder),
      },
    ];
    if (runtime.state.events.length > 0) {
      innerNodes.push({
        id:    'history',
        kind:  'folder',
        label: 'History',
        icon:  'history',
        count: runtime.state.events.length,
      });
    }
    innerNodes.push(
      { id: 'decisions', kind: 'disabled', label: 'Decision Log', comingSoon: true, icon: 'decisions' },
      { id: 'knowledge', kind: 'disabled', label: 'Knowledge',    comingSoon: true, icon: 'knowledge' },
      { id: 'assets',    kind: 'disabled', label: 'Assets',       comingSoon: true, icon: 'assets'    },
      { id: 'snapshots', kind: 'disabled', label: 'Snapshots',    comingSoon: true, icon: 'snapshots'  },
      { id: 'exports',   kind: 'disabled', label: 'Exports',      comingSoon: true, icon: 'exports'   },
    );
    // Project root — Fix 2: prefer user-edited display name, fall back to derived name
    const rootLabel = (settings.projectDisplayName ?? projectName) || 'Project 001';
    const rootNode: WorkspaceNode = {
      id:       'project-root',
      kind:     'folder',
      label:    rootLabel,
      icon:     'project',
      count:    artifacts.length,
      children: innerNodes,
    };
    return [rootNode];
  }, [artifacts, journeyState.stages, runtime, isRunning, currentStage, projectName, settings.projectDisplayName]);

  const B = (extra?:React.CSSProperties): React.CSSProperties => ({...MONO, cursor:'pointer', border:'none', borderRadius:'3px', ...(extra??{})});

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display:'flex', flexDirection:'column',
      height:'100%',             // B5: was 100vh — respects app-shell height, eliminates 44px overflow
      backgroundColor:'#020609',
      overflow:'hidden',
      ...MONO, color:'#cbd5e1',
    }}>
      <style>{`
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        button:disabled{opacity:.4;cursor:not-allowed!important} textarea::placeholder,input::placeholder{color:#64748b}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .shimmer-bar{background:linear-gradient(90deg,#0a1a2e 25%,#1e2d45 50%,#0a1a2e 75%);background-size:800px 100%;animation:shimmer 1.4s infinite linear}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.25}}
        .phase-row:hover{background-color:#040b14!important}
        .phase-row:focus{outline:1px solid #4ade8033;outline-offset:-1px}
      `}</style>

      {/* ── Page header — minimal: DESK label + Focus toggle ── */}
      <div style={{display:'flex',alignItems:'center',padding:'0 16px',height:'42px',backgroundColor:'#020c06',borderBottom:'1px solid #0a1a2e',flexShrink:0,gap:'10px'}}>
        <div style={{fontSize:'12px',color:'#64748b',letterSpacing:'0.1em',fontWeight:700,...MONO}}>DESK</div>
        <div style={{flex:1}}/>
        <button
          onClick={()=>setFocusMode(!focusMode)}
          style={{...B(),padding:'4px 10px',fontSize:'10px',backgroundColor:focusMode?'#0a1f0e':'transparent',color:focusMode?'#4ade80':'#64748b',outline:'1px solid #1e293b'}}
        >
          {focusMode ? '⇤ EXIT FOCUS' : '⇥ FOCUS'}
        </button>
      </div>

      {/* ── Main three-column layout ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* ── W1: WorkspaceExplorer — replaces the orientation-only left rail ── */}
        {!focusMode && (
          <WorkspaceExplorer
            tree={workspaceTree}
            activeNodeId={inspectorArtifact ? `stage-${stageNum(inspectorArtifact.file)}` : null}
            onNodeSelect={handleOpenInspector}
            width={240}
            headerLabel="WORKSPACE"
            onRenameNode={(_, newName) => updateSettings({ projectDisplayName: newName })}
          />
        )}

        {/* ── B3: Center — the hero ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
          <div style={{flex:1,overflowY:'auto',padding:'32px 40px'}}>
            <div style={{maxWidth:'1080px',margin:'0 auto'}}>

              {/* ── ZONE 1: Daily Brief — Fix 4: 18px, var(--ig-text-primary) ── */}
              {dailyBrief ? (
                <div style={{marginBottom:'36px',...SANS}}>
                  <p style={{
                    fontSize:'18px', fontWeight:400, lineHeight:1.75,
                    color:'var(--ig-text-primary, #f1f5f9)', margin:'0 0 14px 0', ...SANS,
                  }}>
                    {dailyBrief.text}
                    {dailyBrief.actionLabel && dailyBrief.actionFile && (
                      <>{' '}<span
                        onClick={()=>{ if (dailyBrief.actionFile) handleOpenReader(dailyBrief.actionFile); }}
                        style={{color:'#4ade80',cursor:'pointer',textDecoration:'underline',...SANS}}
                      >
                        {dailyBrief.actionLabel}
                      </span></>
                    )}
                  </p>
                  {/* Recent activity micro-section — sourced from improvement history (B1 mapping: History tab) */}
                  {runtime.state.reasoningChain.length > 0 && (
                    <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
                      {runtime.state.reasoningChain.slice(0,3).map((r,i) => (
                        <div key={i} style={{fontSize:'11px',color:'#334155',lineHeight:1.7,...MONO}}>
                          <span style={{color:'#2a5a30'}}>{titleCase(humanName(r.artifactName+'.md'))}</span>
                          {' — '}{r.intent.slice(0,60)}{r.intent.length>60?'…':''}{' '}
                          <span style={{color:'#1e293b'}}>
                            {new Date(r.timestamp).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit',hour12:false})}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : !artifacts.length && (
                /* Empty state — Zone 1 prose for no-run state */
                <div style={{marginBottom:'36px',...SANS}}>
                  <p style={{fontSize:'17px',fontWeight:400,lineHeight:1.75,color:'#334155',margin:0,...SANS}}>
                    Describe an idea above to begin.
                  </p>
                </div>
              )}

              {/* ── ZONE 2: Attention Drawer (W5) — spring slide-down when items exist ── */}
              <AttentionDrawer
                items={priorityQueue}
                onReview={handleOpenReader}
              />

              {/* ── ZONE 3: Artifact Library — Fix 1 restore, always visible ── */}
              <div style={{marginTop:'24px'}}>
                {/* Zone 3 section label */}
                <div style={{
                  fontSize:'9px', color:'var(--ig-text-tertiary,#475569)',
                  letterSpacing:'0.12em', fontWeight:700,
                  textTransform:'uppercase', marginBottom:'24px',
                  ...MONO,
                }}>
                  Artifact Library
                </div>

                {LIFECYCLE_PHASES.map(phase => (
                  <div key={phase.id} style={{marginBottom:'28px'}}>
                    {/* Fix 4: Phase header — 11px, uppercase, 0.08em, weight 600, phase color 80% */}
                    <div style={{
                      display:'flex', alignItems:'center', gap:'8px',
                      marginBottom:'10px', paddingBottom:'8px',
                      borderBottom:'1px solid #0a1a2e',
                    }}>
                      <span style={{
                        fontSize:'11px', fontWeight:600,
                        color:phase.color, opacity:0.8,
                        letterSpacing:'0.08em',
                        textTransform:'uppercase', ...MONO,
                      }}>
                        {phase.label}
                      </span>
                      <span style={{fontSize:'11px', color:'#1e293b',...MONO}}>—</span>
                      <span style={{fontSize:'11px', color:'var(--ig-text-tertiary,#334155)',...SANS}}>
                        {phase.question}
                      </span>
                    </div>
                    {/* 2-column card grid */}
                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'repeat(2,1fr)',
                      gap:'10px',
                    }}>
                      {phase.stages.map(n => (
                        <ArtifactCard
                          key={n}
                          stageN={n}
                          artifacts={artifacts}
                          journeyStages={journeyState.stages}
                          summaries={summaries}
                          runtime={runtime}
                          isRunning={isRunning}
                          currentStage={currentStage}
                          onSelect={f => openInspectorForFile(f)}
                          onOpenStudio={handleOpenInStudio}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* B1: Right panel — ABSENT. The DOM element does not exist. */}

      </div>

      {/* ── W4: ArtifactInspector — right-side slide panel, no backdrop ── */}
      <AnimatePresence>
        {inspectorArtifact && (
          <ArtifactInspector
            artifact={inspectorArtifact}
            fullContent={inspectorContent}
            loading={inspectorLoading}
            onClose={() => { setInspectorArtifact(null); setInspectorContent(null); }}
            onOpenInStudio={(file: string) => {
              setInspectorArtifact(null);
              setInspectorContent(null);
              router.push(`/improve?artifact=${encodeURIComponent(file)}`);
            }}
            artifactList={sortedArtifacts}
            currentIndex={inspectorIndex}
            onNavigate={handleInspectorNavigate}
          />
        )}
      </AnimatePresence>

      {/* ArtifactReader overlay — full viewport, above all content */}
      <AnimatePresence>
        {readerArtifact && (
          <ArtifactReaderOverlay
            artifact={readerArtifact}
            fullContent={readerContent}
            loading={readerLoading}
            onClose={() => { setReaderArtifact(null); setReaderContent(null); }}
            onOpenInStudio={(file: string) => {
              setReaderArtifact(null);
              setReaderContent(null);
              router.push(`/improve?artifact=${encodeURIComponent(file)}`);
            }}
            hasPrev={readerIndex > 0}
            hasNext={readerIndex < sortedArtifacts.length - 1}
            onPrev={handleReaderPrev}
            onNext={handleReaderNext}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
