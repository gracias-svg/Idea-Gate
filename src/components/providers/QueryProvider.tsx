'use client';

// Pre-Mission-Control verification — wires TanStack Query into the app so
// ExecutionProvider (src/components/providers/ExecutionProvider.tsx) has
// the QueryClientProvider ancestor it needs to actually run.

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
