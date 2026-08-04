'use client';

// src/components/desk/ArtifactReader.tsx
// Mission 14 R1 — Artifact Reader overlay.
// Mission 15 E1–E5 — max-width, typography, exec summary, dependency section, arrow nav.
// Inline styles only — no Tailwind, no var(--ig-*) (unresolved in this context).
// All hex values match the palette established in desk/page.tsx.

import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

export type HealthState = 'trustworthy' | 'questionable' | 'stale' | 'generating' | 'queued';

export interface ReaderArtifact {
  file: string;
  stageIndex: number;
  stageName: string;
  phase: string;
  phaseColor: string;
  healthState: HealthState;
  confidence?: string;
  version: number;
  summary: string;
  downstreamCount: number;
  agentId?: string;
  // E4: downstream artifact names + health for dependency section
  downstreamItems?: { name: string; healthState: HealthState }[];
  // B4: upstream dependency names + health (Mission 15-D)
  upstreamItems?: { name: string; healthState: HealthState }[];
}

interface Props {
  artifact: ReaderArtifact;
  fullContent: string | null;    // fetched by parent (R3)
  loading: boolean;
  onClose: () => void;
  onOpenInStudio: (file: string) => void;
  // E5: keyboard arrow navigation
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

// ── Constants mirroring desk/page.tsx ────────────────────────────────────────
// HEALTH_COLOR/LABEL/CONF_LABEL exported for ArtifactInspector reuse (Mission 16).
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
const SANS: React.CSSProperties = { fontFamily: "'Geist Sans', 'Geist', system-ui, -apple-system, sans-serif" };

export const HEALTH_COLOR: Record<HealthState, string> = {
  trustworthy: '#4ade80',
  questionable: '#f59e0b',
  stale: '#ef4444',
  generating: '#818cf8',
  queued: '#1e293b',
};
export const HEALTH_LABEL: Record<HealthState, string> = {
  trustworthy: 'SOLID',
  questionable: 'REVIEW',
  stale: 'STALE',
  generating: 'RUNNING',
  queued: 'QUEUED',
};
export const CONF_LABEL: Record<string, string> = {
  high: 'High confidence',
  medium: 'Questionable — needs review',
  low: 'Low confidence',
};

// ── Executive summary excerpt — strips markdown for clean prose ───────────────
// Exported for ArtifactInspector reuse (Mission 16).
export function extractExcerpt(content: string, maxLen = 400): string {
  const parts: string[] = [];
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t === '---' || t === '***' || t.startsWith('```') || t.startsWith('|')) continue;
    const cleaned = t
      .replace(/^>\s*/, '')
      .replace(/^[-*]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '');
    if (cleaned) parts.push(cleaned);
    if (parts.join(' ').length >= maxLen) break;
  }
  return parts.join(' ').slice(0, maxLen);
}

// ── Inline renderer — mirrors desk/page.tsx ir() exactly ─────────────────────
// Exported for ArtifactInspector reuse (Mission 16).
export function ir(text: string, k: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p, i) => {
    const key = `${k}-${i}`;
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={key} style={{ color: '#f1f5f9', fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2 && !p.startsWith('**'))
      return <em key={key} style={{ color: '#cbd5e1', fontStyle: 'italic' }}>{p.slice(1, -1)}</em>;
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2)
      return <code key={key} style={{ background: '#0d1117', color: '#4ade80', padding: '2px 6px', borderRadius: '3px', fontSize: '13px', ...MONO }}>{p.slice(1, -1)}</code>;
    return <React.Fragment key={key}>{p}</React.Fragment>;
  });
}

// ── Markdown block renderer — uses ir() for inline formatting ─────────────────
// Exported for ArtifactInspector reuse (Mission 16).
export function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCode = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let codeStartKey = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    const k = `r${i}`;

    if (inCode) {
      if (t.startsWith('```')) {
        elements.push(
          <div key={codeStartKey} style={{ margin: '14px 0', background: '#0d1117', border: '1px solid #1e293b', borderRadius: '4px', overflow: 'hidden' }}>
            {codeLang && <div style={{ padding: '4px 14px', borderBottom: '1px solid #1e293b', fontSize: '10px', color: '#64748b', background: '#080d12', ...MONO }}>{codeLang}</div>}
            <pre style={{ ...MONO, margin: 0, padding: '14px 16px', fontSize: '12px', color: '#4ade80', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre' }}>{codeLines.join('\n')}</pre>
          </div>
        );
        inCode = false; codeLines = []; codeLang = '';
      } else { codeLines.push(line); }
    } else if (t.startsWith('```')) {
      inCode = true; codeLang = t.slice(3).trim(); codeStartKey = k;
    } else if (!t) {
      elements.push(<div key={k} style={{ height: '9px' }} />);
    } else if (t === '---' || t === '***') {
      elements.push(<div key={k} style={{ borderTop: '1px solid #1e293b', margin: '20px 0' }} />);
    } else if (t.startsWith('# ')) {
      elements.push(
        <div key={k} style={{ marginTop: i === 0 ? 0 : '28px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ ...MONO, fontSize: '20px', color: '#f1f5f9', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{ir(t.slice(2), k)}</h1>
        </div>
      );
    } else if (t.startsWith('## ')) {
      elements.push(
        <div key={k} style={{ marginTop: '24px', marginBottom: '8px' }}>
          <h2 style={{ ...MONO, fontSize: '16px', color: '#cbd5e1', fontWeight: 700, margin: 0 }}>{ir(t.slice(3), k)}</h2>
        </div>
      );
    } else if (t.startsWith('### ')) {
      elements.push(
        <div key={k} style={{ marginTop: '16px', marginBottom: '5px' }}>
          <h3 style={{ ...MONO, fontSize: '12px', color: '#64748b', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ir(t.slice(4), k)}</h3>
        </div>
      );
    } else if (t.startsWith('> ')) {
      elements.push(
        <div key={k} style={{ margin: '10px 0', padding: '10px 16px', borderLeft: '3px solid #4ade8033', background: '#040f08', fontSize: '15px', color: '#4ade8099', ...MONO, lineHeight: 1.8 }}>{ir(t.slice(2), k)}</div>
      );
    } else if (line.match(/^(\s*)([-*])\s+(.+)/)) {
      const bm = line.match(/^(\s*)([-*])\s+(.+)/)!;
      elements.push(
        <div key={k} style={{ display: 'flex', gap: '10px', marginLeft: Math.floor(bm[1].length / 2) * 20, margin: '3px 0' }}>
          <span style={{ color: '#4ade8055', flexShrink: 0, fontSize: '14px' }}>▸</span>
          <span style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.75, ...MONO }}>{ir(bm[3], k)}</span>
        </div>
      );
    } else if (line.match(/^(\s*)(\d+)\.\s+(.+)/)) {
      const om = line.match(/^(\s*)(\d+)\.\s+(.+)/)!;
      elements.push(
        <div key={k} style={{ display: 'flex', gap: '12px', margin: '3px 0' }}>
          <span style={{ fontSize: '15px', color: '#64748b', flexShrink: 0, minWidth: '24px', textAlign: 'right', ...MONO }}>{om[2]}.</span>
          <span style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.75, ...MONO }}>{ir(om[3], k)}</span>
        </div>
      );
    } else if (t.startsWith('|')) {
      const isSep = !!t.match(/^[\|\-\s:]+$/);
      if (!isSep) {
        const cells = t.split('|').slice(1, -1);
        const isHeader = !!lines[i + 1]?.trim().match(/^[\|\-\s:]+$/);
        elements.push(
          <div key={k} style={{ display: 'flex', borderBottom: '1px solid #0f1923', marginTop: isHeader ? '14px' : '0' }}>
            {cells.map((c, ci) => (
              <div key={ci} style={{ flex: 1, padding: '6px 12px', fontSize: '14px', color: isHeader ? '#64748b' : '#94a3b8', fontWeight: isHeader ? 700 : 400, letterSpacing: isHeader ? '0.05em' : 'normal', ...MONO, borderRight: '1px solid #0f1923', background: isHeader ? '#040b14' : 'transparent' }}>
                {ir(c.trim(), `${k}-${ci}`)}
              </div>
            ))}
          </div>
        );
      }
    } else {
      // E2: body text — 15px, line-height 1.75, secondary color
      elements.push(
        <div key={k} style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.75, ...MONO }}>{ir(t, k)}</div>
      );
    }
  }
  return <>{elements}</>;
}

// ── ArtifactReader ─────────────────────────────────────────────────────────────
export default function ArtifactReader({
  artifact, fullContent, loading, onClose, onOpenInStudio,
  onPrev, onNext, hasPrev, hasNext,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const hColor = HEALTH_COLOR[artifact.healthState];
  const hLabel = HEALTH_LABEL[artifact.healthState];
  const confLabel = artifact.confidence ? CONF_LABEL[artifact.confidence] : undefined;

  // ESC → close; ← / → → navigate artifacts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowLeft' && hasPrev && onPrev) { e.preventDefault(); onPrev(); }
    if (e.key === 'ArrowRight' && hasNext && onNext) { e.preventDefault(); onNext(); }
  }, [onClose, hasPrev, onPrev, hasNext, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>('button, [tabindex="0"]');
    firstFocusable?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // prefers-reduced-motion
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const panelTransition = prefersReduced
    ? { type: 'tween' as const, duration: 0.15, ease: 'easeOut' as const }
    : { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 };

  // Excerpt for E3 — stripped prose, max 400 chars
  const excerpt = fullContent ? extractExcerpt(fullContent) : null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="reader-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          backgroundColor: 'rgba(2,6,9,0.82)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Centering container — fixed inset-0 flex so panel stays centered.
          Framer Motion animates scale/opacity only — no positional transform conflict. */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 201,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          padding: '0 16px',
        }}
      >
        <motion.div
          key="reader-panel"
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}
          transition={panelTransition}
          ref={panelRef}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '720px',   // E1: was 680px
            maxHeight: '85vh',
            backgroundColor: '#030a10',
            border: `1px solid ${hColor}33`,
            borderTop: `3px solid ${hColor}`,
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...MONO,
          }}
        >
          {/* ── HEADER ── */}
          <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
            {/* E2: Phase badge + health — 11px mono, phase color at 70% opacity */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: artifact.phaseColor, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.7, ...MONO }}>
                  {artifact.phase.toUpperCase()}
                </span>
                <span style={{ fontSize: '11px', color: '#334155' }}>·</span>
                <span style={{ fontSize: '11px', color: hColor, fontWeight: 700, letterSpacing: '0.08em', ...MONO }}>
                  {hLabel}
                </span>
                <span style={{ fontSize: '11px', color: '#334155' }}>·</span>
                <span style={{ fontSize: '11px', color: '#64748b', ...MONO }}>
                  Stage {artifact.stageIndex} / 15
                </span>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px', padding: '0 2px', lineHeight: 1, ...MONO }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* E2: Title — 26px, weight 700, letter-spacing -0.3px — dominant element */}
            <div style={{ fontSize: '26px', color: '#f1f5f9', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.3px', marginBottom: '6px' }}>
              {artifact.stageName}
            </div>

            {/* E2: Confidence — 14px, Geist Sans, health state color */}
            {confLabel && (
              <div style={{ fontSize: '14px', color: hColor, marginBottom: '18px', ...SANS }}>
                {confLabel}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '16px' }} />

            {/* Metadata row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', fontSize: '11px', color: '#64748b' }}>
              {artifact.agentId && (
                <span>Agent: <span style={{ color: '#94a3b8' }}>{artifact.agentId}</span></span>
              )}
              <span>Version: <span style={{ color: '#94a3b8' }}>v{artifact.version === 0 ? 1 : artifact.version}{artifact.version > 0 ? ' (improved)' : ''}</span></span>
              {artifact.downstreamCount > 0 && (
                <span style={{ color: '#64748b' }}>
                  <span style={{ color: '#f59e0b' }}>{artifact.downstreamCount}</span> artifact{artifact.downstreamCount !== 1 ? 's' : ''} depend on this
                </span>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '0' }} />
          </div>

          {/* ── CONTENT (scrollable) ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

            {/* E3: Executive Summary box — shows when loading (shimmer) or when content is ready */}
            {(loading || fullContent) && (
              <div style={{
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px',
                padding: '16px',
                background: 'rgba(255,255,255,0.02)',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '9px', color: '#64748b', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', ...MONO }}>
                  Executive Summary
                </div>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="shimmer-bar" style={{ height: '11px', borderRadius: '2px', width: '100%' }} />
                    <div className="shimmer-bar" style={{ height: '11px', borderRadius: '2px', width: '88%' }} />
                    <div className="shimmer-bar" style={{ height: '11px', borderRadius: '2px', width: '72%' }} />
                  </div>
                ) : excerpt ? (
                  <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.75, ...SANS }}>
                    {excerpt}
                    {(fullContent?.length ?? 0) > 400 && <span style={{ color: '#334155' }}>…</span>}
                  </div>
                ) : null}
              </div>
            )}

            {/* E2: Full content body — 15px, line-height 1.75 (enforced in MarkdownContent) */}
            {fullContent ? (
              <MarkdownContent content={fullContent} />
            ) : !loading ? (
              <div style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.75, ...SANS }}>
                {artifact.summary
                  ? <>{artifact.summary}<span style={{ color: '#334155' }}>…</span></>
                  : <span style={{ color: '#334155' }}>Content not yet generated.</span>}
              </div>
            ) : null}

            {/* B4: Upstream dependencies section — only when upstreamItems are present */}
            {artifact.upstreamItems && artifact.upstreamItems.length > 0 && (
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '9px', color: '#64748b', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', ...MONO }}>
                  Upstream Dependencies
                </div>
                {artifact.upstreamItems.slice(0, 6).map((item, idx) => {
                  const dotColor =
                    item.healthState === 'stale'
                      ? '#ef4444'
                      : item.healthState === 'questionable'
                      ? '#f59e0b'
                      : item.healthState === 'trustworthy'
                      ? '#2a5a30'
                      : 'transparent';
                  const dotBorder =
                    item.healthState === 'generating' || item.healthState === 'queued'
                      ? '1px solid #334155'
                      : 'none';
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '7px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: dotColor,
                        border: dotBorder,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '13px', color: '#94a3b8', ...MONO }}>{item.name}</span>
                      <span style={{ fontSize: '11px', color: HEALTH_COLOR[item.healthState], marginLeft: 'auto', ...MONO }}>
                        {HEALTH_LABEL[item.healthState]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* E4: Downstream impact section — only when downstreamItems are present */}
            {artifact.downstreamItems && artifact.downstreamItems.length > 0 && (
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '9px', color: '#64748b', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', ...MONO }}>
                  Downstream Impact
                </div>
                {artifact.downstreamItems.slice(0, 4).map((item, idx) => {
                  const dotColor =
                    item.healthState === 'stale' || item.healthState === 'questionable'
                      ? '#f59e0b'
                      : item.healthState === 'trustworthy'
                      ? '#2a5a30'
                      : 'transparent';
                  const dotBorder =
                    item.healthState === 'generating' || item.healthState === 'queued'
                      ? '1px solid #334155'
                      : 'none';
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '7px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: dotColor,
                        border: dotBorder,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '13px', color: '#94a3b8', ...MONO }}>{item.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Divider before footer ── */}
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

          {/* ── ACTION FOOTER (sticky) ── */}
          <div style={{ padding: '16px 24px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#030a10' }}>
            <button
              onClick={() => onOpenInStudio(artifact.file)}
              style={{
                padding: '10px 20px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em',
                backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid #4ade8033',
                borderRadius: '6px', color: '#4ade80', cursor: 'pointer',
                ...MONO,
              }}
            >
              Open in Studio →
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none', color: '#64748b',
                fontSize: '12px', cursor: 'pointer', padding: '10px 0', ...MONO,
              }}
            >
              Close
            </button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: '10px', color: '#1e293b' }}>ESC to close</span>
          </div>
        </motion.div>
      </div>
    </>
  );
}
