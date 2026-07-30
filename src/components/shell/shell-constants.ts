// src/components/shell/shell-constants.ts
// Mission 14 Phase 1 — Global Shell configuration.
// Pure data only. No React, no store imports. NavRail and CommandPalette
// read from this file so route strings and command definitions live in
// exactly one place.

export interface NavItem {
  id:    string;
  label: string;
  href:  string;
  /** lucide-react icon component name, resolved by the consuming component. */
  icon:  string;
}

// Four primary destinations. Settings currently opens as a TopBar-owned
// modal (there is no /settings route yet) — see NavRail.tsx handling.
export const NAV_ITEMS: NavItem[] = [
  { id: 'desk',     label: 'Desk',     href: '/desk',     icon: 'LayoutDashboard' },
  { id: 'studio',   label: 'Studio',   href: '/improve',  icon: 'Wand2'           },
  { id: 'mission-control', label: 'Mission Control', href: '/mission-control', icon: 'Network' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings2'       },
];

export type CmdAction =
  | 'navigate-desk'
  | 'navigate-studio'
  | 'navigate-mission-control'
  | 'new-idea'
  | 'start-lifecycle'
  | 'stop-lifecycle'
  | 'open-settings';

// 'Models' and 'Artifacts' are populated at runtime (model-registry.ts /
// DataProvider's live artifact list) — not static data, so they have no
// CMD_ITEMS entries below, but the type lives here since this is the one
// place CommandPalette.tsx and NavRail.tsx both read group/action shape from.
export type CmdGroup = 'Navigation' | 'Run Controls' | 'Workspace' | 'Models' | 'Artifacts';

export interface CmdItem {
  id:     string;
  label:  string;
  group:  CmdGroup;
  action: CmdAction;
}

export const CMD_ITEMS: CmdItem[] = [
  // Navigation
  { id: 'cmd-nav-desk',     label: 'Go to Desk',      group: 'Navigation', action: 'navigate-desk'   },
  { id: 'cmd-nav-studio',   label: 'Go to Studio',    group: 'Navigation', action: 'navigate-studio' },
  { id: 'cmd-nav-mc',       label: 'Go to Mission Control', group: 'Navigation', action: 'navigate-mission-control' },
  { id: 'cmd-open-settings',label: 'Open Settings',   group: 'Navigation', action: 'open-settings'   },
  // Run Controls
  { id: 'cmd-start',        label: 'Run Lifecycle',  group: 'Run Controls', action: 'start-lifecycle' },
  { id: 'cmd-stop',         label: 'Stop Lifecycle', group: 'Run Controls', action: 'stop-lifecycle'  },
  // Workspace
  { id: 'cmd-new-idea',     label: 'New Idea',        group: 'Workspace', action: 'new-idea'      },
];
