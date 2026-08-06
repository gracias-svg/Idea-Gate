'use client';

// src/components/ui/tool-group.tsx
// Mission 22 — Fix 1: Flowing-thoughts model.
//
// Redesigned to match the Lovable reference (generation-experience.tsx ToolGroup):
//   - Fixed-height body: 4 rows always rendered when streaming
//   - Opacity ramp [0.15, 0.40, 0.75, 1.0] oldest → newest
//   - shimmer-flow CSS class on newest row text (streaming only)
//   - Rows enter from below (y:8→0) and exit upward (y:-8, opacity:0, height→0)
//   - No collapse/expand toggle — header always visible, rows always visible
//   - mm:ss elapsed timer in header
//
// ToolGroup no longer manages its own cycling — AgentToolGroup owns the data.
// ToolGroup just renders up to 4 windowed entries with the opacity ramp.

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ToolCategory = 'file' | 'search' | 'command';

export interface ToolEntry {
  id:        string;
  category:  ToolCategory;
  title:     string;
  subtitle?: string;
}

export type ToolGroupState = 'streaming' | 'completed' | 'interrupted';

export interface ToolGroupProps {
  state:             ToolGroupState;
  shimmerLabel:      string;
  completeLabel:     string;
  interruptedLabel?: string;
  nestedTools?:      ToolEntry[];
  maxVisibleTools?:  number;   // default 4
  startedAt?:        number;
}

// ── Category colors ────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<ToolCategory, string> = {
  file:    '#818cf8',
  search:  '#38bdf8',
  command: '#fb923c',
};

// ── Category icons (13 px) ────────────────────────────────────────────────────

function FileIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true">
      <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9.5L13.5 3Z"
        stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 3v6h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SearchIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.6" />
      <path d="m16.5 16.5 3.5 3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CommandIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true">
      <path d="M8 3H7a3 3 0 0 0-3 3v1m4-4h8m-8 0v4M7 7H5m2 0h10M3 7v10m0 0v1a3 3 0 0 0 3 3h1M3 17H2m1 0h2m14-14h1a3 3 0 0 1 3 3v1m0 0h1m-1 0h-2m2 10v1a3 3 0 0 1-3 3h-1m1-4h2m-2 0h-2M8 21h8m-8 0v-4m8 4v-4m-8 0h8"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CategoryIcon({ category }: { category: ToolCategory }) {
  const color = CATEGORY_COLORS[category];
  if (category === 'file')   return <FileIcon   color={color} />;
  if (category === 'search') return <SearchIcon color={color} />;
  return <CommandIcon color={color} />;
}

// ── State icons in header ─────────────────────────────────────────────────────

function SparkIcon() {
  // ✦ spark — matches Lovable reference header icon
  return (
    <span style={{ color: '#4ade80', fontSize: '13px', lineHeight: 1, flexShrink: 0 }}>✦</span>
  );
}
function CompletedCheck() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="7" fill="#4ade80" />
      <path d="M4 7.2l2 2 4-4.2" stroke="#0a1a12" strokeWidth="1.6" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function InterruptedDot() {
  return <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b', flexShrink: 0 }} />;
}

// ── Elapsed mm:ss timer ───────────────────────────────────────────────────────

function useElapsed(startedAt: number | undefined, active: boolean): string {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active || !startedAt) { setSecs(0); return; }
    const tick = () => setSecs(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);

  if (!startedAt || !active || secs === 0) return '';
  const m  = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

// ── Opacity ramp — oldest is dimmest, newest is fully lit ─────────────────────
// Supports up to 6 entries (6 agents in the execution panel).

const ROW_OPACITY = [0.10, 0.20, 0.35, 0.55, 0.75, 1.0];

// ── Main component ─────────────────────────────────────────────────────────────

export function ToolGroup({
  state,
  shimmerLabel,
  completeLabel,
  interruptedLabel = 'Interrupted',
  nestedTools = [],
  maxVisibleTools = 4,
  startedAt,
}: ToolGroupProps) {
  const elapsed = useElapsed(startedAt, state === 'streaming');
  const streaming = state === 'streaming';

  // Sliding window — oldest entries shift out as new ones arrive
  const windowedTools = nestedTools.slice(-maxVisibleTools);

  // ── Header ────────────────────────────────────────────────────────────────
  const headerIcon = state === 'completed'
    ? <CompletedCheck />
    : state === 'interrupted'
      ? <InterruptedDot />
      : <SparkIcon />;

  const headerText = state === 'completed'
    ? completeLabel
    : state === 'interrupted'
      ? interruptedLabel
      : shimmerLabel;

  const headerColor = state === 'completed'
    ? '#4ade80'
    : state === 'interrupted'
      ? '#f59e0b'
      : 'rgba(241,245,249,0.55)';

  return (
    <div style={{
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.025)',
      overflow: 'hidden',
      fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
      }}>
        {headerIcon}

        <span style={{
          flex: 1,
          fontSize: '13.5px',
          color: headerColor,
          fontWeight: streaming ? 400 : 500,
          transition: 'color 200ms ease',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {headerText}
        </span>

        {elapsed && (
          <span style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.02em',
            flexShrink: 0,
            tabularNums: true,
          } as React.CSSProperties}>
            {elapsed}
          </span>
        )}
      </div>

      {/* ── Tool rows — always rendered when tools exist, no collapse ── */}
      {windowedTools.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '4px 8px 8px',
        }}>
          <AnimatePresence initial={false} mode="sync">
            {windowedTools.map((tool, i) => {
              const opacityIdx = Math.max(0, i - (maxVisibleTools - windowedTools.length));
              const opacity = ROW_OPACITY[Math.min(opacityIdx, ROW_OPACITY.length - 1)];
              const isNewest = i === windowedTools.length - 1;
              const color = CATEGORY_COLORS[tool.category];

              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                  transition={{
                    height:   { duration: 0.15, ease: 'easeIn' },
                    opacity:  { duration: isNewest ? 0.2 : 0.12 },
                    y:        { duration: isNewest ? 0.2 : 0.12 },
                  }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 4px',
                    height: '28px',
                    maxHeight: '28px',
                  }}>
                    {/* Category icon */}
                    <span style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '18px', height: '18px',
                      borderRadius: '4px',
                      backgroundColor: `${color}18`,
                      flexShrink: 0,
                    }}>
                      <CategoryIcon category={tool.category} />
                    </span>

                    {/* Title — shimmer on newest while streaming */}
                    <span
                      className={isNewest && streaming ? 'tool-shimmer' : ''}
                      style={{
                        flex: 1, minWidth: 0,
                        fontSize: '12px',
                        fontFamily: "'JetBrains Mono','Fira Code',monospace",
                        color: isNewest && streaming ? undefined : 'rgba(203,213,225,0.8)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {tool.title}
                    </span>

                    {/* Subtitle (stage/status) or category tag */}
                    <span style={{
                      fontSize: '9px',
                      fontFamily: "'JetBrains Mono','Fira Code',monospace",
                      color,
                      opacity: 0.6,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}>
                      {tool.subtitle ?? tool.category}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
