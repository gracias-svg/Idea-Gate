'use client';

// src/components/shared/WorkspaceExplorer.tsx
// Mission 16 — Shared workspace tree explorer used by both Desk and Studio.
//
// Core interaction: ONE shared highlight element (not per-row backgrounds).
// A single motion.div springs to the position of the hovered or active row.
// This is what separates premium from a plain expand/collapse list.
//
// Folder expand/collapse: spring (stiffness 300, damping 30), height + opacity.
// Chevron rotates 90deg on open. Folder/FolderOpen icon swaps.
// Disabled nodes: not interactive, "soon" badge, greyed.
//
// Inline styles only. No Tailwind. No var(--ig-*) tokens.

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, FolderOpen, FileText, ChevronRight,
  Zap, Clock, BookOpen, Package, Database, Archive, Upload,
} from 'lucide-react';
import type { HealthState } from '@/components/desk/ArtifactReader';

// ── Types ─────────────────────────────────────────────────────────────────────
export type { HealthState };
export type WorkspaceNodeKind = 'folder' | 'file' | 'disabled';

export interface WorkspaceNode {
  id:         string;
  kind:       WorkspaceNodeKind;
  label:      string;
  // File nodes
  file?:      string;
  stageIndex?: number;
  healthState?: HealthState;
  version?:   number;
  // Folder nodes
  children?:  WorkspaceNode[];
  phaseColor?: string;        // accent color for phase folders
  count?:     number;         // shown next to label
  // Disabled folders
  comingSoon?: boolean;
  // Icon override (folder-level)
  icon?: 'project' | 'journey' | 'decisions' | 'history' | 'knowledge' | 'assets' | 'snapshots' | 'exports';
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

const HEALTH_DOT: Record<HealthState, string> = {
  trustworthy: '#4ade80',
  questionable: '#f59e0b',
  stale:        '#ef4444',
  generating:   '#818cf8',
  queued:       '#1e293b',
};

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 };
const SPRING_CONTENT = { type: 'spring' as const, stiffness: 260, damping: 28 };
const ROW_HEIGHT = 30; // px — used as default for initial highlight height

// ── NodeIcon ──────────────────────────────────────────────────────────────────
function NodeIcon({ node, isOpen }: { node: WorkspaceNode; isOpen: boolean }) {
  const sz  = 13;
  const col = node.phaseColor ?? '#475569';
  const dim = node.kind === 'disabled' ? '#1e293b' : col;

  switch (node.icon) {
    case 'project':   return <Package  size={sz} color="#4ade80" />;
    case 'journey':   return <Zap     size={sz} color="#818cf8" />;
    case 'decisions': return <BookOpen size={sz} color="#64748b" />;
    case 'history':   return <Clock   size={sz} color="#64748b" />;
    case 'knowledge': return <Database size={sz} color="#1e293b" />;
    case 'assets':    return <Package  size={sz} color="#1e293b" />;
    case 'snapshots': return <Archive  size={sz} color="#1e293b" />;
    case 'exports':   return <Upload   size={sz} color="#1e293b" />;
    default:
      if (node.kind === 'file') return <FileText size={sz} color="#334155" />;
      return isOpen
        ? <FolderOpen size={sz} color={dim} />
        : <Folder     size={sz} color={dim} />;
  }
}

// ── ExplorerRow ───────────────────────────────────────────────────────────────
interface RowProps {
  node:     WorkspaceNode;
  depth:    number;
  isActive: boolean;
  isOpen:   boolean;
  onHoverEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
  onClick:  () => void;
  // Fix 2 (Mission 17) — inline rename support (additive, optional)
  onDoubleClick?:  () => void;
  isRenaming?:     boolean;
  renameValue?:    string;
  onRenameChange?: (v: string) => void;
  onRenameCommit?: () => void;
  onRenameCancel?: () => void;
}

function ExplorerRow({ node, depth, isActive, isOpen, onHoverEnter, onClick, onDoubleClick, isRenaming, renameValue, onRenameChange, onRenameCommit, onRenameCancel }: RowProps) {
  const isDisabled    = node.kind === 'disabled';
  const hasChildren   = node.kind === 'folder' && (node.children?.length ?? 0) > 0;
  const isExpandable  = hasChildren || node.comingSoon;

  return (
    <div
      onMouseEnter={isDisabled ? undefined : onHoverEnter}
      onClick={isDisabled ? undefined : onClick}
      onDoubleClick={isDisabled ? undefined : onDoubleClick}
      role={isDisabled ? undefined : 'button'}
      tabIndex={isDisabled ? undefined : 0}
      onKeyDown={isDisabled ? undefined : (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      aria-expanded={isExpandable ? isOpen : undefined}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '5px',
        height:      `${ROW_HEIGHT}px`,
        paddingLeft: `${10 + depth * 14}px`,
        paddingRight: '10px',
        cursor:      isDisabled ? 'default' : 'pointer',
        position:    'relative',
        zIndex:      1,           // above the highlight div (z-index 0)
        userSelect:  'none',
        flexShrink:  0,
      }}
    >
      {/* Chevron — only rendered for expandable folders */}
      <motion.span
        animate={{ rotate: isExpandable && isOpen ? 90 : 0 }}
        transition={SPRING}
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          '12px',
          height:         '12px',
          flexShrink:     0,
          color:          isDisabled ? '#1e293b' : '#334155',
        }}
      >
        {isExpandable ? <ChevronRight size={10} /> : null}
      </motion.span>

      {/* Icon */}
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <NodeIcon node={node} isOpen={isOpen} />
      </span>

      {/* Label — or inline rename input when isRenaming */}
      {isRenaming ? (
        <input
          value={renameValue ?? ''}
          autoFocus
          onChange={e => onRenameChange?.(e.target.value)}
          onBlur={onRenameCommit}
          onKeyDown={e => {
            if (e.key === 'Enter')  { e.preventDefault(); onRenameCommit?.(); }
            if (e.key === 'Escape') { e.preventDefault(); onRenameCancel?.(); }
            e.stopPropagation();
          }}
          onClick={e => e.stopPropagation()}
          style={{
            flex:        1, minWidth: 0,
            fontSize:    '13px', fontWeight: 500,
            color:       '#e2e8f0',
            background:  'rgba(255,255,255,0.07)',
            border:      'none',
            borderBottom:'1px solid #4ade8055',
            outline:     'none',
            padding:     '1px 3px',
            borderRadius:'2px',
            ...MONO,
          }}
        />
      ) : (
        <span style={{
          flex:         1,
          minWidth:     0,
          fontSize:     '13px',
          fontWeight:   isActive ? 600 : 400,
          color:        isDisabled ? '#1e293b' : isActive ? '#e2e8f0' : '#64748b',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
          ...MONO,
        }}>
          {node.label}
        </span>
      )}

      {/* Health dot — file nodes only, not queued (queued has no dot) */}
      {node.kind === 'file' && node.healthState && node.healthState !== 'queued' && (
        <span style={{
          width:           '5px',
          height:          '5px',
          borderRadius:    '50%',
          flexShrink:      0,
          backgroundColor: HEALTH_DOT[node.healthState],
        }} />
      )}

      {/* Count — folder nodes */}
      {(node.kind === 'folder') && node.count !== undefined && (
        <span style={{ fontSize: '10px', color: '#1e293b', flexShrink: 0, ...MONO }}>
          {node.count}
        </span>
      )}

      {/* Coming soon badge */}
      {node.comingSoon && (
        <span style={{ fontSize: '9px', color: '#1e293b', flexShrink: 0, ...MONO }}>
          soon
        </span>
      )}
    </div>
  );
}

// ── TreeNode — recursive ──────────────────────────────────────────────────────
interface TreeNodeProps {
  node:         WorkspaceNode;
  depth:        number;
  activeNodeId: string | null;
  openIds:      Set<string>;
  onToggle:     (id: string) => void;
  onSelect:     (node: WorkspaceNode) => void;
  onHoverEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
  // Fix 2 (Mission 17) — rename state threaded through (all optional)
  renamingId?:      string | null;
  renameValue?:     string;
  onStartRename?:   (id: string, currentLabel: string) => void;
  onRenameChange?:  (v: string) => void;
  onRenameCommit?:  () => void;
  onRenameCancel?:  () => void;
}

function TreeNode({ node, depth, activeNodeId, openIds, onToggle, onSelect, onHoverEnter, renamingId, renameValue, onStartRename, onRenameChange, onRenameCommit, onRenameCancel }: TreeNodeProps) {
  const isOpen      = openIds.has(node.id);
  const isActive    = activeNodeId === node.id;
  const hasChildren = node.kind === 'folder' && (node.children?.length ?? 0) > 0;
  const isRenaming  = renamingId === node.id;

  const handleClick = useCallback(() => {
    if (node.kind === 'disabled') return;
    if (node.kind === 'folder')   { onToggle(node.id); return; }
    onSelect(node);
  }, [node, onToggle, onSelect]);

  const handleDoubleClick = useCallback(() => {
    if (node.icon === 'project' && onStartRename) {
      onStartRename(node.id, node.label);
    }
  }, [node, onStartRename]);

  return (
    <>
      <ExplorerRow
        node={node}
        depth={depth}
        isActive={isActive}
        isOpen={isOpen}
        onHoverEnter={onHoverEnter}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        isRenaming={isRenaming}
        renameValue={isRenaming ? renameValue : undefined}
        onRenameChange={onRenameChange}
        onRenameCommit={onRenameCommit}
        onRenameCancel={onRenameCancel}
      />
      {/* Animated children */}
      <AnimatePresence initial={false}>
        {node.kind === 'folder' && isOpen && hasChildren && (
          <motion.div
            key={`${node.id}-children`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING_CONTENT}
            style={{ overflow: 'hidden' }}
          >
            {node.children!.map(child => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                activeNodeId={activeNodeId}
                openIds={openIds}
                onToggle={onToggle}
                onSelect={onSelect}
                onHoverEnter={onHoverEnter}
                renamingId={renamingId}
                renameValue={renameValue}
                onStartRename={onStartRename}
                onRenameChange={onRenameChange}
                onRenameCommit={onRenameCommit}
                onRenameCancel={onRenameCancel}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── WorkspaceExplorer ─────────────────────────────────────────────────────────
export interface WorkspaceExplorerProps {
  tree:           WorkspaceNode[];
  activeNodeId:   string | null;
  onNodeSelect:   (node: WorkspaceNode) => void;
  width?:         number;     // default 240
  headerLabel?:   string;     // section header text, default "WORKSPACE"
  // Fix 2 (Mission 17) — rename callback (additive, optional)
  onRenameNode?:  (id: string, newName: string) => void;
}

export default function WorkspaceExplorer({
  tree,
  activeNodeId,
  onNodeSelect,
  width = 240,
  headerLabel = 'WORKSPACE',
  onRenameNode,
}: WorkspaceExplorerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fix 2 — local rename state
  const [renamingId,   setRenamingId]   = useState<string | null>(null);
  const [renameValue,  setRenameValue]  = useState('');

  const handleStartRename = useCallback((id: string, currentLabel: string) => {
    setRenamingId(id);
    setRenameValue(currentLabel);
  }, []);

  const handleRenameChange = useCallback((v: string) => setRenameValue(v), []);

  const handleRenameCommit = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRenameNode?.(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, onRenameNode]);

  const handleRenameCancel = useCallback(() => {
    setRenamingId(null);
  }, []);

  // Default open: project root (R2), Documents, and all phase children
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set([
    'project-root',
    'documents',
    'phase-discover', 'phase-decide', 'phase-specify', 'phase-architect', 'phase-ship',
  ]));

  // ── Shared highlight state ─────────────────────────────────────────────────
  // ONE highlight div that springs to the hovered/active row position.
  // top is content-relative (includes scroll offset) so it works in scrollable containers.
  const [hoverPos,  setHoverPos]  = useState<{ top: number; height: number } | null>(null);
  const [activePos, setActivePos] = useState<{ top: number; height: number } | null>(null);

  // The highlight renders at hoverPos when available, else at activePos.
  const highlightPos = hoverPos ?? activePos;

  const handleHoverEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rowRect       = e.currentTarget.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setHoverPos({
      top:    rowRect.top - containerRect.top + container.scrollTop,
      height: rowRect.height,
    });
  }, []);

  const handleHoverLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  const handleToggle = useCallback((id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((node: WorkspaceNode) => {
    // Capture the current hover position as the active highlight position
    setActivePos(hoverPos);
    onNodeSelect(node);
  }, [hoverPos, onNodeSelect]);

  return (
    <div
      ref={containerRef}
      onMouseLeave={handleHoverLeave}
      style={{
        width:        `${width}px`,
        flexShrink:   0,
        height:       '100%',
        overflowY:    'auto',
        overflowX:    'hidden',
        position:     'relative',
        backgroundColor: '#020c06',
        borderRight:  '1px solid #0a1a2e',
        display:      'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Section header ── */}
      <div style={{
        padding:      '10px 12px 8px',
        borderBottom: '1px solid #0a1a2e',
        flexShrink:   0,
      }}>
        <div style={{
          fontSize:      '9px',
          color:         '#1e293b',
          letterSpacing: '0.12em',
          fontWeight:    700,
          textTransform: 'uppercase',
          ...MONO,
        }}>
          {headerLabel}
        </div>
      </div>

      {/* ── Scrollable tree area (relative for absolute highlight) ── */}
      <div style={{ flex: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>

        {/* ── THE shared highlight element ──────────────────────────────── */}
        {/* Single motion.div — springs between row positions on hover/select. */}
        {/* z-index 0 keeps it behind row content (z-index 1). */}
        <AnimatePresence>
          {highlightPos && (
            <motion.div
              key="explorer-highlight"
              initial={{ opacity: 0, y: highlightPos.top, height: highlightPos.height }}
              animate={{ opacity: 1, y: highlightPos.top, height: highlightPos.height }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              style={{
                position:        'absolute',
                left:            '4px',
                right:           '4px',
                top:             0,
                borderRadius:    '3px',
                backgroundColor: 'rgba(255,255,255,0.045)',
                pointerEvents:   'none',
                zIndex:          0,
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Tree rows ── */}
        <div style={{ paddingTop: '4px', paddingBottom: '16px' }}>
          {tree.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              activeNodeId={activeNodeId}
              openIds={openIds}
              onToggle={handleToggle}
              onSelect={handleSelect}
              onHoverEnter={handleHoverEnter}
              renamingId={renamingId}
              renameValue={renameValue}
              onStartRename={onRenameNode ? handleStartRename : undefined}
              onRenameChange={handleRenameChange}
              onRenameCommit={handleRenameCommit}
              onRenameCancel={handleRenameCancel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
