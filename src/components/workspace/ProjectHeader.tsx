'use client';

// src/components/workspace/ProjectHeader.tsx
// Sprint 07 (W4) — Workspace panel header.
//
// Real counts only: artifactCount/referenceDocCount/collaboratorSlotCount are
// passed in from the page's actual state, never invented. Stage progress reads
// stageDisplayNumber()/STAGE_COUNT from orchestration.ts (the one shared
// source), and the completion line is a plain written/total count — explicitly
// NOT a scored/colour-coded "health score" (banned by the mission brief).

import React, { useState, useRef, useEffect } from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import { stageDisplayNumber, STAGE_COUNT } from '@/lib/execution/adapters/orchestration';
import { workspaceMotion } from './motion';

interface ProjectHeaderProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  onOpenSelector: () => void;
  isSelectorOpen: boolean;
  artifactCount: number;
  referenceDocCount: number;
  collaboratorSlotCount: number;
  currentStage: number;
  writtenCount: number;
  reducedMotion: boolean;
}

export default function ProjectHeader({
  projectName, onRenameProject, onOpenSelector, isSelectorOpen,
  artifactCount, referenceDocCount, collaboratorSlotCount,
  currentStage, writtenCount, reducedMotion,
}: ProjectHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editing) setDraft(projectName); }, [projectName, editing]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== projectName) onRenameProject(trimmed);
    else setDraft(projectName);
  };

  const initial = (projectName.trim()[0] ?? '?').toUpperCase();
  const hoverT = reducedMotion ? 'none' : `background-color ${workspaceMotion.hoverMs}ms ease-out`;

  return (
    <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid #0a1a2e' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        {/* I1: root-level project identity — Folder/FolderOpen (state reflects
            the selector dropdown) containing the project's own initial. No
            fabricated imagery. */}
        <button
          onClick={onOpenSelector}
          title="Switch project"
          style={{
            width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#0a1509', border: '1px solid #1a3a20', cursor: 'pointer',
            transition: hoverT, position: 'relative',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0d1a10')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0a1509')}
        >
          {isSelectorOpen
            ? <FolderOpen size={17} color="#4ade80" strokeWidth={1.75} />
            : <Folder size={17} color="#4ade80" strokeWidth={1.75} />}
          <span style={{
            position: 'absolute', bottom: '4px', right: '3px',
            fontSize: '11px', fontWeight: 700, color: '#4ade80', lineHeight: 1,
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            textShadow: '0 0 2px #0a1509, 0 0 2px #0a1509',
          }}>
            {initial}
          </span>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(projectName); setEditing(false); } }}
              style={{
                width: '100%', background: '#040b14', border: '1px solid #1a3a20', borderRadius: '3px',
                color: '#e2e8f0', fontFamily: "'Geist Sans', sans-serif", fontSize: '13px', fontWeight: 600,
                padding: '2px 5px', outline: 'none', boxSizing: 'border-box' as const,
              }}
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              title="Rename project"
              style={{
                display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'text', color: '#e2e8f0', fontFamily: "'Geist Sans', sans-serif", fontSize: '13px',
                fontWeight: 600, padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {projectName}
            </button>
          )}
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
            Stage {stageDisplayNumber(currentStage)} / {STAGE_COUNT}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '10px', fontSize: '11px', color: '#334155', fontFamily: "'JetBrains Mono','Fira Code',monospace", lineHeight: 1.6 }}>
        {artifactCount} artifact{artifactCount === 1 ? '' : 's'} · {referenceDocCount} reference{referenceDocCount === 1 ? '' : 's'} · {collaboratorSlotCount} collaborator{collaboratorSlotCount === 1 ? '' : 's'}
      </div>
      <div style={{ marginTop: '2px', fontSize: '11px', color: '#334155', fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
        {writtenCount} / {STAGE_COUNT} stages written
      </div>
    </div>
  );
}
