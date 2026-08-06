'use client';

// src/components/ui/task-list.tsx
// Mission 20 — G1: Adapted from @kvnkld/task-list (aicss.dev).
//
// Source: https://21st.dev/@kvnkld/components/task-list
// Adaptation: CSS Modules → inline styles with --ig-* tokens.
// Animation logic (rolling digits, icon transitions, collapsible) preserved
// exactly from the original. Made data-driven (labels[], currentIndex, isRunning)
// instead of self-advancing. No external dependencies beyond React + framer-motion.
//
// Color substitutions:
//   neutral-950  → var(--ig-canvas)
//   white        → var(--ig-text-primary, #f1f5f9)
//   neutral-600  → var(--ig-text-secondary, #94a3b8)
//   neutral-400  → var(--ig-text-tertiary, #64748b)
//   green accent → #4ade80 (IdeaGate emerald, consistent with existing tokens)

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TaskListProps {
  labels:       string[];
  currentIndex: number;    // count of completed tasks (0 = none, labels.length = all done)
  isRunning:    boolean;
  title?:       string;    // header text, defaults to "Building"
  defaultOpen?: boolean;
}

// ── Rolling digit animation (preserved exactly from original) ─────────────────

const RollDigit = ({ char }: { char: string }) => {
  const prev = useRef(char);
  const [roll, setRoll] = useState<{ from: string; to: string } | null>(null);
  const [up,   setUp]   = useState(false);

  useEffect(() => {
    if (char === prev.current) return;
    const from = prev.current;
    prev.current = char;
    setRoll({ from, to: char });
    setUp(false);
    const raf  = requestAnimationFrame(() => requestAnimationFrame(() => setUp(true)));
    const done = setTimeout(() => setRoll(null), 380);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, [char]);

  const outerStyle: React.CSSProperties = {
    display: 'inline-block',
    overflow: 'hidden',
    height: '1.1em',
    verticalAlign: 'middle',
  };

  if (!roll) return <span style={outerStyle}>{char}</span>;
  return (
    <span style={outerStyle}>
      <span style={{
        display: 'flex',
        flexDirection: 'column',
        transform: up ? 'translateY(-50%)' : 'translateY(0)',
        transition: up ? 'transform 380ms cubic-bezier(0.23,1,0.32,1)' : 'none',
      }}>
        <span>{roll.from}</span>
        <span>{roll.to}</span>
      </span>
    </span>
  );
};

const RollingCount = ({ value }: { value: string }) => (
  <span style={{ display: 'inline-flex', fontVariantNumeric: 'tabular-nums', alignItems: 'center' }} aria-label={value}>
    {value.split('').map((c, i) => <RollDigit key={i} char={c} />)}
  </span>
);

// ── Icons (SVGs preserved exactly, color adapted to --ig-* tokens) ────────────

const iconBase: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0,
  transition: 'opacity 200ms ease',
};

const DashedIcon = ({ visible }: { visible: boolean }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"
    style={{ ...iconBase, opacity: visible ? 1 : 0, color: 'var(--ig-text-tertiary, #475569)' }}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeDasharray="1.8 3.6" strokeLinecap="round" />
  </svg>
);

const ArrowIcon = ({ visible }: { visible: boolean }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"
    style={{ ...iconBase, opacity: visible ? 1 : 0, color: '#4ade80' }}>
    <path d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = ({ visible }: { visible: boolean }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"
    style={{ ...iconBase, opacity: visible ? 1 : 0, color: '#4ade80' }}>
    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FilledCheckIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" style={{ color: '#4ade80' }}>
    <path fillRule="evenodd" clipRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
      fill="currentColor" />
  </svg>
);

// ── Main component ─────────────────────────────────────────────────────────────

export function TaskList({
  labels,
  currentIndex,
  isRunning,
  title = 'Building your product',
  defaultOpen = true,
}: TaskListProps) {
  const [collapsed, setCollapsed] = useState(!defaultOpen);
  const n = labels.length;

  // defaultOpen controls initial state only; user toggle is always respected.
  // Do NOT auto-open on isRunning — Artifact Compilation must remain visible.

  const allDone = currentIndex >= n;
  const running = isRunning && !allDone;
  const pct     = Math.round((Math.min(Math.max(currentIndex, 0), n) / n) * 100);
  // SVG circle: r=9 → circumference = 2π×9 ≈ 56.55
  const CIRC    = 56.55;
  const dash    = (pct / 100) * CIRC;
  const gap     = CIRC - dash;
  const countStr = `${Math.min(Math.max(currentIndex, 0), n)}/${n}`;

  return (
    <div style={{ fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)', width: '100%' }}>
      {/* ── Header button ── */}
      <button
        type="button"
        aria-expanded={!collapsed}
        aria-label="Toggle lifecycle stages"
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '6px 0', color: 'inherit',
        }}
      >
        {/* Status icon area */}
        <span style={{ position: 'relative', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {allDone ? (
            <FilledCheckIcon />
          ) : running ? (
            /* Pie progress ring */
            <svg viewBox="0 0 24 24" width="16" height="16"
              style={{ color: '#4ade8099', transform: 'rotate(-90deg)', overflow: 'visible' }}>
              {/* Background ring */}
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"
                strokeWidth="2" opacity="0.2" />
              {/* Progress arc */}
              <circle cx="12" cy="12" r="9" fill="none" stroke="#4ade80"
                strokeWidth="2"
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 600ms ease' }} />
            </svg>
          ) : (
            /* List icon */
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"
              style={{ color: 'var(--ig-text-tertiary, #475569)' }}>
              <path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        {/* Chevron */}
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"
          style={{ color: 'var(--ig-text-tertiary, #475569)', flexShrink: 0, transition: 'transform 200ms ease', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
          <path d="m19.5 8.25-7.5 7.5-7.5-7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Title */}
        <span style={{ flex: 1, textAlign: 'left', fontSize: '13px', fontWeight: 500, color: 'var(--ig-text-secondary, #cbd5e1)' }}>
          {title}
        </span>

        {/* Rolling count */}
        <span style={{ fontSize: '12px', color: 'var(--ig-text-tertiary, #64748b)', fontFamily: 'var(--ig-font-mono)' }}>
          <RollingCount value={countStr} />
        </span>
      </button>

      {/* ── Collapsible list ── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: '0 0 0 2px' }}>
              {labels.map((label, i) => {
                const done   = i < currentIndex;
                const active = i === currentIndex && isRunning && !allDone;
                const ahead  = i > currentIndex;

                return (
                  <li key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '4px 0',
                    opacity: ahead ? 0.35 : 1,
                    transition: 'opacity 300ms ease',
                  }}>
                    {/* Icon trio — three overlapping icons, one visible at a time */}
                    <span style={{ position: 'relative', width: '15px', height: '15px', flexShrink: 0 }}>
                      <DashedIcon visible={!done && !active} />
                      <ArrowIcon  visible={active} />
                      <CheckIcon  visible={done} />
                    </span>

                    {/* Label */}
                    <span style={{
                      fontSize: '12px',
                      fontFamily: 'var(--ig-font-sans)',
                      color: done   ? 'var(--ig-text-tertiary, #475569)'
                           : active ? 'var(--ig-text-primary, #f1f5f9)'
                           :          'var(--ig-text-secondary, #94a3b8)',
                      textDecoration:      done ? 'line-through' : 'none',
                      textDecorationColor: '#334155',
                      fontWeight:          active ? 500 : 400,
                      transition: 'color 200ms ease, font-weight 200ms ease',
                    }}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
