'use client';

// src/components/improve/TipTapRenderer.tsx
//
// MISSION 1 — Document Render Swap (Phase B, read-only).
// MISSION 2 — Selection Bubble Menu (additive, read-only-safe).
// MISSION 3 — Collaborative Document Editor (additive, editable mode).
//
// All three missions are additive. When editable=false (default), behaviour
// is byte-for-byte what shipped after Mission 2. When editable=true, the
// editor is writable, the formatting toolbar renders, and the ⌘S / autosave
// pipeline is active.
//
// Constitution references:
//   §5   — editing philosophy (no mode toggle; doc always editable when flag active)
//   §5.1 — caret-color: var(--ig-emerald) (CSS, not JS)
//   §6   — ::selection override, rgba(74,222,128,0.18)
//   §7   — save state machine; autosave 8s debounce
//   §11  — formatting toolbar spec (two zones; selectionUpdate + transaction)
//   §13  — toolbar entrance 120ms ease-out, opacity only
//   §14  — lucide-react 14px icons, every icon-only button has aria-label
//   §27  — one editor instance per artifact; toolbar on selectionUpdate+transaction

import React, {
  useCallback, useEffect, useLayoutEffect, useRef, useState,
} from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import StarterKit               from '@tiptap/starter-kit';
import { Markdown }             from 'tiptap-markdown';
import { Table }                from '@tiptap/extension-table';
import { TableRow }             from '@tiptap/extension-table-row';
import { TableCell }            from '@tiptap/extension-table-cell';
import { TableHeader }          from '@tiptap/extension-table-header';
import {
  Bold, Italic, Underline, Strikethrough, Code,
  List, ListOrdered, Quote,
  type LucideIcon,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { parseSections } from '@/lib/parseSections';
import { workspaceMotion } from '@/components/workspace/motion';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TipTapRendererProps {
  content:          string;
  fs?:              number;           // kept for MD() call-site parity; unused
  anchors?:         boolean;
  arrivalId?:       string | null;
  reducedMotion?:   boolean;
  /** Mission 2 — populates caller's intent textarea (page.tsx setIntent). */
  onPresetSelect?:  (intent: string) => void;
  /** Mission 3 — editable mode. default false. When false: identical to pre-M3. */
  editable?:        boolean;
  /** Mission 3 — called on every editor update with the current markdown string. */
  onContentChange?: (md: string) => void;
  /** Mission 3 — called on ⌘S with the current markdown string. */
  onSave?:          (md: string) => Promise<void>;
}

// ── Toolbar state ─────────────────────────────────────────────────────────────

interface ToolbarState {
  bold: boolean; italic: boolean; underline: boolean; strike: boolean;
  code: boolean; bulletList: boolean; orderedList: boolean; blockquote: boolean;
}

const EMPTY_TOOLBAR: ToolbarState = {
  bold: false, italic: false, underline: false, strike: false,
  code: false, bulletList: false, orderedList: false, blockquote: false,
};

// ── FormattingToolbar (Constitution §11) ─────────────────────────────────────
// Rendered inside TipTapRenderer so it has access to the editor instance.
// Hidden when editable=false — zero DOM impact on read-only path.

interface ToolbarProps {
  editor:   Editor | null;
  visible:  boolean;
}

function FormattingToolbar({ editor, visible }: ToolbarProps) {
  // Reactive toolbar state — updated on BOTH selectionUpdate and transaction
  // per Constitution §11 and §27. Using explicit event listeners rather than
  // useEditorState to guarantee both event types fire.
  const [ts, setTs] = useState<ToolbarState>(EMPTY_TOOLBAR);

  const refresh = useCallback(() => {
    if (!editor) { setTs(EMPTY_TOOLBAR); return; }
    setTs({
      bold:        editor.isActive('bold'),
      italic:      editor.isActive('italic'),
      underline:   editor.isActive('underline'),
      strike:      editor.isActive('strike'),
      code:        editor.isActive('code'),
      bulletList:  editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote:  editor.isActive('blockquote'),
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on('selectionUpdate', refresh);  // cursor moves
    editor.on('transaction', refresh);      // programmatic changes (⌘B etc.) — §11
    refresh();
    return () => {
      editor.off('selectionUpdate', refresh);
      editor.off('transaction', refresh);
    };
  }, [editor, refresh]);

  // Divider helper
  const Divider = () => (
    <div style={{
      width: '1px', height: '16px', margin: '0 4px',
      backgroundColor: 'var(--ig-border-subtle)', flexShrink: 0,
    }} aria-hidden />
  );

  // Button builder — wraps shadcn Toggle with IdeaGate token overrides (§11)
  const Btn = ({
    pressed, onClick, icon: Icon, label,
  }: { pressed: boolean; onClick: () => void; icon: LucideIcon; label: string }) => (
    <Toggle
      pressed={pressed}
      onPressedChange={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'h-7 w-7 p-0 rounded',
        'bg-transparent hover:bg-[var(--ig-surface-raised)]',
        'border-none outline-none focus-visible:ring-1 focus-visible:ring-[var(--ig-emerald)]',
        '[&_svg]:text-[var(--ig-text-secondary)]',
        pressed
          ? 'bg-[var(--ig-surface-active)] [&_svg]:!text-[var(--ig-emerald)]'
          : '',
      )}
    >
      <Icon size={14} />
    </Toggle>
  );

  if (!visible) return null;

  return (
    // Constitution §11 — sticky above document body, 36px height, opacity-only entrance
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--ig-surface-raised)',
        boxShadow: 'var(--ig-elev-1)',
        borderBottom: '1px solid var(--ig-border-subtle)',
        height: '36px',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        animation: 'ig-toolbar-in 120ms ease-out',  // §13
        flexShrink: 0,
      }}
      onMouseDown={e => e.preventDefault()} // don't steal focus from editor
    >
      {/* Zone A — Formatting (Constitution §11 left zone) */}
      <Btn pressed={ts.bold}      onClick={() => editor?.chain().focus().toggleBold().run()}        icon={Bold}          label="Bold (⌘B)" />
      <Btn pressed={ts.italic}    onClick={() => editor?.chain().focus().toggleItalic().run()}      icon={Italic}        label="Italic (⌘I)" />
      <Btn pressed={ts.underline} onClick={() => editor?.chain().focus().toggleUnderline().run()}   icon={Underline}     label="Underline (⌘U)" />
      <Btn pressed={ts.strike}    onClick={() => editor?.chain().focus().toggleStrike().run()}      icon={Strikethrough} label="Strikethrough" />

      <Divider />
      <Btn pressed={ts.code}      onClick={() => editor?.chain().focus().toggleCode().run()}        icon={Code}          label="Inline code" />

      <Divider />
      <Btn pressed={ts.bulletList}  onClick={() => editor?.chain().focus().toggleBulletList().run()}  icon={List}        label="Bullet list" />
      <Btn pressed={ts.orderedList} onClick={() => editor?.chain().focus().toggleOrderedList().run()} icon={ListOrdered} label="Ordered list" />

      <Divider />
      <Btn pressed={ts.blockquote} onClick={() => editor?.chain().focus().toggleBlockquote().run()} icon={Quote}        label="Blockquote" />

      {/* Zone B — AI placeholder (Constitution §11 right zone, non-functional M3) */}
      <button
        type="button"
        className="ig-preset-chip"
        style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '12px', cursor: 'default', opacity: 0.5 }}
        tabIndex={-1}
        aria-hidden
      >
        ✦ AI
      </button>
    </div>
  );
}

// ── Bubble presets (Mission 2) ────────────────────────────────────────────────

const BUBBLE_PRESETS = [
  { label: 'More concise',    intent: 'Make this more concise — remove redundancy, preserve all PM insights' },
  { label: 'Sharpen summary', intent: 'Rewrite summary to be crisper and interview-ready — one PM insight per sentence' },
  { label: 'Add evidence',    intent: 'Ground every claim in frameworks, data, or explicitly labelled assumptions' },
  { label: 'Improve structure', intent: 'Reorganise for PM logic — problem → insight → decision → artifact' },
  { label: 'More strategic',  intent: 'Strengthen strategic reasoning — sharper market framing, competitive logic, positioning' },
] as const;

interface BubbleState { visible: boolean; top: number; anchorX: number; }

// ── Main component ────────────────────────────────────────────────────────────

export default function TipTapRenderer({
  content,
  fs,
  anchors = false,
  arrivalId = null,
  reducedMotion = false,
  onPresetSelect,
  editable = false,
  onContentChange,
  onSave,
}: TipTapRendererProps) {
  void fs;
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef    = useRef<HTMLDivElement>(null);

  // ── Anchor-id assignment (Mission 2 fix: onCreate/onUpdate, not useEffect)
  const assignAnchorIds = (dom: HTMLElement) => {
    if (!anchors) return;
    const sectionIds = parseSections(content);
    const h2s = dom.querySelectorAll('h2');
    h2s.forEach((el, i) => {
      const id = sectionIds[i]?.anchorId;
      if (id) (el as HTMLElement).id = id;
    });
  };

  // ── Editor (Mission 3: initialise with correct editable state) ──────────────
  // Re-created whenever `content` changes — correct for read-only; for editable
  // mode, content only changes on artifact switch (not on user typing), so this
  // never discards live edits.
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
      editable,                        // Mission 3: honour initial prop value
      immediatelyRender: false,
      onCreate: ({ editor: ed }) => {
        assignAnchorIds(ed.view.dom as HTMLElement);
      },
      onUpdate: ({ editor: ed }) => {
        assignAnchorIds(ed.view.dom as HTMLElement);
        // Mission 3: serialise and forward to page.tsx dirty-tracking
        if (editable && onContentChange) {
          const md = (ed.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown(); // A3
          onContentChange(md);
        }
      },
    },
    [content],
  );

  // ── Runtime editable toggle (Mission 3, A1 confirmed: setEditable is live) ──
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable, false); // false = don't emit update transaction
  }, [editor, editable]);

  // ── ⌘S save handler (Mission 3, Constitution §7, §15) ────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!editable || !onSave || !editor) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      const md = (editor.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();
      void onSave(md);
    }
  }, [editable, onSave, editor]);

  // ── Arrival highlight (Mission 1 port, unchanged) ──────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const h2s = containerRef.current.querySelectorAll('.ProseMirror h2');
    h2s.forEach(el => {
      const e = el as HTMLElement;
      e.style.transition = reducedMotion ? 'none' : `background-color ${workspaceMotion.arrivalAccentMs}ms ease-out`;
      e.style.backgroundColor = (!!arrivalId && el.id === arrivalId) ? '#0d1a10' : 'transparent';
    });
  }, [arrivalId, reducedMotion, editor, content]);

  // ── Mission 2: Selection Bubble (unchanged from M2) ───────────────────────
  const [bubble, setBubble] = useState<BubbleState>({ visible: false, top: 0, anchorX: 0 });
  const [shouldRender, setShouldRender] = useState(false);
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
      if (!container.contains(sel.anchorNode)) {
        setBubble(b => (b.visible ? { ...b, visible: false } : b));
        return;
      }
      const range  = sel.getRangeAt(0);
      const selRect = range.getBoundingClientRect();
      if (selRect.width === 0 && selRect.height === 0) {
        setBubble(b => (b.visible ? { ...b, visible: false } : b));
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const GAP = 8; const BUBBLE_H_ESTIMATE = 40;
      let top = selRect.top - containerRect.top - BUBBLE_H_ESTIMATE - GAP;
      if (top < 0) top = selRect.bottom - containerRect.top + GAP;
      const anchorX = selRect.left - containerRect.left + selRect.width / 2;
      setBubble({ visible: true, top, anchorX });
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  useEffect(() => {
    if (bubble.visible) { setShouldRender(true); return; }
    const exitMs = reducedMotion ? 0 : 80;
    const t = window.setTimeout(() => setShouldRender(false), exitMs);
    return () => window.clearTimeout(t);
  }, [bubble.visible, reducedMotion]);

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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="ig-tiptap-render"
      onKeyDown={handleKeyDown}    // ⌘S wired here (Mission 3)
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Formatting toolbar — visible only when editable (Constitution §11) */}
      <FormattingToolbar editor={editor} visible={editable} />

      {editor && <EditorContent editor={editor} />}

      {/* Selection bubble (Mission 2 — unchanged) */}
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
            transform: reducedMotion ? 'none' : undefined,
          }}
        >
          {BUBBLE_PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              className="ig-preset-chip ig-selection-bubble-chip"
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
