// src/components/ModelSelector/types.ts
// Local UI types for the ModelSelector component family.
// Do NOT redefine ModelEntry — it is imported from '@/lib/model-registry'.
// Mission: 12A — see IDEAGATE-MISSION-12-MODEL-SELECTOR-SPECIFICATION.md

import type { ModelEntry, ModelCategory } from '@/lib/model-registry';

export type FilterChip = 'all' | 'paid' | 'free' | 'fast' | 'thinking' | 'vision';

export interface ModelSelectorProps {
  /** Currently selected model ID (full registry modelId, not a legacy ModelKey). */
  selectedModelId: string;
  /** Called when the user selects a model. Receives the full modelId. */
  onSelectModel: (modelId: string) => void;
  /** Disable the trigger (e.g., while a lifecycle is running). */
  disabled?: boolean;
}

export interface ModelCardProps {
  model: ModelEntry;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
  /** Forward-compat hook for a future Model Details Panel (Mission 13+). Unused in 12A. */
  onDetailRequest?: (model: ModelEntry) => void;
  tabIndex?: number;
  cardRef?: (el: HTMLButtonElement | null) => void;
}

export interface CategorySectionProps {
  category: ModelCategory;
  label: string;
  icon: string;
  models: ModelEntry[];
  selectedModelId: string;
  onSelect: (modelId: string) => void;
  registerCardRef: (modelId: string, el: HTMLButtonElement | null) => void;
}

// Display order — fixed per Spec Section 7. Do not reorder without updating the spec.
export const CATEGORY_ORDER: { category: ModelCategory; label: string; icon: string }[] = [
  { category: 'frontier-premium',          label: 'Frontier Premium',           icon: '🏆' },
  { category: 'best-value-paid',           label: 'Best Value Paid',            icon: '💰' },
  { category: 'fast-affordable',           label: 'Fast & Affordable',          icon: '⚡' },
  { category: 'zero-cost',                 label: 'Zero-Cost / Free',           icon: '🆓' },
  { category: 'coding-specialist',         label: 'Coding Specialists',         icon: '💻' },
  { category: 'heavy-reasoning',           label: 'Heavy Reasoning',            icon: '🧠' },
  { category: 'vision-document-analysis',  label: 'Vision / Document Analysis', icon: '👁' },
];
