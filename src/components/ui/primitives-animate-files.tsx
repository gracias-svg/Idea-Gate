'use client';

// src/components/ui/primitives-animate-files.tsx
// Adapted from ui.unlumen.com primitives-animate-files.
// Changes from source:
//   - import from 'framer-motion' not 'motion/react' (IdeaGate package)
//   - getStrictContext inlined (replaces @unlumen-ui/lib-get-strict-context)
//   - useHighlightHover adds + container.scrollTop (scroll compensation for scrollable trees)
//   - FilesHighlight uses key= not layoutId= (no cross-tree shared layout)
//   - FilesHighlight sets all positional values in initial to prevent first-frame flash

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Inline getStrictContext ───────────────────────────────────────────────────
// Creates a context + typed hook with a null-guard. Avoids the external dep.
function getStrictContext<T>(name: string): [React.Context<T | null>, () => T] {
  const Ctx = React.createContext<T | null>(null);
  function useCtx() {
    const val = React.useContext(Ctx);
    if (val === null) throw new Error(`[${name}] must be used inside its provider`);
    return val;
  }
  return [Ctx, useCtx];
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface HighlightBounds { top: number; left: number; width: number; height: number }

interface FilesCtxValue {
  containerRef:       React.RefObject<HTMLDivElement | null>;
  highlightBounds:    HighlightBounds | null;
  setHighlightBounds: React.Dispatch<React.SetStateAction<HighlightBounds | null>>;
}

interface FolderItemCtxValue { isOpen: boolean; toggle: () => void }

// ── Contexts ──────────────────────────────────────────────────────────────────
const [FilesCtx, useFiles]           = getStrictContext<FilesCtxValue>('Files');
const [FolderItemCtx, useFolderItem] = getStrictContext<FolderItemCtxValue>('FolderItem');

export { useFolderItem };

// ── useHighlightHover ─────────────────────────────────────────────────────────
// Attaches to a row element. On mouseenter, computes position relative to the
// Files container and broadcasts to the shared FilesHighlight.
// + container.scrollTop compensates for scroll offset in long trees.
export function useHighlightHover() {
  const { containerRef, setHighlightBounds } = useFiles();
  const ref = React.useRef<HTMLDivElement>(null);

  const onMouseEnter = React.useCallback(() => {
    const el        = ref.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    setHighlightBounds({
      top:    eRect.top  - cRect.top  + container.scrollTop,
      left:   eRect.left - cRect.left,
      width:  eRect.width,
      height: eRect.height,
    });
  }, [containerRef, setHighlightBounds]);

  return { ref, onMouseEnter };
}

// ── Files ─────────────────────────────────────────────────────────────────────
// Root container. Provides context. position:relative is required — FilesHighlight
// is absolutely positioned inside this element.
interface FilesProps {
  children:     React.ReactNode;
  className?:   string;
  style?:       React.CSSProperties;
  onMouseLeave?: () => void;
}
export function Files({ children, className, style, onMouseLeave }: FilesProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [highlightBounds, setHighlightBounds] = React.useState<HighlightBounds | null>(null);

  const handleMouseLeave = React.useCallback(() => {
    setHighlightBounds(null);
    onMouseLeave?.();
  }, [onMouseLeave]);

  return (
    <FilesCtx.Provider value={{ containerRef, highlightBounds, setHighlightBounds }}>
      <div
        ref={containerRef}
        className={className}
        style={{ position: 'relative', ...style }}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </FilesCtx.Provider>
  );
}

// ── FilesHighlight ─────────────────────────────────────────────────────────────
// Single shared motion.div that springs to the hovered row's bounds.
// Stays mounted while any row is hovered; unmounts on mouse-leave.
interface FilesHighlightProps {
  className?: string;
  style?:     React.CSSProperties;
}
export function FilesHighlight({ className, style }: FilesHighlightProps) {
  const { highlightBounds } = useFiles();
  return (
    <AnimatePresence>
      {highlightBounds && (
        <motion.div
          key="files-highlight"
          initial={{
            opacity: 0,
            top:    highlightBounds.top,
            left:   highlightBounds.left,
            width:  highlightBounds.width,
            height: highlightBounds.height,
          }}
          animate={{
            opacity: 1,
            top:     highlightBounds.top,
            left:    highlightBounds.left,
            width:   highlightBounds.width,
            height:  highlightBounds.height,
          }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 750, damping: 40 }}
          className={className}
          style={{ position: 'absolute', pointerEvents: 'none', ...style }}
        />
      )}
    </AnimatePresence>
  );
}

// ── FolderItem ─────────────────────────────────────────────────────────────────
// Manages open/close state for one folder.
// Provides context to FolderTrigger, FolderHighlight, FolderContent, FolderIcon.
interface FolderItemProps { children: React.ReactNode; defaultOpen?: boolean }
export function FolderItem({ children, defaultOpen = false }: FolderItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const toggle = React.useCallback(() => setIsOpen(v => !v), []);
  return (
    <FolderItemCtx.Provider value={{ isOpen, toggle }}>
      {children}
    </FolderItemCtx.Provider>
  );
}

// ── FolderTrigger ─────────────────────────────────────────────────────────────
// Clickable wrapper for folder rows. Auto-toggles the parent FolderItem on click.
// Attaches useHighlightHover. Use when the entire row click = toggle.
interface FolderTriggerProps {
  children:       React.ReactNode;
  className?:     string;
  style?:         React.CSSProperties;
  onDoubleClick?: () => void;
  onKeyDown?:     (e: React.KeyboardEvent<HTMLDivElement>) => void;
}
export function FolderTrigger({ children, className, style, onDoubleClick, onKeyDown }: FolderTriggerProps) {
  const { toggle } = useFolderItem();
  const { ref, onMouseEnter } = useHighlightHover();

  const defaultKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  }, [toggle]);

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      className={className}
      style={{ position: 'relative', zIndex: 1, cursor: 'pointer', userSelect: 'none', ...style }}
      onMouseEnter={onMouseEnter}
      onClick={toggle}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown ?? defaultKeyDown}
    >
      {children}
    </div>
  );
}

// ── FolderHighlight ───────────────────────────────────────────────────────────
// Hover wrapper for folder rows where click behaviour is caller-controlled.
// Attaches useHighlightHover. Use when you need custom onClick / onDoubleClick.
interface FolderHighlightProps {
  children:       React.ReactNode;
  className?:     string;
  style?:         React.CSSProperties;
  onClick?:       () => void;
  onDoubleClick?: () => void;
  onKeyDown?:     (e: React.KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?:      number;
  role?:          string;
}
export function FolderHighlight({
  children, className, style,
  onClick, onDoubleClick, onKeyDown, tabIndex, role,
}: FolderHighlightProps) {
  const { ref, onMouseEnter } = useHighlightHover();
  return (
    <div
      ref={ref}
      role={role}
      tabIndex={tabIndex}
      className={className}
      style={{ position: 'relative', zIndex: 1, ...style }}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

// ── FileHighlight ─────────────────────────────────────────────────────────────
// Hover wrapper for file rows. Attaches useHighlightHover.
interface FileHighlightProps {
  children:   React.ReactNode;
  className?: string;
  style?:     React.CSSProperties;
  onClick?:   () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?:  number;
  role?:      string;
}
export function FileHighlight({
  children, className, style,
  onClick, onKeyDown, tabIndex, role,
}: FileHighlightProps) {
  const { ref, onMouseEnter } = useHighlightHover();
  return (
    <div
      ref={ref}
      role={role}
      tabIndex={tabIndex}
      className={className}
      style={{ position: 'relative', zIndex: 1, ...style }}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

// ── FolderContent ─────────────────────────────────────────────────────────────
// Spring-animated expand/collapse driven by parent FolderItem's isOpen state.
interface FolderContentProps { children: React.ReactNode; className?: string }
export function FolderContent({ children, className }: FolderContentProps) {
  const { isOpen } = useFolderItem();
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 750, damping: 40 }}
          style={{ overflow: 'hidden' }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── FolderIcon ────────────────────────────────────────────────────────────────
// Animated icon swap between open and closed state. Driven by FolderItem context.
interface FolderIconProps { openIcon: React.ReactNode; closeIcon: React.ReactNode }
export function FolderIcon({ openIcon, closeIcon }: FolderIconProps) {
  const { isOpen } = useFolderItem();
  return (
    <span style={{ display: 'flex', alignItems: 'center', position: 'relative', flexShrink: 0 }}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={isOpen ? 'open' : 'close'}
          initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 15 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {isOpen ? openIcon : closeIcon}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
