'use client';

// Mission Control v1 — Batch M2 — MetricGrid.
// A grid of Foundation StatBlocks, max 4. Every metric carries a `context`
// string — the so-what rule (a bare number is banned). Reveals with
// staggerParent on mount. Presentation-only: the page maps runtime → items.

import { memo } from 'react';
import { motion } from 'framer-motion';
import StatBlock from '@/components/ui/StatBlock';
import { reveal, staggerParent } from '@/lib/motion/primitives';

export interface MetricItem {
  label: string;
  value: React.ReactNode;
  context: string;
  tone?: 'emerald' | 'caution' | 'neutral';
}

interface MetricGridProps {
  items: MetricItem[];
}

function MetricGridImpl({ items }: MetricGridProps) {
  const shown = items.slice(0, 4); // hard cap — 4 is the ceiling, not a target.
  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      animate="visible"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
      }}
    >
      {shown.map((m) => (
        <motion.div key={m.label} variants={reveal}>
          <StatBlock value={m.value} label={m.label} context={m.context} tone={m.tone} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default memo(MetricGridImpl);
