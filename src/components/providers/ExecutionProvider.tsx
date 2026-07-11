'use client';

// Foundation Phase 1 — Batch F4 — Unified Execution Context.
// Data provider only — no UI. Drives useExecutionQuery so the execution
// store (src/lib/execution/store.ts) stays hydrated for any descendant
// that reads it. Not wired into layout.tsx yet: it needs a QueryClientProvider
// ancestor, which this batch does not add — that's a follow-up wiring step,
// not a foundation-phase concern.

import type { ReactNode } from 'react';
import { useExecutionQuery } from '@/lib/execution/query';

interface ExecutionProviderProps {
  children: ReactNode;
}

export default function ExecutionProvider({ children }: ExecutionProviderProps) {
  useExecutionQuery();
  return <>{children}</>;
}
