'use client';

// src/lib/useWorkspaceState.ts
// Mission 24 — Shared workspace state across Desk and Studio.
//
// Single source of truth for:
//   activeNodeId      — which artifact node is highlighted in the explorer
//   projectDisplayName — user-edited project name (overrides per-page defaults)
//
// Persistence: localStorage (survives reload)
// Cross-tab sync: BroadcastChannel 'ideagate-workspace'
//
// Pattern: read localStorage on mount → broadcast on write → receive broadcast → update state.
// No polling. No server round-trip. Sub-50ms cross-tab latency.

import { useState, useEffect, useCallback, useRef } from 'react';

const CHANNEL  = 'ideagate-workspace';
const KEY_NODE = 'ig-ws-active-node';
const KEY_NAME = 'ig-ws-project-name';

type WsMsg =
  | { type: 'ACTIVE_NODE'; nodeId: string | null }
  | { type: 'PROJECT_RENAME'; name: string };

export function useWorkspaceState() {
  const [activeNodeId, _setNode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(KEY_NODE);
  });

  const [projectDisplayName, _setName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(KEY_NAME);
  });

  const ch = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL);
    ch.current = channel;

    channel.onmessage = (e: MessageEvent<WsMsg>) => {
      const msg = e.data;
      if (msg.type === 'ACTIVE_NODE')    _setNode(msg.nodeId);
      if (msg.type === 'PROJECT_RENAME') _setName(msg.name);
    };

    return () => {
      channel.close();
      ch.current = null;
    };
  }, []);

  const setActiveNodeId = useCallback((nodeId: string | null) => {
    _setNode(nodeId);
    if (nodeId) localStorage.setItem(KEY_NODE, nodeId);
    else        localStorage.removeItem(KEY_NODE);
    ch.current?.postMessage({ type: 'ACTIVE_NODE', nodeId } as WsMsg);
  }, []);

  const setProjectDisplayName = useCallback((name: string) => {
    _setName(name);
    localStorage.setItem(KEY_NAME, name);
    ch.current?.postMessage({ type: 'PROJECT_RENAME', name } as WsMsg);
  }, []);

  return { activeNodeId, setActiveNodeId, projectDisplayName, setProjectDisplayName };
}
