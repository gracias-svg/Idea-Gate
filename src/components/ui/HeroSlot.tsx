// Foundation Phase 1 — Batch F3 — Composition Primitives.
// Wrapper for the workspace's primary focal content. alive=true signals a
// genuinely active/thinking state via the ig-glow shadow token (F1) —
// pair with the `breathe` motion primitive (F2) on the content itself,
// not on this wrapper.

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HeroSlotProps {
  children: ReactNode;
  alive?: boolean;
  className?: string;
}

export default function HeroSlot({ children, alive = false, className }: HeroSlotProps) {
  return (
    <div
      className={cn(
        'min-h-0 p-8',
        alive && 'shadow-ig-glow',
        className
      )}
    >
      {children}
    </div>
  );
}
