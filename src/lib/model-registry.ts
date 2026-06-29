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
