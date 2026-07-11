// Foundation Phase 1 — Batch F3 — Composition Primitives.
// Reusable NavRail + content column + StatusBar frame. NavRail and StatusBar
// already exist (Mission 14 Phase 1) and are imported as-is — this batch
// does not redesign navigation. layout.tsx currently wires these directly;
// AppShell is a composable alternative, not yet swapped into layout.tsx.

import type { ReactNode } from 'react';
import NavRail from './NavRail';
import StatusBar from './StatusBar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ig-canvas">
      <NavRail />
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
