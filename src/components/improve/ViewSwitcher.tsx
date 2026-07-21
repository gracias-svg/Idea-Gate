'use client';

// src/components/improve/ViewSwitcher.tsx
// Sprint 05 — View Switcher: replaces the three static Graph/Events/Reasoning
// tab buttons with a single trigger + dropdown, wired to the same `panel`
// state page.tsx already owns. Mechanism only (Golden Rule of Consistency,
// DIL Part 2 §10) — icons, tokens and motion primitives are this codebase's
// own (glyphs already used by the old tab row; --ig-focus-ring from Sprint 04;
// easing/duration from src/lib/motion/primitives.ts).
//
// V4 (global ⌘1/⌘2/⌘3) intentionally NOT implemented — see sprint report.
// DIL 03 (navigation-language.md, §Keyboard Navigation) reserves ⌘1/⌘2/⌘3
// globally for Desk/Studio/Office workspace switching. Binding them here to
// Studio's internal panel state would collide with that documented scheme
// the moment it's wired up elsewhere. Shortcut-hint glyphs are correspondingly
// omitted from the dropdown rows — showing a hint for a binding that doesn't
// exist would be a false affordance.

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { easing } from '@/lib/motion/primitives';

export type StudioPanel = 'graph' | 'events' | 'reasoning';

interface ViewOption {
  key: StudioPanel;
  icon: string;
  label: string;
}

const VIEWS: ViewOption[] = [
  { key: 'graph', icon: '◈', label: 'ARTIFACT GRAPH' },
  { key: 'events', icon: '▶', label: 'EVENT FEED' },
  { key: 'reasoning', icon: '⟳', label: 'REASONING CHAIN' },
];

const dropdownVariants = {
  closed: { opacity: 0, scale: 0.96, y: -2 },
  open: { opacity: 1, scale: 1, y: 0 },
};

interface ViewSwitcherProps {
  panel: StudioPanel;
  setPanel: (p: StudioPanel) => void;
}

export default function ViewSwitcher({ panel, setPanel }: ViewSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const current = VIEWS.find(v => v.key === panel) ?? VIEWS[0];

  // keep roving highlight aligned with the active view whenever it opens
  useEffect(() => {
    if (open) setFocusedIdx(VIEWS.findIndex(v => v.key === panel));
  }, [open, panel]);

  // click-outside closes
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // arrow/enter/escape nav while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIdx(i => Math.min(i + 1, VIEWS.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setPanel(VIEWS[focusedIdx].key);
        setOpen(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, focusedIdx, setPanel]);

  const enterTransition = { duration: reduceMotion ? 0 : 0.12, ease: easing.out };
  const exitTransition = { duration: reduceMotion ? 0 : 0.12, ease: easing.in };

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="ig-view-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '9px',
          letterSpacing: '0.08em',
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontWeight: 500,
          // Sprint 06 T1/T3 — was a flush tab (radius 0 + green underline) matching
          // the old 3-button tab row it replaced in Sprint 05. Now restyled to the
          // top-chrome's unified pill + elevation language; the underline's job
          // (showing this is the "current" control) is carried by the border +
          // text color instead of a bottom rule.
          border: '1px solid #4ade8033',
          borderRadius: 'var(--ig-radius-full)',
          cursor: 'pointer',
          backgroundColor: '#040b14',
          color: '#4ade80',
          boxShadow: 'var(--ig-elev-1)',
        }}
      >
        <span>{current.icon} {current.label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={open ? enterTransition : exitTransition}
          style={{ fontSize: '8px', color: '#4ade8099', display: 'inline-block' }}
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Switch view"
            variants={dropdownVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={enterTransition}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              zIndex: 40,
              minWidth: '210px',
              backgroundColor: '#040b14',
              borderRadius: 'var(--ig-radius-sm)',
              boxShadow: 'var(--ig-elev-2)',
              padding: '4px',
              transformOrigin: 'top left',
            }}
          >
            {VIEWS.map((v, i) => {
              const isActive = v.key === panel;
              const isFocused = i === focusedIdx;
              return (
                <div
                  key={v.key}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={-1}
                  onMouseEnter={() => setFocusedIdx(i)}
                  onClick={() => {
                    setPanel(v.key);
                    setOpen(false);
                  }}
                  className="ig-view-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 8px',
                    borderRadius: 'var(--ig-radius-sm)',
                    fontSize: '9px',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    color: isActive ? '#4ade80' : '#94a3b8',
                    backgroundColor: isFocused ? '#0d1117' : 'transparent',
                  }}
                >
                  <span style={{ width: '14px', textAlign: 'center' as const }}>{v.icon}</span>
                  <span style={{ flex: 1 }}>{v.label}</span>
                  {isActive && <span style={{ color: '#4ade80' }}>✓</span>}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
