'use client';

// src/components/desk/ArtifactInspector.tsx
// Mission 16 — Right-side slide-in inspector (W4).
//
// Shell: slides in from right edge, 420px, no backdrop, no full-screen dim.
// The workspace remains fully visible and interactive behind the panel.
// Only a subtle left-edge shadow signals depth.
//
// Content: identical to ArtifactReader — reuses its exported primitives.
// Trigger: clicking a file node in WorkspaceExplorer.
// Close: ESC key, clicking outside the panel.
//
// Inline styles only. No Tailwind. No var(--ig-*) tokens.

import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  extractExcerpt,
  MarkdownContent,
  HEALTH_COLOR,
  HEALTH_LABEL,
  CONF_LABEL,
  type ReaderArtifact,
} from './ArtifactReader';

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
const SANS: React.CSSProperties = { fontFamily: "'Geist Sans', 'Geist', system-ui, -apple-system, sans-serif" };

interface Props {
  artifact:       ReaderArtifact;
  fullContent:    string | null;
  loading:        boolean;
  onClose:        () => void;
  onOpenInStudio: (file: string) => void;
  // Fix 3 (Mission 17) — prev/next navigation
  artifactList?:  string[];
  currentIndex?:  number;
  onNavigate?:    (direction: 'prev' | 'next') => void;
}

// Panel uses vw-based width so it scales with viewport; content column is capped separately.
const PANEL_W_STYLE = { width: '45vw', minWidth: '480px', maxWidth: '860px' } as const;
const TOP_BAR_H  = 44 + 42; // global TopBar (44) + Desk header bar (42)

export default function ArtifactInspector({
  artifact, fullContent, loading, onClose, onOpenInStudio,
  artifactList, currentIndex, onNavigate,
}: Props) {
  const panelRef  = useRef<HTMLDivElement>(null);
  const hColor    = HEALTH_COLOR[artifact.healthState];
  const hLabel    = HEALTH_LABEL[artifact.healthState];
  const confLabel = artifact.confidence ? CONF_LABEL[artifact.confidence] : undefined;
  const excerpt   = fullContent ? extractExcerpt(fullContent) : null;

  const totalCount = artifactList?.length ?? 0;
  const idx        = currentIndex ?? 0;
  const hasPrev    = onNavigate && idx > 0;
  const hasNext    = onNavigate && idx < totalCount - 1;

  // ESC + ArrowLeft/Right → close or navigate
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    // Guard: don't steal arrow keys from text inputs
    const tag = (document.activeElement as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft'  && hasPrev) { onNavigate?.('prev'); }
    if (e.key === 'ArrowRight' && hasNext) { onNavigate?.('next'); }
  }, [onClose, hasPrev, hasNext, onNavigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Click outside → close
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
  }, [onClose]);

  return (
    <>
      {/* Invisible backdrop — full viewport, no visual dim, just click-outside detection */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed', inset: 0,
          zIndex:   150,
          pointerEvents: 'all',
          // no background — workspace stays fully visible
        }}
      />

      {/* Inspector panel — slides in from right */}
      <motion.div
        ref={panelRef}
        key="artifact-inspector"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          position:        'fixed',
          top:             TOP_BAR_H,
          right:           0,
          bottom:          0,
          ...PANEL_W_STYLE,
          zIndex:          151,
          backgroundColor: '#030a10',
          borderLeft:      `1px solid ${hColor}33`,
          borderTop:       `2px solid ${hColor}`,
          boxShadow:       '-12px 0 40px rgba(0,0,0,0.5)',
          display:         'flex',
          flexDirection:   'column',
          overflow:        'hidden',
          ...MONO,
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ padding: '18px 20px 0', flexShrink: 0 }}>
          {/* Phase + health + stage */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: artifact.phaseColor, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.7, ...MONO }}>
                {artifact.phase.toUpperCase()}
              </span>
              <span style={{ fontSize: '10px', color: '#1e293b' }}>·</span>
              <span style={{ fontSize: '10px', color: hColor, fontWeight: 700, letterSpacing: '0.08em', ...MONO }}>
                {hLabel}
              </span>
              <span style={{ fontSize: '10px', color: '#1e293b' }}>·</span>
              <span style={{ fontSize: '10px', color: '#334155', ...MONO }}>
                Stage {artifact.stageIndex} / 15
              </span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '16px', padding: '0 2px', lineHeight: 1, ...MONO }}
              aria-label="Close inspector"
            >
              ×
            </button>
          </div>

          {/* Title — Fix 4: 24px weight 700 */}
          <div style={{ fontSize: '24px', color: 'var(--ig-text-primary, #f1f5f9)', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.3px', marginBottom: '4px' }}>
            {artifact.stageName}
          </div>

          {/* Confidence */}
          {confLabel && (
            <div style={{ fontSize: '13px', color: hColor, marginBottom: '14px', ...SANS }}>
              {confLabel}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '12px' }} />

          {/* Metadata row — Fix 4: migrate #64748b → var(--ig-text-tertiary) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', fontSize: '10px', color: 'var(--ig-text-tertiary, #64748b)', ...MONO }}>
            {artifact.agentId && (
              <span>Agent: <span style={{ color: '#94a3b8' }}>{artifact.agentId}</span></span>
            )}
            <span>Version: <span style={{ color: '#94a3b8' }}>v{artifact.version === 0 ? 1 : artifact.version}{artifact.version > 0 ? ' (improved)' : ''}</span></span>
            {artifact.downstreamCount > 0 && (
              <span>
                <span style={{ color: '#f59e0b' }}>{artifact.downstreamCount}</span> downstream
              </span>
            )}
          </div>

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '0' }} />
        </div>

        {/* ── CONTENT (scrollable) ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Reading column — capped at 660px so extra panel width becomes breathing room, not line stretch */}
          <div style={{ maxWidth: '660px', margin: '0 auto' }}>

          {/* Executive Summary */}
          {(loading || fullContent) && (
            <div style={{
              border:       '1px solid rgba(255,255,255,0.06)',
              borderRadius: '5px',
              padding:      '14px',
              background:   'rgba(255,255,255,0.02)',
              marginBottom: '20px',
            }}>
              {/* Fix 4: Executive Summary label — 10px, migrate #64748b → var(--ig-text-tertiary) */}
              <div style={{ fontSize: '10px', color: 'var(--ig-text-tertiary, #64748b)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', ...MONO }}>
                Executive Summary
              </div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div className="shimmer-bar" style={{ height: '10px', borderRadius: '2px', width: '100%' }} />
                  <div className="shimmer-bar" style={{ height: '10px', borderRadius: '2px', width: '85%' }} />
                  <div className="shimmer-bar" style={{ height: '10px', borderRadius: '2px', width: '68%' }} />
                </div>
              ) : excerpt ? (
                /* Fix 4: prose 14px, lineHeight 1.7, tokens */
                <div style={{ fontSize: '14px', color: 'var(--ig-text-secondary, #94a3b8)', lineHeight: 1.7, ...SANS }}>
                  {excerpt}
                  {(fullContent?.length ?? 0) > 400 && <span style={{ color: 'var(--ig-text-tertiary, #334155)' }}>…</span>}
                </div>
              ) : null}
            </div>
          )}

          {/* Full content */}
          {fullContent ? (
            <MarkdownContent content={fullContent} />
          ) : !loading ? (
            <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.75, ...SANS }}>
              {artifact.summary
                ? <>{artifact.summary}<span style={{ color: '#334155' }}>…</span></>
                : <span style={{ color: '#334155' }}>Content not yet generated.</span>}
            </div>
          ) : null}

          {/* Upstream dependencies */}
          {artifact.upstreamItems && artifact.upstreamItems.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '9px', color: '#64748b', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', ...MONO }}>
                Upstream Dependencies
              </div>
              {artifact.upstreamItems.slice(0, 6).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{
                    width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: item.healthState === 'stale' ? '#ef4444'
                      : item.healthState === 'questionable' ? '#f59e0b'
                      : item.healthState === 'trustworthy'  ? '#2a5a30'
                      : 'transparent',
                    border: (item.healthState === 'generating' || item.healthState === 'queued') ? '1px solid #334155' : 'none',
                  }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8', flex: 1, ...MONO }}>{item.name}</span>
                  <span style={{ fontSize: '10px', color: HEALTH_COLOR[item.healthState], ...MONO }}>
                    {HEALTH_LABEL[item.healthState]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Downstream impact */}
          {artifact.downstreamItems && artifact.downstreamItems.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '9px', color: '#64748b', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', ...MONO }}>
                Downstream Impact
              </div>
              {artifact.downstreamItems.slice(0, 4).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{
                    width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: (item.healthState === 'stale' || item.healthState === 'questionable') ? '#f59e0b'
                      : item.healthState === 'trustworthy' ? '#2a5a30'
                      : 'transparent',
                    border: (item.healthState === 'generating' || item.healthState === 'queued') ? '1px solid #334155' : 'none',
                  }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8', ...MONO }}>{item.name}</span>
                </div>
              ))}
            </div>
          )}
          </div>{/* /reading-column 660px */}
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

        {/* ── FOOTER ── */}
        <div style={{ padding: '10px 20px 14px', flexShrink: 0, backgroundColor: '#030a10' }}>

          {/* Fix 3 — Prev / counter / Next navigation row */}
          {onNavigate && totalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => onNavigate('prev')}
                disabled={!hasPrev}
                style={{
                  background: 'transparent', border: 'none', padding: '2px 0',
                  fontSize: '11px', cursor: hasPrev ? 'pointer' : 'default',
                  color: hasPrev ? 'var(--ig-text-tertiary, #475569)' : 'var(--ig-text-tertiary, #1e293b)',
                  opacity: hasPrev ? 1 : 0.35, ...MONO,
                }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: '11px', color: 'var(--ig-text-tertiary, #475569)', flex: 1, textAlign: 'center', ...MONO }}>
                {idx + 1} of {totalCount}
              </span>
              <button
                onClick={() => onNavigate('next')}
                disabled={!hasNext}
                style={{
                  background: 'transparent', border: 'none', padding: '2px 0',
                  fontSize: '11px', cursor: hasNext ? 'pointer' : 'default',
                  color: hasNext ? 'var(--ig-text-tertiary, #475569)' : 'var(--ig-text-tertiary, #1e293b)',
                  opacity: hasNext ? 1 : 0.35, ...MONO,
                }}
              >
                Next →
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onOpenInStudio(artifact.file)}
            style={{
              padding: '9px 18px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
              backgroundColor: 'rgba(74,222,128,0.10)', border: '1px solid #4ade8033',
              borderRadius: '5px', color: '#4ade80', cursor: 'pointer', ...MONO,
            }}
          >
            Open in Studio →
          </button>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: '11px', cursor: 'pointer', padding: '9px 0', ...MONO }}
          >
            Close
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '10px', color: 'var(--ig-text-tertiary, #1e293b)' }}>ESC</span>
          </div>{/* /footer-buttons-row */}
        </div>
      </motion.div>
    </>
  );
}
