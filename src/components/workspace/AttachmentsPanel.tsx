'use client';

// src/components/workspace/AttachmentsPanel.tsx
// Sprint 07 (W5) — Reference docs, now with real per-type counts.
//
// Reuses the EXISTING uploader wiring from improve/page.tsx (docs state,
// handleUpload, uploadRef) verbatim — this component does not introduce a new
// upload path, it only adds type-chip filtering on top of the same list.
// Zero-count types are shown at zero, never hidden (per spec) — a chip
// disappearing when its count hits zero would misrepresent "no docs of this
// type yet" as "this type doesn't exist here."

import React, { useState } from 'react';
import { workspaceMotion } from './motion';

interface UpDoc { name: string; text: string; chars: number; }

type DocType = 'Docs' | 'Images' | 'PDFs' | 'Sheets' | 'Voice';
const DOC_TYPES: DocType[] = ['Docs', 'Images', 'PDFs', 'Sheets', 'Voice'];

const EXT_MAP: Record<string, DocType> = {
  doc: 'Docs', docx: 'Docs', txt: 'Docs', md: 'Docs', rtf: 'Docs',
  png: 'Images', jpg: 'Images', jpeg: 'Images', gif: 'Images', svg: 'Images', webp: 'Images',
  pdf: 'PDFs',
  csv: 'Sheets', xls: 'Sheets', xlsx: 'Sheets',
  mp3: 'Voice', wav: 'Voice', m4a: 'Voice',
};

function docType(name: string): DocType {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MAP[ext] ?? 'Docs';
}

interface AttachmentsPanelProps {
  docs: UpDoc[];
  uplLoading: boolean;
  uplError: string | null;
  uploadRef: React.RefObject<HTMLInputElement>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (name: string) => void;
  reducedMotion: boolean;
}

export default function AttachmentsPanel({
  docs, uplLoading, uplError, uploadRef, onUpload, onRemove, reducedMotion,
}: AttachmentsPanelProps) {
  const [activeType, setActiveType] = useState<DocType | null>(null);

  const counts: Record<DocType, number> = { Docs: 0, Images: 0, PDFs: 0, Sheets: 0, Voice: 0 };
  for (const d of docs) counts[docType(d.name)]++;

  const visible = activeType ? docs.filter(d => docType(d.name) === activeType) : docs;
  const hoverT = reducedMotion ? 'none' : `background-color ${workspaceMotion.hoverMs}ms ease-out, color ${workspaceMotion.hoverMs}ms ease-out`;

  return (
    <div>
      <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 'var(--ig-t-label-size)', fontWeight: 600, letterSpacing: 'var(--ig-t-label-tracking)', textTransform: 'uppercase' as const, color: '#2a5a30' }}>
        REFERENCE DOCS{docs.length > 0 && <span style={{ color: '#818cf855', marginLeft: '6px' }}>{docs.length} loaded</span>}
      </div>

      {/* Type chips — real counts, zero shown not hidden */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '7px', marginBottom: '8px' }}>
        {DOC_TYPES.map(t => {
          const active = activeType === t;
          const n = counts[t];
          return (
            <button
              key={t}
              onClick={() => setActiveType(active ? null : t)}
              disabled={n === 0}
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: '11px', fontWeight: 500,
                padding: '3px 7px', borderRadius: '3px', cursor: n === 0 ? 'default' : 'pointer',
                backgroundColor: active ? '#0a1f0e' : 'transparent',
                color: n === 0 ? '#1e293b' : active ? '#4ade80' : '#64748b',
                border: `1px solid ${active ? '#4ade8033' : '#1e293b'}`,
                transition: hoverT,
              }}
            >
              {t} · {n}
            </button>
          );
        })}
      </div>

      {visible.map(d => (
        <div key={d.name} style={{ padding: '5px 8px', backgroundColor: '#040b14', border: '1px solid #818cf822', borderRadius: '3px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--ig-t-caption-size)', color: '#818cf8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>◆ {d.name}</div>
            <div style={{ fontSize: '11px', color: '#475569' }}>{d.chars.toLocaleString()} chars</div>
          </div>
          <button onClick={() => onRemove(d.name)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
        </div>
      ))}
      {activeType && visible.length === 0 && (
        <div style={{ fontSize: '11px', color: '#1e293b', padding: '4px 0 8px' }}>No {activeType.toLowerCase()} yet.</div>
      )}

      <label style={{ display: 'block', padding: '8px', backgroundColor: '#040b14', border: '1px dashed #1e293b', borderRadius: '3px', cursor: 'pointer', marginBottom: '10px', textAlign: 'center' as const }}>
        <div style={{ fontSize: '11px', color: uplLoading ? '#475569' : '#64748b' }}>{uplLoading ? '⟳ Extracting…' : '+ Upload Reference Document'}</div>
        <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>PDF · DOCX · TXT · MD · multiple allowed</div>
        <input ref={uploadRef} type="file" accept=".pdf,.docx,.txt,.md,.csv" multiple onChange={onUpload} style={{ display: 'none' }} />
      </label>
      {uplError && <div style={{ fontSize: '11px', color: '#f87171', marginBottom: '7px', lineHeight: 1.5 }}>⚠ {uplError}</div>}
    </div>
  );
}
