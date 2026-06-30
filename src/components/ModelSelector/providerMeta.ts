// src/components/ModelSelector/providerMeta.ts
//
// Derives a display provider name + brand color from a model's ID prefix.
//
// CORRECTION NOTE: ModelEntry.provider in model-registry.ts is the ROUTING provider
// (always 'openrouter' for all 22 current entries) — not the underlying model maker.
// IDEAGATE-MISSION-12-MODEL-SELECTOR-SPECIFICATION.md Section 4 implied the `provider`
// field could drive the color dot directly; that does not hold given the actual registry
// shape. This file corrects that by deriving brand identity from the modelId prefix
// instead (e.g., 'anthropic/claude-opus-4-8' -> Anthropic). No registry changes required.
//
// Mission: 12A

const PROVIDER_META: Record<string, { name: string; color: string }> = {
  anthropic:     { name: 'Anthropic',  color: '#CC785C' },
  google:        { name: 'Google',     color: '#4285F4' },
  openai:        { name: 'OpenAI',     color: '#10A37F' },
  deepseek:      { name: 'DeepSeek',   color: '#0073E6' },
  'x-ai':        { name: 'xAI',        color: '#1DA1F2' },
  nvidia:        { name: 'NVIDIA',     color: '#76B900' },
  openrouter:    { name: 'OpenRouter', color: '#6C47FF' },
  xiaomi:        { name: 'Xiaomi',     color: '#FF6900' },
  qwen:          { name: 'Qwen',       color: '#FF7700' },
  'meta-llama':  { name: 'Meta',       color: '#0668E1' },
  mistralai:     { name: 'Mistral',    color: '#FA520F' },
};

export function getProviderMeta(modelId: string): { name: string; color: string } {
  const prefix = modelId.split('/')[0] ?? '';
  return PROVIDER_META[prefix] ?? { name: prefix || 'Unknown', color: '#6B7280' };
}
