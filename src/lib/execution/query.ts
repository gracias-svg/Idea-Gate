// Foundation Phase 1 — Batch F4 — Unified Execution Context.
// Polls the same endpoint and cadence StatusBar already uses for its own
// local state (GET /api/journey-state, 4s) — this hook is the shared
// version other execution-aware components should adopt instead of
// each polling independently.

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useExecutionStore } from './store';
import type { JourneyStateResponse } from './types';

async function fetchJourneyState(): Promise<JourneyStateResponse> {
  const res = await fetch('/api/journey-state');
  if (!res.ok) throw new Error(`journey-state fetch failed: ${res.status}`);
  return res.json();
}

export function useExecutionQuery() {
  const hydrate = useExecutionStore((s) => s.hydrate);

  const query = useQuery({
    queryKey: ['journey-state'],
    queryFn: fetchJourneyState,
    refetchInterval: 4000,
    retry: true,
  });

  // v5 dropped onSuccess from useQuery — react to data changes instead.
  // Errors are swallowed here by design (silent retry): refetchInterval
  // keeps polling on its own schedule regardless of query error state.
  useEffect(() => {
    if (query.data) hydrate(query.data);
  }, [query.data, hydrate]);

  return query;
}
