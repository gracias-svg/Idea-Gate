'use client';
// src/components/ModelSelector/index.tsx
// Mission: 12A — top-level entry point for the ModelSelector component family.
//
// USAGE (for Mission 12B/12C, NOT wired in this mission):
//   <ModelSelector
//     selectedModelId={gs.defaultModel}      // or a future widened-string field — see
//                                              // Spec Section 11, Open Question #2
//     onSelectModel={(id) => updateSettings({ defaultModel: id })}
//     disabled={isRunning}
//   />

import React, { useState, useRef } from 'react';
import { ModelSelectorTrigger } from './ModelSelectorTrigger';
import { ModelSelectorPanel } from './ModelSelectorPanel';
import type { ModelSelectorProps } from './types';

export function ModelSelector({ selectedModelId, onSelectModel, disabled }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setIsOpen(false);
    // Return focus to trigger after closing — accessibility requirement, Spec Section 10
    (wrapperRef.current?.querySelector('button') as HTMLButtonElement | null)?.focus();
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <ModelSelectorTrigger
        selectedModelId={selectedModelId}
        isOpen={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen(o => !o)}
      />
      {isOpen && (
        <ModelSelectorPanel
          selectedModelId={selectedModelId}
          onSelect={onSelectModel}
          onClose={close}
        />
      )}
    </div>
  );
}

export default ModelSelector;
