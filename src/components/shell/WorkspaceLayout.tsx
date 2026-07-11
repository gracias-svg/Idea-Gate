// Foundation Phase 1 — Batch F3 — Composition Primitives.
// Three-column workspace grammar: hero (primary focus) + supporting (right
// rail) + vitals (thin status strip). rail is reserved for a future left
// auxiliary column and is optional.

import type { ReactNode } from 'react';

interface WorkspaceLayoutProps {
  hero: ReactNode;
  supporting?: ReactNode;
  rail?: ReactNode;
  vitals?: ReactNode;
}

export default function WorkspaceLayout({ hero, supporting, rail, vitals }: WorkspaceLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {vitals && (
        <div className="max-h-[36px] flex-shrink-0 overflow-hidden">
          {vitals}
        </div>
      )}
      <div className="flex flex-1 min-h-0 gap-4">
        {rail && (
          <div className="flex-shrink-0">
            {rail}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {hero}
        </div>
        {supporting && (
          <div className="w-[300px] flex-shrink-0">
            {supporting}
          </div>
        )}
      </div>
    </div>
  );
}
