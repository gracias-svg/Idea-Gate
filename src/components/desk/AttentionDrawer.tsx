'use client';

// src/components/desk/AttentionDrawer.tsx
// Mission 16 — Attention drawer (replaces Mission 15's Priority Queue list).
//
// Behavior: not rendered when no stale/questionable artifacts exist.
// When items arrive: spring slide-down (stiffness 260, damping 28), ~300ms.
// "Review →" button is the ONLY interactive action per row — triggers the
// centered ArtifactReader (passed in as onReview). Clicking the row itself
// does nothing.
//
// Inline styles only. No Tailwind. No var(--ig-*) tokens.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

export interface AttentionItem {
  file:        string;
  health:      'stale' | 'questionable';
  downstreams: number;
  name:        string;
}

interface Props {
  items:    AttentionItem[];
  onReview: (file: string) => void;
}

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 28 };

export default function AttentionDrawer({ items, onReview }: Props) {
  return (
    <AnimatePresence initial={false}>
      {items.length > 0 && (
        <motion.div
          key="attention-drawer"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={SPRING}
          style={{ overflow: 'hidden', marginBottom: '32px' }}
        >
          <div>
            <div style={{
              fontSize: '9px', color: '#64748b', letterSpacing: '0.12em',
              fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' as const,
              ...MONO,
            }}>
              Needs your attention
            </div>

            {items.map((item, i) => {
              const hCol = item.health === 'stale' ? '#ef4444' : '#f59e0b';
              return (
                <div
                  key={item.file}
                  style={{
                    display:         'flex',
                    alignItems:      'center',
                    gap:             '12px',
                    height:          '40px',
                    padding:         '0 14px',
                    boxSizing:       'border-box' as const,
                    borderLeft:      `3px solid ${hCol}`,
                    borderBottom:    i < items.length - 1 ? '1px solid #0a1a2e' : 'none',
                    backgroundColor: 'transparent',
                  }}
                >
                  {/* Artifact name */}
                  <span style={{
                    flex: '1 1 auto', minWidth: 0,
                    fontSize: '14px', fontWeight: 500,
                    color: '#94a3b8',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    ...MONO,
                  }}>
                    {item.name}
                  </span>

                  {/* Health label */}
                  <span style={{ fontSize: '11px', color: hCol, flexShrink: 0, ...MONO }}>
                    {item.health === 'stale' ? 'Stale' : 'Questionable'}
                  </span>

                  {/* Downstream count */}
                  {item.downstreams > 0 && (
                    <span style={{ fontSize: '11px', color: '#334155', flexShrink: 0, ...MONO }}>
                      {item.downstreams} downstream
                    </span>
                  )}

                  {/* Review → — the sole action; opens centered ArtifactReader overlay */}
                  <button
                    onClick={() => onReview(item.file)}
                    style={{
                      background:   'transparent',
                      border:       'none',
                      color:        hCol,
                      fontSize:     '12px',
                      cursor:       'pointer',
                      flexShrink:   0,
                      padding:      '0',
                      lineHeight:   1,
                      ...MONO,
                    }}
                  >
                    Review →
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
