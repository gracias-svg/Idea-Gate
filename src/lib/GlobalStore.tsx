'use client';

// src/lib/GlobalStore.tsx
//
// Single source of truth for IdeaGate application state.
// All views (Office, Improve, Desk) read from and write to this store.
// Currently persists to localStorage — migrates to Supabase in V3.1.
//
// Usage in any page/component:
//   const { settings, history, refDocs, updateSettings, addHistory, addRefDoc, removeRefDoc } = useGlobal();

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GlobalSettings {
  // Model routing
  model: 'haiku' | 'sonnet';               // haiku = claude-haiku-4-5, sonnet = claude-sonnet-4-5
  tokenBudgetPerCall: number;               // max_tokens ceiling (default 4000)

  // UI preferences
  theme: 'retro' | 'professional';          // V3.1 will activate dual theme system
  animationsEnabled: boolean;
  fontSize: 'sm' | 'md' | 'lg';

  // Reasoning and tracing
  reasoningDepth: 'brief' | 'detailed';    // controls prompt instruction for reasoning output
  promptTracing: boolean;                   // log prompts to improvement history
  showTokenCosts: boolean;                  // display cost after each operation

  // Export preferences
  defaultExportFormat: 'md' | 'txt' | 'json';

  // Persistence
  persistenceMode: 'local' | 'supabase';   // switches to supabase when V3.1 is active
}

export interface ImprovementEntry {
  id:           string;         // unique ID (timestamp-random)
  artifactName: string;         // e.g. "1-discovery.md"
  intent:       string;         // the improvement instruction
  extent:       string;         // light | medium | strong
  scope:        string;         // block | stage | project
  model:        string;         // full model name from OpenRouter
  inputTokens:  number;
  outputTokens: number;
  totalTokens:  number;
  costUSD:      number;
  reasoning:    string;         // LLM's PM reasoning
  impactWarnings: string[];
  refDocCount:  number;         // how many reference docs were injected
  timestamp:    string;         // ISO string
}

export interface RefDocument {
  name:       string;
  text:       string;
  chars:      number;
  addedAt:    string;
}

interface GlobalState {
  settings: GlobalSettings;
  history:  ImprovementEntry[];   // last 100 improvements across all sessions
  refDocs:  RefDocument[];        // globally stored reference documents
  version:  number;               // bumped on every state change for debugging
}

// ── Default settings ──────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: GlobalSettings = {
  model:               'haiku',
  tokenBudgetPerCall:  4000,
  theme:               'retro',
  animationsEnabled:   true,
  fontSize:            'md',
  reasoningDepth:      'detailed',
  promptTracing:       false,
  showTokenCosts:      true,
  defaultExportFormat: 'md',
  persistenceMode:     'local',
};

const DEFAULT_STATE: GlobalState = {
  settings: DEFAULT_SETTINGS,
  history:  [],
  refDocs:  [],
  version:  0,
};

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'UPDATE_SETTINGS';  payload: Partial<GlobalSettings> }
  | { type: 'ADD_HISTORY';      payload: ImprovementEntry }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'ADD_REF_DOC';      payload: RefDocument }
  | { type: 'REMOVE_REF_DOC';   payload: string }       // name
  | { type: 'CLEAR_REF_DOCS' }
  | { type: 'HYDRATE';          payload: Partial<GlobalState> };

function reducer(state: GlobalState, action: Action): GlobalState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload }, version: state.version + 1 };
    case 'ADD_HISTORY':
      return { ...state, history: [action.payload, ...state.history].slice(0, 100), version: state.version + 1 };
    case 'CLEAR_HISTORY':
      return { ...state, history: [], version: state.version + 1 };
    case 'ADD_REF_DOC':
      return {
        ...state,
        // Replace if same name, otherwise prepend
        refDocs: [action.payload, ...state.refDocs.filter(d => d.name !== action.payload.name)],
        version: state.version + 1,
      };
    case 'REMOVE_REF_DOC':
      return { ...state, refDocs: state.refDocs.filter(d => d.name !== action.payload), version: state.version + 1 };
    case 'CLEAR_REF_DOCS':
      return { ...state, refDocs: [], version: state.version + 1 };
    case 'HYDRATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface GlobalContextValue {
  // State
  settings: GlobalSettings;
  history:  ImprovementEntry[];
  refDocs:  RefDocument[];

  // Actions
  updateSettings: (patch: Partial<GlobalSettings>) => void;
  addHistory:     (entry: Omit<ImprovementEntry, 'id' | 'timestamp'>) => void;
  clearHistory:   () => void;
  addRefDoc:      (doc: Omit<RefDocument, 'addedAt'>) => void;
  removeRefDoc:   (name: string) => void;
  clearRefDocs:   () => void;

  // Derived helpers
  modelString:  string;   // full OpenRouter model string
  fontSizePx:   number;   // base body font size in px
}

const GlobalContext = createContext<GlobalContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ig_global_store_v3';

export function GlobalStore({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<GlobalState>;
        dispatch({ type: 'HYDRATE', payload: {
          settings: { ...DEFAULT_SETTINGS, ...(saved.settings ?? {}) },
          history:  saved.history  ?? [],
          refDocs:  saved.refDocs  ?? [],
        }});
      }
    } catch { /* ignore corrupt storage */ }
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        settings: state.settings,
        history:  state.history,
        refDocs:  state.refDocs,
      }));
    } catch { /* storage may be full — silent */ }
  }, [state.version]);

  // ── Action creators ───────────────────────────────────────────────────────
  const updateSettings = useCallback((patch: Partial<GlobalSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: patch });
  }, []);

  const addHistory = useCallback((entry: Omit<ImprovementEntry, 'id' | 'timestamp'>) => {
    dispatch({
      type: 'ADD_HISTORY',
      payload: {
        ...entry,
        id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
      },
    });
  }, []);

  const clearHistory  = useCallback(() => dispatch({ type: 'CLEAR_HISTORY' }), []);

  const addRefDoc = useCallback((doc: Omit<RefDocument, 'addedAt'>) => {
    dispatch({ type: 'ADD_REF_DOC', payload: { ...doc, addedAt: new Date().toISOString() } });
  }, []);

  const removeRefDoc  = useCallback((name: string) => dispatch({ type: 'REMOVE_REF_DOC', payload: name }), []);
  const clearRefDocs  = useCallback(() => dispatch({ type: 'CLEAR_REF_DOCS' }), []);

  // ── Derived values ────────────────────────────────────────────────────────
  const modelString = state.settings.model === 'sonnet'
    ? 'anthropic/claude-sonnet-4-5'
    : 'anthropic/claude-haiku-4-5';

  const fontSizePx = state.settings.fontSize === 'sm' ? 11
    : state.settings.fontSize === 'lg' ? 14
    : 12;

  const value: GlobalContextValue = {
    settings:       state.settings,
    history:        state.history,
    refDocs:        state.refDocs,
    updateSettings,
    addHistory,
    clearHistory,
    addRefDoc,
    removeRefDoc,
    clearRefDocs,
    modelString,
    fontSizePx,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGlobal(): GlobalContextValue {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error('useGlobal must be used inside <GlobalStore>. Add <GlobalStore> to layout.tsx.');
  return ctx;
}

// ── Model string helper (standalone, usable outside React) ────────────────────
export function resolveModel(model: 'haiku' | 'sonnet'): string {
  return model === 'sonnet' ? 'anthropic/claude-sonnet-4-5' : 'anthropic/claude-haiku-4-5';
}
