'use client';

// src/components/shell/CommandPalette.tsx
// Mission 14 Phase 1 — Global Shell.
// Workflow Proof (2026-07-22): upgraded from a hand-rolled filter/keyboard-nav
// implementation to cmdk (github.com/pacocoursey/cmdk) — the same headless
// primitive Linear/Raycast-class palettes are built on. Fuzzy filtering,
// keyboard nav (arrows, vim bindings, Home/End, loop-around), and grouping
// are cmdk's, not reinvented here. This file supplies IdeaGate's own skin
// (--ig-* tokens, motion primitives) and wires cmdk's <Command.Item onSelect>
// to EXISTING app functions only — no new capability was invented.
//
// Architecture note: CommandPaletteContext needs a Provider ancestor of
// BOTH the palette overlay (rendered at the end of layout.tsx) and the
// Cmd+K trigger button (in TopBar, rendered earlier as a sibling). The
// Provider is exported from this same file (CommandPaletteProvider) rather
// than a new file, and layout.tsx wraps the shell with it.
//
// Styling convention: inline style objects + CSS custom properties (--ig-*
// Foundation tokens), matching TopBar.tsx / ArtifactTree.tsx. Tailwind IS
// configured in this repo, but this file predates that discovery and stays
// consistent with itself rather than mixing two styling systems mid-file.

import {
  createContext, useContext, useState, useCallback, useEffect, useMemo, useRef,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Command as Cmdk } from 'cmdk';
import { Search } from 'lucide-react';
import { CMD_ITEMS, type CmdItem, type CmdGroup } from './shell-constants';
import { useGlobalStore } from '@/lib/GlobalStore';
import { useData } from '@/lib/DataProvider';
import { getEnabledModels, resolveModelId } from '@/lib/model-registry';
import { humanName } from '@/lib/artifactDisplay';
import { easing } from '@/lib/motion/primitives';

// ── Context ───────────────────────────────────────────────────────────────────
interface CommandPaletteContextValue {
  isOpen: boolean;
  open:   () => void;
  close:  () => void;
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  isOpen: false,
  open:   () => {},
  close:  () => {},
});

export function useCommandPalette(): CommandPaletteContextValue {
  return useContext(CommandPaletteContext);
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open  = useCallback(() => setIsOpen(true),  []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global ⌘K / Ctrl+K trigger + ESC close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(v => !v);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

// ── Render item shape — unifies static CMD_ITEMS with the two runtime-
// populated groups (Models, Artifacts) into one list cmdk can filter/group. ──
interface RenderItem {
  id:      string;
  label:   string;
  group:   CmdGroup;
  meta?:   string;
  onSelect: () => void;
}

const GROUP_ORDER: CmdGroup[] = ['Navigation', 'Run Controls', 'Workspace', 'Models', 'Artifacts'];

// ── Palette overlay ───────────────────────────────────────────────────────────
export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const router = useRouter();
  const { state: globalState, updateSettings } = useGlobalStore();
  const settings = globalState.settings;
  const { state: dataState } = useData();

  const [query,       setQuery]       = useState('');
  const [hasError,    setHasError]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset transient state whenever the palette opens (open-empty state).
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setHasError(false);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const runStaticAction = useCallback((item: CmdItem) => {
    switch (item.action) {
      case 'navigate-desk':
        router.push('/desk');
        break;
      case 'navigate-studio':
        router.push('/improve');
        break;
      case 'navigate-office':
        router.push('/office');
        break;
      case 'stop-lifecycle':
        // Same trigger as TopBar's Stop button — direct API call, no
        // store state required.
        fetch('/api/run', { method: 'DELETE' }).catch(() => {});
        break;
      case 'new-idea':
        // TopBar owns the idea-reset logic (local state + resetWorkspace()
        // + window events + navigate) — this file has no access to that
        // local state, so it dispatches the same cross-component signal
        // TopBar already listens for (see TopBar.tsx handleNewIdea).
        window.dispatchEvent(new Event('ideagate:triggerNewIdea'));
        break;
      case 'start-lifecycle':
        // TODO: Run requires the idea text, which is local state owned
        // by TopBar (not in GlobalStore or RuntimeContext). Wiring
        // deferred until idea text has a shared home. Out of this task's
        // 4-item scope (Desk/Studio/Office nav, model switch, artifact
        // jump, New Idea).
        console.log(`[CommandPalette] action not wired: ${item.action}`);
        break;
      case 'open-settings':
        // TODO: Settings is a TopBar-local modal (no /settings route,
        // no store flag). Wiring deferred — out of scope, see above.
        console.log(`[CommandPalette] action not wired: ${item.action}`);
        break;
      default:
        console.log(`[CommandPalette] unknown action: ${item.action}`);
    }
  }, [router]);

  const activeModelId = resolveModelId(settings.defaultModel);

  // Unified, groupable item list. Static nav/run-control items reuse the
  // existing switch above; Models + Artifacts are populated at runtime from
  // functions that already exist elsewhere (model-registry, DataProvider) —
  // no new capability, just new entry points into it.
  const items: RenderItem[] = useMemo(() => {
    const staticItems: RenderItem[] = CMD_ITEMS.map(item => ({
      id: item.id,
      label: item.label,
      group: item.group,
      onSelect: () => runStaticAction(item),
    }));

    const modelItems: RenderItem[] = getEnabledModels().map(m => ({
      id: `model-${m.modelId}`,
      label: m.displayName,
      group: 'Models' as const,
      meta: m.modelId === activeModelId ? 'current' : undefined,
      onSelect: () => { updateSettings({ defaultModel: m.modelId }); close(); },
    }));

    const artifactItems: RenderItem[] = dataState.artifacts.map(file => ({
      id: `artifact-${file}`,
      label: humanName(file),
      group: 'Artifacts' as const,
      onSelect: () => {
        router.push(`/improve?artifact=${encodeURIComponent(file)}`);
        close();
      },
    }));

    return [...staticItems, ...modelItems, ...artifactItems];
  }, [runStaticAction, activeModelId, updateSettings, dataState.artifacts, router, close]);

  const groups = useMemo(() => {
    const map = new Map<CmdGroup, RenderItem[]>();
    for (const item of items) {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    }
    return GROUP_ORDER
      .filter(g => map.has(g))
      .map(g => [g, map.get(g)!] as const);
  }, [items]);

  const execute = useCallback((item: RenderItem) => {
    try {
      item.onSelect();
      close();
    } catch {
      setHasError(true);
    }
  }, [close]);

  // Closed state — not rendered at all.
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="cmdk-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: easing.out }}
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: '15vh',
        }}
      >
        <motion.div
          key="cmdk-modal"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.12, ease: easing.out }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '32rem',
            background: 'var(--ig-surface-overlay)',
            border: '1px solid var(--ig-border-default)',
            borderRadius: 'var(--ig-radius-lg)',
            boxShadow: 'var(--ig-elev-overlay)',
            overflow: 'hidden',
            fontFamily: 'var(--ig-font-mono)',
          }}
        >
          {hasError ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--status-error)', fontSize: 'var(--ig-t-body-size)', marginBottom: '12px' }}>
                Something went wrong.
              </div>
              <button
                onClick={close}
                style={{
                  padding: '6px 14px', background: 'transparent',
                  border: '1px solid var(--ig-border-default)', borderRadius: 'var(--ig-radius-md)',
                  color: 'var(--ig-text-secondary)', cursor: 'pointer', fontSize: 'var(--ig-t-label-size)',
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <Cmdk
              label="Command Menu"
              loop
              shouldFilter
              style={{ width: '100%' }}
            >
              {/* cmdk manages active-item tracking internally (uncontrolled —
                  see workflow-proof note below) via [data-selected] on each
                  [cmdk-item]. This file's convention is 100% inline styles,
                  but that state lives outside React (a store cmdk owns), so
                  it can't be read into a style prop without re-controlling
                  the value — which was tried and broke cmdk's built-in
                  first-item auto-select + keyboard nav (arrow keys had
                  nothing to move from). This scoped <style> tag is the
                  narrow exception: it styles cmdk's own attribute with the
                  same --ig-* tokens the rest of this file uses inline. */}
              <style>{`
                [cmdk-item] {
                  display: flex; align-items: center; justify-content: space-between;
                  padding: 8px 16px;
                  border-left: 2px solid transparent;
                  font-size: var(--ig-t-body-size);
                  color: var(--ig-text-secondary);
                  cursor: pointer;
                }
                [cmdk-item][data-selected="true"] {
                  border-left: 2px solid var(--ig-emerald);
                  color: var(--ig-text-primary);
                  background: var(--ig-emerald-muted);
                }
              `}</style>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '0 16px',
                borderBottom: '1px solid var(--ig-border-subtle)',
              }}>
                <Search size={14} color="var(--ig-text-tertiary)" style={{ flexShrink: 0 }} />
                <Cmdk.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Type a command or navigate..."
                  style={{
                    width: '100%', padding: '14px 0', boxSizing: 'border-box',
                    background: 'transparent', border: 'none',
                    color: 'var(--ig-text-primary)', fontSize: 'var(--ig-t-body-size)',
                    outline: 'none', fontFamily: 'var(--ig-font-mono)',
                  }}
                />
              </div>

              <Cmdk.List style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px 0' }}>
                <Cmdk.Empty style={{
                  padding: '20px', textAlign: 'center',
                  color: 'var(--ig-text-tertiary)', fontSize: 'var(--ig-t-body-size)',
                }}>
                  No commands found
                </Cmdk.Empty>

                {groups.map(([group, groupItems]) => (
                  <Cmdk.Group
                    key={group}
                    heading={
                      <div style={{
                        padding: '6px 16px 4px',
                        fontSize: 'var(--ig-t-caption-size)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--ig-text-secondary)',
                      }}>
                        {group}
                      </div>
                    }
                    style={{ marginBottom: '4px' }}
                  >
                    {groupItems.map(item => (
                      <Cmdk.Item
                        key={item.id}
                        value={item.label}
                        onSelect={() => execute(item)}
                      >
                        <span>{item.label}</span>
                        {item.meta && (
                          <span style={{
                            fontSize: 'var(--ig-t-caption-size)',
                            color: 'var(--ig-emerald)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}>
                            {item.meta}
                          </span>
                        )}
                      </Cmdk.Item>
                    ))}
                  </Cmdk.Group>
                ))}
              </Cmdk.List>
            </Cmdk>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
