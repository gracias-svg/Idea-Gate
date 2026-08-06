'use client';

// src/components/shared/FolderWorkspace.tsx
// Mission 28 — Folder workspace as document library.
//
// Every optional folder (Align, Plan, Measure, Archive) is now a full
// document library workspace, not just an information page.
//
// Layout:
//   1. Folder header (purpose, description, chips, note)
//   2. Document grid (existing docs as cards → click opens TipTap editor)
//   3. Attachment grid (uploaded files → click to preview/download)
//   4. Template gallery (dashed buttons — click creates doc from template)
//   5. Action row (+ New Document, ↑ Upload)
//
// Editors: NO inline editor. Clicking any document/template always opens the
// existing TipTap editor in Studio (/improve). FolderWorkspace is a library,
// not an editor.
//
// Routing:
//   - If `onOpenWorkspaceDoc` prop is provided (Studio), call it directly.
//   - Otherwise (Desk), store doc id in sessionStorage and navigate to /improve.
//     /improve reads the sessionStorage key on mount and opens the doc.

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FileText, Paperclip, Image as ImageIcon, FileType } from 'lucide-react';
import type { WorkspaceNode } from './WorkspaceExplorer';
import {
  createDoc, createAttachment, deleteDoc,
  useWorkspaceDocs, WorkspaceDocument,
} from '@/lib/workspaceDocuments';
import { getTemplateContent } from '@/lib/templates';

// ── Typography ─────────────────────────────────────────────────────────────────
const SANS: React.CSSProperties = { fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)' };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

// ── Folder specs ──────────────────────────────────────────────────────────────

interface FolderSpec {
  purpose:     string;
  description: string;
  contains:    string[];
  templates:   string[];
  note?:       string;
  accentColor: string;
}

const FOLDER_SPECS: Record<string, FolderSpec> = {
  align: {
    accentColor: '#818cf8',
    purpose:     'Shared understanding across all stakeholders.',
    description: 'Align is where product strategy becomes visible. Document the north star, socialize OKRs, map stakeholders, and keep decision logs that survive team changes.',
    contains:    ['Product Vision', 'North Star Metric', 'OKRs', 'Decision Log', 'Stakeholder Map', 'RACI', 'Strategy Brief'],
    templates:   ['Product Vision', 'OKR Framework', 'Stakeholder Map', 'Decision Log', 'Strategy Brief'],
  },
  plan: {
    accentColor: '#38bdf8',
    purpose:     'When and how the product gets built.',
    description: 'Plan is your execution layer. Roadmaps, milestones, sprint plans, and risk registers live here.',
    contains:    ['Roadmap', 'Release Plan', 'Milestones', 'Risk Register', 'RAID Log', 'Sprint Plan', 'Launch Checklist'],
    templates:   ['Roadmap', 'Release Plan', 'Sprint Plan', 'RAID Log', 'Launch Checklist'],
  },
  measure: {
    accentColor: '#4ade80',
    purpose:     'Outcomes, experiments, and user signals.',
    description: 'Measure is how you know if you shipped the right thing. Post-launch reviews, experiment briefs, funnel analyses belong here.',
    contains:    ['North Star Metrics', 'Funnel Analysis', 'Experiment Brief', 'A/B Test Results', 'NPS Report', 'Post-Launch Review'],
    templates:   ['Experiment Brief', 'Metrics Summary', 'Funnel Analysis', 'Post-Launch Review'],
  },
  archive: {
    accentColor: '#64748b',
    purpose:     'Completed work preserved for future reference.',
    description: 'Archive captures institutional memory. Previous PRDs, completed launches, historical roadmaps, and retrospectives.',
    contains:    ['Final PRDs', 'Superseded Docs', 'Historical Roadmaps', 'Retrospectives', 'Past Releases'],
    templates:   [],
    note:        'Archive is read-only. Documents here are preserved for reference.',
  },
  documents: {
    accentColor: '#4ade80',
    purpose:     'All structured artifacts from the 15-stage lifecycle.',
    description: 'Documents contains every artifact the AI product team has generated — from idea intake through the prototype prompt.',
    contains:    ['Discover', 'Decide', 'Specify', 'Architect', 'Ship'],
    templates:   [],
  },
  history: {
    accentColor: '#818cf8',
    purpose:     'Execution history and improvement sessions.',
    description: 'History captures every agent run, stage completion, and improvement cycle. Generated automatically.',
    contains:    ['Stage completions', 'Improvement sessions', 'Agent runs', 'Confidence snapshots'],
    templates:   [],
    note:        'History is generated automatically from your workspace activity.',
  },
  'phase-discover': {
    accentColor: '#4ade80',
    purpose:     'Validate the problem before committing to a solution.',
    description: 'Three artifacts: Idea Intake, Discovery, and Problem Definition.',
    contains:    ['Idea Intake', 'Market Research', 'Problem Definition'],
    templates:   [],
  },
  'phase-decide': {
    accentColor: '#38bdf8',
    purpose:     'Align on what to build and why now.',
    description: 'Four artifacts: Solution Design, MVP Hypothesis, Validation Strategy, Prioritization.',
    contains:    ['Solution Design', 'MVP Hypothesis', 'Validation Strategy', 'Prioritization'],
    templates:   [],
  },
  'phase-specify': {
    accentColor: '#818cf8',
    purpose:     'Define the product in detail.',
    description: 'Three artifacts: PRD, UX Design, and Usability criteria.',
    contains:    ['Product Requirements (PRD)', 'UX Design', 'Usability Criteria'],
    templates:   [],
  },
  'phase-architect': {
    accentColor: '#fb923c',
    purpose:     'Design the technical foundation.',
    description: 'Two artifacts: System Architecture and Backlog & Release Plan.',
    contains:    ['Architecture Document', 'Backlog & Release Plan'],
    templates:   [],
  },
  'phase-ship': {
    accentColor: '#fde047',
    purpose:     'Deliver the product to users.',
    description: 'Three artifacts: Implementation Plan, QA & Readiness, and Prototype Prompt.',
    contains:    ['Implementation Plan', 'QA & Readiness', 'Prototype Prompt'],
    templates:   [],
  },
  'project-root': {
    accentColor: '#4ade80',
    purpose:     'The root of your product workspace.',
    description: 'Your workspace organizes every artifact, document, and execution event in one place.',
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function attachmentIcon(fileType: string | undefined): React.ReactNode {
  if (!fileType) return <Paperclip size={13} color="#64748b" />;
  if (fileType.startsWith('image/')) return <ImageIcon size={13} color="#38bdf8" />;
  if (fileType === 'application/pdf') return <FileType size={13} color="#f87171" />;
  return <Paperclip size={13} color="#64748b" />;
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export interface FolderWorkspaceProps {
  node:                 WorkspaceNode;
  onClose?:             () => void;
  /** Studio provides this to open wsDoc editor without page navigation. */
  onOpenWorkspaceDoc?:  (docId: string) => void;
}

export default function FolderWorkspace({ node, onClose, onOpenWorkspaceDoc }: FolderWorkspaceProps) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const spec    = FOLDER_SPECS[node.id] ?? DEFAULT_SPEC;
  const accent  = node.phaseColor ?? spec.accentColor;
  const isReadOnly  = node.id === 'archive' || node.id === 'history';
  const isPhase     = node.id.startsWith('phase-');
  const isDocuments = node.id === 'documents' || isPhase;

  // All workspace items for this folder, sorted newest first
  const allDocs = useWorkspaceDocs();
  const workspaceItems = allDocs
    .filter(d => d.folderId === node.id)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // ── Open a document for editing ────────────────────────────────────────────
  const openDoc = (docId: string) => {
    if (onOpenWorkspaceDoc) {
      onOpenWorkspaceDoc(docId);
    } else {
      // Desk context: store pending id and navigate to Studio
      sessionStorage.setItem('ig-open-wsdoc', docId);
      router.push('/improve');
    }
  };

  // ── New Document ───────────────────────────────────────────────────────────
  const handleNewDocument = () => {
    const doc = createDoc(node.id, 'Untitled', '');
    openDoc(doc.id);
  };

  // ── Template ───────────────────────────────────────────────────────────────
  const handleTemplate = (t: string) => {
    const doc = createDoc(node.id, t, getTemplateContent(t), t);
    openDoc(doc.id);
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = () => fileRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    for (const file of files) {
      const reader = new FileReader();
      const isText = /^text\/|\.md$|\.txt$/i.test(file.type + file.name);
      if (isText) {
        reader.onload = ev => {
          const content = ev.target?.result as string ?? '';
          createDoc(node.id, file.name.replace(/\.[^.]+$/, ''), content);
        };
        reader.readAsText(file);
      } else {
        // Binary: store as dataUrl if small enough (<1 MB)
        if (file.size < 1_048_576) {
          reader.onload = ev => {
            createAttachment(node.id, file.name, file.type, file.size, ev.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          createAttachment(node.id, file.name, file.type, file.size);
        }
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Open attachment for preview ────────────────────────────────────────────
  const handleOpenAttachment = (att: WorkspaceDocument) => {
    if (att.dataUrl) {
      const w = window.open('', '_blank');
      if (!w) return;
      if (att.fileType?.startsWith('image/')) {
        w.document.write(`<html><body style="margin:0;background:#000"><img src="${att.dataUrl}" style="max-width:100%;max-height:100vh;display:block;margin:auto"/></body></html>`);
      } else {
        w.location.href = att.dataUrl;
      }
    }
  };

  // ── Shared button style ───────────────────────────────────────────────────
  const actionBtn = (color: string): React.CSSProperties => ({
    padding: '8px 16px',
    background: `${color}14`,
    border: `1px solid ${color}33`,
    borderRadius: '5px',
    fontSize: '12px', fontWeight: 500,
    color: color,
    cursor: 'pointer',
    ...MONO,
  });

  const ghostBtn: React.CSSProperties = {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #1e293b',
    borderRadius: '5px',
    fontSize: '12px', fontWeight: 400,
    color: '#64748b',
    cursor: 'pointer',
    ...MONO,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
    >
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".md,.txt,.pdf,.png,.jpg,.jpeg,.gif,.svg"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Accent line */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${accent} 0%, transparent 60%)`, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '40px 52px', ...SANS }}>
        <div style={{ maxWidth: '760px' }}>

          {/* Back breadcrumb */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#475569', fontSize: '11px', padding: '0 0 28px 0',
                letterSpacing: '0.04em', ...MONO,
              }}
            >
              ← Workspace
            </button>
          )}

          {/* Folder title */}
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '26px', fontWeight: 700, letterSpacing: '-0.01em',
            color: 'var(--ig-text-primary, #f1f5f9)', lineHeight: 1.2, ...SANS,
          }}>
            {node.label}
          </h1>

          {/* Purpose line */}
          <p style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 500, color: accent, ...SANS }}>
            {spec.purpose}
          </p>

          {/* Description */}
          <p style={{
            margin: '0 0 32px 0', fontSize: '14px', fontWeight: 400, lineHeight: 1.7,
            color: '#64748b', maxWidth: '56ch', ...SANS,
          }}>
            {spec.description}
          </p>

          {/* ── Note (archive, history) ── */}
          {spec.note && (
            <div style={{
              padding: '10px 14px', marginBottom: '24px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid #0f2035',
              borderLeft: `3px solid ${accent}44`,
              borderRadius: '0 4px 4px 0',
              fontSize: '12px', lineHeight: 1.6, color: '#475569', ...MONO,
            }}>
              {spec.note}
            </div>
          )}

          {/* ── Unified workspace items grid ── */}
          {workspaceItems.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <div style={{
                fontSize: '9px', fontWeight: 700, color: '#475569',
                letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', ...MONO,
              }}>
                Workspace Items · {workspaceItems.length}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {workspaceItems.map(item => (
                  item.kind === 'document'
                    ? <DocCard key={item.id} doc={item} accent={accent} onOpen={() => openDoc(item.id)} onDelete={() => deleteDoc(item.id)} />
                    : <AttachmentCard key={item.id} att={item} onOpen={() => handleOpenAttachment(item)} onDelete={() => deleteDoc(item.id)} />
                ))}
              </div>
            </section>
          )}

          {/* ── Empty state ── */}
          {workspaceItems.length === 0 && !isReadOnly && !isDocuments && (
            <div style={{
              padding: '32px 0', marginBottom: '24px',
              borderTop: '1px solid #0a1a2e',
              borderBottom: '1px solid #0a1a2e',
            }}>
              <div style={{ fontSize: '13px', color: '#334155', ...SANS, marginBottom: '8px' }}>
                This folder is empty.
              </div>
              <div style={{ fontSize: '12px', color: '#1e293b', ...SANS }}>
                Create a document or upload a file to get started.
              </div>
            </div>
          )}

          {/* ── What belongs here ── */}
          {spec.contains.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                fontSize: '9px', fontWeight: 700, color: '#475569',
                letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', ...MONO,
              }}>
                What belongs here
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {spec.contains.map(item => (
                  <span key={item} style={{
                    padding: '4px 9px', background: `${accent}0d`,
                    border: `1px solid ${accent}22`, borderRadius: '4px',
                    fontSize: '12px', color: '#7c8fa3', ...MONO,
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Templates ── */}
          {spec.templates.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                fontSize: '9px', fontWeight: 700, color: '#475569',
                letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', ...MONO,
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
                      padding: '7px 13px', background: 'transparent',
                      border: `1px dashed ${accent}33`, borderRadius: '4px',
                      fontSize: '12px', color: '#64748b', cursor: 'pointer', ...MONO,
                    }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = `${accent}66`; el.style.color = '#94a3b8'; }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = `${accent}33`; el.style.color = '#64748b'; }}
                  >
                    <span style={{ fontSize: '10px', color: accent, opacity: 0.7 }}>+</span>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Action row ── */}
          {!isReadOnly && (
            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              {!isDocuments && (
                <button onClick={handleNewDocument} style={actionBtn(accent)}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = `${accent}22`; el.style.borderColor = `${accent}55`; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = `${accent}14`; el.style.borderColor = `${accent}33`; }}>
                  + New Document
                </button>
              )}
              {!isDocuments && (
                <button onClick={handleUpload} style={ghostBtn}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#334155'; el.style.color = '#94a3b8'; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = '#1e293b'; el.style.color = '#64748b'; }}>
                  ↑ Upload
                </button>
              )}
              {isDocuments && (
                <a href="/improve" style={actionBtn(accent)}>
                  Open in Studio →
                </a>
              )}
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}

// ── DocCard ────────────────────────────────────────────────────────────────────

function DocCard({ doc, accent, onOpen, onDelete }: { doc: WorkspaceDocument; accent: string; onOpen: () => void; onDelete: () => void }) {
  const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
      style={{
        padding: '14px', borderRadius: '6px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: '8px',
        transition: 'border-color 150ms ease, background 150ms ease',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${accent}33`; el.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.background = 'rgba(255,255,255,0.025)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', background: `${accent}18`, flexShrink: 0 }}>
            <FileText size={11} color={accent} />
          </span>
          {doc.template && (
            <span style={{ fontSize: '9px', color: accent, opacity: 0.6, letterSpacing: '0.06em', textTransform: 'uppercase', ...MONO }}>
              {doc.template.slice(0, 12)}
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          aria-label="Delete document"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', fontSize: '14px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#334155'; }}
        >
          ×
        </button>
      </div>
      <div style={{ fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)', fontSize: '13px', fontWeight: 500, color: 'var(--ig-text-primary, #e2e8f0)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {doc.title || 'Untitled'}
      </div>
      <div style={{ fontSize: '10px', color: '#334155', ...MONO }}>
        {relativeDate(doc.updatedAt)}
      </div>
    </div>
  );
}

// ── AttachmentCard ─────────────────────────────────────────────────────────────

function AttachmentCard({ att, onOpen, onDelete }: { att: WorkspaceDocument; onOpen: () => void; onDelete: () => void }) {
  const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
  const canPreview = !!att.dataUrl;
  return (
    <div
      onClick={canPreview ? onOpen : undefined}
      role={canPreview ? 'button' : undefined}
      tabIndex={canPreview ? 0 : undefined}
      onKeyDown={canPreview ? (e => { if (e.key === 'Enter') onOpen(); }) : undefined}
      style={{
        padding: '14px', borderRadius: '6px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        cursor: canPreview ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: '8px',
        transition: 'border-color 150ms ease',
      }}
      onMouseEnter={canPreview ? (e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }) : undefined}
      onMouseLeave={canPreview ? (e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; }) : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {attachmentIcon(att.fileType)}
          <span style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', ...MONO }}>
            {att.fileType?.split('/').pop()?.toUpperCase() ?? 'FILE'}
          </span>
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          aria-label="Remove attachment"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#334155'; }}
        >
          ×
        </button>
      </div>
      <div style={{ fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)', fontSize: '12px', fontWeight: 500, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {att.fileName ?? att.title}
      </div>
      <div style={{ fontSize: '10px', color: '#334155', display: 'flex', gap: '6px', ...MONO }}>
        <span>{formatBytes(att.fileSize)}</span>
        {canPreview && <span style={{ color: '#1e293b' }}>· click to preview</span>}
        {!canPreview && <span style={{ color: '#1e293b' }}>· too large to preview</span>}
      </div>
    </div>
  );
}
