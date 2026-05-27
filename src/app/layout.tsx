// src/app/layout.tsx
// Root layout — wraps all pages with providers.
// Providers (innermost to outermost):
//   GlobalStore   → shared settings, improvement history, ref docs
//   DataProvider  → artifact list and polling state

import type { Metadata } from 'next';
import './globals.css';
import TopBar from '@/components/TopBar';
import { DataProvider } from '@/lib/DataProvider';
import { GlobalStore } from '@/lib/GlobalStore';

export const metadata: Metadata = {
  title:       'IdeaGate — AI-Native PM Operating System',
  description: 'Multi-agent product lifecycle orchestration from idea to prototype',
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
        {/* GlobalStore must be outermost — provides settings, history, ref docs to all pages */}
        <GlobalStore>
          {/* DataProvider — polls /api/data and /api/agents, exposes artifact list */}
          <DataProvider>
            {/* TopBar is global navigation — reads from both providers */}
            <TopBar />
            {children}
          </DataProvider>
        </GlobalStore>
      </body>
    </html>
  );
}
