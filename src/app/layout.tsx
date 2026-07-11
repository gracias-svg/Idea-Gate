// src/app/layout.tsx
// Provider hierarchy (inner to outer):
//   RuntimeContext          → shared event bus, artifact graph, stale tracking, telemetry
//   GlobalStore             → settings, improvement history, ref docs (localStorage)
//   DataProvider            → artifact list polling, agent state polling
//   CommandPaletteProvider  → Cmd+K open/close state (Mission 14 Phase 1)
//   NavRail / TopBar / StatusBar → global shell chrome around {children}
//
// Note: desk/improve/office pages each size their own root container to
// height:100vh with overflow:hidden. The shell's <main> uses overflow:'auto'
// (not 'hidden') so that assumption can never clip page content — this is
// a deliberate deviation from a literal overflow-hidden spec, made to avoid
// a regression, not an oversight.

import type { Metadata } from 'next';
import './globals.css';
import TopBar from '@/components/TopBar';
import { DataProvider } from '@/lib/DataProvider';
import { GlobalStore } from '@/lib/GlobalStore';
import { RuntimeContext } from '@/lib/RuntimeContext';
import NavRail from '@/components/shell/NavRail';
import StatusBar from '@/components/shell/StatusBar';
import CommandPalette, { CommandPaletteProvider } from '@/components/shell/CommandPalette';
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title:       'IdeaGate — AI-Native PM Operating System',
  description: 'Multi-agent product lifecycle orchestration. Idea to prototype in 14 enforced stages.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", GeistSans.variable)}>
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
              <CommandPaletteProvider>
                <div className="ideagate-shell" style={{
                  display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden',
                  background: 'var(--surface-base)',
                }}>
                  <NavRail />
                  <div style={{
                    display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden',
                  }}>
                    <TopBar />
                    <main style={{ flex: 1, overflow: 'auto' }}>
                      {children}
                    </main>
                    <StatusBar />
                  </div>
                </div>
                <CommandPalette />
              </CommandPaletteProvider>
            </DataProvider>
          </GlobalStore>
        </RuntimeContext>
      </body>
    </html>
  );
}
