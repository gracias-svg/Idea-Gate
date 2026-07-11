'use client';

// Foundation Phase 1 — Batch F4 — Unified Execution Context.
// Data provider only — no UI. Drives useExecutionQuery so the execution
// store (src/lib/execution/store.ts) stays hydrated for any descendant
// that reads it. Wired into layout.tsx under QueryProvider (Pre-Mission-
// Control verification), which supplies the QueryClientProvider ancestor
// this needs.

import type { ReactNode } from 'react';
import { useExecutionQuery } from '@/lib/execution/query';

interface ExecutionProviderProps {
  children: ReactNode;
}

export default function ExecutionProvider({ children }: ExecutionProviderProps) {
  useExecutionQuery();
  return <>{children}</>;
}
