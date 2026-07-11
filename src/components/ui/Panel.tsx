// Foundation Phase 1 — Batch F3 — Composition Primitives.
// Base surface for grouped content. elevation maps to the ig-elev shadow
// tokens (F1); density controls internal padding.

import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const panelVariants = cva(
  'rounded-lg bg-ig-surface',
  {
    variants: {
      elevation: {
        1: 'shadow-ig-1',
        2: 'shadow-ig-2',
      },
      density: {
        comfortable: 'p-6',
        compact: 'p-4',
      },
    },
    defaultVariants: {
      elevation: 1,
      density: 'comfortable',
    },
  }
);

interface PanelProps extends VariantProps<typeof panelVariants> {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Panel({ title, children, elevation, density, className }: PanelProps) {
  return (
    <div className={cn(panelVariants({ elevation, density }), className)}>
      {title && (
        <div className="mb-3 font-mono text-xs uppercase tracking-widest text-ig-text-tertiary">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
