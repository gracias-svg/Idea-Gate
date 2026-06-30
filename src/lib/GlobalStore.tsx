'use client';

// src/lib/GlobalStore.tsx
// IdeaGate — Global Settings Store
// Single source of truth for all user-configurable settings.
// Architecture: Personal settings travel with the user across projects.
//               Project settings apply to the active project.
// Storage: localStorage (V3.1). Migrates to Supabase in V3.4.

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { MODEL_REGISTRY, LEGACY_KEY_MAP, getModelById } from '@/lib/model-registry';

// ── Model keys ────────────────────────────────────────────────────────────────
export type ModelKey =
  // Paid models — billed per token via OpenRouter
  | 'haiku' | 'sonnet' | 'deepseek' | 'llama'
  | 'qwen'  | 'mistral' | 'gpt4o'
  // Free tier models — OpenRouter free tier (rate-limited, no billing)
  // gemini (google/gemini-flash-1.5) — removed: OpenRouter 404 "no endpoints" (confirmed 2026-06-27)
  // ring (inclusionai/ring-2.6-1t:free) — removed: OpenRouter 404 "no longer free" (confirmed 2026-06-27)
  | 'nemotron' | 'gptoss' | 'owlalpha';

// Value shape — `free` flag enables UI grouping and "(Free)" labels
export interface ModelMeta {
  label:    string;   // Display label — free models include "(Free)" suffix
  provider: string;   // Model provider name
  cost:     string;   // Human-readable cost — 'Free' for free-tier models
  best:     string;   // Primary use case shown in tooltips and settings
  free?:    boolean;  // true = OpenRouter free tier; omit or false = paid
  contextK?: number;  // Context window in thousands of tokens (optional display)
}

export const MODEL_LABELS: Record<ModelKey, ModelMeta> = {
  // ── Paid models ─────────────────────────────────────────────────────────
  haiku:    { label: 'Claude Haiku',    provider: 'Anthropic',   cost: '$0.25/M',  best: 'Fast edits, coordination'         },
  sonnet:   { label: 'Claude Sonnet',   provider: 'Anthropic',   cost: '$3.00/M',  best: 'PM reasoning, PRD depth'          },
  deepseek: { label: 'DeepSeek R1',     provider: 'DeepSeek',    cost: '$0.55/M',  best: 'Technical depth, architecture'    },
  llama:    { label: 'Llama 3.3 70B',   provider: 'Meta',        cost: '$0.59/M',  best: 'Fast drafts, volume'              },
  qwen:     { label: 'Qwen 2.5 72B',    provider: 'Alibaba',     cost: '$0.13/M',  best: 'Low-cost, repetitive tasks'       },
  mistral:  { label: 'Mistral Large',   provider: 'Mistral',     cost: '$2.00/M',  best: 'Structured output, formatting'    },
  gpt4o:    { label: 'GPT-4o',          provider: 'OpenAI',      cost: '$2.50/M',  best: 'PM evaluation, balanced'          },
  // gemini removed: google/gemini-flash-1.5 → OpenRouter 404 "no endpoints" (confirmed 2026-06-27)
  // ── Free tier models (OpenRouter free tier) ──────────────────────────────
  // Recommended priority order: owlalpha → nemotron → gptoss
  // ring removed: inclusionai/ring-2.6-1t:free → OpenRouter 404 "no longer free" (confirmed 2026-06-27)
  nemotron: { label: 'Nemotron 3 Super (Free)', provider: 'NVIDIA',      cost: 'Free', contextK: 1000, free: true,
              best: 'Large document generation, long-horizon PM workflows'              },
  gptoss:   { label: 'GPT-OSS 120B (Free)',     provider: 'OpenAI',      cost: 'Free', contextK: 128,  free: true,
              best: 'PRD drafting, case studies, structured PM artifact generation'    },
  owlalpha: { label: 'Owl Alpha (Free)',          provider: 'OpenRouter',  cost: 'Free', contextK: 1048, free: true,
              best: 'Agentic workflows, tool use, long-context PM lifecycle generation' },
};

// ── Free model utilities ──────────────────────────────────────────────────────
// Derived from registry — ModelKeys whose resolved modelId is marked isFree in MODEL_REGISTRY
// Ordered by recommended priority: owlalpha → nemotron → gptoss
export const FREE_MODEL_KEYS: ModelKey[] = ['owlalpha', 'nemotron', 'gptoss'] as const;

// Free model fallback chain for UI and future coordinator use
// Primary: owlalpha · Fallback 1: nemotron · Fallback 2: gptoss
export const FREE_MODEL_FALLBACK_CHAIN: ModelKey[] = FREE_MODEL_KEYS;

// ── Safe model metadata accessors (added post-12B crash fix) ─────────────────
// defaultModel may now hold either a legacy ModelKey ('deepseek') OR a full
// registry modelId ('deepseek/deepseek-r1') since ModelSelector writes full IDs.
// These functions never throw — they fall back to the registry, then to a raw
// display of the key itself, rather than crashing on an unrecognized key.

export function getModelMeta(key: string): ModelMeta {
  const legacyMeta = MODEL_LABELS[key as ModelKey];
  if (legacyMeta) return legacyMeta;

  const entry = getModelById(key);
  if (entry) {
    return {
      label:    entry.displayName,
      provider: entry.provider,
      cost:     entry.isFree ? 'Free' : (entry.inputCostPerMillion ? `$${entry.inputCostPerMillion}/M` : 'Varies'),
      best:     entry.bestUseCases[0] ?? '',
      free:     entry.isFree,
      contextK: Math.round(entry.contextWindow / 1000),
    };
  }

  // Unknown key — display gracefully instead of crashing
  return { label: key, provider: 'Unknown', cost: '—', best: '—' };
}

export function isModelFree(key: string): boolean {
  if (FREE_MODEL_KEYS.includes(key as ModelKey)) return true;
  const entry = getModelById(key);
  return entry?.isFree ?? false;
}

// ── Builder IDs ───────────────────────────────────────────────────────────────
export type BuilderId =
  | 'claude' | 'chatgpt' | 'gemini' | 'lovable'
  | 'bolt'   | 'v0'      | 'replit' | 'cursor'
  | 'windsurf' | 'openhands';

// ── Compression modes (simplified terminology) ────────────────────────────────
export type CompressionMode = 'complete' | 'balanced' | 'technical' | 'visual' | 'brief';

export const COMPRESSION_LABELS: Record<CompressionMode, { label: string; description: string; charCount: string }> = {
  complete:  { label: 'Complete',  description: 'All content, every word preserved',         charCount: '~150k chars' },
  balanced:  { label: 'Balanced',  description: 'Smart summaries, key context retained',      charCount: '~45k chars'  },
  technical: { label: 'Technical', description: 'Code, specs, architecture focused',          charCount: '~25k chars'  },
  visual:    { label: 'Visual',    description: 'UI flows, design context, visual specs',     charCount: '~20k chars'  },
  brief:     { label: 'Brief',     description: 'Key decisions and recommendations only',     charCount: '~7k chars'   },
};

// ── Operating modes ───────────────────────────────────────────────────────────
export type OperatingMode = 'fast' | 'balanced' | 'deep' | 'research' | 'builder';

export const OPERATING_MODE_META: Record<OperatingMode, { label: string; description: string; emoji: string; color: string }> = {
  fast:     { label: 'Fast',     description: 'Speed-first. Haiku model, brief reasoning, minimal tokens.',       emoji: '⚡', color: '#f59e0b' },
  balanced: { label: 'Balanced', description: 'Best for most work. Haiku with full reasoning and smart context.',  emoji: '⚖', color: '#4ade80' },
  deep:     { label: 'Deep',     description: 'Maximum quality. Sonnet, full context, detailed PM reasoning.',     emoji: '◈', color: '#818cf8' },
  research: { label: 'Research', description: 'Discovery and analysis. DeepSeek R1 with full context.',            emoji: '◉', color: '#38bdf8' },
  builder:  { label: 'Builder',  description: 'Build-ready output. Lovable-optimised, Visual compression.',        emoji: '▶', color: '#fb923c' },
};

// Operating mode presets — each mode orchestrates multiple lower-level settings
export const OPERATING_MODE_PRESETS: Record<OperatingMode, Partial<Pick<GlobalSettings, 'defaultModel' | 'tokenBudgetPerCall' | 'reasoningDepth' | 'defaultCompression' | 'defaultBuilder'>>> = {
  fast:     { defaultModel: 'haiku',    tokenBudgetPerCall: 1500, reasoningDepth: 'brief',    defaultCompression: 'brief'    },
  balanced: { defaultModel: 'haiku',    tokenBudgetPerCall: 4000, reasoningDepth: 'detailed', defaultCompression: 'balanced' },
  deep:     { defaultModel: 'sonnet',   tokenBudgetPerCall: 6000, reasoningDepth: 'detailed', defaultCompression: 'complete' },
  research: { defaultModel: 'deepseek', tokenBudgetPerCall: 8000, reasoningDepth: 'detailed', defaultCompression: 'complete' },
  builder:  { defaultModel: 'haiku',    tokenBudgetPerCall: 3000, reasoningDepth: 'brief',    defaultCompression: 'visual',  defaultBuilder: 'lovable' },
};

// ── Coordinator autonomy ──────────────────────────────────────────────────────
export type CoordinatorAutonomy = 'manual' | 'assisted' | 'autonomous';

export const AUTONOMY_META: Record<CoordinatorAutonomy, { label: string; description: string; available: boolean; badge?: string }> = {
  manual:    { label: 'Manual',    description: 'Each lifecycle stage requires your approval before proceeding.', available: true  },
  assisted:  { label: 'Assisted',  description: 'Runs automatically. Coordinator decisions are always visible.',  available: true  },
  autonomous:{ label: 'Autonomous',description: 'Runs with minimal interruption. Only surfaces exceptions.',      available: false, badge: 'V3.3' },
};

// ── Settings type (28 active V3.1 settings) ───────────────────────────────────
// Annotated: [P] = Personal (travels with user), [J] = Project (active project only)
export interface GlobalSettings {
  // ── PERSONAL: APPEARANCE ─────────────────────────── [P]
  theme:              'retro' | 'professional'; // [P] Visual style
  fontSize:           'sm' | 'md' | 'lg';       // [P] 11.5 / 13.5 / 15px
  density:            'compact' | 'standard' | 'spacious'; // [P] Spacing system
  animationsEnabled:  boolean;                  // [P] UI animations
  crtIntensity:       'off' | 'subtle' | 'strong'; // [P] Office canvas scanlines

  // ── PERSONAL: AI MODELS ──────────────────────────── [P]
  defaultModel:       string;                   // [P] Full registry modelId (e.g. 'anthropic/claude-sonnet-4-6').
                                                  // Widened from ModelKey in Mission 12B to support full
                                                  // registry IDs. ModelKey/MODEL_LABELS unchanged — still
                                                  // used by legacy ModelDropdown/SettingsModal/office page.
  tokenBudgetPerCall: number;                   // [P] Hard max_tokens ceiling (1000–8000)
  openRouterApiKey:   string;                   // [P] OpenRouter API key — overrides OPENROUTER_API_KEY env var
  anthropicApiKey:    string;                   // [P] Anthropic API key — overrides ANTHROPIC_API_KEY env var
  customModelId:      string;                   // [P] Paste any OpenRouter model ID — overrides dropdown when set
  showTokenCosts:     boolean;                  // [P] Display token cost after improvements
  promptTracing:      boolean;                  // [P] Log full prompts to history

  // ── PERSONAL: READING ────────────────────────────── [P]
  defaultFocusMode:   boolean;                  // [P] Start Desk in focus mode
  lineHeight:         'tight' | 'normal' | 'relaxed'; // [P] 1.6 / 1.9 / 2.2

  // ── PERSONAL: ACCESSIBILITY ──────────────────────── [P]
  reduceMotion:       boolean;                  // [P] Disable all animations (overrides animationsEnabled)
  highContrast:       boolean;                  // [P] Increase text contrast ratios
  keyboardNavEnabled: boolean;                  // [P] Artifact list + TOC keyboard navigation

  // ── PROJECT: OPERATING MODE ──────────────────────── [J]
  operatingMode:      OperatingMode;            // [J] Orchestrates model, tokens, compression

  // ── PROJECT: COORDINATOR AUTONOMY ───────────────── [J]
  coordinatorAutonomy:CoordinatorAutonomy;      // [J] How much the coordinator self-directs

  // ── PROJECT: BUILDER ─────────────────────────────── [J]
  defaultBuilder:     BuilderId;                // [J] Pre-selected in Build Destination
  defaultCompression: CompressionMode;          // [J] Package compression level
  defaultExportFormat:'md' | 'txt' | 'json' | 'zip'; // [J] Artifact download format

  // ── PROJECT: INTELLIGENCE (PROJECT MEMORY) ──────── [J]
  rememberDecisions:      boolean;              // [J] Log coordinator decisions to session
  storeReasoningChain:    boolean;              // [J] Persist improvement reasoning
  trackArtifactLineage:   boolean;              // [J] Track artifact → artifact dependencies
  crossArtifactReferences:boolean;              // [J] Show cross-references in Desk OVERVIEW
  autoSnapshot:           boolean;              // [J] Auto-snapshot on lifecycle Stage 14

  // ── PROJECT: SAFETY & RECOVERY ──────────────────── [J]
  sessionCostCeiling:      number;              // [J] Hard stop in USD (0 = unlimited)
  confirmDestructiveActions:boolean;            // [J] Confirm before clear/run/delete ops

  // ── SYSTEM: ADVANCED ─────────────────────────────── [P]
  persistenceMode:    'local' | 'supabase';     // [P] Storage backend
  debugMode:          boolean;                  // [P] Parse badges, verbose console logging

  // ── INTERNAL (not shown in UI, controlled by Operating Mode) ────────────────
  reasoningDepth:     'brief' | 'detailed';     // Internal — set by operatingMode preset
}

// ── Defaults ──────────────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS: GlobalSettings = {
  // Personal — Appearance
  theme:              'retro',
  fontSize:           'md',
  density:            'standard',
  animationsEnabled:  true,
  crtIntensity:       'subtle',
  // Personal — AI Models
  defaultModel:       'owlalpha', // Free tier default — change in Settings > AI Models
  tokenBudgetPerCall: 4000,
  openRouterApiKey:   '',   // Leave blank to use OPENROUTER_API_KEY env var
  anthropicApiKey:    '',   // Leave blank to use ANTHROPIC_API_KEY env var
  customModelId:      '',   // Paste any OpenRouter model ID to override the dropdown
  showTokenCosts:     true,
  promptTracing:      false,
  // Personal — Reading
  defaultFocusMode:   false,
  lineHeight:         'normal',
  // Personal — Accessibility
  reduceMotion:       false,
  highContrast:       false,
  keyboardNavEnabled: true,
  // Project — Operating Mode
  operatingMode:      'balanced',
  // Project — Coordinator
  coordinatorAutonomy:'assisted',
  // Project — Builder
  defaultBuilder:     'claude',
  defaultCompression: 'balanced',
  defaultExportFormat:'md',
  // Project — Intelligence
  rememberDecisions:      true,
  storeReasoningChain:    true,
  trackArtifactLineage:   true,
  crossArtifactReferences:true,
  autoSnapshot:           false,
  // Project — Safety
  sessionCostCeiling:      0,
  confirmDestructiveActions:true,
  // System
  persistenceMode:    'local',
  debugMode:          false,
  // Internal
  reasoningDepth:     'detailed',
};

// ── Improvement history entry ─────────────────────────────────────────────────
export interface ImprovementEntry {
  id:           string;
  artifactName: string;
  intent:       string;
  model:        string;
  reasoning:    string;
  timestamp:    number;
  tokensUsed?:  number;
  costUsd?:     number;
}

// ── Reference document ────────────────────────────────────────────────────────
export interface RefDocument {
  id:       string;
  name:     string;
  content:  string;
  addedAt:  number;
}

// ── Store state ───────────────────────────────────────────────────────────────
export interface GlobalStoreState {
  settings:  GlobalSettings;
  history:   ImprovementEntry[];
  refDocs:   RefDocument[];
}

const INITIAL_STATE: GlobalStoreState = {
  settings: DEFAULT_SETTINGS,
  history:  [],
  refDocs:  [],
};

// ── Actions ───────────────────────────────────────────────────────────────────
type Action =
  | { type: 'UPDATE_SETTINGS';   payload: Partial<GlobalSettings> }
  | { type: 'APPLY_MODE';        payload: OperatingMode }
  | { type: 'RESET_SETTINGS' }
  | { type: 'ADD_HISTORY';       payload: ImprovementEntry }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'ADD_REF_DOC';       payload: RefDocument }
  | { type: 'REMOVE_REF_DOC';    payload: string }
  | { type: 'CLEAR_REF_DOCS' }
  | { type: 'HYDRATE';           payload: Partial<GlobalStoreState> };

function reducer(state: GlobalStoreState, action: Action): GlobalStoreState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'APPLY_MODE': {
      const preset = OPERATING_MODE_PRESETS[action.payload];
      return {
        ...state,
        settings: { ...state.settings, operatingMode: action.payload, ...preset },
      };
    }
    case 'RESET_SETTINGS':
      return { ...state, settings: DEFAULT_SETTINGS };
    case 'ADD_HISTORY':
      return { ...state, history: [action.payload, ...state.history].slice(0, 100) };
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'ADD_REF_DOC':
      return { ...state, refDocs: [action.payload, ...state.refDocs] };
    case 'REMOVE_REF_DOC':
      return { ...state, refDocs: state.refDocs.filter(d => d.id !== action.payload) };
    case 'CLEAR_REF_DOCS':
      return { ...state, refDocs: [] };
    case 'HYDRATE':
      return {
        ...state,
        ...action.payload,
        // Merge settings with defaults to handle new fields in migrations
        settings: { ...DEFAULT_SETTINGS, ...(action.payload.settings ?? state.settings) },
      };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
interface GlobalStoreContext {
  state:          GlobalStoreState;
  dispatch:       React.Dispatch<Action>;
  updateSettings: (partial: Partial<GlobalSettings>) => void;
  applyMode:      (mode: OperatingMode) => void;
  resetSettings:  () => void;
  addHistory:     (entry: ImprovementEntry) => void;
  clearHistory:   () => void;
  addRefDoc:      (doc: RefDocument) => void;
  removeRefDoc:   (id: string) => void;
  clearRefDocs:   () => void;
  exportSettings: () => void;
  importSettings: (json: string) => void;
}

const Ctx = createContext<GlobalStoreContext | null>(null);

const STORAGE_KEY = 'ig_global_store_v3';

export function GlobalStore({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<GlobalStoreState>;
        dispatch({ type: 'HYDRATE', payload: parsed });
      }
    } catch { /* ignore corrupt storage */ }
  }, []);

  // Persist on every state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore storage quota errors */ }
  }, [state]);

  const ctx: GlobalStoreContext = {
    state,
    dispatch,
    updateSettings: (p)    => dispatch({ type: 'UPDATE_SETTINGS', payload: p }),
    applyMode:      (mode) => dispatch({ type: 'APPLY_MODE',      payload: mode }),
    resetSettings:  ()     => dispatch({ type: 'RESET_SETTINGS' }),
    addHistory:     (e)    => dispatch({ type: 'ADD_HISTORY',     payload: e }),
    clearHistory:   ()     => dispatch({ type: 'CLEAR_HISTORY' }),
    addRefDoc:      (d)    => dispatch({ type: 'ADD_REF_DOC',     payload: d }),
    removeRefDoc:   (id)   => dispatch({ type: 'REMOVE_REF_DOC',  payload: id }),
    clearRefDocs:   ()     => dispatch({ type: 'CLEAR_REF_DOCS' }),
    exportSettings: () => {
      const blob = new Blob([JSON.stringify({ settings: state.settings, version: 3 }, null, 2)], { type: 'application/json' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'ideagate-settings.json' });
      a.click(); URL.revokeObjectURL(a.href);
    },
    importSettings: (json) => {
      try {
        const parsed = JSON.parse(json);
        if (parsed?.settings && typeof parsed.settings === 'object') {
          dispatch({ type: 'HYDRATE', payload: { settings: parsed.settings } });
        }
      } catch { /* invalid JSON — silently ignore */ }
    },
  };

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useGlobalStore(): GlobalStoreContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGlobalStore must be used within <GlobalStore>');
  return ctx;
}

// Convenience hook — read-only settings access
export function useSettings(): GlobalSettings {
  return useGlobalStore().state.settings;
}
