'use client';

// src/components/shared/FolderWorkspace.tsx
// Mission 27 — Workflow Completion Pass.
//
// Adds inline editor mode so New Document / Template / Upload flows
// complete end-to-end inside this panel — no blind router.push('/improve').
//
// Editor mode: title input + content textarea + Save / Cancel.
// On save → createDoc() writes to localStorage → BroadcastChannel notifies
// WorkspaceExplorer → document appears in the tree.
//
// "Open in Studio →" for phase folders: navigates to /improve (correct — lets
// the user pick the lifecycle artifact they want to refine).

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { WorkspaceNode } from './WorkspaceExplorer';
import { createDoc } from '@/lib/workspaceDocuments';
import { getTemplateContent } from '@/lib/templates';

// ── Typography ────────────────────────────────────────────────────────────────
const SANS: React.CSSProperties = { fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)' };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

// ── Folder specs ─────────────────────────────────────────────────────────────

interface FolderSpec {
  purpose:     string;
  description: string;
  contains:    string[];
  templates:   string[];
  note?:       string;
  accentColor: string;
  docCount?:   number;
}

const FOLDER_SPECS: Record<string, FolderSpec> = {
  'align': {
    accentColor: '#818cf8',
    purpose:     'Shared understanding across all stakeholders.',
    description: 'Align is where product strategy becomes visible. Use it to document the north star, socialize OKRs, map stakeholders, and keep decision logs that survive team changes.',
    contains:    ['Product Vision', 'North Star Metric', 'OKRs', 'Decision Log', 'Stakeholder Map', 'RACI', 'Strategy Brief'],
    templates:   ['Product Vision', 'OKR Framework', 'Stakeholder Map', 'Decision Log', 'Strategy Brief'],
  },
  'plan': {
    accentColor: '#38bdf8',
    purpose:     'When and how the product gets built.',
    description: 'Plan is your execution layer. Roadmaps, milestones, sprint plans, and risk registers live here. A well-maintained Plan folder means engineering knows what ships next.',
    contains:    ['Roadmap', 'Release Plan', 'Milestones', 'Risk Register', 'RAID Log', 'Sprint Plan', 'Launch Checklist'],
    templates:   ['Roadmap', 'Release Plan', 'Sprint Plan', 'RAID Log', 'Launch Checklist'],
  },
  'measure': {
    accentColor: '#4ade80',
    purpose:     'Outcomes, experiments, and user signals.',
    description: 'Measure is how you know if you shipped the right thing. Post-launch reviews, experiment briefs, funnel analyses, and NPS deep-dives belong here.',
    contains:    ['North Star Metrics', 'Funnel Analysis', 'Experiment Brief', 'A/B Test Results', 'NPS Report', 'Retention Analysis', 'Post-Launch Review'],
    templates:   ['Experiment Brief', 'Metrics Summary', 'Funnel Analysis', 'Post-Launch Review'],
  },
  'archive': {
    accentColor: '#64748b',
    purpose:     'Completed work preserved for future reference.',
    description: 'Archive captures institutional memory. Previous PRDs, completed launches, historical roadmaps, and retrospectives are stored here — read-only, always searchable.',
    contains:    ['Final PRDs', 'Superseded Docs', 'Historical Roadmaps', 'Retrospectives', 'Past Releases', 'Completed Launches'],
    templates:   [],
    note:        'Archive is read-only. Documents here are preserved for reference, never edited.',
  },
  'documents': {
    accentColor: '#4ade80',
    purpose:     'All structured artifacts from the 15-stage lifecycle.',
    description: 'Documents contains every artifact the AI product team has generated — from the initial idea intake through the prototype prompt. Organized by lifecycle phase.',
    contains:    ['Discover', 'Decide', 'Specify', 'Architect', 'Ship'],
    templates:   [],
  },
  'history': {
    accentColor: '#818cf8',
    purpose:     'Execution history and improvement sessions.',
    description: 'History captures every agent run, stage completion, confidence snapshot, and improvement cycle. It is generated automatically — you cannot edit it.',
    contains:    ['Stage completions', 'Improvement sessions', 'Agent runs', 'Confidence snapshots'],
    templates:   [],
    note:        'History is generated automatically from your workspace activity.',
  },
  'phase-discover': {
    accentColor: '#4ade80',
    purpose:     'Validate the problem before committing to a solution.',
    description: 'The Discover phase answers one question: is this problem real, frequent, and worth solving? Three artifacts are produced — Idea Intake, Discovery, and Problem Definition.',
    contains:    ['Idea Intake', 'Market Research', 'Problem Definition'],
    templates:   [],
  },
  'phase-decide': {
    accentColor: '#38bdf8',
    purpose:     'Align on what to build and why now.',
    description: 'The Decide phase establishes the solution hypothesis. Four artifacts converge: Solution Design, MVP Hypothesis, Validation Strategy, and Prioritization.',
    contains:    ['Solution Design', 'MVP Hypothesis', 'Validation Strategy', 'Prioritization'],
    templates:   [],
  },
  'phase-specify': {
    accentColor: '#818cf8',
    purpose:     'Define the product in detail — for users, design, and engineering.',
    description: 'The Specify phase produces the PRD, UX Design, and Usability criteria. These three artifacts are the execution handoff to engineering.',
    contains:    ['Product Requirements (PRD)', 'UX Design', 'Usability Criteria'],
    templates:   [],
  },
  'phase-architect': {
    accentColor: '#fb923c',
    purpose:     'Design the technical foundation.',
    description: 'The Architect phase produces the technical blueprint: System Architecture and the Backlog & Release Plan. These bound the implementation space.',
    contains:    ['Architecture Document', 'Backlog & Release Plan'],
    templates:   [],
  },
  'phase-ship': {
    accentColor: '#fde047',
    purpose:     'Deliver the product to users.',
    description: 'The Ship phase closes the lifecycle: Implementation Plan, QA & Readiness criteria, and the Prototype Prompt — a complete builder context package.',
    contains:    ['Implementation Plan', 'QA & Readiness', 'Prototype Prompt'],
    templates:   [],
  },
  'project-root': {
    accentColor: '#4ade80',
    purpose:     'The root of your product workspace.',
    description: 'Your project workspace organizes every artifact, document, and execution event in one place. Folders below structure your work across the lifecycle.',
    contains:    ['Documents', 'History', 'Align', 'Plan', 'Measure', 'Archive'],
    templates:   [],
  },
};

const DEFAULT_SPEC: FolderSpec = {
  accentColor: '#475569',
  purpose:     'Workspace folder.',
  description: 'This folder is part of your workspace.',
  contains:    [],
  templates:   [],
};

// ── Component ─────────────────────────────────────────────────────────────────

export interface FolderWorkspaceProps {
  node:        WorkspaceNode;
  onClose?:    () => void;
  docCount?:   number;
}

export default function FolderWorkspace({ node, onClose, docCount }: FolderWorkspaceProps) {
  const fileRef    = useRef<HTMLInputElement>(null);
  const titleRef   = useRef<HTMLInputElement>(null);
  const spec       = FOLDER_SPECS[node.id] ?? DEFAULT_SPEC;
  const accent     = node.phaseColor ?? spec.accentColor;
  const isReadOnly = node.id === 'archive' || node.id === 'history';
  const isPhase    = node.id.startsWith('phase-');
  const isDocuments = node.id === 'documents' || isPhase;

  // ── Editor state ──────────────────────────────────────────────────────────
  const [editMode,    setEditMode]    = useState(false);
  const [editTitle,   setEditTitle]   = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTemplate,setEditTemplate]= useState<string | undefined>(undefined);
  const [saveState,   setSaveState]   = useState<'idle' | 'saving' | 'saved'>('idle');

  // Focus title input when entering edit mode
  useEffect(() => {
    if (editMode && titleRef.current) {
      titleRef.current.focus();
    }
  }, [editMode]);

  // Reset edit mode when folder changes
  useEffect(() => {
    setEditMode(false);
    setSaveState('idle');
  }, [node.id]);

  const enterEditor = (title = '', content = '', template?: string) => {
    setEditTitle(title);
    setEditContent(content);
    setEditTemplate(template);
    setSaveState('idle');
    setEditMode(true);
  };

  const handleNewDocument = () => {
    enterEditor('', '');
  };

  const handleTemplate = (t: string) => {
    enterEditor(t, getTemplateContent(t), t);
  };

  const handleUpload = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string ?? '';
      const title = file.name.replace(/\.[^.]+$/, '');
      enterEditor(title, text);
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = () => {
    if (!editTitle.trim() && !editContent.trim()) return;
    setSaveState('saving');
    createDoc(node.id, editTitle.trim() || 'Untitled', editContent, editTemplate);
    setSaveState('saved');
    setTimeout(() => {
      setEditMode(false);
      setSaveState('idle');
    }, 600);
  };

  const handleCancel = () => {
    setEditMode(false);
    setSaveState('idle');
  };

  // ── Editor view ───────────────────────────────────────────────────────────
  if (editMode) {
    return (
      <motion.div
        key={`${node.id}-editor`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Accent line */}
        <div style={{ height: '2px', background: `linear-gradient(90deg, ${accent} 0%, transparent 60%)`, flexShrink: 0 }} />

        {/* Editor toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 52px',
          borderBottom: '1px solid #0a1a2e',
          flexShrink: 0,
          ...MONO,
        }}>
          <button
            onClick={handleCancel}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#475569', fontSize: '11px', padding: 0,
              letterSpacing: '0.04em', ...MONO,
            }}
          >
            ← {node.label}
          </button>

          {editTemplate && (
            <span style={{ fontSize: '10px', color: accent, opacity: 0.7, letterSpacing: '0.06em' }}>
              · {editTemplate}
            </span>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            style={{
              padding: '6px 16px',
              background: saveState === 'saved' ? `${accent}22` : `${accent}14`,
              border: `1px solid ${accent}${saveState === 'saved' ? '55' : '33'}`,
              borderRadius: '4px',
              fontSize: '11px', fontWeight: 600,
              color: saveState === 'saved' ? accent : accent,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              ...MONO,
            }}
          >
            {saveState === 'saving' ? '⟳ Saving…' : saveState === 'saved' ? '✓ Saved' : 'Save'}
          </button>
        </div>

        {/* Title */}
        <div style={{ padding: '32px 52px 0', flexShrink: 0 }}>
          <input
            ref={titleRef}
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Document title"
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
            style={{
              width: '100%',
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: '26px', fontWeight: 700, letterSpacing: '-0.01em',
              color: 'var(--ig-text-primary, #f1f5f9)',
              lineHeight: 1.2,
              boxSizing: 'border-box',
              ...SANS,
            }}
          />
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: '16px 52px 40px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            placeholder="Start writing in Markdown…"
            style={{
              flex: 1, width: '100%',
              background: 'transparent', border: 'none', outline: 'none',
              resize: 'none',
              fontSize: '14px', fontWeight: 400, lineHeight: 1.7,
              color: 'var(--ig-text-secondary, #94a3b8)',
              boxSizing: 'border-box',
              ...SANS,
            }}
          />
        </div>
      </motion.div>
    );
  }

  // ── Folder info view ──────────────────────────────────────────────────────
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Hidden file input for Upload */}
      <input
        ref={fileRef}
        type="file"
        accept=".md,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Accent line at top */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${accent} 0%, transparent 60%)`, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '40px 52px', ...SANS }}>
        <div style={{ maxWidth: '660px' }}>

          {/* ── Back breadcrumb ── */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#475569', fontSize: '11px', padding: '0 0 28px 0',
                letterSpacing: '0.04em',
                ...MONO,
              }}
            >
              ← Workspace
            </button>
          )}

          {/* ── Folder name ── */}
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '26px', fontWeight: 700, letterSpacing: '-0.01em',
            color: 'var(--ig-text-primary, #f1f5f9)',
            lineHeight: 1.2,
            ...SANS,
          }}>
            {node.label}
          </h1>

          {/* ── Purpose line ── */}
          <p style={{
            margin: '0 0 6px 0',
            fontSize: '15px', fontWeight: 500, lineHeight: 1.5,
            color: accent,
            ...SANS,
          }}>
            {spec.purpose}
          </p>

          {/* ── Description ── */}
          <p style={{
            margin: '0 0 36px 0',
            fontSize: '14px', fontWeight: 400, lineHeight: 1.7,
            color: 'var(--ig-text-secondary, #64748b)',
            maxWidth: '54ch',
            ...SANS,
          }}>
            {spec.description}
          </p>

          {/* ── Stat line (if doc count provided) ── */}
          {docCount !== undefined && docCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              marginBottom: '32px',
              paddingBottom: '20px',
              borderBottom: '1px solid #0a1a2e',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: accent, lineHeight: 1, ...MONO }}>
                  {docCount}
                </span>
                <span style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', ...MONO }}>
                  documents
                </span>
              </div>
            </div>
          )}

          {/* ── What belongs here ── */}
          {spec.contains.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontSize: '9px', fontWeight: 700,
                color: '#475569', letterSpacing: '0.12em',
                textTransform: 'uppercase', marginBottom: '14px',
                ...MONO,
              }}>
                What belongs here
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {spec.contains.map(item => (
                  <span key={item} style={{
                    display: 'inline-block',
                    padding: '5px 10px',
                    background: `${accent}0d`,
                    border: `1px solid ${accent}22`,
                    borderRadius: '4px',
                    fontSize: '12px', fontWeight: 400,
                    color: '#7c8fa3',
                    ...MONO,
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Note (archive, history) ── */}
          {spec.note && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid #0f2035',
              borderLeft: `3px solid ${accent}44`,
              borderRadius: '0 4px 4px 0',
              fontSize: '12px', lineHeight: 1.6,
              color: '#475569',
              marginBottom: '32px',
              ...MONO,
            }}>
              {spec.note}
            </div>
          )}

          {/* ── Templates ── */}
          {spec.templates.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontSize: '9px', fontWeight: 700,
                color: '#475569', letterSpacing: '0.12em',
                textTransform: 'uppercase', marginBottom: '14px',
                ...MONO,
              }}>
                Start from a template
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {spec.templates.map(t => (
                  <button
                    key={t}
                    onClick={() => handleTemplate(t)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '7px 13px',
                      background: 'transparent',
                      border: `1px dashed ${accent}33`,
                      borderRadius: '4px',
                      fontSize: '12px', fontWeight: 400,
                      color: '#64748b',
                      cursor: 'pointer',
                      transition: 'border-color 150ms ease, color 150ms ease',
                      ...MONO,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}66`;
                      (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}33`;
                      (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                    }}
                  >
                    <span style={{ fontSize: '10px', color: accent, opacity: 0.7 }}>+</span>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          {!isReadOnly && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={handleNewDocument}
                style={{
                  padding: '9px 18px',
                  background: `${accent}14`,
                  border: `1px solid ${accent}33`,
                  borderRadius: '5px',
                  fontSize: '12px', fontWeight: 500,
                  color: accent,
                  cursor: 'pointer',
                  transition: 'background 150ms ease, border-color 150ms ease',
                  ...MONO,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${accent}22`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}55`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${accent}14`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}33`;
                }}
              >
                + New Document
              </button>

              {!isDocuments && (
                <button
                  onClick={handleUpload}
                  style={{
                    padding: '9px 18px',
                    background: 'transparent',
                    border: '1px solid #1e293b',
                    borderRadius: '5px',
                    fontSize: '12px', fontWeight: 400,
                    color: '#64748b',
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease, color 150ms ease',
                    ...MONO,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#334155';
                    (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#1e293b';
                    (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                  }}
                >
                  ↑ Upload
                </button>
              )}
            </div>
          )}

          {/* ── Phase folders: open Studio ── */}
          {isDocuments && (
            <div style={{ marginTop: '8px' }}>
              <a
                href="/improve"
                style={{
                  display: 'inline-block',
                  padding: '9px 18px',
                  background: `${accent}14`,
                  border: `1px solid ${accent}33`,
                  borderRadius: '5px',
                  fontSize: '12px', fontWeight: 500,
                  color: accent,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  ...MONO,
                }}
              >
                Open in Studio →
              </a>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
