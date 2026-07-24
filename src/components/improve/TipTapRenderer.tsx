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
//   - editable: false, always. No BubbleMenu extension. No toolbar.
//   - No save pipeline, no Document Runtime, no Block Registry — those are
//     Mission 3/4+, not built here.
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
//
// MISSION 2 — Selection Bubble Menu (additive, read-only-safe).
//
// Phase A confirmed @tiptap/extension-bubble-menu does not fire on an
// editable:false editor: ProseMirror's DOMObserver never dispatches a
// selection-updating transaction for non-editable views, so the plugin's
// `selectionChanged` gate never trips. This uses Option B instead — the
// native browser Selection API + geometry math, entirely outside
// ProseMirror/TipTap's own state. `editor.isEditable` is never touched,
// no ProseMirror transaction is ever dispatched, no `editor.commands.*`
// call exists anywhere below. Only reads `window.getSelection()` and
// writes to `onPresetSelect` (the caller's own `setIntent`) — canonical
// markdown and the editor's document are never touched. The bubble only
// renders when `onPresetSelect` is passed (main reading pane call site
// only, per Mission 2 scope — split/original/improved preview panes
// intentionally do not receive it, so they never render a bubble).

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  content:          string;
  fs?:              number;          // kept for MD() call-site parity; unused (MD does `void fs` too)
  anchors?:         boolean;
  arrivalId?:       string | null;
  reducedMotion?:   boolean;
  // Mission 2 — populates the caller's intent textarea (page.tsx's setIntent)
  // when a selection bubble preset is clicked. Optional and additive: when
  // omitted, the selectionchange listener still attaches (harmless — it only
  // computes local component state) but the bubble is never rendered, so
  // omitting this prop is a strict no-op for every existing call site.
  onPresetSelect?: (intent: string) => void;
}

// Curated subset of page.tsx's PRESETS (Mission 1's right-panel list is not
// exported, so these are intentionally duplicated literals — label + intent
// text copied verbatim from page.tsx's PRESETS array). Kept to 5 of the 11:
// selection-context actions that make sense against an arbitrary highlighted
// passage, not whole-artifact actions (e.g. "Competitive moat" or "MVP-focused"
// presume artifact-level framing a mid-paragraph selection doesn't carry).
// The full 11-item list remains reachable in the right panel, unchanged.
const BUBBLE_PRESETS = [
  { label: 'More concise',    intent: 'Make this more concise — remove redundancy, preserve all PM insights' },
  { label: 'Sharpen summary', intent: 'Rewrite summary to be crisper and interview-ready — one PM insight per sentence' },
  { label: 'Add evidence',    intent: 'Ground every claim in frameworks, data, or explicitly labelled assumptions' },
  { label: 'Improve structure', intent: 'Reorganise for PM logic — problem → insight → decision → artifact' },
  { label: 'More strategic',  intent: 'Strengthen strategic reasoning — sharper market framing, competitive logic, positioning' },
] as const;

interface BubbleState { visible: boolean; top: number; anchorX: number; }

export default function TipTapRenderer({
  content,
  fs,
  anchors = false,
  arrivalId = null,
  reducedMotion = false,
  onPresetSelect,
}: TipTapRendererProps) {
  void fs;
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Assign H2 ids in document order, matching parseSections(content) — the
  // same function/order the Workspace tree uses to build its scroll targets
  // — so sidebar navigation keeps working when this renderer is active.
  //
  // ROOT CAUSE (diagnosed during Mission 2 verification): this used to be a
  // standalone useEffect keyed on [editor, content, anchors], querying
  // containerRef.current for '.ProseMirror h2'. `immediatelyRender: false`
  // (below) intentionally defers the editor's first client-side DOM commit
  // to avoid an SSR hydration mismatch, and @tiptap/react's EditorContent
  // mounts editor.view.dom into the container via its own internal effect —
  // there is no ordering guarantee between that mount and a sibling/parent
  // useEffect sharing the same [editor] dependency in the same commit.
  // Verified live: h2 elements DID exist in the DOM, but their `id`
  // attribute was consistently never set. Fix: use TipTap's own
  // onCreate/onUpdate lifecycle hooks instead of a React effect, reading
  // straight off `editor.view.dom` (the actual ProseMirror root) rather
  // than containerRef — these fire only once TipTap itself has built and
  // attached the view, which sidesteps the React-effect-ordering ambiguity
  // entirely. onCreate covers first mount / full editor recreation (this
  // component recreates its editor whenever `content` changes, see below);
  // onUpdate is included defensively for any in-place ProseMirror-internal
  // update that doesn't go through a full recreation.
  const assignAnchorIds = (dom: HTMLElement) => {
    if (!anchors) return;
    const sectionIds = parseSections(content);
    const h2s = dom.querySelectorAll('h2');
    h2s.forEach((el, i) => {
      const id = sectionIds[i]?.anchorId;
      if (id) (el as HTMLElement).id = id;
    });
  };

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
      onCreate: ({ editor: ed }) => assignAnchorIds(ed.view.dom as HTMLElement),
      onUpdate: ({ editor: ed }) => assignAnchorIds(ed.view.dom as HTMLElement),
    },
    [content],
  );

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

  // ── Mission 2: Selection Bubble Menu ─────────────────────────────────────
  // Native Selection API, no ProseMirror/TipTap involvement (see file header).
  const [bubble, setBubble] = useState<BubbleState>({ visible: false, top: 0, anchorX: 0 });
  // Delayed-unmount so the exit transition (B4) can actually play before the
  // bubble leaves the DOM, instead of vanishing the instant `visible` flips.
  const [shouldRender, setShouldRender] = useState(false);
  // Final clamped left (px, container-relative) — corrected from bubble.anchorX
  // once the bubble's real width is known (see clamp effect below).
  const [bubbleLeft, setBubbleLeft] = useState(0);

  useEffect(() => {
    const handleSelectionChange = () => {
      const container = containerRef.current;
      if (!container) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed || sel.toString().length === 0) {
        setBubble(b => (b.visible ? { ...b, visible: false } : b));
        return;
      }
      // Containment check via ref, not class names/data attributes, per spec —
      // this also naturally excludes selections in the right panel, the
      // workspace sidebar, or anywhere else outside this component's DOM.
      if (!container.contains(sel.anchorNode)) {
        setBubble(b => (b.visible ? { ...b, visible: false } : b));
        return;
      }
      const range = sel.getRangeAt(0);
      const selRect = range.getBoundingClientRect();
      if (selRect.width === 0 && selRect.height === 0) {
        setBubble(b => (b.visible ? { ...b, visible: false } : b));
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const GAP = 8;
      const BUBBLE_H_ESTIMATE = 40;
      let top = selRect.top - containerRect.top - BUBBLE_H_ESTIMATE - GAP;
      if (top < 0) top = selRect.bottom - containerRect.top + GAP; // flip below when no room above
      const anchorX = selRect.left - containerRect.left + selRect.width / 2;
      setBubble({ visible: true, top, anchorX });
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Keep the bubble mounted for the exit-transition duration after it hides.
  useEffect(() => {
    if (bubble.visible) { setShouldRender(true); return; }
    const exitMs = reducedMotion ? 0 : 80;
    const t = window.setTimeout(() => setShouldRender(false), exitMs);
    return () => window.clearTimeout(t);
  }, [bubble.visible, reducedMotion]);

  // Measure the bubble's real width post-layout (before paint) and clamp its
  // left edge to the container's bounds — avoids overflowing the document
  // column on either side. Runs synchronously so there's no visible jump.
  useLayoutEffect(() => {
    if (!shouldRender) return;
    const container = containerRef.current;
    const el = bubbleRef.current;
    if (!container || !el) return;
    const containerWidth = container.getBoundingClientRect().width;
    const bubbleWidth = el.offsetWidth;
    const margin = 4;
    const maxLeft = Math.max(margin, containerWidth - bubbleWidth - margin);
    const left = Math.max(margin, Math.min(bubble.anchorX - bubbleWidth / 2, maxLeft));
    setBubbleLeft(left);
  }, [shouldRender, bubble.anchorX, bubble.top]);

  const handlePresetClick = (intent: string) => {
    if (!onPresetSelect) return;
    onPresetSelect(intent);
    window.getSelection()?.removeAllRanges();
    setBubble(b => ({ ...b, visible: false }));
  };

  return (
    <div ref={containerRef} className="ig-tiptap-render">
      {editor && <EditorContent editor={editor} />}
      {onPresetSelect && shouldRender && (
        <div
          ref={bubbleRef}
          className="ig-selection-bubble"
          data-visible={bubble.visible ? 'true' : 'false'}
          role="toolbar"
          aria-label="Selection actions"
          style={{
            top: bubble.top,
            left: bubbleLeft,
            transform: reducedMotion ? 'none' : undefined, // reducedMotion: opacity-only, no translateY
          }}
        >
          {BUBBLE_PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              className="ig-preset-chip ig-selection-bubble-chip"
              // Prevent the browser from collapsing the live selection on
              // mousedown-triggered focus change — without this, clicking a
              // chip can race the selectionchange handler above and hide the
              // bubble before the click (and onPresetSelect) fires.
              onMouseDown={e => e.preventDefault()}
              onClick={() => handlePresetClick(p.intent)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
