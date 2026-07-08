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
  { id: 'office',   label: 'Office',   href: '/office',   icon: 'Network'         },
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings2'       },
];

export type CmdAction =
  | 'navigate-desk'
  | 'navigate-studio'
  | 'navigate-office'
  | 'new-idea'
  | 'start-lifecycle'
  | 'stop-lifecycle'
  | 'open-settings'
  | 'select-model';

export type CmdGroup = 'Navigation' | 'Run Controls' | 'Workspace';

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
  { id: 'cmd-nav-office',   label: 'Go to Office',    group: 'Navigation', action: 'navigate-office' },
  { id: 'cmd-open-settings',label: 'Open Settings',   group: 'Navigation', action: 'open-settings'   },
  // Run Controls
  { id: 'cmd-start',        label: 'Run Lifecycle',  group: 'Run Controls', action: 'start-lifecycle' },
  { id: 'cmd-stop',         label: 'Stop Lifecycle', group: 'Run Controls', action: 'stop-lifecycle'  },
  // Workspace
  { id: 'cmd-new-idea',     label: 'New Idea',        group: 'Workspace', action: 'new-idea'      },
  { id: 'cmd-select-model', label: 'Select Model',    group: 'Workspace', action: 'select-model'  },
];
