'use client';

// src/components/shell/NavRail.tsx
// Mission 14 Phase 1 — Global Shell.
// Vertical navigation rail. Replaces the desk/improve/office tab buttons
// that previously lived in TopBar.tsx. Reads routes from shell-constants.ts
// only — no hardcoded paths in JSX.
//
// Note: this project does not have Tailwind configured (no tailwind.config,
// no @tailwind directives in globals.css). Styling below uses inline style
// objects + CSS custom properties, matching the existing TopBar.tsx convention.

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Wand2, Network, Settings2, HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { NAV_ITEMS } from './shell-constants';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wand2,
  Network,
  Settings2,
};

const RAIL_WIDTH = 240;

export default function NavRail() {
  const pathname = usePathname();
  const router   = useRouter();

  // Empty state — no configured nav items. Render nothing rather than an
  // empty shell frame.
  if (!NAV_ITEMS || NAV_ITEMS.length === 0) return null;

  const mainItems    = NAV_ITEMS.filter(i => i.id !== 'settings');
  const settingsItem = NAV_ITEMS.find(i => i.id === 'settings');

  const renderItem = (item: typeof NAV_ITEMS[number]) => {
    const isActive = pathname?.startsWith(item.href) ?? false;
    const Icon = ICON_MAP[item.icon];

    // Error state (per-item): unresolved icon — fall back to a generic
    // icon-only control with a tooltip instead of crashing the rail.
    if (!Icon) {
      return (
        <button
          key={item.id}
          onClick={() => router.push(item.href)}
          title={item.label}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', margin: '0 auto',
            background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
            color: 'var(--text-secondary)',
          }}
        >
          <HelpCircle size={20} strokeWidth={1.5} />
        </button>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => router.push(item.href)}
        title={item.label}
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', gap: '12px',
          width: '100%', padding: '10px 16px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 'var(--text-label)',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          transition: 'color 150ms var(--ease-standard)',
          zIndex: 1,
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        {isActive && (
          <motion.div
            layoutId="nav-active-indicator"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute', inset: '2px 8px',
              background: 'var(--accent-muted)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              zIndex: -1,
            }}
          />
        )}
        <Icon
          size={20}
          strokeWidth={1.5}
          color={isActive ? 'var(--accent-primary)' : 'currentColor'}
          style={{ flexShrink: 0 }}
        />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <nav
      style={{
        width: RAIL_WIDTH,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a1a0e',
        borderRight: '1px solid #1a3a20',
        padding: '12px 0',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {mainItems.map(renderItem)}
      </div>

      {settingsItem && (
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          {renderItem(settingsItem)}
        </div>
      )}
    </nav>
  );
}

// Loading state (skeleton) — exported so a future data-driven NavRail
// (e.g. permission-gated items) can render this before NAV_ITEMS resolve.
// Not wired into default render because NAV_ITEMS is static config today.
export function NavRailSkeleton() {
  return (
    <nav
      style={{
        width: RAIL_WIDTH, flexShrink: 0, height: '100%',
        background: 'var(--surface-raised)',
        borderRight: '1px solid var(--border-default)',
        padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px',
      }}
    >
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            height: '36px', margin: '0 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--surface-raised)',
            opacity: 0.5 + (i * 0.05),
          }}
        />
      ))}
    </nav>
  );
}
