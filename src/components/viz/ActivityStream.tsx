'use client';

// Mission Control v1 — Batch M2 — ActivityStream.
// Reverse-chronological event list, mono. Items reveal with staggerParent on
// entry. Presentation-only: the page maps runtime events → ActivityItem before
// they reach here (this component never sees `agentsByStage` or timestamps as
// runtime concepts — just a pre-formatted `time` string).

import { memo } from 'react';
import { motion } from 'framer-motion';
import { reveal, staggerParent } from '@/lib/motion/primitives';

export interface ActivityItem {
  id: string;
  label: string;
  detail?: string;
  time: string;
  tone?: 'emerald' | 'caution' | 'neutral';
}

interface ActivityStreamProps {
  items: ActivityItem[];
  emptyHint?: string;
}

const dotColor = (tone: ActivityItem['tone']) =>
  tone === 'emerald' ? 'var(--ig-emerald)'
    : tone === 'caution' ? 'var(--ig-caution)'
      : 'var(--ig-text-tertiary)';

function ActivityStreamImpl({ items, emptyHint }: ActivityStreamProps) {
  if (items.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--ig-font-mono)', fontSize: 11, color: 'var(--ig-text-tertiary)' }}>
        {emptyHint ?? 'Events will appear here as the organisation works.'}
      </div>
    );
  }

  return (
    <motion.ul
      variants={staggerParent}
      initial="hidden"
      animate="visible"
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {items.map((e) => (
        <motion.li
          key={e.id}
          variants={reveal}
          style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}
        >
          <span
            style={{
              flexShrink: 0,
              width: 5, height: 5, marginTop: 5,
              borderRadius: '50%',
              background: dotColor(e.tone),
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--ig-font-mono)', fontSize: 11.5, color: 'var(--ig-text-primary)' }}>
              {e.label}
            </div>
            {e.detail && (
              <div style={{ fontFamily: 'var(--ig-font-mono)', fontSize: 10.5, color: 'var(--ig-text-tertiary)' }}>
                {e.detail}
              </div>
            )}
          </div>
          <span style={{ flexShrink: 0, fontFamily: 'var(--ig-font-mono)', fontSize: 10, color: 'var(--ig-text-tertiary)' }}>
            {e.time}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

export default memo(ActivityStreamImpl);
