'use client';

// src/components/ui/cinematic-glow-toggle.tsx
// Mission 17 — Cinematic glow toggle for dark/light mode.
// Adapted from 21st.dev/@daiwiikharihar/components/cinematic-glow-toggle.
// Deps: framer-motion only (already installed). Inline styles only.
//
// ON state (checked=true) = light mode. Emerald glow is intentional
// and correct — matches IdeaGate's accent. Do not restyle.

import React from 'react';
import { motion } from 'framer-motion';

export interface CinematicSwitchProps {
  checked:  boolean;
  onChange: (checked: boolean) => void;
  label?:   string;
}

const TRACK_W  = 38;
const TRACK_H  = 20;
const THUMB_D  = 14;
const THUMB_MARGIN = (TRACK_H - THUMB_D) / 2;
const EMERALD  = '#4ade80';

const SPRING = { type: 'spring' as const, stiffness: 500, damping: 32 };

export function CinematicSwitch({ checked, onChange, label }: CinematicSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label ?? 'Toggle theme'}
      onClick={() => onChange(!checked)}
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '6px',
        background: 'transparent',
        border:     'none',
        cursor:     'pointer',
        padding:    '0',
        lineHeight: 1,
      }}
    >
      {/* Track */}
      <div
        style={{
          width:           TRACK_W,
          height:          TRACK_H,
          borderRadius:    TRACK_H / 2,
          position:        'relative',
          backgroundColor: checked ? 'rgba(74,222,128,0.18)' : '#0f1f2e',
          border:          `1px solid ${checked ? 'rgba(74,222,128,0.45)' : '#1e293b'}`,
          boxShadow:       checked ? '0 0 14px 3px rgba(74,222,128,0.30)' : 'none',
          transition:      'background-color 220ms, border-color 220ms, box-shadow 220ms',
          flexShrink:      0,
        }}
      >
        {/* Thumb */}
        <motion.div
          animate={{ x: checked ? TRACK_W - THUMB_D - THUMB_MARGIN * 2 : 0 }}
          transition={SPRING}
          style={{
            position:        'absolute',
            top:             THUMB_MARGIN,
            left:            THUMB_MARGIN,
            width:           THUMB_D,
            height:          THUMB_D,
            borderRadius:    '50%',
            backgroundColor: checked ? EMERALD : '#334155',
            boxShadow:       checked ? '0 0 8px 2px rgba(74,222,128,0.55)' : 'none',
          }}
        />
      </div>

      {/* Optional label */}
      {label && (
        <span style={{
          fontSize:   '11px',
          color:      '#475569',
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
        }}>
          {label}
        </span>
      )}
    </button>
  );
}
