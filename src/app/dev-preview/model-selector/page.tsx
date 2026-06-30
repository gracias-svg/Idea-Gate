'use client';
// src/app/dev-preview/model-selector/page.tsx
//
// TEMPORARY preview-only route for Mission 12A isolated testing.
// Not linked from any navigation. Not part of the production app surface.
// Renders ModelSelector standalone with local React state — no GlobalStore dependency,
// no production wiring. This proves the component works correctly before Mission 12B
// touches the real TopBar.
//
// Safe to delete after Mission 12D confirms the wired-in version is stable, or to
// repurpose as a permanent component-testing route. Do not link it from any nav menu.
//
// Mission: 12A

import React, { useState } from 'react';
import { ModelSelector } from '@/components/ModelSelector';
import { DEFAULT_MODEL_ID } from '@/lib/model-registry';

export default function ModelSelectorPreviewPage() {
  const [selected, setSelected] = useState(DEFAULT_MODEL_ID);

  return (
    <div style={{
      padding: '60px', backgroundColor: '#000', minHeight: '100vh', color: '#94a3b8',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <h1 style={{ fontSize: '14px', marginBottom: '8px' }}>
        Mission 12A — ModelSelector Preview
      </h1>
      <p style={{ fontSize: '11px', color: '#475569', marginBottom: '24px' }}>
        Temporary isolated test route. Not linked in production navigation.
        Controlled by local React state only — does not touch GlobalStore.
      </p>
      <ModelSelector selectedModelId={selected} onSelectModel={setSelected} />
      <div style={{ marginTop: '24px', fontSize: '10px', color: '#334155' }}>
        Selected modelId: <span style={{ color: '#4ade80' }}>{selected}</span>
      </div>
    </div>
  );
}
