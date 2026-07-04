'use client';

// src/lib/RuntimeContext.tsx
//
// THE IDEAGATE RUNTIME — shared operational state for all three views.
//
// Operational semantics:
// • ARTIFACT_GRAPH: directed dependency graph of all 15 lifecycle artifacts.
//   When artifact A is modified, all downstream dependents are marked stale.
// • EVENT_BUS: BroadcastChannel across browser tabs. Improve in one tab,
//   Office Mission Control feed updates in real-time in another.
// • STALE ENGINE: transitive dependency walk. Modifying discovery.md marks
//   problem-definition, solution-design, mvp-hypothesis, PRD, UX, backlog,
//   all downstream as stale simultaneously.
// • TELEMETRY: session-level token consumption, cost, improvement count.
// • REASONING CHAIN: each improvement's PM reasoning is stored and linked
//   to the artifact, preserving a full audit trail.

import React, {
  createContext, useContext, useReducer, useEffect,
  useCallback, ReactNode, useRef,
} from 'react';

// ── Artifact dependency graph ─────────────────────────────────────────────────
// Maps artifact → its direct upstream dependencies.
// "I depend on these" → if they change, I become stale.
export const ARTIFACT_DEPS: Record<string, string[]> = {
  '0-idea-intake.md':                  [],
  '1-discovery.md':                    ['0-idea-intake.md'],
  '2-problem-definition.md':           ['1-discovery.md'],
  '3-solution-design.md':              ['2-problem-definition.md'],
  '4-mvp-hypothesis.md':               ['3-solution-design.md', '2-problem-definition.md'],
  '5-validation.md':                   ['4-mvp-hypothesis.md'],
  '6-prioritization.md':               ['5-validation.md', '4-mvp-hypothesis.md'],
  '7-prd.md':                          ['6-prioritization.md', '3-solution-design.md'],
  '8-ux-design.md':                    ['7-prd.md', '3-solution-design.md'],
  '9-usability-planning.md':           ['8-ux-design.md'],
  '10-architecture.md':                ['7-prd.md', '4-mvp-hypothesis.md'],
  '11-backlog-&-release-planning.md':  ['10-architecture.md', '6-prioritization.md'],
  '12-implementation-planning.md':     ['11-backlog-&-release-planning.md', '7-prd.md'],
  '13-qa-&-readiness.md':              ['12-implementation-planning.md', '9-usability-planning.md'],
  '14-prototype-prompt.md':            ['13-qa-&-readiness.md', '10-architecture.md'],
};

export const ALL_ARTIFACTS = Object.keys(ARTIFACT_DEPS);

// Get all DIRECT downstream dependents of an artifact (who depends on me?)
export function getDirectDownstream(artifact: string): string[] {
  return Object.entries(ARTIFACT_DEPS)
    .filter(([, deps]) => deps.includes(artifact))
    .map(([art]) => art);
}

// Get ALL transitive downstream dependents (recursive)
export function getTransitiveDownstream(artifact: string): string[] {
  const visited = new Set<string>();
  const queue   = [artifact];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const [art, deps] of Object.entries(ARTIFACT_DEPS)) {
      if (deps.includes(current) && !visited.has(art)) {
        visited.add(art);
        queue.push(art);
      }
    }
  }
  return Array.from(visited);
}

// ── Runtime event types ───────────────────────────────────────────────────────
// Every event has operational meaning — not UI events, but system state changes.
export type RuntimeEventType =
  | 'ARTIFACT_IMPROVED'        // An artifact was updated by LLM + accepted
  | 'ARTIFACTS_STALE'          // Downstream artifacts marked stale after update
  | 'ARTIFACT_VIEWED'          // An artifact was opened for viewing
  | 'ORCHESTRATION_STARTED'    // V2 CLI lifecycle started
  | 'ORCHESTRATION_STAGE'      // A lifecycle stage completed
  | 'ORCHESTRATION_COMPLETE'   // All 14 stages complete
  | 'MODEL_ROUTED'             // Model selection decision made
  | 'AGENT_ACTIVATED'          // An agent started processing
  | 'AGENT_COMPLETED'          // An agent finished processing
  | 'STALE_CLEARED'            // User manually cleared stale state
  | 'SNAPSHOT_TAKEN';          // Project snapshot saved

export interface RuntimeEvent {
  id:        string;
  type:      RuntimeEventType;
  timestamp: string;
  payload:   Record<string, unknown>;
}

// ── Reasoning chain entry ─────────────────────────────────────────────────────
export interface ReasoningEntry {
  artifactName: string;
  intent:       string;
  reasoning:    string;
  model:        string;
  impactWarnings: string[];
  timestamp:    string;
}

// ── Runtime state ─────────────────────────────────────────────────────────────
export interface RuntimeState {
  // Artifact graph state
  staleArtifacts:    Set<string>;           // artifacts needing review
  artifactVersions:  Record<string, number>; // version counter per artifact
  lastModified:      Record<string, string>; // ISO timestamp per artifact

  // Reasoning continuity
  reasoningChain:    ReasoningEntry[];       // all improvement reasoning, ordered

  // Observability telemetry
  sessionTokens:     number;
  sessionCost:       number;
  improvementCount:  number;
  events:            RuntimeEvent[];         // last 50 events across all tabs

  // Orchestration state
  orchestrationActive: boolean;
  currentStage:        number;
  agentStates:         Record<string, 'idle' | 'working' | 'done' | 'blocked'>;
}

// ── Actions ───────────────────────────────────────────────────────────────────
type RuntimeAction =
  | { type: 'EMIT_EVENT';        event: Omit<RuntimeEvent, 'id' | 'timestamp'> }
  | { type: 'MARK_IMPROVED';     artifact: string; reasoning: ReasoningEntry; tokens: number; cost: number }
  | { type: 'MARK_STALE';        artifacts: string[] }
  | { type: 'CLEAR_STALE';       artifacts?: string[] }       // clear specific or all
  | { type: 'SET_AGENT_STATE';   agent: string; state: 'idle'|'working'|'done'|'blocked' }
  | { type: 'SET_STAGE';         stage: number }
  | { type: 'HYDRATE';           state: Partial<RuntimeState> }
  | { type: 'RESET_WORKSPACE' };   // Mission 13 (P-NEW-6): full reset for "New Idea"

const DEFAULT_STATE: RuntimeState = {
  staleArtifacts:      new Set(),
  artifactVersions:    {},
  lastModified:        {},
  reasoningChain:      [],
  sessionTokens:       0,
  sessionCost:         0,
  improvementCount:    0,
  events:              [],
  orchestrationActive: false,
  currentStage:        0,
  agentStates:         { CO:'idle', PS:'idle', RE:'idle', UX:'idle', AR:'idle', QA:'idle' },
};

function makeEventId(): string {
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
}

function reducer(state: RuntimeState, action: RuntimeAction): RuntimeState {
  switch (action.type) {

    case 'EMIT_EVENT': {
      const ev: RuntimeEvent = {
        id:        makeEventId(),
        timestamp: new Date().toISOString(),
        type:      action.event.type,
        payload:   action.event.payload,
      };
      return { ...state, events: [ev, ...state.events].slice(0, 50) };
    }

    case 'MARK_IMPROVED': {
      const { artifact, reasoning, tokens, cost } = action;
      const downstream = getTransitiveDownstream(artifact);
      const newStale   = new Set(state.staleArtifacts);
      downstream.forEach(d => newStale.add(d));
      // Clear the improved artifact from stale
      newStale.delete(artifact);

      const improvedEvent: RuntimeEvent = {
        id:        makeEventId(),
        timestamp: new Date().toISOString(),
        type:      'ARTIFACT_IMPROVED',
        payload:   { artifact, model: reasoning.model, tokens, cost, downstream: downstream.length },
      };
      const staleEvent: RuntimeEvent | null = downstream.length > 0 ? {
        id:        makeEventId(),
        timestamp: new Date().toISOString(),
        type:      'ARTIFACTS_STALE',
        payload:   { artifacts: downstream, triggeredBy: artifact },
      } : null;

      const newEvents = staleEvent
        ? [staleEvent, improvedEvent, ...state.events].slice(0, 50)
        : [improvedEvent, ...state.events].slice(0, 50);

      return {
        ...state,
        staleArtifacts:   newStale,
        artifactVersions: { ...state.artifactVersions, [artifact]: (state.artifactVersions[artifact] ?? 0) + 1 },
        lastModified:     { ...state.lastModified, [artifact]: new Date().toISOString() },
        reasoningChain:   [reasoning, ...state.reasoningChain].slice(0, 100),
        sessionTokens:    state.sessionTokens + tokens,
        sessionCost:      state.sessionCost + cost,
        improvementCount: state.improvementCount + 1,
        events:           newEvents,
      };
    }

    case 'MARK_STALE': {
      const newStale = new Set(state.staleArtifacts);
      action.artifacts.forEach(a => newStale.add(a));
      const ev: RuntimeEvent = { id: makeEventId(), timestamp: new Date().toISOString(), type: 'ARTIFACTS_STALE', payload: { artifacts: action.artifacts } };
      return { ...state, staleArtifacts: newStale, events: [ev, ...state.events].slice(0, 50) };
    }

    case 'CLEAR_STALE': {
      const newStale = new Set(state.staleArtifacts);
      if (action.artifacts) { action.artifacts.forEach(a => newStale.delete(a)); }
      else { newStale.clear(); }
      const ev: RuntimeEvent = { id: makeEventId(), timestamp: new Date().toISOString(), type: 'STALE_CLEARED', payload: { count: state.staleArtifacts.size } };
      return { ...state, staleArtifacts: newStale, events: [ev, ...state.events].slice(0, 50) };
    }

    case 'SET_AGENT_STATE':
      return { ...state, agentStates: { ...state.agentStates, [action.agent]: action.state } };

    case 'SET_STAGE': {
      const ev: RuntimeEvent = { id: makeEventId(), timestamp: new Date().toISOString(), type: 'ORCHESTRATION_STAGE', payload: { stage: action.stage } };
      return { ...state, currentStage: action.stage, events: [ev, ...state.events].slice(0, 50) };
    }

    case 'HYDRATE':
      return { ...state, ...action.state };

    case 'RESET_WORKSPACE':
      // Mission 13 (P-NEW-6): New Idea must clear stale flags, reasoning chain,
      // telemetry, and agent states from the previous project — not just the
      // artifact list. Returns to the same DEFAULT_STATE used on first mount.
      return { ...DEFAULT_STATE };

    default:
      return state;
  }
}

// ── BroadcastChannel serialization ───────────────────────────────────────────
// Sets are not JSON-serializable, so we convert for cross-tab messaging.
type SerializedState = Omit<RuntimeState, 'staleArtifacts'> & { staleArtifacts: string[] };

function serialize(s: RuntimeState): SerializedState {
  return { ...s, staleArtifacts: Array.from(s.staleArtifacts) };
}
function deserialize(s: SerializedState): RuntimeState {
  return { ...s, staleArtifacts: new Set(s.staleArtifacts) };
}

// ── Context ───────────────────────────────────────────────────────────────────
interface RuntimeContextValue {
  // State
  state: RuntimeState;

  // Core operations
  markImproved: (artifact: string, reasoning: ReasoningEntry, tokens: number, cost: number) => void;
  markStale:    (artifacts: string[]) => void;
  clearStale:   (artifacts?: string[]) => void;
  emitEvent:    (event: Omit<RuntimeEvent, 'id'|'timestamp'>) => void;
  resetWorkspace: () => void;

  // Agent coordination
  setAgentState: (agent: string, agentState: 'idle'|'working'|'done'|'blocked') => void;
  setStage:      (stage: number) => void;

  // Derived queries
  isStale:         (artifact: string) => boolean;
  getVersion:      (artifact: string) => number;
  getReasoningFor: (artifact: string) => ReasoningEntry[];
  getDownstream:   (artifact: string) => string[];
}

const RuntimeCtx = createContext<RuntimeContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
const STORAGE_KEY   = 'ig_runtime_v3';
const CHANNEL_NAME  = 'ideagate-runtime';

export function RuntimeContext({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SerializedState;
        dispatch({ type: 'HYDRATE', state: deserialize(parsed) });
      }
    } catch { /* corrupt storage */ }

    // Connect BroadcastChannel for cross-tab sync
    if (typeof window !== 'undefined') {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = ch;

      ch.addEventListener('message', (e: MessageEvent) => {
        // A different tab emitted an action — apply it here
        if (e.data?.type === 'DISPATCH') {
          dispatch(e.data.action);
        }
      });

      return () => { ch.close(); channelRef.current = null; };
    }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(state))); } catch { /* full */ }
  }, [state]);

  // Broadcast action to other tabs AND apply locally
  const broadcast = useCallback((action: RuntimeAction) => {
    dispatch(action);
    channelRef.current?.postMessage({ type: 'DISPATCH', action });
  }, []);

  // ── Public API ──────────────────────────────────────────────────────────────
  const markImproved = useCallback((artifact: string, reasoning: ReasoningEntry, tokens: number, cost: number) => {
    broadcast({ type: 'MARK_IMPROVED', artifact, reasoning, tokens, cost });
  }, [broadcast]);

  const markStale    = useCallback((artifacts: string[]) => broadcast({ type: 'MARK_STALE', artifacts }), [broadcast]);
  const clearStale   = useCallback((artifacts?: string[]) => broadcast({ type: 'CLEAR_STALE', artifacts }), [broadcast]);
  const emitEvent    = useCallback((event: Omit<RuntimeEvent, 'id'|'timestamp'>) => broadcast({ type: 'EMIT_EVENT', event }), [broadcast]);
  const resetWorkspace = useCallback(() => broadcast({ type: 'RESET_WORKSPACE' }), [broadcast]);
  const setAgentState= useCallback((agent: string, agentState: 'idle'|'working'|'done'|'blocked') => broadcast({ type: 'SET_AGENT_STATE', agent, state: agentState }), [broadcast]);
  const setStage     = useCallback((stage: number) => broadcast({ type: 'SET_STAGE', stage }), [broadcast]);

  // Derived queries
  const isStale         = useCallback((a: string) => state.staleArtifacts.has(a), [state.staleArtifacts]);
  const getVersion      = useCallback((a: string) => state.artifactVersions[a] ?? 0, [state.artifactVersions]);
  const getReasoningFor = useCallback((a: string) => state.reasoningChain.filter(r => r.artifactName === a), [state.reasoningChain]);
  const getDownstream   = useCallback((a: string) => getTransitiveDownstream(a), []);

  const value: RuntimeContextValue = {
    state,
    markImproved, markStale, clearStale, emitEvent,
    resetWorkspace,
    setAgentState, setStage,
    isStale, getVersion, getReasoningFor, getDownstream,
  };

  return <RuntimeCtx.Provider value={value}>{children}</RuntimeCtx.Provider>;
}

export function useRuntime(): RuntimeContextValue {
  const ctx = useContext(RuntimeCtx);
  if (!ctx) throw new Error('useRuntime must be inside <RuntimeContext>. Add it to layout.tsx.');
  return ctx;
}
