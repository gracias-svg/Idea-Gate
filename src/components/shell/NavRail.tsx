'use client';

// src/components/shell/NavRail.tsx
// Mission 14 Phase 1 — Global Shell.
// Mission 7 B1 — Collapsible nav rail.
//
// Collapse control lives INSIDE the rail (bottom, below Settings) — not an
// external floating tab. Reuses usePanelState('nav') for localStorage
// persistence, same pattern as Studio's left/right panels.
//
// Collapsed: ~56px wide, icon-only, labels hidden. Native `title` attribute
// provides hover tooltips — no extra component needed.
//
// Width transitions via CSS transition (200ms ease-in-out) matching the
// Studio panel collapse timing (Constitution §13: Save state transition 200ms
// ease-in-out is the nearest motion primitive).
//
// Note: no Tailwind configured in this project — all styling is inline
// style objects + CSS custom properties, matching TopBar.tsx convention.

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Wand2, Network, Settings2, HelpCircle,
  ChevronLeft, ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { NAV_ITEMS } from './shell-constants';
import { usePanelState } from '@/lib/usePanelState';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wand2,
  Network,
  Settings2,
};

const RAIL_WIDTH           = 240;
const RAIL_COLLAPSED_WIDTH = 56;

export default function NavRail() {
  const pathname = usePathname();
  const router   = useRouter();

  // B1 — Collapsible rail. key: 'nav', default 240px, default expanded.
  // Hydration-safe: usePanelState always inits with defaultCollapsed=false
  // (matches SSR), then syncs from localStorage after mount.
  const { collapsed, toggle } = usePanelState('nav', RAIL_WIDTH, false);

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
        // Native tooltip: always-on, especially useful when collapsed. Per Constitution
        // §15 (hover tooltip after 400ms delay) — native `title` matches this exactly.
        title={item.label}
        aria-label={item.label}
        // C4 — ig-interactive-row adds 80ms ease-out background hover;
        // active state is handled by the motion.div overlay (not data-active).
        className="ig-interactive-row"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          // Collapsed: center the icon. Expanded: left-align with gap for label.
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : '12px',
          width: '100%',
          // Collapsed: equal padding both sides to center icon in 56px.
          // Expanded: original 10px 16px.
          padding: collapsed ? '10px 18px' : '10px 16px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 'var(--text-label)',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          transition: 'color 150ms var(--ease-standard)',
          zIndex: 1,
          // Clip label text during collapse animation
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        {isActive && (
          <motion.div
            layoutId="nav-active-indicator"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute',
              inset: collapsed ? '2px 4px' : '2px 8px',
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
        {/* Label — hidden in collapsed state. CSS overflow:hidden + whiteSpace:nowrap
            clips gracefully during the width animation without flashing. */}
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  return (
    <nav
      style={{
        // B1 — width animates between expanded (240px) and collapsed (56px).
        // Same 200ms ease-in-out as Studio's left/right panel collapse.
        width: collapsed ? `${RAIL_COLLAPSED_WIDTH}px` : `${RAIL_WIDTH}px`,
        transition: 'width 200ms ease-in-out',
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a1a0e',
        borderRight: '1px solid #1a3a20',
        padding: '12px 0',
        overflow: 'hidden',
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

      {/* B1 — Collapse toggle: inside the rail, full-width, 32px tall, below Settings.
          Chevron points left (collapse) or right (expand), matching the direction
          the rail moves. No external floating tab — control lives in the rail itself. */}
      <button
        onClick={toggle}
        aria-label={collapsed ? 'Expand navigation rail' : 'Collapse navigation rail'}
        title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '32px', flexShrink: 0,
          background: 'none', border: 'none', cursor: 'pointer',
          borderTop: '1px solid #1a3a2033',
          color: '#334155',
          marginTop: '4px',
          // Subtle hover: same 80ms ease-out the rest of the rail uses
          transition: 'color 80ms ease-out, background-color 80ms ease-out',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.color = '#334155';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        {collapsed
          ? <ChevronRight size={14} strokeWidth={1.5} />
          : <ChevronLeft  size={14} strokeWidth={1.5} />
        }
      </button>
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
