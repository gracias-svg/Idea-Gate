'use client';

// src/components/shared/WorkspaceExplorer.tsx
// Mission 23 — Hover mechanism replaced with primitives-animate-files.
// Core change: Files + FilesHighlight + FileHighlight + FolderHighlight replace
// the manual onHoverEnter / shared-motion-div approach. The shared highlight now
// springs at stiffness:750/damping:40 (was 300/30) — visibly snappier glide.
//
// Folder expand/collapse: kept as-is (openIds set + AnimatePresence) — minimal blast radius.
// External props interface: UNCHANGED.

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, FolderOpen, FileText, ChevronRight,
  Zap, Clock, BookOpen, Package, Database, Archive, Upload,
} from 'lucide-react';
import type { HealthState } from '@/components/desk/ArtifactReader';
import {
  Files, FilesHighlight, FileHighlight, FolderHighlight,
} from '@/components/ui/primitives-animate-files';
import { useWorkspaceState } from '@/lib/useWorkspaceState';
import { useWorkspaceDocs } from '@/lib/workspaceDocuments';

// ── Types ─────────────────────────────────────────────────────────────────────
export type { HealthState };
export type WorkspaceNodeKind = 'folder' | 'file' | 'disabled';

export interface WorkspaceNode {
  id:          string;
  kind:        WorkspaceNodeKind;
  label:       string;
  // File nodes
  file?:       string;
  stageIndex?: number;
  healthState?: HealthState;
  version?:    number;
  // Folder nodes
  children?:   WorkspaceNode[];
  phaseColor?: string;
  count?:      number;
  // Disabled folders
  comingSoon?: boolean;
  // Empty state hint — shown when a real folder is open but has no children
  emptyHint?:  string;
  // Icon override
  icon?: 'project' | 'journey' | 'decisions' | 'history' | 'knowledge' | 'assets' | 'snapshots' | 'exports';
  // Workspace document id (user-created docs, not lifecycle artifacts)
  wdocId?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

const HEALTH_DOT: Record<HealthState, string> = {
  trustworthy:  '#4ade80',
  questionable: '#f59e0b',
  stale:        '#ef4444',
  generating:   '#818cf8',
  queued:       '#1e293b',
};

const SPRING      = { type: 'spring' as const, stiffness: 300, damping: 30 };
const SPRING_FOLD = { type: 'spring' as const, stiffness: 260, damping: 28 };
const ROW_HEIGHT  = 30;

const DEFAULT_OPEN = new Set([
  'project-root',
  'documents',
  'phase-discover', 'phase-decide', 'phase-specify', 'phase-architect', 'phase-ship',
]);

// ── NodeIcon ──────────────────────────────────────────────────────────────────
function NodeIcon({ node, isOpen }: { node: WorkspaceNode; isOpen: boolean }) {
  const sz  = 13;
  const col = node.phaseColor ?? '#475569';
  const dim = node.kind === 'disabled' ? '#1e293b' : col;

  switch (node.icon) {
    case 'project':   return <Package  size={sz} color="#4ade80" />;
    case 'journey':   return <Zap      size={sz} color="#818cf8" />;
    case 'decisions': return <BookOpen size={sz} color="#64748b" />;
    case 'history':   return <Clock    size={sz} color="#64748b" />;
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

// ── RowContent — shared inner layout for all row types ───────────────────────
interface RowContentProps {
  node:           WorkspaceNode;
  depth:          number;
  isActive:       boolean;
  isOpen:         boolean;
  isRenaming?:    boolean;
  renameValue?:   string;
  onRenameChange?: (v: string) => void;
  onRenameCommit?: () => void;
  onRenameCancel?: () => void;
}

function RowContent({ node, depth, isActive, isOpen, isRenaming, renameValue, onRenameChange, onRenameCommit, onRenameCancel }: RowContentProps) {
  const isDisabled   = node.kind === 'disabled';
  const hasChildren  = node.kind === 'folder' && (node.children?.length ?? 0) > 0;
  const isExpandable = hasChildren || node.comingSoon;

  return (
    <>
      {/* Chevron */}
      <motion.span
        animate={{ rotate: isExpandable && isOpen ? 90 : 0 }}
        transition={SPRING}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '12px', height: '12px', flexShrink: 0,
          color: isDisabled ? '#1e293b' : '#475569',
        }}
      >
        {isExpandable ? <ChevronRight size={10} /> : null}
      </motion.span>

      {/* Icon */}
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <NodeIcon node={node} isOpen={isOpen} />
      </span>

      {/* Label or rename input */}
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
            flex: 1, minWidth: 0,
            fontSize: '13px', fontWeight: 500,
            color: '#e2e8f0',
            background: 'rgba(255,255,255,0.07)',
            border: 'none',
            borderBottom: '1px solid #4ade8055',
            outline: 'none',
            padding: '1px 3px',
            borderRadius: '2px',
            ...MONO,
          }}
        />
      ) : (
        <span style={{
          flex: 1, minWidth: 0,
          fontSize: '13px',
          fontWeight: isActive ? 600 : node.kind === 'folder' ? 500 : 400,
          color: isDisabled
            ? '#334155'
            : isActive
              ? 'var(--ig-text-primary, #f1f5f9)'
              : node.icon === 'project'
                ? 'var(--ig-text-primary, #e2e8f0)'
                : node.kind === 'folder'
                  ? 'var(--ig-text-secondary, #94a3b8)'
                  : '#7c8fa3',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          ...MONO,
        }}>
          {node.label}
        </span>
      )}

      {/* Health dot — file nodes */}
      {node.kind === 'file' && node.healthState && node.healthState !== 'queued' && (
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: HEALTH_DOT[node.healthState],
        }} />
      )}

      {/* Count — folder nodes */}
      {node.kind === 'folder' && node.count !== undefined && (
        <span style={{ fontSize: '10px', color: '#475569', flexShrink: 0, ...MONO }}>
          {node.count}
        </span>
      )}

      {/* Coming soon badge */}
      {node.comingSoon && (
        <span style={{ fontSize: '9px', color: '#334155', flexShrink: 0, ...MONO }}>
          soon
        </span>
      )}
    </>
  );
}

// ── ExplorerRow — wraps RowContent in the correct hover primitive ──────────────
interface RowProps {
  node:           WorkspaceNode;
  depth:          number;
  isActive:       boolean;
  isOpen:         boolean;
  onClick:        () => void;
  onDoubleClick?: () => void;
  isRenaming?:    boolean;
  renameValue?:   string;
  onRenameChange?: (v: string) => void;
  onRenameCommit?: () => void;
  onRenameCancel?: () => void;
}

function ExplorerRow({
  node, depth, isActive, isOpen, onClick, onDoubleClick,
  isRenaming, renameValue, onRenameChange, onRenameCommit, onRenameCancel,
}: RowProps) {
  const isDisabled = node.kind === 'disabled';

  const rowBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '5px',
    height: `${ROW_HEIGHT}px`,
    paddingLeft: `${10 + depth * 14}px`,
    paddingRight: '10px',
    cursor: isDisabled ? 'default' : 'pointer',
    userSelect: 'none',
    flexShrink: 0,
  };

  const content = (
    <RowContent
      node={node} depth={depth} isActive={isActive} isOpen={isOpen}
      isRenaming={isRenaming} renameValue={renameValue}
      onRenameChange={onRenameChange}
      onRenameCommit={onRenameCommit}
      onRenameCancel={onRenameCancel}
    />
  );

  // Disabled nodes — no hover, no primitives wrapper
  if (isDisabled) {
    return <div style={{ ...rowBase, opacity: 0.35 }}>{content}</div>;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
  };

  // File node — FileHighlight provides hover registration
  if (node.kind === 'file') {
    return (
      <FileHighlight
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        style={{
          ...rowBase,
          // Active indicator: green left border, not the shared highlight
          borderLeft: isActive ? '2px solid #4ade80' : '2px solid transparent',
          paddingLeft: isActive
            ? `${Math.max(0, 10 + depth * 14 - 2)}px`
            : `${10 + depth * 14}px`,
        }}
      >
        {content}
      </FileHighlight>
    );
  }

  // Folder node — FolderHighlight provides hover registration, caller controls click
  return (
    <FolderHighlight
      role="button"
      tabIndex={0}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      style={rowBase}
    >
      {content}
    </FolderHighlight>
  );
}

// ── TreeNode — recursive ──────────────────────────────────────────────────────
interface TreeNodeProps {
  node:          WorkspaceNode;
  depth:         number;
  activeNodeId:  string | null;
  openIds:       Set<string>;
  onToggle:      (id: string) => void;
  onSelect:      (node: WorkspaceNode) => void;
  renamingId?:   string | null;
  renameValue?:  string;
  onStartRename?:  (id: string, currentLabel: string) => void;
  onRenameChange?: (v: string) => void;
  onRenameCommit?: () => void;
  onRenameCancel?: () => void;
}

function TreeNode({
  node, depth, activeNodeId, openIds, onToggle, onSelect,
  renamingId, renameValue, onStartRename, onRenameChange, onRenameCommit, onRenameCancel,
}: TreeNodeProps) {
  const isOpen      = openIds.has(node.id);
  const isActive    = activeNodeId === node.id;
  const hasChildren = node.kind === 'folder' && (node.children?.length ?? 0) > 0;
  const isRenaming  = renamingId === node.id;

  const handleClick = useCallback(() => {
    if (node.kind === 'disabled') return;
    if (node.kind === 'folder')   { onToggle(node.id); onSelect(node); return; }
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
            transition={SPRING_FOLD}
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
        {/* Empty state — real folder, open, no children */}
        {node.kind === 'folder' && isOpen && !hasChildren && !node.comingSoon && node.emptyHint && (
          <motion.div
            key={`${node.id}-empty`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING_FOLD}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              paddingLeft: `${10 + (depth + 1) * 14 + 17}px`,
              paddingRight: '10px',
              paddingTop: '6px',
              paddingBottom: '10px',
            }}>
              <div style={{ fontSize: '10px', color: '#334155', lineHeight: 1.5, ...MONO }}>
                {node.emptyHint}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── WorkspaceExplorer ─────────────────────────────────────────────────────────
export interface WorkspaceExplorerProps {
  tree:          WorkspaceNode[];
  onNodeSelect:  (node: WorkspaceNode) => void;
  width?:        number;
  headerLabel?:  string;
  onRenameNode?: (id: string, newName: string) => void;
}

// ── Merge workspace docs into the folder tree ─────────────────────────────────
// Folders that can hold user-created docs.
const WDOC_FOLDERS = new Set(['align', 'plan', 'measure', 'archive']);

function mergeDocsIntoNode(
  node: WorkspaceNode,
  docsByFolder: Map<string, WorkspaceNode[]>,
): WorkspaceNode {
  if (node.kind !== 'folder') return node;
  const docNodes = WDOC_FOLDERS.has(node.id) ? (docsByFolder.get(node.id) ?? []) : [];
  const mergedChildren = [
    ...(node.children ?? []).map(c => mergeDocsIntoNode(c, docsByFolder)),
    ...docNodes,
  ];
  if (mergedChildren.length === (node.children?.length ?? 0) && docNodes.length === 0) return node;
  return { ...node, children: mergedChildren, count: mergedChildren.length || node.count };
}

export default function WorkspaceExplorer({
  tree,
  onNodeSelect,
  width = 240,
  headerLabel = 'WORKSPACE',
  onRenameNode,
}: WorkspaceExplorerProps) {
  const ws   = useWorkspaceState();
  const docs = useWorkspaceDocs();

  // Build wdoc nodes grouped by folderId
  const docsByFolder = React.useMemo(() => {
    const map = new Map<string, WorkspaceNode[]>();
    for (const doc of docs) {
      const nodes = map.get(doc.folderId) ?? [];
      nodes.push({
        id:     `wdoc-${doc.id}`,
        kind:   'file',
        label:  doc.title,
        wdocId: doc.id,
      });
      map.set(doc.folderId, nodes);
    }
    return map;
  }, [docs]);

  // Merge docs into tree (immutable — original tree prop untouched)
  const mergedTree = React.useMemo(
    () => tree.map(n => mergeDocsIntoNode(n, docsByFolder)),
    [tree, docsByFolder],
  );

  // Rename state
  const [renamingId,  setRenamingId]  = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleStartRename = useCallback((id: string, currentLabel: string) => {
    setRenamingId(id);
    setRenameValue(currentLabel);
  }, []);

  const handleRenameChange = useCallback((v: string) => setRenameValue(v), []);

  const handleRenameCommit = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      ws.setProjectDisplayName(renameValue.trim());
      onRenameNode?.(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, onRenameNode, ws]);

  const handleRenameCancel = useCallback(() => setRenamingId(null), []);

  // Folder open state
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(DEFAULT_OPEN));

  const handleToggle = useCallback((id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((node: WorkspaceNode) => {
    ws.setActiveNodeId(node.id);
    onNodeSelect(node);
  }, [onNodeSelect, ws]);

  return (
    <div style={{
      width:           `${width}px`,
      flexShrink:      0,
      height:          '100%',
      overflowY:       'hidden',
      overflowX:       'hidden',
      position:        'relative',
      backgroundColor: '#020c06',
      borderRight:     '1px solid #0a1a2e',
      display:         'flex',
      flexDirection:   'column',
    }}>
      {/* Section header — outside Files so it's never included in highlight area */}
      <div style={{
        padding:      '10px 12px 8px',
        borderBottom: '1px solid #0a1a2e',
        flexShrink:   0,
      }}>
        <div style={{
          fontSize:      '9px',
          color:         '#2d4a6a',
          letterSpacing: '0.12em',
          fontWeight:    700,
          textTransform: 'uppercase',
          ...MONO,
        }}>
          {headerLabel}
        </div>
      </div>

      {/* Files — scrollable container + highlight context */}
      {/* position:relative is injected by Files; overflow:auto on the same div   */}
      {/* so scrollTop is on the ref element, matching useHighlightHover's calc.  */}
      <Files style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Shared sliding highlight — springs to hovered row */}
        <FilesHighlight style={{
          background:   'rgba(255,255,255,0.11)',
          borderRadius: '6px',
        }} />

        {/* Tree rows */}
        <div style={{ paddingTop: '4px', paddingBottom: '16px' }}>
          {mergedTree.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              activeNodeId={ws.activeNodeId}
              openIds={openIds}
              onToggle={handleToggle}
              onSelect={handleSelect}
              renamingId={renamingId}
              renameValue={renameValue}
              onStartRename={onRenameNode ? handleStartRename : undefined}
              onRenameChange={handleRenameChange}
              onRenameCommit={handleRenameCommit}
              onRenameCancel={handleRenameCancel}
            />
          ))}
        </div>
      </Files>
    </div>
  );
}
