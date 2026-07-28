'use client';

// src/components/workspace/ProjectSelector.tsx
// Sprint 07 (W8 UI) — thin dropdown over ProjectRepository.
//
// This UI never touches localStorage directly and never assumes a data shape
// beyond the `ProjectRepository` interface (src/lib/projectRepository.ts).
// "+ New Project" creates/switches a LOCAL NAME SLOT only — it is distinct
// from TopBar's "New Idea" (runtime.resetWorkspace()), which resets the
// actual lifecycle run on disk. This component never calls that.

import React, { useState } from 'react';
import { Project, ProjectRepository } from '@/lib/projectRepository';
import { workspaceMotion } from './motion';

interface ProjectSelectorProps {
  repo: ProjectRepository;
  isOpen: boolean;
  onClose: () => void;
  onProjectChange: (project: Project) => void;
  activeProjectId: string | null;
  reducedMotion: boolean;
}

export default function ProjectSelector({
  repo, isOpen, onClose, onProjectChange, activeProjectId, reducedMotion,
}: ProjectSelectorProps) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');

  if (!isOpen) return null;

  const projects = repo.list();
  const hoverT = reducedMotion ? 'none' : `background-color ${workspaceMotion.hoverMs}ms ease-out`;

  const handleSwitch = (id: string) => {
    const p = repo.switch(id);
    if (p) onProjectChange(p);
    onClose();
  };

  const handleCreate = () => {
    const name = draft.trim();
    if (!name) { setCreating(false); return; }
    const p = repo.create(name);
    onProjectChange(p);
    setDraft('');
    setCreating(false);
    onClose();
  };

  return (
    <>
      {/* Click-outside scrim */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      <div style={{
        position: 'absolute', top: '52px', left: '14px', width: '220px', zIndex: 41,
        backgroundColor: '#040b14', border: '1px solid #1a3a20', borderRadius: '5px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden',
      }}>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {projects.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: '11px', color: '#1e293b' }}>No projects yet.</div>
          )}
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => handleSwitch(p.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                padding: '8px 12px', backgroundColor: p.id === activeProjectId ? '#0a1509' : 'transparent',
                color: p.id === activeProjectId ? '#4ade80' : '#94a3b8',
                fontFamily: "'Geist Sans', sans-serif", fontSize: '12px', fontWeight: p.id === activeProjectId ? 600 : 400,
                transition: hoverT,
              }}
              onMouseEnter={e => { if (p.id !== activeProjectId) e.currentTarget.style.backgroundColor = '#050d07'; }}
              onMouseLeave={e => { if (p.id !== activeProjectId) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #0a1a2e' }}>
          {creating ? (
            <div style={{ padding: '8px 12px', display: 'flex', gap: '6px' }}>
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                placeholder="Project name"
                style={{ flex: 1, minWidth: 0, background: '#020c06', border: '1px solid #1a3a20', borderRadius: '3px', color: '#e2e8f0', fontSize: '11px', padding: '4px 6px', outline: 'none' }}
              />
              <button onClick={handleCreate} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '11px' }}>Add</button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#334155', fontSize: '11px' }}
            >
              + New Project
            </button>
          )}
        </div>
      </div>
    </>
  );
}
