'use client';

// src/components/shell/CommandPalette.tsx
// Mission 14 Phase 1 — Global Shell.
// Foundational Cmd+K palette: navigation + run controls only. No AI chat,
// no prompt generation, no automation (out of Mission 14 scope).
//
// Architecture note: CommandPaletteContext needs a Provider ancestor of
// BOTH the palette overlay (rendered at the end of layout.tsx) and the
// Cmd+K trigger button (in TopBar, rendered earlier as a sibling). The
// Runbook said "no separate provider file needed yet" — so the Provider
// is exported from this same file (CommandPaletteProvider) rather than a
// new file, and layout.tsx wraps the shell with it.
//
// This project has no Tailwind configured — styling uses inline style
// objects + CSS custom properties, matching TopBar.tsx's existing convention.

import {
  createContext, useContext, useState, useCallback, useEffect, useMemo, useRef,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CMD_ITEMS, type CmdItem } from './shell-constants';

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

// ── Palette overlay ───────────────────────────────────────────────────────────
export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const router = useRouter();

  const [query,       setQuery]       = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasError,    setHasError]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset transient state whenever the palette opens (open-empty state).
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setHasError(false);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CMD_ITEMS;
    return CMD_ITEMS.filter(
      i => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)
    );
  }, [query]);

  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, CmdItem[]>();
    for (const item of filtered) {
      if (!map.has(item.group)) { map.set(item.group, []); order.push(item.group); }
      map.get(item.group)!.push(item);
    }
    return order.map(g => [g, map.get(g)!] as const);
  }, [filtered]);

  const execute = useCallback((item: CmdItem) => {
    try {
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
          // TODO: no GlobalStore action exists for "new idea" — TopBar
          // implements it inline (local state reset + resetWorkspace() +
          // window events + navigate). Wiring deferred until that logic
          // is lifted to a shared location. Not guessing the store shape.
          console.log(`[CommandPalette] action not wired: ${item.action}`);
          break;
        case 'start-lifecycle':
          // TODO: Run requires the idea text, which is local state owned
          // by TopBar (not in GlobalStore or RuntimeContext). Wiring
          // deferred until idea text has a shared home.
          console.log(`[CommandPalette] action not wired: ${item.action}`);
          break;
        case 'open-settings':
          // TODO: Settings is a TopBar-local modal (no /settings route,
          // no store flag). Wiring deferred.
          console.log(`[CommandPalette] action not wired: ${item.action}`);
          break;
        case 'select-model':
          // TODO: no store action exists to open the model selector
          // dropdown programmatically. Wiring deferred.
          console.log(`[CommandPalette] action not wired: ${item.action}`);
          break;
        default:
          console.log(`[CommandPalette] unknown action: ${item.action}`);
      }
      close();
    } catch {
      setHasError(true);
    }
  }, [router, close]);

  // Keyboard navigation within the open palette
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Cycle to the first item of the next group
        if (groups.length > 1) {
          const flat = groups.flatMap(([, items]) => items);
          const current = flat[activeIndex];
          const currentGroupIdx = groups.findIndex(([g]) => g === current?.group);
          const nextGroupIdx = (currentGroupIdx + 1) % groups.length;
          const nextGroupFirstItem = groups[nextGroupIdx][1][0];
          setActiveIndex(flat.findIndex(i => i.id === nextGroupFirstItem.id));
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const flat = groups.flatMap(([, items]) => items);
        const item = flat[activeIndex];
        if (item) execute(item);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, filtered, groups, activeIndex, execute]);

  // Closed state — not rendered at all.
  if (!isOpen) return null;

  const flat = groups.flatMap(([, items]) => items);

  return (
    <AnimatePresence>
      <motion.div
        key="cmdk-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
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
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '32rem',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-panel)',
            overflow: 'hidden',
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
          }}
        >
          {hasError ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--status-error)', fontSize: 'var(--text-body)', marginBottom: '12px' }}>
                Something went wrong.
              </div>
              <button
                onClick={close}
                style={{
                  padding: '6px 14px', background: 'transparent',
                  border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-label)',
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
                placeholder="Type a command or navigate..."
                style={{
                  width: '100%', padding: '14px 16px', boxSizing: 'border-box',
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)', fontSize: 'var(--text-body)',
                  outline: 'none', fontFamily: "'JetBrains Mono','Fira Code',monospace",
                }}
              />

              <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px 0' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-body)' }}>
                    No commands found
                  </div>
                ) : (
                  groups.map(([group, items]) => (
                    <div key={group} style={{ marginBottom: '4px' }}>
                      <div style={{
                        padding: '6px 16px 4px',
                        fontSize: 'var(--text-caption)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--text-secondary)',
                      }}>
                        {group}
                      </div>
                      {items.map(item => {
                        const idx = flat.findIndex(i => i.id === item.id);
                        const isActive = idx === activeIndex;
                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => execute(item)}
                            style={{
                              padding: '8px 16px',
                              fontSize: 'var(--text-body)',
                              color: isActive ? 'var(--text-on-accent)' : 'var(--text-primary)',
                              background: isActive ? 'var(--accent-primary)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'background 100ms var(--ease-standard)',
                            }}
                          >
                            {item.label}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
