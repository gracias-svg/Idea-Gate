'use client';

// src/components/ModelDropdown.tsx
// Reusable model selector dropdown — reads from and writes to GlobalStore.
// Replaces per-page horizontal scrolling model bars.
//
// Usage:
//   import { ModelDropdown } from '@/components/ModelDropdown';
//   <ModelDropdown />                  ← reads/writes settings.defaultModel globally
//   <ModelDropdown onSelect={fn} />   ← override callback (still writes to settings too)

import React, { useState, useRef, useEffect } from 'react';
import {
  useGlobalStore, MODEL_LABELS, FREE_MODEL_KEYS, getModelMeta, isModelFree,
  type ModelKey,
} from '@/lib/GlobalStore';

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

// Paid model keys — everything not in FREE_MODEL_KEYS
const PAID_MODEL_KEYS = (Object.keys(MODEL_LABELS) as ModelKey[]).filter(
  k => !FREE_MODEL_KEYS.includes(k),
);

interface ModelDropdownProps {
  /** Called in addition to settings update. Optional. */
  onSelect?: (key: ModelKey) => void;
  /** Compact = smaller trigger button for tight spaces (Office header) */
  compact?: boolean;
}

export function ModelDropdown({ onSelect, compact = false }: ModelDropdownProps) {
  const { state: { settings }, updateSettings } = useGlobalStore();
  const currentKey = settings.defaultModel;
  const currentMeta = getModelMeta(currentKey);
  const isFreeModel = isModelFree(currentKey);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  function handleSelect(key: ModelKey) {
    updateSettings({ defaultModel: key });
    onSelect?.(key);
    setOpen(false);
  }

  const triggerFontSize = compact ? '10px' : '11px';
  const dotSize       = compact ? '6px'  : '7px';
  const triggerPadY   = compact ? '4px'  : '5px';
  const triggerPadX   = compact ? '8px'  : '10px';
  const dotColor      = isFreeModel ? '#84cc16' : '#4ade80';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>

      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        title={`Model: ${currentMeta.label} · ${currentMeta.provider} · ${currentMeta.cost}`}
        style={{
          ...MONO,
          display:         'flex',
          alignItems:      'center',
          gap:             '6px',
          padding:         `${triggerPadY} ${triggerPadX}`,
          backgroundColor: '#040b14',
          border:          `1px solid ${open ? '#334155' : '#1e293b'}`,
          borderRadius:    '3px',
          cursor:          'pointer',
          fontSize:        triggerFontSize,
          whiteSpace:      'nowrap',
          minWidth:        '160px',
        }}
      >
        {/* Status dot */}
        <div style={{
          width: dotSize, height: dotSize, borderRadius: '50%',
          backgroundColor: dotColor, flexShrink: 0,
        }} />

        {/* Label */}
        <span style={{ color: '#94a3b8', flex: 1 }}>{currentMeta.label}</span>

        {/* FREE badge */}
        {isFreeModel && (
          <span style={{
            fontSize: '8px', fontWeight: 700, color: '#4ade80',
            padding: '1px 4px', border: '1px solid #4ade8033',
            borderRadius: '2px', letterSpacing: '0.04em',
          }}>FREE</span>
        )}

        {/* Chevron */}
        <span style={{ color: '#334155', fontSize: '9px', marginLeft: '2px' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* ── Dropdown panel ─────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position:        'absolute',
          top:             'calc(100% + 4px)',
          left:            0,
          backgroundColor: '#020c06',
          border:          '1px solid #1e293b',
          borderRadius:    '4px',
          minWidth:        '300px',
          zIndex:          9999,
          boxShadow:       '0 12px 32px #00000090',
          overflow:        'hidden',
        }}>

          {/* ── PAID MODELS ───────────────────────────────────────────── */}
          <div style={{
            padding:      '6px 12px 5px',
            fontSize:     '9px',
            color:        '#334155',
            letterSpacing:'0.12em',
            fontWeight:   700,
            borderBottom: '1px solid #0a1a2e',
            backgroundColor: '#020609',
            ...MONO,
          }}>
            PAID MODELS
          </div>

          {PAID_MODEL_KEYS.map(k => {
            const info   = MODEL_LABELS[k];
            const active = k === currentKey;
            return (
              <button
                key={k}
                onClick={() => handleSelect(k)}
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  gap:             '8px',
                  width:           '100%',
                  padding:         '8px 12px',
                  backgroundColor: active ? '#081208' : 'transparent',
                  border:          'none',
                  borderLeft:      `2px solid ${active ? '#4ade80' : 'transparent'}`,
                  cursor:          'pointer',
                  textAlign:       'left',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#040b14'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    ...MONO,
                    fontSize:   '12px',
                    color:      active ? '#4ade80' : '#94a3b8',
                    fontWeight: active ? 700 : 400,
                  }}>
                    {info.label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                    {info.provider} · {info.cost} · {info.best}
                  </div>
                </div>
                {active && (
                  <span style={{ fontSize: '10px', color: '#4ade80' }}>✓</span>
                )}
              </button>
            );
          })}

          {/* ── FREE TIER MODELS ──────────────────────────────────────── */}
          <div style={{
            padding:         '6px 12px 5px',
            fontSize:        '9px',
            color:           '#4ade8077',
            letterSpacing:   '0.12em',
            fontWeight:      700,
            borderTop:       '1px solid #0a1a2e',
            borderBottom:    '1px solid #0a1a2e',
            backgroundColor: '#020609',
            display:         'flex',
            alignItems:      'center',
            gap:             '8px',
            ...MONO,
          }}>
            <span>FREE TIER</span>
            <span style={{ fontSize: '8px', color: '#334155', fontWeight: 400, letterSpacing: '0.05em' }}>
              OpenRouter free tier · rate-limited · no cost
            </span>
          </div>

          {FREE_MODEL_KEYS.map(k => {
            const info   = MODEL_LABELS[k];
            const active = k === currentKey;
            return (
              <button
                key={k}
                onClick={() => handleSelect(k)}
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  gap:             '8px',
                  width:           '100%',
                  padding:         '8px 12px',
                  backgroundColor: active ? '#081208' : 'transparent',
                  border:          'none',
                  borderLeft:      `2px solid ${active ? '#84cc16' : 'transparent'}`,
                  cursor:          'pointer',
                  textAlign:       'left',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#040b14'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      ...MONO,
                      fontSize:   '12px',
                      color:      active ? '#84cc16' : '#94a3b8',
                      fontWeight: active ? 700 : 400,
                    }}>
                      {info.label}
                    </span>
                    <span style={{
                      fontSize: '8px', fontWeight: 700,
                      color: active ? '#84cc16' : '#4ade8055',
                      padding: '1px 4px',
                      border: `1px solid ${active ? '#84cc1633' : '#4ade8022'}`,
                      borderRadius: '2px',
                    }}>
                      FREE
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                    {info.provider}
                    {info.contextK ? ` · ${info.contextK >= 1000 ? `${info.contextK / 1000}M` : `${info.contextK}K`} ctx` : ''}
                    {' · '}{info.best}
                  </div>
                </div>
                {active && (
                  <span style={{ fontSize: '10px', color: '#84cc16' }}>✓</span>
                )}
              </button>
            );
          })}

          {/* ── Footer note ───────────────────────────────────────────── */}
          <div style={{
            padding:         '6px 12px',
            fontSize:        '9px',
            color:           '#1e293b',
            borderTop:       '1px solid #0a1a2e',
            backgroundColor: '#020609',
            lineHeight:      1.6,
          }}>
            Selection persists across Desk · Refine · Office
          </div>
        </div>
      )}
    </div>
  );
}
