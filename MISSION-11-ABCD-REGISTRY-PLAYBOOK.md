# IDEAGATE PMOS — MISSION 11 (A / B / C / D)
# MODEL REGISTRY FOUNDATION — FOUR-PART PLAYBOOK
# Version: 2.0.0 | Replaces: MISSION-11-MODEL-REGISTRY-PLAYBOOK.md

**Canonical Reference:** IDEAGATE-MODEL-PLATFORM-SPECIFICATION.md
**Spec Version:** 1.0.0

---

## HOW TO USE THIS DOCUMENT

This file contains four separate missions. Each is executed independently.

**You do not write any code. Claude Code writes everything.**

**Sequence:**
```
Mission 11A → report output here → Mission 11B → report here → 11C → report here → 11D → done
```

**For each mission:**
1. Open your existing Claude Code chat (same one used for Missions 1-10E)
2. Type exactly: `I am starting Mission 11A. Here is the complete playbook:` then paste the mission section
3. Let Claude Code execute every step
4. Copy ALL Claude Code output (every command + every result)
5. Paste that output back into this Claude.ai chat for review
6. Only after review confirmation: proceed to the next mission

**Claude Code creates model-registry.ts and all file changes.**
**You do not write any code yourself.**

---
---
---

# ═══════════════════════════════════════════════════════════
# MISSION 11A — REGISTRY DATA LAYER
# PASTE EVERYTHING BELOW THIS LINE INTO CLAUDE CODE
# ═══════════════════════════════════════════════════════════

## MISSION 11A — REGISTRY DATA LAYER

**Single responsibility:** Create `model-registry.ts`. Nothing else.
**Risk:** ZERO — new file only. No existing file is touched.
**Rollback:** `rm src/lib/model-registry.ts`
**Time estimate:** 10 minutes

---

### BEFORE ANY ACTION — READ THESE FILES FIRST

```bash
cat /Users/apple/idea-gate-ui-safe/CLAUDE.md
cat /Users/apple/idea-gate-ui-safe/ENGINEERING_STATUS.md
cd /Users/apple/idea-gate-ui-safe && git status && git log --oneline -5
cd /Users/apple/agent-zero-data/workdir/ui-layer && git status && git log --oneline -5
```

Report all four outputs before making any change.

---

### PROTECTED FILES — DO NOT TOUCH IN ANY MISSION

```
/Users/apple/idea-gate-ui-safe/src/core/coordinator-v2.js
/Users/apple/idea-gate-ui-safe/src/core/lifecycle-engine.js
/Users/apple/idea-gate-ui-safe/src/core/journey-engine.js
/Users/apple/idea-gate-ui-safe/src/utils/llm.js
/Users/apple/agent-zero-data/workdir/ui-layer/src/lib/parseContent.ts
/Users/apple/agent-zero-data/workdir/ui-layer/src/app/desk/page.tsx
```

---

### STEP A0 — PRE-FLIGHT (no changes)

```bash
# Check TypeScript baseline BEFORE any changes
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | head -10
echo "BASELINE_TS_COMPLETE"

# Check that model-registry.ts does NOT yet exist
ls /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts 2>&1 || echo "CONFIRMED_NOT_EXISTS"
```

Expected: `BASELINE_TS_COMPLETE` with zero error lines. `CONFIRMED_NOT_EXISTS`.
If model-registry.ts already exists: STOP and report. Do not overwrite without review.

---

### STEP A1 — CREATE model-registry.ts

Create this file at exactly this path:
`/Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts`

Write the following content exactly:

```typescript
/**
 * IDEAGATE PMOS — Model Registry
 * Version: 1.0.0 | Last Updated: 2026-06-29
 *
 * CANONICAL SOURCE OF TRUTH for all AI models in IdeaGate.
 * Every model-related UI, backend, and execution decision derives from this file.
 *
 * DO NOT hardcode model IDs anywhere else in the codebase.
 * Add new models here only. Use resolveModelId() or getModelById() for all lookups.
 *
 * Architecture spec: IDEAGATE-MODEL-PLATFORM-SPECIFICATION.md
 * Implementation: Mission 11A (data layer) | 11B (routes) | 11C (frontend)
 */

// ─── Type Definitions ─────────────────────────────────────────────────────────

export type ProviderId =
  | 'openrouter'           // Active — all current models
  | 'anthropic_direct'     // Future — direct Anthropic API
  | 'google_ai_studio'     // Future — free Gemini tier
  | 'dashscope'            // Future — native Qwen
  | 'minimax_direct'       // Future — native MiniMax
  | 'zhipuai_direct'       // Future — native GLM
  | 'openai_direct'        // Future — direct OpenAI API
  | 'ollama'               // Future — local inference
  | 'lm_studio';           // Future — local OpenAI-compatible

export type ModelCategory =
  | 'frontier-premium'
  | 'best-value-paid'
  | 'fast-affordable'
  | 'zero-cost'
  | 'coding-specialist'
  | 'heavy-reasoning'
  | 'vision-document-analysis';

export type CostTier = 'free' | 'ultra-low' | 'low' | 'mid' | 'premium';

export type ModelStatus =
  | 'active-stable'    // Tested in production, reliable
  | 'active-preview'   // Enabled but preview — may change
  | 'deprecated'       // Disabled, migration path defined
  | 'retired';         // Removed from dropdown, historical reference only

export type InputType = 'text' | 'image' | 'audio' | 'video';
export type OutputType = 'text' | 'image' | 'audio';
export type Rating = 1 | 2 | 3 | 4 | 5;
export type Speed = 'very-fast' | 'fast' | 'moderate-fast' | 'moderate' | 'slow';

// ─── Model Entry Interface ─────────────────────────────────────────────────────

export interface ModelEntry {
  // Identity (all required)
  modelId: string;                     // Exact ID sent to provider API. NEVER modify in transit.
  displayName: string;                 // UI display name
  provider: ProviderId;                // Provider routing key
  category: ModelCategory;             // Primary UI grouping

  // Cost
  costTier: CostTier;
  inputCostPerMillion?: number;        // USD per 1M prompt tokens. Omit if free or unknown.
  outputCostPerMillion?: number;       // USD per 1M completion tokens.

  // Capabilities
  contextWindow: number;               // Max token count. Source: official provider docs.
  maxOutputTokens?: number;            // Max completion tokens. Omit if unknown.
  inputTypes: InputType[];
  outputTypes: OutputType[];

  // Feature Flags
  supportsVision: boolean;
  supportsThinking: boolean;           // Native reasoning/thinking mode available
  supportsStreaming: boolean;
  supportsJSON: boolean;               // Structured / JSON output mode
  supportsToolCalling: boolean;

  // Quality Ratings 1-5 (based on observed behavior where no benchmark exists)
  pmDocumentQuality: Rating;
  codingQuality: Rating;
  architectureQuality: Rating;
  uxQuality: Rating;
  researchQuality: Rating;
  longContextQuality: Rating;
  structuredOutputQuality: Rating;
  reliabilityScore: Rating;
  typicalSpeed: Speed;

  // Status
  status: ModelStatus;
  enabled: boolean;                    // Appears in dropdown
  comingSoon: boolean;                 // Visible but not selectable (provider stub)
  isFree: boolean;                     // Must match costTier === 'free'

  // Guidance
  bestUseCases: string[];
  notes: string;

  // Future platform intelligence (all optional)
  isRecommended?: boolean;             // IdeaGate recommended pick
  isBenchmarkWinner?: boolean;         // Top of current benchmark for this category
  isExperimental?: boolean;            // Experimental — behavior may change
  tags?: string[];                     // Free-form filter tags
}

// ─── Registry Constants ────────────────────────────────────────────────────────

export const REGISTRY_VERSION = '1.0.0';
export const REGISTRY_LAST_UPDATED = '2026-06-29';

/**
 * FALLBACK_MODEL_ID: Used ONLY when no model is selected yet (e.g., first load).
 * NOT used as a silent substitution. See PATTERN NOTE below.
 */
export const FALLBACK_MODEL_ID = 'openrouter/owl-alpha';
export const DEFAULT_MODEL_ID  = 'openrouter/owl-alpha';

/**
 * RECOVERY_MODEL_IDS: Ordered list for Transparent Recovery Mode (Mission 14).
 * When the primary model fails, these are tried in order and the fallback is
 * ALWAYS shown to the user — never hidden. See IDEAGATE-MODEL-PLATFORM-SPECIFICATION.md §20.
 */
export const RECOVERY_MODEL_IDS = [
  'openrouter/owl-alpha',
  'nvidia/nemotron-3-super-120b-a12b:free',
] as const;

/**
 * LEGACY_KEY_MAP
 *
 * Maps short legacy keys (used in GlobalStore, routes before Mission 11) to
 * full provider model IDs. This preserves backward compatibility.
 *
 * RULE: Legacy keys (haiku, owlalpha, etc.) must continue to work after migration.
 * New code should pass full model IDs directly, not short keys.
 *
 * These keys are NEVER removed. They are only added or remapped.
 */
export const LEGACY_KEY_MAP: Record<string, string> = {
  haiku:     'anthropic/claude-haiku-4-5',
  sonnet:    'anthropic/claude-sonnet-4-6',
  deepseek:  'deepseek/deepseek-r1',
  llama:     'meta-llama/llama-3.3-70b-instruct',
  qwen:      'qwen/qwen-2.5-72b-instruct',
  mistral:   'mistralai/mistral-large-2411',
  gpt4o:     'openai/gpt-4o',
  owlalpha:  'openrouter/owl-alpha',
  nemotron:  'nvidia/nemotron-3-super-120b-a12b:free',
  gptoss:    'openai/gpt-oss-120b:free',
  // Deprecated key remaps — kept for safety, point to fallback
  gemini:    'openrouter/owl-alpha',   // was google/gemini-flash-1.5 (deprecated Jun 2026)
  ring:      'openrouter/owl-alpha',   // was inclusionai/ring-2.6-1t:free (became paid Jun 2026)
};

// ─── Model Registry Data ───────────────────────────────────────────────────────

export const MODEL_REGISTRY: ModelEntry[] = [

  // ═══════════════════════════════════════════════════════════
  // FRONTIER PREMIUM
  // Highest quality. Use for final portfolio deliverables.
  // ═══════════════════════════════════════════════════════════

  {
    modelId: 'anthropic/claude-opus-4-8',
    displayName: 'Claude Opus 4.8',
    provider: 'openrouter',
    category: 'frontier-premium',
    costTier: 'premium',
    inputCostPerMillion: 15,
    outputCostPerMillion: 75,
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    inputTypes: ['text', 'image'],
    outputTypes: ['text'],
    supportsVision: true,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 5,
    codingQuality: 5,
    architectureQuality: 5,
    uxQuality: 5,
    researchQuality: 5,
    longContextQuality: 5,
    structuredOutputQuality: 5,
    reliabilityScore: 5,
    typicalSpeed: 'moderate',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Final PRDs', 'Executive strategy', 'Full lifecycle generation', 'Technical architecture'],
    notes: 'Highest quality in registry. Best for portfolio deliverables. Adaptive thinking on by default.',
    isRecommended: true,
  },

  {
    modelId: 'anthropic/claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    provider: 'openrouter',
    category: 'frontier-premium',
    costTier: 'premium',
    inputCostPerMillion: 3,
    outputCostPerMillion: 15,
    contextWindow: 1_000_000,
    maxOutputTokens: 64_000,
    inputTypes: ['text', 'image'],
    outputTypes: ['text'],
    supportsVision: true,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 5,
    codingQuality: 5,
    architectureQuality: 4,
    uxQuality: 5,
    researchQuality: 4,
    longContextQuality: 5,
    structuredOutputQuality: 5,
    reliabilityScore: 5,
    typicalSpeed: 'moderate-fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Daily PM work', 'Document refinement', 'SWE-bench coding', 'Multi-turn sessions'],
    notes: 'Best all-round daily PM model. Near-frontier quality at lower cost than Opus.',
  },

  {
    modelId: 'anthropic/claude-opus-4-7',
    displayName: 'Claude Opus 4.7',
    provider: 'openrouter',
    category: 'frontier-premium',
    costTier: 'premium',
    inputCostPerMillion: 5,
    outputCostPerMillion: 25,
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    inputTypes: ['text', 'image'],
    outputTypes: ['text'],
    supportsVision: true,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 5,
    codingQuality: 5,
    architectureQuality: 5,
    uxQuality: 5,
    researchQuality: 4,
    longContextQuality: 5,
    structuredOutputQuality: 5,
    reliabilityScore: 5,
    typicalSpeed: 'moderate',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Long agent pipelines', 'Complex codebase navigation', 'End-to-end project execution'],
    notes: 'Alternative to Opus 4.8 when newest model unavailable. Built for sustained agent workflows.',
  },

  {
    modelId: 'anthropic/claude-haiku-4-5',
    displayName: 'Claude Haiku 4.5',
    provider: 'openrouter',
    category: 'fast-affordable',
    costTier: 'low',
    inputCostPerMillion: 0.25,
    outputCostPerMillion: 1.25,
    contextWindow: 200_000,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: false,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 3,
    codingQuality: 4,
    architectureQuality: 3,
    uxQuality: 3,
    researchQuality: 3,
    longContextQuality: 3,
    structuredOutputQuality: 4,
    reliabilityScore: 5,
    typicalSpeed: 'very-fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Fast edits', 'Quick formatting', 'Simple document tasks', 'Rapid testing'],
    notes: 'Fast and cheap. Lower quality for complex PM documents.',
  },

  // ═══════════════════════════════════════════════════════════
  // BEST VALUE PAID
  // Strong capability, significantly lower cost than frontier.
  // ═══════════════════════════════════════════════════════════

  {
    modelId: 'google/gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'openrouter',
    category: 'best-value-paid',
    costTier: 'mid',
    contextWindow: 1_000_000,
    inputTypes: ['text', 'image', 'audio', 'video'],
    outputTypes: ['text'],
    supportsVision: true,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 5,
    codingQuality: 5,
    architectureQuality: 4,
    uxQuality: 4,
    researchQuality: 5,
    longContextQuality: 5,
    structuredOutputQuality: 5,
    reliabilityScore: 4,
    typicalSpeed: 'moderate',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Research synthesis', 'PRD writing', 'Full-project reasoning', 'Multimodal PM docs'],
    notes: 'Strong multimodal + 1M context. Tool-enabled (search, code execution).',
  },

  {
    modelId: 'google/gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'openrouter',
    category: 'fast-affordable',
    costTier: 'ultra-low',
    contextWindow: 1_000_000,
    inputTypes: ['text', 'image', 'audio', 'video'],
    outputTypes: ['text'],
    supportsVision: true,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 4,
    architectureQuality: 3,
    uxQuality: 4,
    researchQuality: 4,
    longContextQuality: 4,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'very-fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Fast drafts', 'Formatting passes', 'Interactive sessions', 'Bulk generation'],
    notes: 'Ultra-low cost. Fast. Multimodal. Good workhorse for daily PM iteration.',
  },

  {
    modelId: 'google/gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash Preview',
    provider: 'openrouter',
    category: 'fast-affordable',
    costTier: 'low',
    contextWindow: 1_050_000,
    inputTypes: ['text', 'image'],
    outputTypes: ['text'],
    supportsVision: true,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 4,
    architectureQuality: 3,
    uxQuality: 4,
    researchQuality: 4,
    longContextQuality: 4,
    structuredOutputQuality: 4,
    reliabilityScore: 3,
    typicalSpeed: 'fast',
    status: 'active-preview',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Fast agentic workflows', 'Rapid iteration', 'Low-latency sessions'],
    notes: 'Preview status — monitor for deprecation. Optimized for agentic workflows.',
    isExperimental: true,
  },

  {
    modelId: 'x-ai/grok-4-1-fast',
    displayName: 'xAI Grok 4.1 Fast',
    provider: 'openrouter',
    category: 'best-value-paid',
    costTier: 'mid',
    contextWindow: 1_800_000,
    inputTypes: ['text', 'image'],
    outputTypes: ['text'],
    supportsVision: true,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 5,
    codingQuality: 5,
    architectureQuality: 4,
    uxQuality: 4,
    researchQuality: 5,
    longContextQuality: 5,
    structuredOutputQuality: 5,
    reliabilityScore: 4,
    typicalSpeed: 'fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Cross-document review', 'Massive context retention', 'Full lifecycle cross-reference'],
    notes: 'Largest context window in registry (1.8M tokens). Best for reviewing all 15 artifacts together.',
  },

  {
    modelId: 'deepseek/deepseek-v4-pro',
    displayName: 'DeepSeek V4 Pro',
    provider: 'openrouter',
    category: 'best-value-paid',
    costTier: 'mid',
    contextWindow: 1_000_000,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 5,
    architectureQuality: 5,
    uxQuality: 3,
    researchQuality: 5,
    longContextQuality: 5,
    structuredOutputQuality: 5,
    reliabilityScore: 4,
    typicalSpeed: 'moderate',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Technical architecture', 'Algorithm design', 'Research synthesis', 'Complex reasoning'],
    notes: '1.6T total, 49B active parameters. Best value for architecture and engineering documents.',
  },

  {
    modelId: 'deepseek/deepseek-r1',
    displayName: 'DeepSeek R1',
    provider: 'openrouter',
    category: 'best-value-paid',
    costTier: 'low',
    inputCostPerMillion: 0.55,
    outputCostPerMillion: 2.19,
    contextWindow: 128_000,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 5,
    architectureQuality: 4,
    uxQuality: 3,
    researchQuality: 4,
    longContextQuality: 3,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Technical depth', 'Reasoning chains', 'Architecture docs'],
    notes: 'Strong chain-of-thought. Legacy "deepseek" key maps here.',
  },

  {
    modelId: 'qwen/qwen-2.5-72b-instruct',
    displayName: 'Qwen 2.5 72B',
    provider: 'openrouter',
    category: 'best-value-paid',
    costTier: 'low',
    inputCostPerMillion: 0.13,
    outputCostPerMillion: 0.53,
    contextWindow: 128_000,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: false,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 4,
    architectureQuality: 3,
    uxQuality: 3,
    researchQuality: 4,
    longContextQuality: 3,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Low-cost PM docs', 'Repetitive generation', 'Cost-sensitive runs'],
    notes: 'CONFIRMED IN PRODUCTION (Run 2, $0.02 for 7 stages). Excellent quality/cost ratio.',
  },

  {
    modelId: 'meta-llama/llama-3.3-70b-instruct',
    displayName: 'Llama 3.3 70B',
    provider: 'openrouter',
    category: 'best-value-paid',
    costTier: 'low',
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
    contextWindow: 128_000,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: false,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 3,
    codingQuality: 4,
    architectureQuality: 3,
    uxQuality: 3,
    researchQuality: 3,
    longContextQuality: 3,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Fast drafts', 'High-volume generation', 'Cost-sensitive work'],
    notes: 'Open-source Meta model. Good throughput. Lower PM quality than frontier.',
  },

  {
    modelId: 'mistralai/mistral-large-2411',
    displayName: 'Mistral Large',
    provider: 'openrouter',
    category: 'best-value-paid',
    costTier: 'mid',
    inputCostPerMillion: 2,
    outputCostPerMillion: 6,
    contextWindow: 128_000,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: false,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 4,
    architectureQuality: 4,
    uxQuality: 3,
    researchQuality: 4,
    longContextQuality: 3,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'moderate-fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['Structured output', 'Code-heavy PM docs', 'Architecture documentation'],
    notes: 'Strong structured output. Good for API-spec and architecture documentation.',
  },

  {
    modelId: 'openai/gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openrouter',
    category: 'best-value-paid',
    costTier: 'mid',
    inputCostPerMillion: 2.5,
    outputCostPerMillion: 10,
    contextWindow: 128_000,
    inputTypes: ['text', 'image'],
    outputTypes: ['text'],
    supportsVision: true,
    supportsThinking: false,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 4,
    architectureQuality: 4,
    uxQuality: 4,
    researchQuality: 4,
    longContextQuality: 3,
    structuredOutputQuality: 5,
    reliabilityScore: 5,
    typicalSpeed: 'moderate-fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['PM evaluation', 'Balanced quality/cost', 'Vision-enabled PM docs'],
    notes: 'Reliable, vision-capable. Best structured output in its tier.',
  },

  // ═══════════════════════════════════════════════════════════
  // FAST & AFFORDABLE
  // Speed and volume. Iteration, formatting, bulk generation.
  // ═══════════════════════════════════════════════════════════

  {
    modelId: 'deepseek/deepseek-v4-flash',
    displayName: 'DeepSeek V4 Flash',
    provider: 'openrouter',
    category: 'fast-affordable',
    costTier: 'ultra-low',
    inputCostPerMillion: 0.14,
    outputCostPerMillion: 0.28,
    contextWindow: 1_000_000,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 5,
    architectureQuality: 4,
    uxQuality: 3,
    researchQuality: 4,
    longContextQuality: 4,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'very-fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['High-throughput generation', 'Fast reasoning', 'Cost-sensitive volume work'],
    notes: '~20-100x cheaper than frontier at comparable reasoning quality.',
  },

  {
    modelId: 'xiaomi/mimo-v2-flash',
    displayName: 'MiMo V2 Flash',
    provider: 'openrouter',
    category: 'fast-affordable',
    costTier: 'low',
    contextWindow: 256_000,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 5,
    architectureQuality: 5,
    uxQuality: 3,
    researchQuality: 3,
    longContextQuality: 3,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: false,
    bestUseCases: ['API specs', 'Engineering design docs', 'Implementation planning'],
    notes: '#1 open-source SWE-bench Verified globally. DISABLE thinking mode when using with agentic tools.',
  },

  // ═══════════════════════════════════════════════════════════
  // ZERO COST / FREE
  // $0 token cost. Rate limits apply. Not for sensitive content.
  // ═══════════════════════════════════════════════════════════

  {
    modelId: 'openrouter/owl-alpha',
    displayName: 'Owl Alpha (Free)',
    provider: 'openrouter',
    category: 'zero-cost',
    costTier: 'free',
    contextWindow: 1_048_576,
    maxOutputTokens: 262_144,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: false,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 4,
    architectureQuality: 3,
    uxQuality: 3,
    researchQuality: 4,
    longContextQuality: 5,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'slow',
    status: 'active-preview',
    enabled: true,
    comingSoon: false,
    isFree: true,
    bestUseCases: ['Free lifecycle runs', 'Development testing', 'Long-document batch work'],
    notes: '⚠️ PROMPTS LOGGED by Stealth provider. Temporary "Alpha" model — monitor retirement. 4.73% tool error rate. 200 RPD limit. ~12 tok/s.',
    isRecommended: false,
  },

  {
    modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
    displayName: 'Nemotron 3 Super (Free)',
    provider: 'openrouter',
    category: 'zero-cost',
    costTier: 'free',
    contextWindow: 1_000_000,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 4,
    architectureQuality: 4,
    uxQuality: 3,
    researchQuality: 4,
    longContextQuality: 5,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'fast',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: true,
    bestUseCases: ['Free long-context generation', 'Document synthesis', 'Recovery fallback'],
    notes: 'CONFIRMED IN PRODUCTION (Run 1 merge fallback). 120B total, 12B active. NVIDIA Open License.',
  },

  {
    modelId: 'nvidia/nemotron-3-ultra-253b',
    displayName: 'Nemotron 3 Ultra (Free)',
    provider: 'openrouter',
    category: 'zero-cost',
    costTier: 'free',
    contextWindow: 1_000_000,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 5,
    architectureQuality: 5,
    uxQuality: 3,
    researchQuality: 5,
    longContextQuality: 5,
    structuredOutputQuality: 5,
    reliabilityScore: 4,
    typicalSpeed: 'moderate',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: true,
    bestUseCases: ['Free orchestration', 'Deep research at no cost', 'Complex enterprise docs'],
    notes: '550B total, 55B active. Best free model for complex reasoning. Fully open weights, datasets, and recipes.',
  },

  {
    modelId: 'openai/gpt-oss-120b:free',
    displayName: 'GPT-OSS 120B (Free)',
    provider: 'openrouter',
    category: 'zero-cost',
    costTier: 'free',
    contextWindow: 128_000,   // NOTE: verify at openrouter.ai/openai/gpt-oss-120b:free
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 5,
    architectureQuality: 4,
    uxQuality: 3,
    researchQuality: 4,
    longContextQuality: 3,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'moderate',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: true,
    bestUseCases: ['High-quality free generation', 'Chain-of-thought', 'Agentic workflows'],
    notes: '117B params, 5.1B active (MoE). Apache 2.0. Configurable reasoning depth. Context window: verify on OpenRouter.',
  },

  {
    modelId: 'nex-agi/nex-n2-pro:free',
    displayName: 'Nex N2 Pro (Free)',
    provider: 'openrouter',
    category: 'zero-cost',
    costTier: 'free',
    contextWindow: 262_144,
    inputTypes: ['text', 'image'],
    outputTypes: ['text'],
    supportsVision: true,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 5,
    architectureQuality: 5,
    uxQuality: 3,
    researchQuality: 4,
    longContextQuality: 4,
    structuredOutputQuality: 4,
    reliabilityScore: 3,
    typicalSpeed: 'moderate',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: true,
    bestUseCases: ['Free agentic workflows', 'Coding with vision', 'Sprint planning'],
    notes: '397B total, 17B active. Adaptive Thinking. RATE LIMITS: 50 RPD / 20 RPM — may stall multi-stage runs.',
  },

  {
    modelId: 'inclusionai/ring-2.6-1t:free',
    displayName: 'Ring 2.6 1T (Free)',
    provider: 'openrouter',
    category: 'zero-cost',
    costTier: 'free',
    contextWindow: 262_144,
    maxOutputTokens: 65_536,
    inputTypes: ['text'],
    outputTypes: ['text'],
    supportsVision: false,
    supportsThinking: true,
    supportsStreaming: true,
    supportsJSON: true,
    supportsToolCalling: true,
    pmDocumentQuality: 4,
    codingQuality: 5,
    architectureQuality: 4,
    uxQuality: 3,
    researchQuality: 4,
    longContextQuality: 3,
    structuredOutputQuality: 4,
    reliabilityScore: 4,
    typicalSpeed: 'moderate',
    status: 'active-stable',
    enabled: true,
    comingSoon: false,
    isFree: true,
    bestUseCases: ['Free thinking/reasoning', 'Agentic coding', 'Multi-turn workflows'],
    notes: '1T total, 63B active. Adaptive reasoning: high/xhigh modes. 200 RPD rate limit.',
  },

];

// ─── Deprecated Models Reference ──────────────────────────────────────────────
// DO NOT re-enable these. Reference only.

export const DEPRECATED_MODELS = [
  {
    modelId: 'google/gemini-flash-1.5',
    deprecatedDate: '2026-06',
    reason: 'No endpoints found on OpenRouter June 2026',
    migration: 'Use google/gemini-2.5-flash',
  },
  {
    modelId: 'inclusionai/ring-2.6-1t (original, now paid)',
    deprecatedDate: '2026-06',
    reason: 'Free tier became paid. New :free variant restored.',
    migration: 'Use inclusionai/ring-2.6-1t:free',
  },
] as const;

// ─── Registry Access Functions ─────────────────────────────────────────────────

/**
 * PATTERN NOTE — how these functions work together:
 *
 * At the API boundary (run/route.ts):
 *   1. FIRST call validateModelId(submittedKey) → if false, return 400 immediately
 *   2. THEN call resolveModelId(submittedKey) → guaranteed to return a valid model ID
 *
 * resolveModelId() only falls back to FALLBACK_MODEL_ID in cases that
 * validateModelId() already blocked — so the fallback is for safety only,
 * not a runtime substitution path.
 */

/**
 * resolveModelId: Converts any key or model ID to a full provider model ID.
 * Accepts legacy short keys ('owlalpha') and full IDs ('openrouter/owl-alpha').
 * Returns FALLBACK_MODEL_ID only when called after validateModelId() already failed —
 * this path should not be reached in normal operation.
 */
export function resolveModelId(keyOrModelId: string): string {
  if (!keyOrModelId) return FALLBACK_MODEL_ID;

  // Direct model ID match — most common path for new code
  const direct = MODEL_REGISTRY.find(m => m.modelId === keyOrModelId);
  if (direct && direct.enabled) return direct.modelId;

  // Legacy short key match — backward compatibility path
  const legacyModelId = LEGACY_KEY_MAP[keyOrModelId];
  if (legacyModelId) {
    const legacyEntry = MODEL_REGISTRY.find(m => m.modelId === legacyModelId);
    if (legacyEntry && legacyEntry.enabled) return legacyEntry.modelId;
  }

  // Safety fallback — should not be reached if validateModelId() is called first
  console.warn(`[Registry] resolveModelId('${keyOrModelId}') fell through to fallback. Check validateModelId() call.`);
  return FALLBACK_MODEL_ID;
}

/**
 * validateModelId: Returns true if the key or model ID is valid for API submission.
 * Call this BEFORE resolveModelId() at every API boundary.
 * Returns false for: unknown keys, disabled models, comingSoon models.
 */
export function validateModelId(keyOrModelId: string): boolean {
  if (!keyOrModelId) return false;

  // Check direct model ID
  const direct = MODEL_REGISTRY.find(m => m.modelId === keyOrModelId);
  if (direct) return direct.enabled && !direct.comingSoon;

  // Check legacy key
  const legacyModelId = LEGACY_KEY_MAP[keyOrModelId];
  if (legacyModelId) {
    const entry = MODEL_REGISTRY.find(m => m.modelId === legacyModelId);
    return !!(entry && entry.enabled && !entry.comingSoon);
  }

  return false;
}

/** Returns the full ModelEntry for a model ID, or null. */
export function getModelById(modelId: string): ModelEntry | null {
  return MODEL_REGISTRY.find(m => m.modelId === modelId) ?? null;
}

/** Returns all enabled models for dropdown display. */
export function getEnabledModels(): ModelEntry[] {
  return MODEL_REGISTRY.filter(m => m.enabled && m.status !== 'retired');
}

/** Returns enabled models for a specific category. */
export function getModelsByCategory(category: ModelCategory): ModelEntry[] {
  return MODEL_REGISTRY.filter(m => m.enabled && m.category === category);
}

/** Returns all model IDs valid for API submission (full IDs, not legacy keys). */
export function getValidModelIds(): string[] {
  return MODEL_REGISTRY
    .filter(m => m.enabled && !m.comingSoon && m.status !== 'retired')
    .map(m => m.modelId);
}

/** Returns all free models sorted by reliability score descending. */
export function getFreeModels(): ModelEntry[] {
  return MODEL_REGISTRY
    .filter(m => m.isFree && m.enabled)
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore);
}

/**
 * validateRegistry: Checks the entire registry for consistency errors.
 * Call once at application startup. Logs but never throws.
 * Returns { errors, warnings } — zero errors is required for production.
 */
export function validateRegistry(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  for (const model of MODEL_REGISTRY) {
    if (seenIds.has(model.modelId))
      errors.push(`DUPLICATE modelId: ${model.modelId}`);
    seenIds.add(model.modelId);

    if (!model.modelId)        errors.push('Empty modelId in registry');
    if (!model.displayName)    errors.push(`Missing displayName: ${model.modelId}`);
    if (!model.provider)       errors.push(`Missing provider: ${model.modelId}`);
    if (!model.category)       errors.push(`Missing category: ${model.modelId}`);

    if (model.isFree !== (model.costTier === 'free'))
      warnings.push(`isFree/costTier mismatch: ${model.modelId}`);

    if (model.contextWindow <= 0)
      warnings.push(`Zero/negative contextWindow: ${model.modelId}`);
  }

  const total = MODEL_REGISTRY.length;
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`[Registry] ✅ Valid — ${total} models, 0 errors, 0 warnings`);
  } else {
    if (errors.length > 0)   console.error(`[Registry] ❌ ${errors.length} errors:`, errors);
    if (warnings.length > 0) console.warn(`[Registry] ⚠️ ${warnings.length} warnings:`, warnings);
  }

  return { errors, warnings };
}
```

---

### STEP A2 — VERIFY MODEL COUNT

```bash
grep -c "modelId:" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts
```

Expected: number ≥ 20

---

### STEP A3 — TYPESCRIPT VERIFICATION

```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | head -10 && \
echo "A3_TS_PASS"
```

Expected: `A3_TS_PASS` with zero error lines.

If TypeScript errors occur: fix ONLY the model-registry.ts file. Do not touch other files.

---

### STEP A4 — RUN REGISTRY VALIDATION

Create a temporary test file to confirm validateRegistry works:

```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
node -e "
const { validateRegistry } = require('./src/lib/model-registry.ts');
" 2>&1 | head -5 || echo "NOTE: Node cannot directly run TS — TypeScript check above confirms validity"
```

If node cannot run TypeScript directly, the TypeScript pass at A3 is sufficient. Just confirm A3 passed.

---

### STEP A5 — GIT COMMIT

```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git add src/lib/model-registry.ts && \
git diff --cached --stat && \
git commit -m "feat(registry): create model-registry.ts — canonical model data layer

- Single source of truth for all AI models in IdeaGate
- 20+ models across 6 categories with full capability matrix
- TypeScript interfaces: ModelEntry, ProviderId, ModelCategory, CostTier
- LEGACY_KEY_MAP: backward-compatible key resolution (haiku, owlalpha, etc.)
- Access functions: resolveModelId, validateModelId, getModelById, getEnabledModels
- validateRegistry(): startup consistency check
- No existing files modified — zero regression risk

Spec: IDEAGATE-MODEL-PLATFORM-SPECIFICATION.md
Mission: 11A (data layer only)"
```

---

### MISSION 11A ACCEPTANCE CRITERIA

```
□ model-registry.ts exists at src/lib/model-registry.ts
□ modelId count ≥ 20
□ TypeScript: 0 errors (A3_TS_PASS confirmed)
□ Git commit exists with correct message
□ ZERO other files modified
□ ZERO existing functionality changed
```

---

### MISSION 11A FINAL REPORT FORMAT

Paste this filled-in report back to Claude.ai before starting Mission 11B:

```
MISSION 11A REPORT
File created: YES / NO
Model count: ___
TypeScript: PASS / FAIL
Git commit hash: ___
Other files modified: NONE / [list any]
```

# ═══════════════════════════════════════════════════════════
# END OF MISSION 11A — STOP HERE. REPORT BACK BEFORE 11B.
# ═══════════════════════════════════════════════════════════

---
---
---

# ═══════════════════════════════════════════════════════════
# MISSION 11B — BACKEND ROUTE MIGRATION
# Only start after Mission 11A report is confirmed.
# PASTE EVERYTHING BELOW THIS LINE INTO CLAUDE CODE
# ═══════════════════════════════════════════════════════════

## MISSION 11B — BACKEND ROUTE MIGRATION

**Single responsibility:** Migrate run/route.ts and improve/route.ts to use registry.
**Risk:** LOW — route files are stateless handlers. Rollback is one git command.
**Files touched:** run/route.ts, improve/route.ts (exactly 2 files)
**Files NOT touched:** Everything else, especially coordinator-v2.js and GlobalStore.tsx
**Rollback:** `git checkout src/app/api/run/route.ts src/app/api/improve/route.ts`

---

### STEP B0 — PRE-FLIGHT

```bash
# Confirm 11A completed
ls /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts && echo "11A_CONFIRMED"

# TypeScript baseline
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l && \
echo "BASELINE_TS_COMPLETE"

# Read current MODEL_IDS in run/route.ts
grep -n "MODEL_IDS\|modelKey\|modelId\|haiku\|owlalpha\|OPENROUTER_MODEL" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/app/api/run/route.ts | head -30
```

Quote the grep output completely before proceeding.

---

### STEP B1 — READ run/route.ts IN FULL

```bash
cat /Users/apple/agent-zero-data/workdir/ui-layer/src/app/api/run/route.ts
```

Quote the full file content. Identify:
- Where MODEL_IDS is defined
- Where `MODEL_IDS[modelKey]` is used
- Where the model value is passed to the CLI spawn

---

### STEP B2 — MIGRATE run/route.ts

At the top of the file, after all existing imports, add:
```typescript
import { resolveModelId, validateModelId, getValidModelIds } from '@/lib/model-registry';
```

Find the `MODEL_IDS` constant declaration. Remove it entirely.

Find every usage of `MODEL_IDS[modelKey]` or `MODEL_IDS[model]` or similar.

Replace with this exact pattern — validate FIRST, then resolve:

```typescript
// Validate submitted model key/ID against registry
const modelKey = body.model ?? 'owlalpha';  // adjust field name to match actual body field
if (!validateModelId(modelKey)) {
  return NextResponse.json(
    {
      error: 'Unknown or unavailable model',
      received: modelKey,
      availableModels: getValidModelIds().slice(0, 8),
    },
    { status: 400 }
  );
}
const resolvedModelId = resolveModelId(modelKey);
```

Then use `resolvedModelId` wherever the old `MODEL_IDS[modelKey]` was used.

**IMPORTANT:** Read the actual file first. Adjust field names to match what the file actually uses. Do not guess field names.

---

### STEP B3 — TYPESCRIPT CHECK

```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | head -10 && \
echo "B3_TS_PASS"
```

If errors exist: fix in run/route.ts only. Do not touch other files.
Rollback if not fixable in 5 minutes: `git checkout src/app/api/run/route.ts`

---

### STEP B4 — FULL LIFECYCLE ACCEPTANCE TEST

This test is required after touching run/route.ts because it gates the lifecycle.

Start the development server if not running:
```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && npm run dev &
sleep 5
```

Manual test:
1. Open http://localhost:3000/desk
2. Select "Owl Alpha (Free)" in the model dropdown
3. Enter idea: "a daily habit tracker for students"
4. Click Run
5. Wait for Stage 0 to complete (first artifact appears in left rail)

```bash
# After Stage 0 completes — find and check the artifact
LATEST=$(ls -t /Users/apple/idea-gate-ui-safe/workspace/ | head -1)
echo "Run folder: $LATEST"
ls /Users/apple/idea-gate-ui-safe/workspace/$LATEST/artifacts/ | head -5
head -20 /Users/apple/idea-gate-ui-safe/workspace/$LATEST/artifacts/0-idea-intake.md
```

Expected: artifact contains "habit tracker" content, not SmartSync or other ideas.
If the lifecycle crashes or produces wrong content: rollback run/route.ts and report.

---

### STEP B5 — READ improve/route.ts

```bash
cat /Users/apple/agent-zero-data/workdir/ui-layer/src/app/api/improve/route.ts
```

Quote the full content. Apply the same migration pattern as B2.

---

### STEP B6 — MIGRATE improve/route.ts

Same pattern as B2:
- Add import at top
- Remove MODEL_IDS constant
- Replace MODEL_IDS[key] with validateModelId() then resolveModelId()

---

### STEP B7 — FINAL TYPESCRIPT CHECK

```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | head -10 && \
echo "B7_TS_PASS"
```

---

### STEP B8 — GIT COMMIT

```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git add src/app/api/run/route.ts src/app/api/improve/route.ts && \
git diff --cached --stat && \
git commit -m "fix(routes): migrate run and improve routes to registry-driven model resolution

run/route.ts:
  - Removed hardcoded MODEL_IDS constant
  - Added validateModelId() check — unknown models return 400 with valid model list
  - Added resolveModelId() for backward-compatible key resolution
  - Legacy keys (haiku, owlalpha, etc.) continue to work via LEGACY_KEY_MAP

improve/route.ts:
  - Same pattern as run/route.ts

Lifecycle acceptance test: PASSED (Stage 0 habit tracker confirmed)
Mission: 11B (backend routes)"
```

---

### MISSION 11B ACCEPTANCE CRITERIA

```
□ run/route.ts: no MODEL_IDS constant, uses resolveModelId()
□ improve/route.ts: same
□ TypeScript: 0 errors (B7_TS_PASS)
□ Lifecycle acceptance: Stage 0 artifact generated on-topic
□ Unknown model ID returns 400 (confirmed or noted for testing)
□ Only 2 files modified
```

---

### MISSION 11B REPORT FORMAT

```
MISSION 11B REPORT
run/route.ts migrated: YES / NO
improve/route.ts migrated: YES / NO
MODEL_IDS removed from both: YES / NO
validateModelId() added: YES / NO
TypeScript: PASS / FAIL
Stage 0 lifecycle test: PASS / FAIL (habit tracker content appeared: YES / NO)
Git commit hash: ___
Other files modified: NONE / [list any]
```

# ═══════════════════════════════════════════════════════════
# END OF MISSION 11B — STOP HERE. REPORT BACK BEFORE 11C.
# ═══════════════════════════════════════════════════════════

---
---
---

# ═══════════════════════════════════════════════════════════
# MISSION 11C — FRONTEND STATE MIGRATION
# Only start after Mission 11B report is confirmed.
# PASTE EVERYTHING BELOW THIS LINE INTO CLAUDE CODE
# ═══════════════════════════════════════════════════════════

## MISSION 11C — FRONTEND STATE MIGRATION

**Single responsibility:** Migrate GlobalStore.tsx and improve/page.tsx to use registry.
**Risk:** LOW-MEDIUM — GlobalStore affects all UI components. Read-only import only.
**Files touched:** GlobalStore.tsx, improve/page.tsx (exactly 2 files)
**Files NOT touched:** Everything else
**Rollback:** `git checkout src/lib/GlobalStore.tsx src/app/improve/page.tsx`

---

### STEP C0 — PRE-FLIGHT

```bash
# Confirm 11A and 11B completed
ls /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts && \
grep -c "resolveModelId" /Users/apple/agent-zero-data/workdir/ui-layer/src/app/api/run/route.ts && \
echo "11AB_CONFIRMED"

# TypeScript baseline (should be 0 errors after 11B)
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l && \
echo "BASELINE_TS_COMPLETE"

# Read GlobalStore model sections
grep -n "MODEL_LABELS\|MODEL_IDS\|FREE_MODEL_KEYS\|ModelKey\|defaultModel\|haiku\|owlalpha" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/GlobalStore.tsx | head -40
```

Quote the grep output completely.

---

### STEP C1 — READ GlobalStore.tsx IN FULL

```bash
cat /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/GlobalStore.tsx
```

Quote the full content. Identify:
- Exact definition of MODEL_LABELS
- Exact definition of FREE_MODEL_KEYS
- Exact definition of ModelKey type (if it exists)
- How model keys are used in settings.defaultModel

---

### STEP C2 — MIGRATE GlobalStore.tsx

Add this import after all existing imports:
```typescript
import {
  MODEL_REGISTRY,
  LEGACY_KEY_MAP,
  FALLBACK_MODEL_ID,
  resolveModelId,
} from '@/lib/model-registry';
```

Replace the MODEL_LABELS constant with:
```typescript
// Derived from registry — includes both legacy keys and full model IDs
const MODEL_LABELS: Record<string, string> = {
  // Legacy key → display name mappings (backward compatibility)
  ...Object.fromEntries(
    Object.entries(LEGACY_KEY_MAP).map(([key, modelId]) => {
      const entry = MODEL_REGISTRY.find(m => m.modelId === modelId);
      return [key, entry?.displayName ?? modelId];
    })
  ),
  // Full model ID → display name mappings (new code path)
  ...Object.fromEntries(
    MODEL_REGISTRY.filter(m => m.enabled).map(m => [m.modelId, m.displayName])
  ),
};
```

Replace the FREE_MODEL_KEYS constant with:
```typescript
const FREE_MODEL_KEYS = new Set<string>(
  MODEL_REGISTRY.filter(m => m.isFree && m.enabled).map(m => m.modelId)
);
```

**CRITICAL RULES FOR C2:**
- Do NOT change the ModelKey type if any component uses it as a literal type
- Do NOT change any function signatures
- Do NOT change the shape of settings.defaultModel
- If in doubt about any line, preserve the original and add the registry import alongside it
- The goal is additive — the registry provides data, existing code logic stays the same

---

### STEP C3 — TYPESCRIPT CHECK AFTER GLOBALSTORE

```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | head -15 && \
echo "C3_TS_PASS"
```

If TypeScript errors occur: read each error carefully.

**Common error patterns and fixes:**
- `Type 'string' is not assignable to type 'ModelKey'` — add `as ModelKey` cast or widen the type
- `Property 'MODEL_LABELS' does not exist` — the import may be wrong; check the path
- `Cannot find module '@/lib/model-registry'` — verify the file exists at src/lib/model-registry.ts

If errors cannot be fixed in 10 minutes:
```bash
git checkout src/lib/GlobalStore.tsx
```
Report the exact error message back to Claude.ai for diagnosis.

---

### STEP C4 — UI SMOKE TEST

```bash
# Dev server should be running. If not:
cd /Users/apple/agent-zero-data/workdir/ui-layer && npm run dev &
sleep 5
```

Manual verification:
1. Open http://localhost:3000/desk
2. Open the model dropdown
3. Confirm model names are readable (not undefined or empty)
4. Confirm "Owl Alpha (Free)" appears
5. Confirm "Qwen 2.5 72B" appears (was used in Run 2)
6. Select any model — confirm it stays selected

If the dropdown shows blank/undefined model names: rollback GlobalStore.tsx immediately.
```bash
git checkout src/lib/GlobalStore.tsx
```

---

### STEP C5 — READ improve/page.tsx

```bash
cat /Users/apple/agent-zero-data/workdir/ui-layer/src/app/improve/page.tsx
```

Quote the full content. Find the local `MODELS` or `MODEL_LIST` constant.
Note: This file may use `as const` for the models array, creating narrow TypeScript literal types.

---

### STEP C6 — MIGRATE improve/page.tsx SAFELY

**This is the highest-risk step in Mission 11. Read the file first. Do not guess.**

After reading the file, choose the correct migration strategy:

**Strategy A — If MODELS is a simple array with no `as const`:**
Replace with:
```typescript
import { MODEL_REGISTRY } from '@/lib/model-registry';

const MODELS = MODEL_REGISTRY
  .filter(m => m.enabled && !m.comingSoon)
  .map(m => ({
    key: m.modelId,
    label: m.displayName,
    tier: m.isFree ? 'free' : 'paid',
    description: m.bestUseCases[0] ?? '',
    speed: m.typicalSpeed,
  }));
```

**Strategy B — If MODELS uses `as const` and the type is used downstream (e.g., `ModelKey` or tuple type):**
Keep the existing MODELS constant as-is. Add the import and a SEPARATE registry-derived constant for new use:
```typescript
import { MODEL_REGISTRY } from '@/lib/model-registry';

// Registry-aware model list (used for new dropdowns in Mission 12+)
const REGISTRY_MODELS = MODEL_REGISTRY.filter(m => m.enabled && !m.comingSoon);

// Keep existing MODELS constant unchanged — do not modify
```

Strategy B is always safer. When in doubt, use Strategy B.

**Do NOT attempt to rewrite improve/page.tsx structural logic. Change ONLY the data source.**

---

### STEP C7 — TYPESCRIPT CHECK

```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | head -15 && \
echo "C7_TS_PASS"
```

If TypeScript errors: rollback improve/page.tsx and use Strategy B instead.
```bash
git checkout src/app/improve/page.tsx
```

---

### STEP C8 — GIT COMMIT

Only if C3 and C7 both passed:

```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git add src/lib/GlobalStore.tsx src/app/improve/page.tsx && \
git diff --cached --stat && \
git commit -m "fix(frontend): migrate GlobalStore and improve/page to registry-driven model data

GlobalStore.tsx:
  - MODEL_LABELS now derived from MODEL_REGISTRY + LEGACY_KEY_MAP
  - FREE_MODEL_KEYS now derived from MODEL_REGISTRY
  - No changes to function signatures or component API
  - Backward compatible — existing model keys continue to work

improve/page.tsx:
  - MODELS array [or REGISTRY_MODELS] derived from MODEL_REGISTRY
  - [Strategy A or B — note which was used]

All existing models still work. New models in registry now available.
Mission: 11C (frontend state migration)"
```

---

### MISSION 11C ACCEPTANCE CRITERIA

```
□ GlobalStore.tsx: MODEL_LABELS derived from registry
□ GlobalStore.tsx: FREE_MODEL_KEYS derived from registry
□ improve/page.tsx: model data uses registry (Strategy A or B)
□ TypeScript: 0 errors after all changes
□ UI smoke test: dropdown shows model names correctly
□ No component rendering broken
□ Only 2 files modified
```

---

### MISSION 11C REPORT FORMAT

```
MISSION 11C REPORT
GlobalStore.tsx migrated: YES / NO
improve/page.tsx migrated: YES / NO (Strategy used: A / B)
TypeScript GlobalStore: PASS / FAIL
TypeScript improve/page: PASS / FAIL
UI smoke test: PASS / FAIL (model names visible: YES / NO)
Git commit hash: ___
Other files modified: NONE / [list any]
```

# ═══════════════════════════════════════════════════════════
# END OF MISSION 11C — STOP HERE. REPORT BACK BEFORE 11D.
# ═══════════════════════════════════════════════════════════

---
---
---

# ═══════════════════════════════════════════════════════════
# MISSION 11D — DOCUMENTATION UPDATE
# Only start after Mission 11C report is confirmed.
# PASTE EVERYTHING BELOW THIS LINE INTO CLAUDE CODE
# ═══════════════════════════════════════════════════════════

## MISSION 11D — DOCUMENTATION AND FULL LIFECYCLE VALIDATION

**Single responsibility:** Update docs + run final 15-stage acceptance test + tag release.
**Risk:** ZERO — documentation only until acceptance test
**Files touched:** CLAUDE.md, ENGINEERING_STATUS.md, IDEAGATE-MASTER-TODO.md
**Files NOT touched:** Any code file

---

### STEP D0 — PRE-FLIGHT

```bash
# Confirm all three prior missions complete
ls /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts && \
grep -c "resolveModelId" /Users/apple/agent-zero-data/workdir/ui-layer/src/app/api/run/route.ts && \
grep -c "MODEL_REGISTRY" /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/GlobalStore.tsx && \
echo "11ABC_ALL_CONFIRMED"

# Final TypeScript baseline — must be 0 errors
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l && \
echo "FINAL_TS_BASELINE"
```

Expected: `11ABC_ALL_CONFIRMED`, `0`, `FINAL_TS_BASELINE`

---

### STEP D1 — UPDATE CLAUDE.md

```bash
cat /Users/apple/idea-gate-ui-safe/CLAUDE.md
```

Add the following section after the existing PROJECT LOCATIONS section:

```markdown
## MODEL REGISTRY — CANONICAL SOURCE
Location: /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts
Spec:      /Users/apple/idea-gate-ui-safe/IDEAGATE-MODEL-PLATFORM-SPECIFICATION.md

RULES — NEVER VIOLATE:
- Model IDs are ONLY defined in model-registry.ts
- NEVER hardcode a model ID anywhere else in the codebase
- NEVER add MODEL_IDS or MODEL_LABELS constants to any new file
- Use resolveModelId() for key/ID resolution
- Use validateModelId() at every API boundary before resolveModelId()
- LEGACY_KEY_MAP maintains backward compatibility — do not remove entries

To add a new model: edit model-registry.ts only. No other file changes needed.
To deprecate a model: set enabled:false and status:'deprecated' in model-registry.ts.
```

---

### STEP D2 — UPDATE ENGINEERING_STATUS.md

```bash
cat /Users/apple/idea-gate-ui-safe/ENGINEERING_STATUS.md | head -30
```

Add a Mission 11 completion section:

```markdown
## Mission 11 — Model Registry Foundation (COMPLETE)
Date: 2026-06-29

### 11A — Registry Data Layer
- Created: src/lib/model-registry.ts
- Models: 20+ with full capability matrix (pmDocumentQuality, codingQuality, etc.)
- Exports: ModelEntry interface, LEGACY_KEY_MAP, resolveModelId(), validateModelId()
- Status: COMPLETE ✅

### 11B — Backend Route Migration
- Migrated: run/route.ts, improve/route.ts
- Removed: hardcoded MODEL_IDS constants in both files
- Added: validateModelId() check returns 400 for unknown models
- Status: COMPLETE ✅

### 11C — Frontend State Migration
- Migrated: GlobalStore.tsx (MODEL_LABELS, FREE_MODEL_KEYS from registry)
- Migrated: improve/page.tsx (MODELS from registry)
- Status: COMPLETE ✅

### What Changed
Before Mission 11:
  - Model IDs hardcoded in 3+ files
  - Adding a new model required changing 3 files
  - No capability metadata existed

After Mission 11:
  - One file (model-registry.ts) is the source of truth
  - Adding a new model = edit model-registry.ts only
  - Full capability matrix per model (PM quality, coding, architecture, etc.)
  - Backward compatible — all existing keys still work

### Next: Mission 12 — Premium Model Selector Dropdown UI
```

---

### STEP D3 — UPDATE IDEAGATE-MASTER-TODO.md

```bash
cat /Users/apple/idea-gate-ui-safe/IDEAGATE-MASTER-TODO.md | head -40
```

Mark Mission 11 items as complete. Add Mission 12 as next P0 priority.

---

### STEP D4 — COMMIT DOCUMENTATION

```bash
cd /Users/apple/idea-gate-ui-safe && \
git add CLAUDE.md ENGINEERING_STATUS.md IDEAGATE-MASTER-TODO.md && \
git diff --cached --stat && \
git commit -m "docs(mission-11): update CLAUDE.md, ENGINEERING_STATUS, TODO post-registry

- CLAUDE.md: added model registry rules — no hardcoding model IDs
- ENGINEERING_STATUS.md: Mission 11A/B/C complete sections added
- IDEAGATE-MASTER-TODO.md: Mission 11 marked complete, Mission 12 added"
```

---

### STEP D5 — FULL 15-STAGE LIFECYCLE ACCEPTANCE TEST

This is the final gate. All 15 stages must complete.

```bash
# Confirm dev server is running
curl -s http://localhost:3000 > /dev/null && echo "SERVER_RUNNING" || echo "SERVER_NEEDS_START"
```

If server not running:
```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && npm run dev &
sleep 8
```

**Manual test — perform in browser:**
1. Go to http://localhost:3000/desk
2. Click "+ New Idea" to clear any previous run
3. Select model: "Owl Alpha (Free)"
4. Enter idea: `"a daily habit tracker for students"`
5. Click Run
6. Wait for all 15 stages to complete (10-20 minutes)

**After completion — verify:**
```bash
LATEST=$(ls -t /Users/apple/idea-gate-ui-safe/workspace/ | head -1)
echo "Run folder: $LATEST"
echo "Artifact count:"
ls /Users/apple/idea-gate-ui-safe/workspace/$LATEST/artifacts/ | wc -l
echo "Stage 0 content preview:"
head -8 /Users/apple/idea-gate-ui-safe/workspace/$LATEST/artifacts/0-idea-intake.md
echo "Stage 2 content preview:"
head -8 /Users/apple/idea-gate-ui-safe/workspace/$LATEST/artifacts/2-problem-definition.md
echo "Stage 6 content preview:"
head -8 /Users/apple/idea-gate-ui-safe/workspace/$LATEST/artifacts/6-prioritization.md
```

**Acceptance checklist:**
```
□ 15 artifacts generated (count = 15)
□ Stage 0: mentions "habit tracker" or "students"
□ Stage 2: does NOT mention "SmartSync" or "checkout"
□ Stage 6: does NOT mention "Personal Finance" or unrelated product
□ No artifact contains "[Product Idea]" placeholder
□ No artifact shows "[object Object]" or raw JSON
□ No crash in terminal / server logs
□ Desk UI shows 15 artifacts in left rail
□ Model dropdown still opens and shows models
□ New Idea button clears artifact list
```

PASS = 10/10 boxes checked
PARTIAL = 8-9 boxes (document which failed, continue to D6)
FAIL = fewer than 8 (report back, investigate before tagging)

---

### STEP D6 — PUSH BOTH REPOS AND TAG

Only if D5 passes (10/10 or 9/10 acceptable):

```bash
# Push UI layer
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git log --oneline -5 && \
git push origin main && \
echo "UI_PUSHED"

# Push CLI repo
cd /Users/apple/idea-gate-ui-safe && \
git log --oneline -5 && \
git push origin main && \
echo "CLI_PUSHED"

# Tag the release
cd /Users/apple/idea-gate-ui-safe && \
git tag -a v4.0-registry-foundation -m "IdeaGate v4.0 — Model Registry Foundation

Mission 11A: model-registry.ts created (20+ models, full capability matrix)
Mission 11B: run/route.ts + improve/route.ts migrated to registry
Mission 11C: GlobalStore.tsx + improve/page.tsx migrated to registry
Mission 11D: Documentation updated, 15-stage lifecycle validated

Lifecycle acceptance test: PASSED
Tag date: 2026-06-29" && \
git push origin v4.0-registry-foundation && \
echo "TAG_PUSHED"
```

---

### MISSION 11D ACCEPTANCE CRITERIA

```
□ CLAUDE.md updated with model registry rules
□ ENGINEERING_STATUS.md updated with Mission 11 completion
□ IDEAGATE-MASTER-TODO.md updated
□ 15-stage lifecycle: PASS (habit tracker, all stages on-topic)
□ Both repos pushed clean
□ Tag v4.0-registry-foundation pushed
```

---

### MISSION 11D FINAL REPORT FORMAT

```
MISSION 11D REPORT
CLAUDE.md updated: YES / NO
ENGINEERING_STATUS.md updated: YES / NO
IDEAGATE-MASTER-TODO.md updated: YES / NO
15-stage lifecycle: PASS / PARTIAL / FAIL
  Artifacts generated: ___ / 15
  Stage 0 on-topic: YES / NO
  Stage 2 on-topic (no SmartSync): YES / NO
  Stage 6 on-topic: YES / NO
  No [object Object]: YES / NO
Both repos pushed: YES / NO
Tag v4.0-registry-foundation: PUSHED / NOT PUSHED
CLI commit: ___
UI commit: ___
```

# ═══════════════════════════════════════════════════════════
# END OF MISSION 11D — ALL OF MISSION 11 IS COMPLETE.
# PASTE FINAL REPORT BACK TO CLAUDE.AI.
# ═══════════════════════════════════════════════════════════

---

## WHAT COMES AFTER MISSION 11

Once all four reports confirm PASS, the next mission is Mission 12.

**Mission 12: Premium Model Selector Dropdown UI**
- New `ModelSelector` component folder
- Categorized dropdown: 6 sections, search, filter chips, badges
- Replace current basic select in TopBar
- Bottom status bar component
- No changes to registry, routes, or lifecycle
- Starts ONLY after Mission 11D is confirmed complete

Do not start Mission 12 implementation. Wait for Mission 11D confirmation first.

