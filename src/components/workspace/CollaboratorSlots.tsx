'use client';

// src/components/workspace/CollaboratorSlots.tsx
// Sprint 07 (W7) — Collaborator slots placeholder shell.
//
// There is no real multi-collaborator backend yet (single-agent CLI engine —
// see CLAUDE.md §1). This renders generic, unassigned slots only: an empty
// ring/silhouette per slot. It NEVER invents a named person — a null
// `collaborator` is the only state a slot can be in today.

import React from 'react';
import { workspaceMotion } from './motion';

export interface CollaboratorSlot {
  id: string;
  collaborator: { id: string; name: string; avatarUrl: string | null } | null;
}

interface CollaboratorSlotsProps {
  slots: CollaboratorSlot[];
  reducedMotion: boolean;
}

export default function CollaboratorSlots({ slots, reducedMotion }: CollaboratorSlotsProps) {
  const hoverT = reducedMotion ? 'none' : `border-color ${workspaceMotion.hoverMs}ms ease-out`;

  return (
    <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 'var(--ig-t-label-size)', fontWeight: 600, letterSpacing: 'var(--ig-t-label-tracking)', textTransform: 'uppercase' as const, color: '#2a5a30', marginRight: '2px' }}>
        TEAM
      </span>
      {slots.map(slot => (
        <div
          key={slot.id}
          title={slot.collaborator?.name ?? 'Unassigned'}
          style={{
            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${slot.collaborator ? '#1a3a20' : '#1e293b'}`,
            backgroundColor: slot.collaborator ? '#0a1509' : 'transparent',
            transition: hoverT,
          }}
        >
          {slot.collaborator ? (
            <span style={{ fontSize: '11px', color: '#4ade80', fontFamily: "'JetBrains Mono','Fira Code',monospace", fontWeight: 700 }}>
              {slot.collaborator.name[0]?.toUpperCase()}
            </span>
          ) : (
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', border: '1px solid #334155' }} />
          )}
        </div>
      ))}
    </div>
  );
}
