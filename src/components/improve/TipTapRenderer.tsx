'use client';

// src/components/improve/TipTapRenderer.tsx
//
// MISSION 1 — Document Render Swap (Phase B, read-only).
//
// Renders the exact same canonical markdown content that page.tsx's
// MD()/ir() renders (improve/page.tsx:135–183), through TipTap +
// tiptap-markdown instead of the hand-rolled line-by-line regex renderer.
// Markdown stays the canonical source of truth — this component parses it
// to a ProseMirror doc for DISPLAY ONLY and never writes anything back.
//
// Scope, explicitly:
//   - editable: false, always. No BubbleMenu. No toolbar.
//   - No save pipeline, no Document Runtime, no Block Registry — those are
//     Missions 2/3/4+, not built here.
//   - Only ever mounted when GlobalSettings.useTipTapRenderer === true
//     (default false — legacy MD()/ir() stays the default render path).
//   - /improve only. Desk (src/app/desk/page.tsx) has its own, separate
//     ir() implementation and is out of scope for this mission.
//
// Visual parity: see the `.ig-tiptap-render` block in globals.css for the
// full legacy → TipTap CSS mapping and the two documented, expected
// divergences (fenced code blocks, GFM tables — both were unhandled/broken
// in the legacy line-based renderer, so TipTap renders them for real
// rather than reproducing the legacy gap).
//
// Anchor/arrival parity: `anchors` + `arrivalId` reproduce the Workspace
// tree's click-to-scroll behavior (page.tsx:273/283/284) by assigning H2
// ids via parseSections() — the SAME function/order the sidebar uses — and
// flashing the arrived-at heading's background, exactly mirroring MD()'s
// inline transition. Only wired for the primary reading pane at the
// call site, matching MD()'s own `anchors` convention.

import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { parseSections } from '@/lib/parseSections';
import { workspaceMotion } from '@/components/workspace/motion';

interface TipTapRendererProps {
  content:        string;
  fs?:            number;          // kept for MD() call-site parity; unused (MD does `void fs` too)
  anchors?:       boolean;
  arrivalId?:     string | null;
  reducedMotion?: boolean;
}

export default function TipTapRenderer({
  content,
  fs,
  anchors = false,
  arrivalId = null,
  reducedMotion = false,
}: TipTapRendererProps) {
  void fs;
  const containerRef = useRef<HTMLDivElement>(null);

  // Re-created whenever `content` changes — this is a read-only preview with
  // no cursor/selection state worth preserving across artifact switches, so
  // a fresh editor per content string is simpler and safer than diffing.
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Markdown.configure({ html: false, linkify: false, breaks: false, tightLists: true }),
      ],
      content,
      editable: false,
      immediatelyRender: false,
    },
    [content],
  );

  // Assign H2 ids in document order, matching parseSections(content) — the
  // same function/order the Workspace tree uses to build its scroll targets
  // — so sidebar navigation keeps working when this renderer is active.
  useEffect(() => {
    if (!anchors || !editor || !containerRef.current) return;
    const sectionIds = parseSections(content);
    const h2s = containerRef.current.querySelectorAll('.ProseMirror h2');
    h2s.forEach((el, i) => {
      const id = sectionIds[i]?.anchorId;
      if (id) el.id = id;
    });
  }, [editor, content, anchors]);

  // Arrival highlight — mirrors MD()'s inline background-color flash on the
  // just-scrolled-to H2 (page.tsx:170), honouring reducedMotion. Re-runs
  // whenever arrivalId changes, including the page's own timeout reset back
  // to null (page.tsx:284), so the highlight clears the same way it does today.
  useEffect(() => {
    if (!containerRef.current) return;
    const h2s = containerRef.current.querySelectorAll('.ProseMirror h2');
    h2s.forEach(el => {
      const e = el as HTMLElement;
      e.style.transition = reducedMotion ? 'none' : `background-color ${workspaceMotion.arrivalAccentMs}ms ease-out`;
      e.style.backgroundColor = (!!arrivalId && el.id === arrivalId) ? '#0d1a10' : 'transparent';
    });
  }, [arrivalId, reducedMotion, editor, content]);

  return (
    <div ref={containerRef} className="ig-tiptap-render">
      {editor && <EditorContent editor={editor} />}
    </div>
  );
}
