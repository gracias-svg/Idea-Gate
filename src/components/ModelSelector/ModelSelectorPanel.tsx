'use client';
// src/components/ModelSelector/ModelSelectorPanel.tsx
// Mission: 12A
// Composes search, filters, and category sections. Owns filter logic and keyboard nav.

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { getEnabledModels } from '@/lib/model-registry';
import type { ModelEntry } from '@/lib/model-registry';
import { SearchBar } from './SearchBar';
import { CategorySection } from './CategorySection';
import { CATEGORY_ORDER, type FilterChip } from './types';

interface Props {
  selectedModelId: string;
  onSelect: (modelId: string) => void;
  onClose: () => void;
}

function matchesFilters(m: ModelEntry, filters: Set<FilterChip>): boolean {
  if (filters.size === 0 || filters.has('all')) return true;
  const active = Array.from(filters);
  if (active.includes('paid') && m.costTier === 'free') return false;
  if (active.includes('free') && m.costTier !== 'free') return false;
  if (active.includes('fast') && !['very-fast', 'fast'].includes(m.typicalSpeed)) return false;
  if (active.includes('thinking') && !m.supportsThinking) return false;
  if (active.includes('vision') && !m.supportsVision) return false;
  return true;
}

export function ModelSelectorPanel({ selectedModelId, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Set<FilterChip>>(new Set());
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const panelRef = useRef<HTMLDivElement>(null);

  const enabledModels = useMemo(() => getEnabledModels(), []);

  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enabledModels.filter(m => {
      if (!matchesFilters(m, filters)) return false;
      if (!q) return true;
      return (
        m.displayName.toLowerCase().includes(q) ||
        m.modelId.toLowerCase().includes(q) ||
        m.bestUseCases.some(u => u.toLowerCase().includes(q))
      );
    });
  }, [enabledModels, query, filters]);

  const toggleFilter = useCallback((chip: FilterChip) => {
    setFilters(prev => {
      if (chip === 'all') return new Set();
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip); else next.add(chip);
      return next;
    });
  }, []);

  const registerCardRef = useCallback((modelId: string, el: HTMLButtonElement | null) => {
    if (el) cardRefs.current.set(modelId, el);
    else cardRefs.current.delete(modelId);
  }, []);

  // Keyboard navigation — Arrow keys move focus, Enter selects, Escape closes (Spec Section 10)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Enter') {
        const active = document.activeElement;
        const ids = filteredModels.map(m => m.modelId);
        const activeId = ids.find(id => cardRefs.current.get(id) === active);
        if (activeId) { onSelect(activeId); onClose(); }
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const ids = filteredModels.map(m => m.modelId);
      if (ids.length === 0) return;
      const active = document.activeElement;
      const currentIdx = ids.findIndex(id => cardRefs.current.get(id) === active);
      let nextIdx = e.key === 'ArrowDown' ? currentIdx + 1 : currentIdx - 1;
      if (nextIdx < 0) nextIdx = ids.length - 1;
      if (nextIdx >= ids.length) nextIdx = 0;
      cardRefs.current.get(ids[nextIdx])?.focus();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [filteredModels, onSelect, onClose]);

  // Click-outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const noResults = filteredModels.length === 0;

  return (
    <div
      ref={panelRef}
      className="ig-ms-scroll"
      role="listbox"
      aria-label="Select AI model"
      style={{
        position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '400px', maxHeight: '480px',
        overflowY: 'auto', backgroundColor: '#020c06', border: '1px solid #0a1a2e', borderRadius: '6px',
        boxShadow: '0 12px 28px rgba(0,0,0,0.5)', zIndex: 50,
        animation: 'ig-ms-fade-in 150ms ease-out',
      }}
    >
      <style>{`
        @keyframes ig-ms-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ig-ms-scroll::-webkit-scrollbar { width: 6px; }
        .ig-ms-scroll::-webkit-scrollbar-track { background: transparent; }
        .ig-ms-scroll::-webkit-scrollbar-thumb {
          background: #1a3a20; border-radius: 6px;
        }
        .ig-ms-scroll::-webkit-scrollbar-thumb:hover { background: #4ade8055; }
        .ig-ms-scroll { scrollbar-width: thin; scrollbar-color: #1a3a20 transparent; }
        .ig-model-card { transition: background-color 120ms ease, transform 120ms ease; }
        .ig-model-card:hover { background-color: #0a0f1ecc; transform: translateX(2px); }
      `}</style>
      <div style={{ position: 'sticky', top: 0, zIndex: 3, backgroundColor: '#020c06' }}>
        <SearchBar query={query} onQueryChange={setQuery} activeFilters={filters} onToggleFilter={toggleFilter} />
      </div>
      {noResults ? (
        <div style={{ padding: '20px 12px', fontSize: '10px', color: '#334155', textAlign: 'center' }}>
          No models found for &quot;{query}&quot;. Try &quot;free&quot;, &quot;vision&quot;, or a provider name.
        </div>
      ) : (
        CATEGORY_ORDER.map(({ category, label, icon }) => (
          <CategorySection
            key={category}
            category={category}
            label={label}
            icon={icon}
            models={filteredModels.filter(m => m.category === category)}
            selectedModelId={selectedModelId}
            onSelect={(id) => { onSelect(id); onClose(); }}
            registerCardRef={registerCardRef}
          />
        ))
      )}
      <div style={{ padding: '6px 12px', borderTop: '1px solid #0a1a2e', fontSize: '8px', color: '#1e293b', textAlign: 'center' }}>
        Powered by OpenRouter · {enabledModels.length} models available
      </div>
    </div>
  );
}
