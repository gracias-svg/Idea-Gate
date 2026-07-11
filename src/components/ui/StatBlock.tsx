// Foundation Phase 1 — Batch F3 — Composition Primitives.
// A single metric: value + label, with optional context line and trend.
// context is required outside the vitals strip (Foundation spec §12,
// "never a bare number without what it means") — logs a dev warning if
// omitted so vitals-only usage stays intentional, not an oversight.

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'emerald' | 'caution' | 'neutral';

interface StatBlockProps {
  value: ReactNode;
  label: string;
  context?: string;
  tone?: Tone;
  trend?: ReactNode;
  /** Set true only for compact vitals-strip usage, where context is intentionally omitted. */
  inVitals?: boolean;
}

const toneClass: Record<Tone, string> = {
  emerald: 'text-ig-emerald',
  caution: 'text-ig-caution',
  neutral: 'text-ig-text-primary',
};

export default function StatBlock({ value, label, context, tone = 'neutral', trend, inVitals = false }: StatBlockProps) {
  if (!context && !inVitals && process.env.NODE_ENV !== 'production') {
    console.warn(`StatBlock "${label}" is missing context outside the vitals strip.`);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className={cn('text-4xl font-bold tracking-tight', toneClass[tone])}>
          {value}
        </span>
        {trend}
      </div>
      <span className="font-mono text-xs uppercase tracking-widest text-ig-text-secondary">
        {label}
      </span>
      {context && (
        <span className="text-xs text-ig-text-tertiary">
          {context}
        </span>
      )}
    </div>
  );
}
