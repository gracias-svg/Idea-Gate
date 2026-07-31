'use client';

// src/app/desk/page.tsx
// IdeaGate — Artifact Reading Desk
// Fix: ArtifactReader uses if-else-if chains (no continue with JSX)
// TSX parser cannot handle `elements.push(<jsx>)` followed by `continue` in a for loop.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGlobalStore } from '@/lib/GlobalStore';
import { useRuntime } from '@/lib/RuntimeContext';
import { parseContent } from '@/lib/parseContent';
import LifecycleNodeChain, { type StageData } from '@/components/desk/LifecycleNodeChain';
import RunInsightPanel from '@/components/desk/RunInsightPanel';

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
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

// Confidence colours (used in PM Intelligence panel)
const CONF_COLOR: Record<string, string> = { high: '#4ade80', medium: '#f59e0b', low: '#f87171' };
const CONF_LABEL: Record<string, string> = { high: 'HIGH', medium: 'MED', low: 'LOW' };

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

interface TocEntry { level:2|3; text:string; id:string; }
function extractTOC(content:string): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const line of content.split('\n')) {
    const h2=line.match(/^##\s+(.+)/), h3=line.match(/^###\s+(.+)/), m=h2??h3;
    if (!m) continue;
    const text=m[1].trim(), id=text.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    entries.push({ level: h2?2:3, text, id });
  }
  return entries;
}

// ── B3: Artifact card — health-aware, hover-reactive, Studio fade ─────────────
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
        <span style={{ fontSize: '9px', color: hColor, letterSpacing: '0.08em', fontWeight: 700 }}>
          {hLabel}
        </span>
        <span style={{ fontSize: '9px', color: '#334155' }}>{stageN}</span>
      </div>

      {/* Stage name or shimmer skeleton */}
      {isGenerating ? (
        <div className="shimmer-bar" style={{ height: '12px', borderRadius: '2px', width: '70%' }} />
      ) : (
        <div style={{ fontSize: '12px', color: nameColor, fontWeight: 600 }}>
          {STAGE_LABEL[stageN]}
        </div>
      )}

      {/* Summary or skeleton rows */}
      {isGenerating ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <div className="shimmer-bar" style={{ height: '9px', borderRadius: '2px', width: '100%' }} />
          <div className="shimmer-bar" style={{ height: '9px', borderRadius: '2px', width: '80%' }} />
        </div>
      ) : (
        <div style={{ fontSize: '10px', color: isGen ? '#64748b' : '#1e293b', lineHeight: 1.6, flex: 1 }}>
          {isGen
            ? summary
              ? `${summary.slice(0, 120)}${summary.length >= 120 ? '…' : ''}`
              : (jStage?.reasoning ? `${String(jStage.reasoning).slice(0, 120)}…` : '')
            : 'Not yet generated'}
        </div>
      )}

      {/* Footer: version tag + Studio → (fades in on hover) */}
      {isGen && !isGenerating && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
          <span style={{ fontSize: '9px', color: ver > 0 ? '#4ade80' : '#334155' }}>
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

// ── Inline renderer ───────────────────────────────────────────────────────────
function ir(text:string, k:string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p,i)=>{
    const key=`${k}-${i}`;
    if (p.startsWith('**')&&p.endsWith('**')) return <strong key={key} style={{color:'#f1f5f9',fontWeight:700}}>{p.slice(2,-2)}</strong>;
    if (p.startsWith('*')&&p.endsWith('*')&&p.length>2&&!p.startsWith('**')) return <em key={key} style={{color:'#cbd5e1',fontStyle:'italic'}}>{p.slice(1,-1)}</em>;
    if (p.startsWith('`')&&p.endsWith('`')&&p.length>2) return <code key={key} style={{background:'#0d1117',color:'#4ade80',padding:'2px 6px',borderRadius:'3px',fontSize:`${BASE_FONT-1}px`}}>{p.slice(1,-1)}</code>;
    return <React.Fragment key={key}>{p}</React.Fragment>;
  });
}

// ── Artifact reader — if-else-if chains, NO continue with JSX ────────────────
// TSX parser fails when elements.push(<JSX/>) is followed by `continue` in a for loop.
// Fix: use if-else-if so every branch is mutually exclusive — no continue needed.
function ArtifactReader({ content, scrollRef }: { content:string; scrollRef:React.RefObject<HTMLDivElement> }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCode = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let codeStartKey = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t    = line.trim();
    const k    = `l${i}`;

    // ── Code block state machine ──────────────────────────────────────────────
    if (inCode) {
      if (t.startsWith('```')) {
        // Close the code block
        const captured = codeLines.join('\n');
        elements.push(
          <div key={codeStartKey} style={{margin:'14px 0',background:'#0d1117',border:'1px solid #1e293b',borderRadius:'4px',overflow:'hidden'}}>
            {codeLang && <div style={{padding:'4px 14px',borderBottom:'1px solid #1e293b',fontSize:'10px',color:'#64748b',background:'#080d12'}}>{codeLang}</div>}
            <pre style={{...MONO,margin:0,padding:'14px 16px',fontSize:'12px',color:'#4ade80',lineHeight:1.7,overflowX:'auto',whiteSpace:'pre'}}>{captured}</pre>
          </div>
        );
        inCode = false; codeLines = []; codeLang = '';
      } else {
        codeLines.push(line);
      }
    } else if (t.startsWith('```')) {
      inCode = true; codeLang = t.slice(3).trim(); codeStartKey = k;
    } else if (!t) {
      elements.push(<div key={k} style={{height:'9px'}} />);
    } else if (t === '---' || t === '***') {
      elements.push(<div key={k} style={{borderTop:'1px solid #1e293b',margin:'20px 0'}} />);
    } else if (t.startsWith('# ')) {
      elements.push(
        <div key={k} style={{marginTop:i===0?0:'30px',marginBottom:'14px',paddingBottom:'10px',borderBottom:'1px solid #1e293b'}}>
          <h1 id={t.slice(2).toLowerCase().replace(/[^a-z0-9]+/g,'-')} style={{...MONO,fontSize:'22px',color:'#f1f5f9',fontWeight:700,margin:0,lineHeight:1.3}}>{ir(t.slice(2),k)}</h1>
        </div>
      );
    } else if (t.startsWith('## ')) {
      elements.push(
        <div key={k} style={{marginTop:'26px',marginBottom:'9px'}}>
          <h2 id={t.slice(3).toLowerCase().replace(/[^a-z0-9]+/g,'-')} style={{...MONO,fontSize:'17px',color:'#cbd5e1',fontWeight:700,margin:0}}>{ir(t.slice(3),k)}</h2>
        </div>
      );
    } else if (t.startsWith('### ')) {
      elements.push(
        <div key={k} style={{marginTop:'18px',marginBottom:'6px'}}>
          <h3 id={t.slice(4).toLowerCase().replace(/[^a-z0-9]+/g,'-')} style={{...MONO,fontSize:'13px',color:'#64748b',fontWeight:700,margin:0,textTransform:'uppercase',letterSpacing:'0.05em'}}>{ir(t.slice(4),k)}</h3>
        </div>
      );
    } else if (t.startsWith('#### ')) {
      elements.push(
        <div key={k} style={{marginTop:'12px',marginBottom:'4px',fontSize:'13px',color:'#cbd5e1',fontWeight:600,...MONO}}>{ir(t.slice(5),k)}</div>
      );
    } else if (t.startsWith('> ')) {
      elements.push(
        <div key={k} style={{margin:'10px 0',padding:'10px 16px',borderLeft:'3px solid #4ade8033',background:'#040f08',fontSize:`${BASE_FONT}px`,color:'#4ade8099',...MONO,lineHeight:1.8}}>{ir(t.slice(2),k)}</div>
      );
    } else if (line.match(/^(\s*)([-*])\s+(.+)/)) {
      const bm = line.match(/^(\s*)([-*])\s+(.+)/)!;
      elements.push(
        <div key={k} style={{display:'flex',gap:'10px',marginLeft:Math.floor(bm[1].length/2)*20,margin:'3px 0'}}>
          <span style={{color:'#4ade8055',flexShrink:0,fontSize:'14px'}}>▸</span>
          <span style={{fontSize:`${BASE_FONT}px`,color:'#cbd5e1',lineHeight:1.85,...MONO}}>{ir(bm[3],k)}</span>
        </div>
      );
    } else if (line.match(/^(\s*)(\d+)\.\s+(.+)/)) {
      const om = line.match(/^(\s*)(\d+)\.\s+(.+)/)!;
      elements.push(
        <div key={k} style={{display:'flex',gap:'12px',margin:'3px 0'}}>
          <span style={{fontSize:`${BASE_FONT}px`,color:'#64748b',flexShrink:0,minWidth:'24px',textAlign:'right' as const,...MONO}}>{om[2]}.</span>
          <span style={{fontSize:`${BASE_FONT}px`,color:'#cbd5e1',lineHeight:1.85,...MONO}}>{ir(om[3],k)}</span>
        </div>
      );
    } else if (t.startsWith('|')) {
      // Table row — separator rows are silently skipped (else branch does nothing)
      const isSep = !!t.match(/^[\|\-\s:]+$/);
      if (!isSep) {
        const cells    = t.split('|').slice(1,-1);
        const isHeader = !!lines[i+1]?.trim().match(/^[\|\-\s:]+$/);
        elements.push(
          <div key={k} style={{display:'flex',borderBottom:'1px solid #0f1923',marginTop:isHeader?'14px':'0'}}>
            {cells.map((c,ci) => (
              <div key={ci} style={{
                flex:1, padding:'6px 12px',
                fontSize:`${BASE_FONT-1}px`,
                color:isHeader?'#64748b':'#94a3b8',
                fontWeight:isHeader?700:400,
                letterSpacing:isHeader?'0.05em':'normal',
                ...MONO,
                borderRight:'1px solid #0f1923',
                background:isHeader?'#040b14':'transparent',
              }}>
                {ir(c.trim(),`${k}-${ci}`)}
              </div>
            ))}
          </div>
        );
      }
      // separator rows: fall through (no push) — equivalent to skipping
    } else {
      elements.push(
        <div key={k} style={{fontSize:`${BASE_FONT}px`,color:'#cbd5e1',lineHeight:1.9,...MONO}}>{ir(t,k)}</div>
      );
    }
  }

  return (
    <div ref={scrollRef} style={{padding:'28px 36px',overflowY:'auto',flex:1,...MONO,fontSize:`${BASE_FONT}px`}}>
      {elements}
    </div>
  );
}

// ── PM Intelligence panel ──────────────────────────────────────────────────────
function PMIntelligence({
  selected, content, runtime, artifacts, insight, agentsUsed,
}: {
  selected:string; content:string; runtime:ReturnType<typeof useRuntime>; artifacts:string[];
  insight?: StageData; agentsUsed?: string[];
}) {
  const n       = stageNum(selected);
  const intel   = STAGE_INTEL[n];
  const col     = STAGE_COLOR[n] ?? '#94a3b8';
  const ver     = runtime.getVersion(selected);
  const isStale = runtime.isStale(selected);
  const wc      = wordCount(content);
  const rt      = readTime(content);
  const toc     = extractTOC(content);
  const reasoning = runtime.getReasoningFor(selected);
  const upstreamNums   = STAGE_DEPS[n] ?? [];
  const downstreamNums = Object.entries(STAGE_DEPS)
    .filter(([,deps])=>deps.includes(n)).map(([k])=>parseInt(k,10));
  if (!intel) return null;
  return (
    <div>
      {/* Purpose */}
      <div style={{marginBottom:'12px'}}>
        <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',fontWeight:700,marginBottom:'6px'}}>PURPOSE</div>
        <div style={{padding:'9px 10px',backgroundColor:'#040b14',border:`1px solid ${col}22`,borderRadius:'3px',fontSize:'11px',color:'#64748b',lineHeight:1.8}}>{intel.purpose}</div>
      </div>
      {/* Agent ownership — real run reasoning (journey-state), supersedes static framework/interview text */}
      <div style={{marginBottom:'12px'}}>
        <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',fontWeight:700,marginBottom:'6px'}}>AGENT OWNERSHIP</div>
        <div style={{backgroundColor:'#040b14',border:`1px solid ${intel.agentColor}22`,borderRadius:'3px'}}>
          <RunInsightPanel
            stageId={String(n)}
            reasoning={insight?.reasoning ?? null}
            decision={insight?.decision ?? null}
            confidence={insight?.confidence ?? null}
            agentsUsed={agentsUsed}
            isStale={isStale}
          />
        </div>
      </div>
      {/* Dependency map */}
      <div style={{marginBottom:'12px'}}>
        <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',fontWeight:700,marginBottom:'6px'}}>DEPENDENCY MAP</div>
        <div style={{padding:'8px 10px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'3px',fontSize:'10px'}}>
          {upstreamNums.length > 0 ? (
            <div style={{marginBottom:'7px'}}>
              <div style={{color:'#64748b',marginBottom:'3px',fontSize:'9px',letterSpacing:'0.06em'}}>↑ DEPENDS ON</div>
              {upstreamNums.map(u => {
                const upArt = artifacts.find(a=>stageNum(a)===u);
                const upStale = upArt ? runtime.isStale(upArt) : false;
                return (
                  <div key={u} style={{color:upStale?'#f59e0b':'#94a3b8',marginBottom:'2px',paddingLeft:'8px'}}>
                    {STAGE_LABEL[u]} {upStale?'△':''}
                    <span style={{color:'#2a5a30',marginLeft:'6px',fontSize:'9px'}}>[{STAGE_INTEL[u]?.agentId}]</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{color:'#64748b',marginBottom:'7px',fontSize:'9px'}}>↑ Root artifact — no upstream dependencies</div>
          )}
          {downstreamNums.length > 0 && (
            <div>
              <div style={{color:'#64748b',marginBottom:'3px',fontSize:'9px',letterSpacing:'0.06em'}}>↓ REQUIRED BY</div>
              {downstreamNums.map(d => {
                const dArt = artifacts.find(a=>stageNum(a)===d);
                const dStale = dArt ? runtime.isStale(dArt) : false;
                return (
                  <div key={d} style={{color:dStale?'#f59e0b':'#94a3b8',marginBottom:'2px',paddingLeft:'8px'}}>
                    {STAGE_LABEL[d]} {dStale?'△':''}
                    <span style={{color:'#2a5a30',marginLeft:'6px',fontSize:'9px'}}>[{STAGE_INTEL[d]?.agentId}]</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Version lineage */}
      <div style={{marginBottom:'12px'}}>
        <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',fontWeight:700,marginBottom:'6px'}}>VERSION LINEAGE</div>
        <div style={{padding:'8px 10px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'3px',fontSize:'10px',lineHeight:1.9}}>
          <div style={{color:'#cbd5e1'}}>v1 · Created by V2 lifecycle run</div>
          {reasoning.map((r,i) => (
            <div key={i} style={{color:'#cbd5e1',paddingLeft:'8px',borderLeft:'2px solid #4ade8022',marginLeft:'6px',marginTop:'4px'}}>
              <div style={{color:'#4ade80'}}>v{i+2} · {r.model} · {new Date(r.timestamp).toLocaleTimeString()}</div>
              <div style={{color:'#64748b',fontSize:'9px'}}>{r.intent.slice(0,60)}{r.intent.length>60?'…':''}</div>
            </div>
          ))}
          {ver === 0 && <div style={{color:'#334155',fontSize:'9px',marginTop:'4px'}}>No improvements yet — original V2 lifecycle output</div>}
        </div>
      </div>
      {/* Quality signal */}
      <div style={{marginBottom:'12px'}}>
        <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',fontWeight:700,marginBottom:'6px'}}>QUALITY SIGNAL</div>
        <div style={{padding:'8px 10px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'3px',fontSize:'10px',lineHeight:1.9}}>
          <div style={{color:'#64748b'}}>Score: <span style={{color:'#334155'}}>N/A — evaluator in V3.3</span></div>
          <div style={{color:'#64748b'}}>Status: <span style={{color:isStale?'#f59e0b':'#4ade80'}}>{isStale?'△ Stale':'✓ Current'}</span></div>
          <div style={{color:'#64748b'}}>Words: <span style={{color:'#cbd5e1'}}>{wc.toLocaleString()}</span></div>
          <div style={{color:'#64748b'}}>Sections: <span style={{color:'#cbd5e1'}}>{toc.length}</span></div>
          <div style={{color:'#64748b'}}>Read time: <span style={{color:'#cbd5e1'}}>{rt}</span></div>
        </div>
      </div>
      {/* Comparison stub */}
      {ver > 0 && (
        <div style={{marginBottom:'12px'}}>
          <div style={{fontSize:'10px',color:'#2a5a30',letterSpacing:'0.1em',fontWeight:700,marginBottom:'6px'}}>COMPARISON</div>
          <div style={{padding:'8px 10px',backgroundColor:'#040b14',border:'1px solid #818cf822',borderRadius:'3px',fontSize:'10px',color:'#64748b',lineHeight:1.7}}>
            <div style={{color:'#818cf8',marginBottom:'4px'}}>v{ver} vs v1 diff — V3.2 feature</div>
            <div>Full before/after diff (Cursor-style) requires storing v1 at improvement time. Open in Refine to see the improvement reasoning chain.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DeskPage() {
  const runtime = useRuntime();

  const [artifacts,    setArtifacts]    = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [selected,     setSelected]     = useState<string|null>(null);
  const [rawContent,   setRawContent]   = useState<string|null>(null);
  const [loading,      setLoading]      = useState(false);
  const [focusMode,    setFocusMode]    = useState(false);
  const [rightTab,     setRightTab]     = useState<'overview'|'actions'|'history'>('overview');
  const [snapName,     setSnapName]     = useState('');
  const [snapshots,    setSnapshots]    = useState<{name:string;stage:number;ts:string}[]>([]);
  const [snapSaved,    setSnapSaved]    = useState(false);
  const [quickIntent,  setQuickIntent]  = useState('');
  // card library state
  const [summaries,      setSummaries]      = useState<Record<string, string>>({});
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    () => new Set(['discover', 'decide', 'specify', 'architect', 'ship'])
  );
  // B2: running state — governs 'generating' health state on cards
  const [isRunning, setIsRunning] = useState(false);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const fetchedRef   = useRef<Set<string>>(new Set());   // guards duplicate summary fetches
  // P-NEW-6: dismissal latch — keeps the artifact rail cleared after "+ New Idea"
  // until a genuinely new lifecycle (different projectPath) appears.
  const dismissedRef        = useRef(false);
  const dismissedProjectRef = useRef<string|null>(null);
  const latestProjectRef    = useRef<string|null>(null);
  // Mission 14 Phase 2 Stage B — real reasoning data, polled independently of
  // the /api/data effect above so the dismissal latch above is never touched.
  const [journeyState, setJourneyState] = useState<{
    currentStage: number;
    stages: Record<string, StageData>;
    agentsByStage: Record<string, string[]>;
  }>({ currentStage: 0, stages: {}, agentsByStage: {} });

  useEffect(()=>{
    const loadData = () => fetch('/api/data').then(r=>r.json()).then(d=>{
      const proj = d.projectPath ?? null;
      if (dismissedRef.current) {
        // Stay cleared until a NEW lifecycle (different project) starts.
        if (proj !== dismissedProjectRef.current) dismissedRef.current = false;
        else return;
      }
      latestProjectRef.current = proj;
      setArtifacts(d.artifacts??[]);
      setCurrentStage(d.currentStage??0);
    }).catch(()=>{});
    loadData();
    try{ const s=localStorage.getItem('ig_snapshots'); if(s) setSnapshots(JSON.parse(s)); }catch{}
    const poll = setInterval(loadData, 4000);
    // Triggered by TopBar's "New Idea" and manual refresh buttons
    const clearArtifact = () => {
      dismissedRef.current = true;
      dismissedProjectRef.current = latestProjectRef.current;
      setSelected(null); setArtifacts([]);
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

  // B2: Poll /api/run for isRunning — drives 'generating' health state
  useEffect(()=>{
    const check = () => fetch('/api/run').then(r=>r.json())
      .then(d=>setIsRunning(!!(d.running??false)))
      .catch(()=>setIsRunning(false));
    check();
    const t = setInterval(check, 2000);
    return () => clearInterval(t);
  },[]);

  // Fetch first-150-char summaries for all generated artifacts (for card grid).
  // fetchedRef guards against duplicate requests when artifacts array reference changes.
  useEffect(()=>{
    for (const f of artifacts) {
      if (fetchedRef.current.has(f)) continue;
      fetchedRef.current.add(f);
      fetch(`/api/data?file=${encodeURIComponent(f)}`)
        .then(r=>r.json())
        .then(d=>{
          const raw = (d.content ?? '') as string;
          // Strip headings + separators; join remaining lines for a prose summary
          const text = raw.split('\n')
            .filter(l => { const t=l.trim(); return t && !t.startsWith('#') && t !== '---' && t !== '***'; })
            .join(' ')
            .trim();
          setSummaries(prev => ({ ...prev, [f]: text.slice(0, 150) }));
        })
        .catch(()=>{});
    }
  },[artifacts]);

  useEffect(()=>{
    setRawContent(null); setLoading(false);
    if(!selected) return;
    setLoading(true);
    fetch(`/api/improve?file=${encodeURIComponent(selected)}`).then(r=>r.json())
      .then(d=>setRawContent(parseContent(d.content??'')))
      .catch(e=>setRawContent(`[Error: ${e.message}]`))
      .finally(()=>setLoading(false));
  },[selected]);

  const content  = rawContent ?? '';
  const toc      = extractTOC(content);
  const selStage = selected ? stageNum(selected) : -1;
  const selColor = selStage >= 0 ? (STAGE_COLOR[selStage] ?? '#94a3b8') : '#94a3b8';
  const isStale  = selected ? runtime.isStale(selected) : false;
  const ver      = selected ? runtime.getVersion(selected) : 0;
  const staleCount = runtime.state.staleArtifacts.size;

  const stagesForChain = useMemo(():Record<string,StageData> => {
    const out: Record<string,StageData> = {};
    for (const [id, data] of Object.entries(journeyState.stages)) {
      const art = artifacts.find(a=>stageNum(a)===parseInt(id,10));
      out[id] = { ...data, isStale: art ? runtime.isStale(art) : false };
    }
    return out;
  },[journeyState.stages, artifacts, runtime]);

  const handleSelectStageFromChain = useCallback((id:string)=>{
    const n = parseInt(id,10);
    const art = artifacts.find(a=>stageNum(a)===n);
    if (art) setSelected(art);
  },[artifacts]);

  // B5: weakest-link — generated artifact that is stale/questionable with most downstream dependents
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

  const handleDownload = useCallback(()=>{
    if(!content||!selected) return;
    const a = Object.assign(document.createElement('a'),{ href:URL.createObjectURL(new Blob([content],{type:'text/markdown'})), download:selected });
    a.click(); URL.revokeObjectURL(a.href);
  },[content,selected]);

  const handleCopy = useCallback(async()=>{
    if(!content) return;
    await navigator.clipboard.writeText(content).catch(()=>{});
  },[content]);

  const handleOpenInRefine = useCallback(()=>{
    if(selected) sessionStorage.setItem('ig_selected_artifact', selected);
    if(quickIntent.trim()) sessionStorage.setItem('ig_quick_intent', quickIntent.trim());
    window.location.href = '/improve';
  },[selected, quickIntent]);

  const handleSaveSnapshot = useCallback(()=>{
    if(!snapName.trim()) return;
    const s = { name:snapName.trim(), stage:currentStage, ts:new Date().toISOString() };
    const next = [s,...snapshots].slice(0,10);
    setSnapshots(next);
    try{ localStorage.setItem('ig_snapshots',JSON.stringify(next)); }catch{}
    setSnapName(''); setSnapSaved(true);
    setTimeout(()=>setSnapSaved(false), 2000);
  },[snapName, snapshots, currentStage]);

  const handleTocClick = useCallback((id:string)=>{
    const el = document.getElementById(id);
    if(el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop - 24, behavior:'smooth' });
  },[]);

  // D1: expand/collapse lifecycle phases in the left rail
  const togglePhase = useCallback((id:string)=>{
    setExpandedPhases(prev=>{
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  },[]);

  // D2: "Open in Studio →" — uses URL param (CommandPalette pattern)
  const handleOpenInStudio = useCallback((f:string)=>{
    window.location.href = `/improve?artifact=${encodeURIComponent(f)}`;
  },[]);

  const B = (extra?:React.CSSProperties): React.CSSProperties => ({...MONO, cursor:'pointer', border:'none', borderRadius:'3px', ...(extra??{})});

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',backgroundColor:'#020609',overflow:'hidden',...MONO,color:'#cbd5e1'}}>
      <style>{`
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        .art-row:hover{background:#0a1509!important} .toc-item:hover{color:#4ade80!important;cursor:pointer}
        button:disabled{opacity:.4;cursor:not-allowed!important} textarea::placeholder,input::placeholder{color:#64748b}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .shimmer-bar{background:linear-gradient(90deg,#0a1a2e 25%,#1e2d45 50%,#0a1a2e 75%);background-size:800px 100%;animation:shimmer 1.4s infinite linear}
      `}</style>

      {/* Page header */}
      <div style={{display:'flex',alignItems:'center',padding:'0 14px',height:'42px',backgroundColor:'#020c06',borderBottom:'1px solid #0a1a2e',flexShrink:0,gap:'10px'}}>
        <div style={{fontSize:'12px',color:'#64748b',letterSpacing:'0.1em',fontWeight:700}}>DESK</div>
        {selected && <>
          <span style={{color:'#334155'}}>›</span>
          <span style={{fontSize:'11px',color:'#cbd5e1'}}>Stage {selStage}</span>
          <span style={{color:'#334155'}}>›</span>
          <span style={{fontSize:'11px',color:selColor,fontWeight:700}}>{titleCase(humanName(selected))}</span>
          {isStale && <div style={{fontSize:'9px',color:'#f59e0b',padding:'1px 6px',border:'1px solid #f59e0b33',borderRadius:'2px'}}>△ stale</div>}
          {ver > 0 && <div style={{fontSize:'9px',color:'#4ade80',padding:'1px 6px',border:'1px solid #4ade8033',borderRadius:'2px'}}>v{ver}</div>}
        </>}
        <div style={{flex:1}}/>
        {selected && content && (
          <div style={{display:'flex',gap:'4px'}}>
            {(() => { const kb = (new Blob([content]).size / 1024).toFixed(1); return (
              <>
                <button onClick={handleCopy}     style={{...B(),padding:'4px 9px',fontSize:'10px',backgroundColor:'transparent',color:'#cbd5e1',outline:'1px solid #1e293b'}}>Copy</button>
                <button onClick={handleDownload} style={{...B(),padding:'4px 9px',fontSize:'10px',backgroundColor:'#0a1509',color:'#4ade80',outline:'1px solid #1a3a20'}}>⬇ MD ({kb}KB)</button>
              </>
            ); })()}
            <button onClick={handleOpenInRefine} style={{...B(),padding:'4px 9px',fontSize:'10px',backgroundColor:'#0a0f1e',color:'#818cf8',outline:'1px solid #818cf833'}}>Edit in Refine ↗</button>
          </div>
        )}
        <button onClick={()=>setFocusMode(!focusMode)}
          style={{...B(),padding:'4px 10px',fontSize:'10px',backgroundColor:focusMode?'#0a1f0e':'transparent',color:focusMode?'#4ade80':'#64748b',outline:'1px solid #1e293b'}}>
          {focusMode ? '⇤ EXIT FOCUS' : '⇥ FOCUS'}
        </button>
      </div>

      {/* Main layout */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left rail — B1/B4: 5-phase grouping with PM question subtitle */}
        {!focusMode && (
          <div style={{width:'196px',flexShrink:0,borderRight:'1px solid #0a1a2e',backgroundColor:'#020c06',overflowY:'auto',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'9px 13px 6px',fontSize:'12px',color:'#2a5a30',letterSpacing:'0.12em',fontWeight:700}}>
              ARTIFACTS · {artifacts.length}/15
            </div>

            {LIFECYCLE_PHASES.map(phase => {
              const expanded = expandedPhases.has(phase.id);
              const genCount = phase.stages.filter(n => artifacts.some(a => stageNum(a) === n)).length;
              return (
                <div key={phase.id}>
                  {/* Phase header — click to toggle */}
                  <div
                    onClick={() => togglePhase(phase.id)}
                    style={{cursor:'pointer',userSelect:'none'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor='#040b14'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor='transparent'}
                  >
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 13px 3px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                        <span style={{fontSize:'9px',color:phase.color}}>{expanded?'▾':'▸'}</span>
                        <span style={{fontSize:'10px',color:phase.color,fontWeight:700,letterSpacing:'0.08em'}}>{phase.label.toUpperCase()}</span>
                      </div>
                      <span style={{fontSize:'9px',color: genCount===phase.stages.length?'#4ade80':'#334155'}}>{genCount}/{phase.stages.length}</span>
                    </div>
                    {/* B4: PM question subtitle — only visible when phase is expanded */}
                    {expanded && (
                      <div style={{padding:'0 13px 4px 22px',fontSize:'9px',color:'#2a5a30',lineHeight:1.5,fontStyle:'italic'}}>
                        {phase.question}
                      </div>
                    )}
                  </div>

                  {/* Stage items */}
                  {expanded && phase.stages.map(n => {
                    const f = artifacts.find(a => stageNum(a) === n);
                    if (!f) {
                      return (
                        <div key={n} style={{display:'flex',alignItems:'center',gap:'7px',padding:'5px 12px 5px 20px',opacity:0.35}}>
                          <div style={{width:'5px',height:'5px',borderRadius:'50%',backgroundColor:'#334155',flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:'11px',color:'#334155',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{STAGE_LABEL[n]}</div>
                            <div style={{fontSize:'9px',color:'#1e293b'}}>Stage {n} · queued</div>
                          </div>
                        </div>
                      );
                    }
                    const col=STAGE_COLOR[n]??'#94a3b8', active=selected===f, stale=runtime.isStale(f), v=runtime.getVersion(f);
                    return (
                      <div key={n} className="art-row" onClick={()=>setSelected(f)}
                        style={{display:'flex',alignItems:'center',gap:'7px',padding:'5px 12px 5px 20px',cursor:'pointer',borderLeft:`2px solid ${active?col:stale?'#f59e0b33':'transparent'}`,backgroundColor:active?'#0a1509':'transparent'}}>
                        <div style={{width:'5px',height:'5px',borderRadius:'50%',backgroundColor:stale?'#f59e0b':v>0?'#4ade80':col,flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:'11px',color:active?col:stale?'#f59e0b':'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{STAGE_LABEL[n]}</div>
                          <div style={{fontSize:'9px',color:'#334155'}}>Stage {n}{v>0?` · v${v}`:''}{stale?' · △':''}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Centre */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* D1/D2/D3: Artifact library — always shows all 15 stages */}
          {!selected && (
            <div style={{flex:1,overflowY:'auto',padding:'14px 18px'}}>
              {/* Library header */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',paddingBottom:'8px',borderBottom:'1px solid #0a1a2e'}}>
                <div style={{fontSize:'11px',color:'#2a5a30',letterSpacing:'0.1em',fontWeight:700}}>
                  ARTIFACT LIBRARY
                </div>
                <div style={{fontSize:'10px',color:'#334155'}}>
                  {artifacts.length}/15 generated · Stage {currentStage}/15
                </div>
              </div>

              {/* D4: Honest empty state when no run data */}
              {!artifacts.length && !journeyState.stages && (
                <div style={{padding:'20px',fontSize:'11px',color:'#334155',textAlign:'center' as const,lineHeight:1.8}}>
                  No run data yet. Run a lifecycle to populate the library.
                </div>
              )}

              {/* B5: Weakest-link banner — most impactful stale/questionable artifact */}
              {isRunning && (
                <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 10px',marginBottom:'10px',backgroundColor:'#0a0f1e',border:'1px solid #818cf833',borderRadius:'3px',fontSize:'10px'}}>
                  <span style={{color:'#818cf8',fontWeight:700,letterSpacing:'0.06em'}}>● RUNNING</span>
                  <span style={{color:'#64748b'}}>Stage {currentStage} · {STAGE_LABEL[currentStage] ?? '…'}</span>
                </div>
              )}
              {!isRunning && weakestLink && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',padding:'7px 10px',marginBottom:'10px',backgroundColor: weakestLink.health==='stale'?'#140a0a':'#0d0e07',border:`1px solid ${weakestLink.health==='stale'?'#ef444433':'#f59e0b33'}`,borderRadius:'3px',fontSize:'10px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                    <span style={{color:weakestLink.health==='stale'?'#ef4444':'#f59e0b',fontWeight:700,letterSpacing:'0.06em',flexShrink:0}}>
                      {weakestLink.health==='stale'?'△ STALE':'⚑ REVIEW'}
                    </span>
                    <span style={{color:'#94a3b8'}}>{weakestLink.name}</span>
                    <span style={{color:'#334155'}}>·</span>
                    <span style={{color:'#64748b'}}>{weakestLink.downstreams} downstream{weakestLink.downstreams!==1?'s':''} affected</span>
                  </div>
                  <button onClick={()=>handleOpenInStudio(weakestLink.file)}
                    style={{padding:'2px 8px',fontSize:'9px',backgroundColor:'transparent',border:`1px solid ${weakestLink.health==='stale'?'#ef444433':'#f59e0b33'}`,borderRadius:'2px',color:weakestLink.health==='stale'?'#ef4444':'#f59e0b',cursor:'pointer',...MONO}}>
                    Fix →
                  </button>
                </div>
              )}

              {/* Phase sections with 2-column card grid */}
              {LIFECYCLE_PHASES.map(phase => (
                <div key={phase.id} style={{marginBottom:'16px'}}>
                  {/* Phase heading */}
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'7px'}}>
                    <div style={{width:'3px',height:'12px',backgroundColor:phase.color,borderRadius:'1px',flexShrink:0}}/>
                    <span style={{fontSize:'10px',color:phase.color,fontWeight:700,letterSpacing:'0.1em'}}>{phase.label.toUpperCase()}</span>
                    <span style={{fontSize:'9px',color:'#334155',fontStyle:'italic'}}>
                      {phase.question}
                    </span>
                    <div style={{flex:1,height:'1px',backgroundColor:'#0a1a2e'}}/>
                    <span style={{fontSize:'9px',color:'#334155'}}>
                      {phase.stages.filter(n=>artifacts.some(a=>stageNum(a)===n)).length}/{phase.stages.length}
                    </span>
                  </div>

                  {/* 2-column card grid — all stages shown, generated + placeholder */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                    {phase.stages.map(n => (
                      <ArtifactCard
                        key={n}
                        stageN={n}
                        artifacts={artifacts}
                        journeyStages={journeyState.stages as Record<string, any>}
                        summaries={summaries}
                        runtime={runtime}
                        isRunning={isRunning}
                        currentStage={currentStage}
                        onSelect={setSelected}
                        onOpenStudio={handleOpenInStudio}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected && loading && <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'#cbd5e1'}}>Loading artifact…</div>}

          {selected && !loading && content && (
            <>
              {/* Article header */}
              <div style={{padding:'18px 36px 10px',borderBottom:'1px solid #0a1a2e',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px'}}>
                  <div style={{width:'8px',height:'8px',borderRadius:'50%',backgroundColor:selColor}}/>
                  <div style={{fontSize:'11px',color:selColor,fontWeight:700,letterSpacing:'0.08em'}}>STAGE {selStage} · {STAGE_LABEL[selStage]}</div>
                  {STAGE_INTEL[selStage] && <div style={{fontSize:'10px',color:'#64748b'}}>· {STAGE_INTEL[selStage].agentId}</div>}
                </div>
                <div style={{fontSize:'10px',color:'#64748b'}}>{wordCount(content).toLocaleString()} words · {readTime(content)} · {toc.length} sections</div>
              </div>

              {/* TOC bar */}
              {toc.length > 2 && (
                <div style={{padding:'7px 36px',backgroundColor:'#020c06',borderBottom:'1px solid #0a1a2e',flexShrink:0,overflowX:'auto'}}>
                  <div style={{display:'flex',gap:'4px',alignItems:'center',whiteSpace:'nowrap'}}>
                    <span style={{fontSize:'9px',color:'#334155',marginRight:'5px',flexShrink:0}}>CONTENTS</span>
                    {toc.map((e,i) => (
                      <React.Fragment key={e.id}>
                        {i > 0 && <span style={{color:'#334155'}}>·</span>}
                        <span className="toc-item" onClick={()=>handleTocClick(e.id)}
                          style={{fontSize:'10px',color:e.level===2?'#94a3b8':'#64748b',paddingLeft:e.level===3?'6px':'0'}}>
                          {e.text.slice(0,28)}{e.text.length>28?'…':''}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              <ArtifactReader content={content} scrollRef={scrollRef}/>

              {/* Footer */}
              <div style={{padding:'7px 36px',borderTop:'1px solid #0a1a2e',flexShrink:0,display:'flex',gap:'12px',alignItems:'center',fontSize:'10px',color:'#64748b',backgroundColor:'#020c06'}}>
                <span>{wordCount(content).toLocaleString()} words</span>
                <span>·</span><span>{readTime(content)}</span>
                <span>·</span><span>{toc.length} sections</span>
                {ver > 0 && <><span>·</span><span style={{color:'#4ade80'}}>v{ver} improved</span></>}
                <div style={{flex:1}}/>
                <button onClick={handleDownload} style={{...B(),padding:'3px 8px',fontSize:'10px',backgroundColor:'transparent',color:'#64748b',outline:'1px solid #1e293b'}}>↓ Download</button>
                <button onClick={handleOpenInRefine} style={{...B(),padding:'3px 8px',fontSize:'10px',backgroundColor:'#0a0f1e',color:'#818cf8',outline:'1px solid #818cf833'}}>Edit in Refine →</button>
              </div>
            </>
          )}
        </div>

        {/* Right panel */}
        {!focusMode && (
          <div style={{width:'256px',flexShrink:0,borderLeft:'1px solid #0a1a2e',backgroundColor:'#020c06',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{display:'flex',borderBottom:'1px solid #0a1a2e',flexShrink:0}}>
              {(['overview','actions','history'] as const).map(t=>(
                <button key={t} onClick={()=>setRightTab(t)}
                  style={{...B(),flex:1,padding:'9px 0',fontSize:'9px',borderRadius:0,backgroundColor:'transparent',color:rightTab===t?'#4ade80':'#64748b',borderBottom:rightTab===t?'1px solid #4ade80':'1px solid transparent',letterSpacing:'0.08em',textTransform:'uppercase' as const}}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'12px'}}>

              {rightTab==='overview' && (
                <>
                  {!selected && (
                    <>
                      <div style={{fontSize:'10px',color:'#2a5a30',fontWeight:700,letterSpacing:'0.1em',marginBottom:'9px'}}>PROJECT</div>
                      <div style={{padding:'9px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'3px',marginBottom:'12px',fontSize:'10px',lineHeight:2}}>
                        <div>Stage: <span style={{color:'#4ade80'}}>{currentStage}/15</span></div>
                        <div>Artifacts: <span style={{color:'#cbd5e1'}}>{artifacts.length}</span></div>
                        <div>Improved: <span style={{color:'#4ade80'}}>{runtime.state.improvementCount}</span></div>
                        <div>Stale: <span style={{color:staleCount>0?'#f59e0b':'#64748b'}}>{staleCount}</span></div>
                      </div>
                      <div style={{fontSize:'10px',color:'#2a5a30',fontWeight:700,letterSpacing:'0.1em',marginBottom:'8px'}}>LIFECYCLE MAP</div>
                      <LifecycleNodeChain
                        stages={stagesForChain}
                        currentStage={currentStage}
                        onSelectStage={handleSelectStageFromChain}
                      />
                    </>
                  )}
                  {selected && content && (
                    <PMIntelligence
                      selected={selected} content={content} runtime={runtime} artifacts={artifacts}
                      insight={journeyState.stages[String(selStage)]}
                      agentsUsed={journeyState.agentsByStage[String(selStage)]}
                    />
                  )}
                </>
              )}

              {rightTab==='actions' && (
                <div>
                  <div style={{fontSize:'10px',color:'#2a5a30',fontWeight:700,letterSpacing:'0.1em',marginBottom:'9px'}}>QUICK IMPROVE</div>
                  <div style={{fontSize:'11px',color:'#64748b',marginBottom:'8px',lineHeight:1.7}}>Describe what to improve, then open in the full Refine engine with this artifact pre-selected.</div>
                  <textarea value={quickIntent} onChange={e=>setQuickIntent(e.target.value)} placeholder='e.g. "Sharpen the competitive moat section"'
                    style={{width:'100%',minHeight:'60px',padding:'8px',...MONO,fontSize:'11px',color:'#64748b',backgroundColor:'#040b14',border:'1px solid #0f1923',borderRadius:'3px',resize:'vertical',outline:'none',lineHeight:1.6,boxSizing:'border-box' as const,marginBottom:'8px'}}/>
                  <button onClick={handleOpenInRefine} disabled={!selected}
                    style={{...B(),width:'100%',padding:'9px 0',fontSize:'11px',fontWeight:700,letterSpacing:'0.08em',backgroundColor:selected?'#0a0f1e':'#040b14',color:selected?'#818cf8':'#334155',outline:`1px solid ${selected?'#818cf833':'#334155'}`,marginBottom:'5px'}}>
                    ↗ Open in Refine
                  </button>
                  <div style={{fontSize:'9px',color:'#334155',textAlign:'center' as const,marginBottom:'16px'}}>Full model selector · 8 providers · builder export</div>
                  <div style={{fontSize:'10px',color:'#2a5a30',fontWeight:700,letterSpacing:'0.1em',marginBottom:'8px',paddingTop:'12px',borderTop:'1px solid #0a1a2e'}}>DOWNLOAD</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'4px',marginBottom:'16px'}}>
                    <button onClick={handleDownload} disabled={!content} style={{...B(),padding:'7px 10px',fontSize:'11px',backgroundColor:'#0a1509',color:'#4ade80',outline:'1px solid #1a3a20',textAlign:'left' as const}}>↓ Download as Markdown</button>
                    <button onClick={handleCopy} disabled={!content} style={{...B(),padding:'7px 10px',fontSize:'11px',backgroundColor:'transparent',color:'#cbd5e1',outline:'1px solid #1e293b',textAlign:'left' as const}}>◻ Copy to clipboard</button>
                    <button onClick={()=>window.location.href='/improve'} style={{...B(),padding:'7px 10px',fontSize:'11px',backgroundColor:'#0a0800',color:'#f59e0b',outline:'1px solid #f59e0b22',textAlign:'left' as const}}>◈ Builder package (10 platforms)</button>
                  </div>
                  <div style={{fontSize:'10px',color:'#2a5a30',fontWeight:700,letterSpacing:'0.1em',marginBottom:'8px',paddingTop:'12px',borderTop:'1px solid #0a1a2e'}}>SNAPSHOT</div>
                  <input value={snapName} onChange={e=>setSnapName(e.target.value)} placeholder="Name this snapshot…"
                    style={{width:'100%',padding:'7px 9px',...MONO,fontSize:'11px',color:'#64748b',backgroundColor:'#040b14',border:'1px solid #0f1923',borderRadius:'3px',outline:'none',boxSizing:'border-box' as const,marginBottom:'6px'}}/>
                  <button onClick={handleSaveSnapshot} disabled={!snapName.trim()}
                    style={{...B(),width:'100%',padding:'7px 0',fontSize:'11px',backgroundColor:'#0a0f1e',color:snapSaved?'#4ade80':'#818cf8',outline:`1px solid ${snapSaved?'#4ade8033':'#818cf833'}`,marginBottom:'4px'}}>
                    {snapSaved ? '✓ Saved!' : '◼ Save snapshot'}
                  </button>
                </div>
              )}

              {rightTab==='history' && (
                <div>
                  {runtime.state.reasoningChain.length > 0 && (
                    <>
                      <div style={{fontSize:'10px',color:'#2a5a30',fontWeight:700,letterSpacing:'0.1em',marginBottom:'8px'}}>IMPROVEMENT HISTORY · {runtime.state.reasoningChain.length}</div>
                      {runtime.state.reasoningChain.slice(0,12).map((r,i) => (
                        <div key={i} style={{padding:'8px 0',borderBottom:'1px solid #060e09'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'3px'}}>
                            <div style={{fontSize:'11px',color:'#4ade80',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{titleCase(humanName(r.artifactName+'.md'))}</div>
                            <div style={{fontSize:'8px',color:'#64748b',flexShrink:0,marginLeft:'6px'}}>{new Date(r.timestamp).toLocaleTimeString()}</div>
                          </div>
                          <div style={{fontSize:'10px',color:'#cbd5e1',marginBottom:'3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.intent}</div>
                          <div style={{fontSize:'9px',color:'#64748b',lineHeight:1.6}}>{r.reasoning.slice(0,100)}…</div>
                          <div style={{fontSize:'9px',color:'#64748b',marginTop:'2px'}}>{r.model}</div>
                        </div>
                      ))}
                    </>
                  )}
                  {!runtime.state.reasoningChain.length && (
                    <div style={{fontSize:'11px',color:'#64748b',lineHeight:1.8,padding:'6px 0'}}>No improvement history yet. Use REFINE to improve artifacts.</div>
                  )}
                  {snapshots.length > 0 && (
                    <>
                      <div style={{fontSize:'10px',color:'#2a5a30',fontWeight:700,letterSpacing:'0.1em',marginTop:'14px',paddingTop:'12px',borderTop:'1px solid #0a1a2e',marginBottom:'8px'}}>SNAPSHOTS · {snapshots.length}</div>
                      {snapshots.map((s,i) => (
                        <div key={i} style={{padding:'8px',backgroundColor:'#040b14',border:'1px solid #0a1a2e',borderRadius:'3px',marginBottom:'6px'}}>
                          <div style={{fontSize:'11px',color:'#cbd5e1',fontWeight:700,marginBottom:'2px'}}>{s.name}</div>
                          <div style={{fontSize:'9px',color:'#64748b'}}>{new Date(s.ts).toLocaleString()} · Stage {s.stage}/15</div>
                          <button onClick={()=>{ const n=snapshots.filter((_,j)=>j!==i); setSnapshots(n); localStorage.setItem('ig_snapshots',JSON.stringify(n)); }}
                            style={{...B(),marginTop:'5px',padding:'3px 7px',fontSize:'9px',backgroundColor:'transparent',color:'#cbd5e1',outline:'1px solid #1e293b'}}>Delete</button>
                        </div>
                      ))}
                    </>
                  )}
                  {runtime.state.events.length > 0 && (
                    <>
                      <div style={{fontSize:'10px',color:'#2a5a30',fontWeight:700,letterSpacing:'0.1em',marginTop:'14px',paddingTop:'12px',borderTop:'1px solid #0a1a2e',marginBottom:'8px'}}>RECENT EVENTS · {runtime.state.events.length}</div>
                      {runtime.state.events.slice(0,10).map((ev,i) => (
                        <div key={ev.id??i} style={{padding:'4px 0',borderBottom:'1px solid #060e09',display:'flex',gap:'7px'}}>
                          <div style={{fontSize:'8px',color:'#1a3a20',flexShrink:0}}>{new Date(ev.timestamp).toLocaleTimeString('en',{hour12:false})}</div>
                          <div style={{fontSize:'10px',color:ev.type==='ARTIFACT_IMPROVED'?'#4ade80':ev.type==='ARTIFACTS_STALE'?'#f59e0b':'#94a3b8'}}>{ev.type.replace(/_/g,' ')}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
