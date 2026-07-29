'use client';

// src/lib/usePanelState.ts
// Mission 6 — reusable panel collapse/expand hook.
//
// Hydration-safe: always initialises with defaultCollapsed so the server
// pre-render matches the first client render. localStorage sync happens
// after hydration in a useEffect — standard Next.js App Router pattern.
//
// API is forward-compatible: `width` and `setWidth` exist now so a future
// drag-to-resize feature doesn't require a call-site API change. Only
// `collapsed` and `toggle` ship in this mission.

import { useState, useCallback, useEffect } from 'react';

export interface PanelState {
  collapsed: boolean;
  toggle: () => void;
  width: number;
  setWidth: (w: number) => void;
}

export function usePanelState(
  key: string,
  defaultWidth: number,
  defaultCollapsed = false,
): PanelState {
  const storageKey = `ig_panel_${key}`;

  // Always start with defaultCollapsed — same value as SSR, no hydration mismatch.
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed);

  // After hydration, sync from localStorage if a stored value exists.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) setCollapsed(JSON.parse(stored) as boolean);
    } catch { /* quota or parse error */ }
  }, [storageKey]);

  const [width, setWidthState] = useState<number>(defaultWidth);

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, [storageKey]);

  const setWidth = useCallback((w: number) => {
    setWidthState(w);
  }, []);

  return { collapsed, toggle, width, setWidth };
}
