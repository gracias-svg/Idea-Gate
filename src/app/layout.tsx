// src/app/layout.tsx
// Provider hierarchy (inner to outer):
//   RuntimeContext  → shared event bus, artifact graph, stale tracking, telemetry
//   GlobalStore     → settings, improvement history, ref docs (localStorage)
//   DataProvider    → artifact list polling, agent state polling
//   TopBar          → global navigation

import type { Metadata } from 'next';
import './globals.css';
import TopBar from '@/components/TopBar';
import { DataProvider } from '@/lib/DataProvider';
import { GlobalStore } from '@/lib/GlobalStore';
import { RuntimeContext } from '@/lib/RuntimeContext';

export const metadata: Metadata = {
  title:       'IdeaGate — AI-Native PM Operating System',
  description: 'Multi-agent product lifecycle orchestration. Idea to prototype in 14 enforced stages.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin:          0,
        padding:         0,
        backgroundColor: '#020609',
        fontFamily:      "'JetBrains Mono','Fira Code',monospace",
        overflowX:       'hidden',
      }}>
        <RuntimeContext>
          <GlobalStore>
            <DataProvider>
              <TopBar />
              {children}
            </DataProvider>
          </GlobalStore>
        </RuntimeContext>
      </body>
    </html>
  );
}
