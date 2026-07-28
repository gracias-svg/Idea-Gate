'use client';

// src/components/workspace/WorkspacePanel.tsx
// Sprint 07 — composes W1/W2/W3(partial)/W4/W6/W7/W8 into the Studio left
// panel. Replaces the old flat "Left sidebar" block in improve/page.tsx.
//
// AttachmentsPanel (W5) is NOT composed here — it augments the existing
// Reference Docs section in the right panel in place, since that's where the
// docs/handleUpload/uploadRef state it reuses already lives (see page.tsx).
//
// Mission 6 C3: workspaceView + onWorkspaceViewChange props added so the
// MoreHorizontal view-switcher dropdown can live here alongside the tree it controls.

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, List, LayoutGrid, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { stageNum } from '@/lib/artifactDisplay';
import { Project, ProjectRepository } from '@/lib/projectRepository';
import { RuntimeEvent } from '@/lib/RuntimeContext';
import ProjectHeader from './ProjectHeader';
import ProjectSelector from './ProjectSelector';
import ArtifactTree from './ArtifactTree';
import CollaboratorSlots, { CollaboratorSlot } from './CollaboratorSlots';
import ActivityFeed from './ActivityFeed';
import { workspaceMotion } from './motion';

// C3 — typed menu item structure; enabled=false rows are rendered but
// show a "coming soon" tooltip and don't fire onSelect.
interface ViewMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  onSelect?: () => void;
}

interface WorkspacePanelProps {
  artifacts: string[];
  currentStage: number;
  selected: string | null;
  activeSectionId: string | null;
  isStale: (file: string) => boolean;
  getVersion: (file: string) => number;
  onSelectArtifact: (file: string) => void;
  onSectionClick: (file: string, anchorId: string) => void;
  reducedMotion: boolean;

  projectName: string;
  onRenameProject: (name: string) => void;
  referenceDocCount: number;

  projectRepo: ProjectRepository;
  activeProjectId: string | null;
  onProjectChange: (project: Project) => void;

  collaboratorSlots: CollaboratorSlot[];
  events: RuntimeEvent[];

  // C3 — view switcher (list | grid), owned by page.tsx, rendered here
  workspaceView: 'list' | 'grid';
  onWorkspaceViewChange: (v: 'list' | 'grid') => void;

  // Preserves the pre-existing DOWNSTREAM panel (regression-tested Studio
  // feature, out of scope for this sprint) directly below the tree — same
  // position it held in the old flat sidebar.
  treeFooter?: React.ReactNode;
}

export default function WorkspacePanel({
  artifacts, currentStage, selected, activeSectionId, isStale, getVersion,
  onSelectArtifact, onSectionClick, reducedMotion,
  projectName, onRenameProject, referenceDocCount,
  projectRepo, activeProjectId, onProjectChange,
  collaboratorSlots, events,
  workspaceView, onWorkspaceViewChange,
  treeFooter,
}: WorkspacePanelProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const writtenCount = artifacts.filter(f => stageNum(f) < currentStage).length;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const cssEaseOut = `cubic-bezier(${workspaceMotion.easing.out.join(',')})`;

  // C3 — typed menu items; Kanban/Timeline/Sort/Filter disabled (future work)
  const menuItems: ViewMenuItem[] = [
    {
      id: 'list',
      label: 'List',
      icon: <List size={12} />,
      enabled: true,
      onSelect: () => { onWorkspaceViewChange('list'); setMenuOpen(false); },
    },
    {
      id: 'grid',
      label: 'Grid',
      icon: <LayoutGrid size={12} />,
      enabled: true,
      onSelect: () => { onWorkspaceViewChange('grid'); setMenuOpen(false); },
    },
    // divider is rendered separately between grid and the disabled items
    {
      id: 'kanban',
      label: 'Kanban',
      icon: null,
      enabled: false,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: null,
      enabled: false,
    },
    {
      id: 'sort',
      label: 'Sort',
      icon: null,
      enabled: false,
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: null,
      enabled: false,
    },
  ];

  const activeItems = menuItems.slice(0, 2);   // List, Grid
  const disabledItems = menuItems.slice(2);     // Kanban, Timeline, Sort, Filter

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ProjectHeader
        projectName={projectName}
        onRenameProject={onRenameProject}
        onOpenSelector={() => setSelectorOpen(o => !o)}
        isSelectorOpen={selectorOpen}
        artifactCount={artifacts.length}
        referenceDocCount={referenceDocCount}
        collaboratorSlotCount={collaboratorSlots.length}
        currentStage={currentStage}
        writtenCount={writtenCount}
        reducedMotion={reducedMotion}
      />
      <ProjectSelector
        repo={projectRepo}
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onProjectChange={onProjectChange}
        activeProjectId={activeProjectId}
        reducedMotion={reducedMotion}
      />

      {/* C3 — "ARTIFACTS" label row + MoreHorizontal view-switcher */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 14px 2px',
        borderBottom: '1px solid #0a1a2e',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          color: '#2a5a30',
        }}>
          ARTIFACTS
        </span>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Change artifact view"
            aria-expanded={menuOpen}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '3px 4px', borderRadius: '4px',
              color: menuOpen ? '#4ade80' : '#475569',
              display: 'flex', alignItems: 'center',
              transition: reducedMotion ? 'none' : `color ${workspaceMotion.hoverMs}ms ${cssEaseOut}, background-color ${workspaceMotion.hoverMs}ms ${cssEaseOut}`,
            }}
            onMouseEnter={e => { if (!menuOpen) { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; } }}
            onMouseLeave={e => { if (!menuOpen) { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; } }}
          >
            <MoreHorizontal size={14} />
          </button>

          {/* C3 — dropdown: AnimatePresence 120ms scale+opacity */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: reducedMotion ? 0 : workspaceMotion.expandCollapseMs / 1000, ease: workspaceMotion.easing.out }}
                style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                  backgroundColor: '#040b14',
                  border: '1px solid #1a3a20',
                  borderRadius: '6px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  minWidth: '140px',
                  zIndex: 50,
                  overflow: 'hidden',
                  transformOrigin: 'top right',
                }}
              >
                {/* Active items: List, Grid */}
                {activeItems.map(item => {
                  const isActive = workspaceView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={item.onSelect}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        width: '100%', textAlign: 'left' as const,
                        padding: '8px 12px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: '11px',
                        color: isActive ? '#4ade80' : '#94a3b8',
                        backgroundColor: isActive ? '#0a1509' : 'transparent',
                        transition: reducedMotion ? 'none' : `background-color ${workspaceMotion.hoverMs}ms ${cssEaseOut}`,
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                    >
                      {item.icon}
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && <Check size={10} color="#4ade80" />}
                    </button>
                  );
                })}

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: '#1a3a2033', margin: '2px 0' }} />

                {/* Disabled items: Kanban, Timeline, Sort, Filter */}
                {disabledItems.map(item => (
                  <div
                    key={item.id}
                    title="Coming soon"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 12px',
                      fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: '11px',
                      color: '#1e293b',
                      cursor: 'not-allowed',
                    }}
                  >
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: '9px', color: '#1e293b', letterSpacing: '0.04em' }}>soon</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <ArtifactTree
          artifacts={artifacts}
          currentStage={currentStage}
          selected={selected}
          activeSectionId={activeSectionId}
          isStale={isStale}
          getVersion={getVersion}
          onSelectArtifact={onSelectArtifact}
          onSectionClick={onSectionClick}
          reducedMotion={reducedMotion}
          workspaceView={workspaceView}
        />
        {treeFooter}
      </div>

      <div style={{ borderTop: '1px solid #0a1a2e', padding: '10px 0', flexShrink: 0 }}>
        <CollaboratorSlots slots={collaboratorSlots} reducedMotion={reducedMotion} />
      </div>

      <div style={{ borderTop: '1px solid #0a1a2e', maxHeight: '160px', overflowY: 'auto', padding: '10px 0', flexShrink: 0 }}>
        <ActivityFeed events={events} reducedMotion={reducedMotion} />
      </div>
    </div>
  );
}
