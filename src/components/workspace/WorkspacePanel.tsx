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

import React, { useState } from 'react';
import { MoreHorizontal, List, LayoutGrid, Check } from 'lucide-react';
import { stageNum } from '@/lib/artifactDisplay';
import { Project, ProjectRepository } from '@/lib/projectRepository';
import { RuntimeEvent } from '@/lib/RuntimeContext';
import ProjectHeader from './ProjectHeader';
import ProjectSelector from './ProjectSelector';
import ArtifactTree from './ArtifactTree';
import CollaboratorSlots, { CollaboratorSlot } from './CollaboratorSlots';
import ActivityFeed from './ActivityFeed';
import { workspaceMotion } from './motion';
// B3 — shadcn DropdownMenu replaces hand-rolled view-switcher dropdown.
// Provides keyboard navigation, focus trapping, and accessible defaults
// for free (Constitution §23 — integrate proven primitives, don't invent).
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  const writtenCount = artifacts.filter(f => stageNum(f) < currentStage).length;

  const cssEaseOut = `cubic-bezier(${workspaceMotion.easing.out.join(',')})`;

  // B3 — Disabled future view items (no state needed — static data for render)
  const disabledItems = ['Kanban', 'Timeline', 'Sort', 'Filter'];

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

      {/* B3 — "ARTIFACTS" label row + shadcn DropdownMenu view-switcher.
          DropdownMenu replaces the hand-rolled AnimatePresence dropdown:
          free keyboard navigation (Arrow Up/Down, Enter, Escape), focus
          trapping, and accessible ARIA roles — per Constitution §23 step 2
          ("Does shadcn/ui have a primitive?" → yes → adapt to IG tokens). */}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Change artifact view"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '3px 4px', borderRadius: '4px',
                color: '#475569',
                display: 'flex', alignItems: 'center',
                transition: reducedMotion ? 'none' : `color ${workspaceMotion.hoverMs}ms ${cssEaseOut}, background-color ${workspaceMotion.hoverMs}ms ${cssEaseOut}`,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            >
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={4}
            // Override shadcn defaults with IdeaGate --ig-* tokens
            style={{
              backgroundColor: '#040b14',
              border: '1px solid #1a3a20',
              borderRadius: '6px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              minWidth: '140px',
              padding: '4px 0',
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
            }}
          >
            {/* List view */}
            <DropdownMenuItem
              onSelect={() => onWorkspaceViewChange('list')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', cursor: 'pointer',
                fontSize: '11px', borderRadius: 0,
                color: workspaceView === 'list' ? '#4ade80' : '#94a3b8',
                backgroundColor: workspaceView === 'list' ? '#0a1509' : 'transparent',
                outline: 'none',
              }}
            >
              <List size={12} />
              <span style={{ flex: 1 }}>List</span>
              {workspaceView === 'list' && <Check size={10} color="#4ade80" />}
            </DropdownMenuItem>

            {/* Grid view */}
            <DropdownMenuItem
              onSelect={() => onWorkspaceViewChange('grid')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', cursor: 'pointer',
                fontSize: '11px', borderRadius: 0,
                color: workspaceView === 'grid' ? '#4ade80' : '#94a3b8',
                backgroundColor: workspaceView === 'grid' ? '#0a1509' : 'transparent',
                outline: 'none',
              }}
            >
              <LayoutGrid size={12} />
              <span style={{ flex: 1 }}>Grid</span>
              {workspaceView === 'grid' && <Check size={10} color="#4ade80" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator style={{ backgroundColor: '#1a3a2033', margin: '2px 0' }} />

            {/* Disabled future items: Kanban, Timeline, Sort, Filter */}
            {disabledItems.map(label => (
              <DropdownMenuItem
                key={label}
                disabled
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 12px', fontSize: '11px', borderRadius: 0,
                  color: '#1e293b', cursor: 'not-allowed',
                }}
              >
                <span style={{ flex: 1 }}>{label}</span>
                <span style={{ fontSize: '9px', color: '#1e293b', letterSpacing: '0.04em' }}>soon</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
