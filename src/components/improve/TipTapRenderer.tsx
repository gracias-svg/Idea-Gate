'use client';

// src/components/improve/TipTapRenderer.tsx
//
// MISSION 1 — Document Render Swap (Phase B, read-only).
// MISSION 2 — Selection Bubble Menu (additive, read-only-safe).
// MISSION 3 — Collaborative Document Editor (additive, editable mode).
// MISSION 30 — Premium Collaborative Toolbar (5 groups, dropdowns, text color, align).
//
// All missions are additive. When editable=false (default), behaviour is
// byte-for-byte what shipped after Mission 2. When editable=true, the editor
// is writable, the premium formatting toolbar renders, and the ⌘S / autosave
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
import { AnimatePresence, motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import StarterKit               from '@tiptap/starter-kit';
import Highlight                from '@tiptap/extension-highlight';
import { Markdown }             from 'tiptap-markdown';
import { Table }                from '@tiptap/extension-table';
import { TableRow }             from '@tiptap/extension-table-row';
import { TableCell }            from '@tiptap/extension-table-cell';
import { TableHeader }          from '@tiptap/extension-table-header';
import { TextStyle }            from '@tiptap/extension-text-style';
import { Color }                from '@tiptap/extension-color';
import { TextAlign }            from '@tiptap/extension-text-align';
import { TaskList }             from '@tiptap/extension-task-list';
import { TaskItem }             from '@tiptap/extension-task-item';
import {
  Bold, Italic, Underline, Strikethrough, Code,
  List, ListOrdered, Quote, Sparkles, Paperclip,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  MoreHorizontal, CheckSquare, Minus, Terminal, ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseSections } from '@/lib/parseSections';
import { workspaceMotion } from '@/components/workspace/motion';
import { useGlobalStore } from '@/lib/GlobalStore';

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
  /** Mission 19 — Zone B: focus the intent textarea when no text is selected. */
  onFocusIntent?:   () => void;
}

// ── Toolbar state ─────────────────────────────────────────────────────────────

interface ToolbarState {
  bold: boolean; italic: boolean; underline: boolean; strike: boolean;
  code: boolean; codeBlock: boolean; bulletList: boolean; orderedList: boolean;
  blockquote: boolean; taskList: boolean;
  activeHighlight: string | null;
  hasSelection:    boolean;
  headingLevel:    0 | 1 | 2 | 3;
  textColor:       string | null;
  textAlign:       'left' | 'center' | 'right' | 'justify';
}

const EMPTY_TOOLBAR: ToolbarState = {
  bold: false, italic: false, underline: false, strike: false,
  code: false, codeBlock: false, bulletList: false, orderedList: false,
  blockquote: false, taskList: false,
  activeHighlight: null, hasSelection: false,
  headingLevel: 0, textColor: null, textAlign: 'left',
};

// ── FormattingToolbar (M30 — Premium 5-group Collaborative Toolbar) ───────────

interface ToolbarProps {
  editor:          Editor | null;
  visible:         boolean;
  documentTheme:   'dark' | 'paper';
  onPresetSelect?: (intent: string) => void;
  onFocusIntent?:  () => void;
}

type OpenMenu = 'type' | 'color' | 'align' | 'more' | null;

function FormattingToolbar({ editor, visible, documentTheme, onPresetSelect, onFocusIntent }: ToolbarProps) {
  const [ts, setTs] = useState<ToolbarState>(EMPTY_TOOLBAR);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const openMenuRef = useRef<OpenMenu>(null);
  openMenuRef.current = openMenu;

  // Reactive toolbar state — updated on BOTH selectionUpdate and transaction
  const refresh = useCallback(() => {
    if (!editor) { setTs(EMPTY_TOOLBAR); return; }
    const sel = editor.state.selection;
    const hlAttrs = editor.isActive('highlight') ? editor.getAttributes('highlight') : null;
    const colorAttrs = editor.getAttributes('textStyle');
    const headingLevel =
      editor.isActive('heading', { level: 1 }) ? 1 :
      editor.isActive('heading', { level: 2 }) ? 2 :
      editor.isActive('heading', { level: 3 }) ? 3 : 0;
    const paraAttrs = editor.getAttributes('paragraph');
    const headAttrs = editor.getAttributes('heading');
    const rawAlign = paraAttrs.textAlign ?? headAttrs.textAlign ?? 'left';
    setTs({
      bold:            editor.isActive('bold'),
      italic:          editor.isActive('italic'),
      underline:       editor.isActive('underline'),
      strike:          editor.isActive('strike'),
      code:            editor.isActive('code'),
      codeBlock:       editor.isActive('codeBlock'),
      bulletList:      editor.isActive('bulletList'),
      orderedList:     editor.isActive('orderedList'),
      blockquote:      editor.isActive('blockquote'),
      taskList:        editor.isActive('taskList'),
      activeHighlight: (hlAttrs?.color as string) ?? null,
      hasSelection:    !sel.empty,
      headingLevel:    headingLevel as 0 | 1 | 2 | 3,
      textColor:       (colorAttrs?.color as string) || null,
      textAlign:       rawAlign as 'left' | 'center' | 'right' | 'justify',
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on('selectionUpdate', refresh);
    editor.on('transaction', refresh);
    refresh();
    return () => {
      editor.off('selectionUpdate', refresh);
      editor.off('transaction', refresh);
    };
  }, [editor, refresh]);

  // Close dropdown on click outside the toolbar
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!openMenuRef.current) return;
      if (toolbarRef.current?.contains(e.target as Node)) return;
      setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenu(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleMenu = (name: NonNullable<OpenMenu>) => {
    setOpenMenu(m => m === name ? null : name);
  };

  const isPaper = documentTheme === 'paper';
  const borderC = isPaper ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const textSec = isPaper ? 'rgba(30,41,59,0.55)' : 'rgba(148,163,184,0.75)';
  const hoverBg = isPaper ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)';
  const pressedBg = isPaper ? 'rgba(74,222,128,0.12)' : 'rgba(74,222,128,0.10)';
  const dropBg = isPaper ? '#fdf8f3' : '#0c111a';
  const dropBorder = isPaper ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)';
  const dropShadow = '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)';

  const Divider = () => (
    <div style={{
      width: '1px', height: '16px', margin: '0 3px',
      backgroundColor: borderC, flexShrink: 0,
    }} aria-hidden />
  );

  const Btn = ({
    pressed, onClick, icon: Icon, label,
  }: { pressed: boolean; onClick: () => void; icon: LucideIcon; label: string }) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px',
        borderRadius: '6px', border: 'none',
        background: pressed ? pressedBg : 'transparent',
        color: pressed ? '#4ade80' : textSec,
        cursor: 'pointer',
        transition: 'background 80ms ease, color 80ms ease',
        flexShrink: 0, padding: 0,
      }}
      onMouseEnter={e => { if (!pressed) (e.currentTarget).style.background = hoverBg; }}
      onMouseLeave={e => { if (!pressed) (e.currentTarget).style.background = 'transparent'; }}
    >
      <Icon size={14} />
    </button>
  );

  // Shared dropdown container style
  const dropStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 6px)',
    background: dropBg, border: `1px solid ${dropBorder}`,
    borderRadius: '10px', boxShadow: dropShadow,
    overflow: 'hidden', zIndex: 200,
  };

  const AlignIcon: LucideIcon =
    ts.textAlign === 'center' ? AlignCenter :
    ts.textAlign === 'right'  ? AlignRight  :
    ts.textAlign === 'justify' ? AlignJustify : AlignLeft;

  const typeLabel = ts.headingLevel === 0 ? 'P' : `H${ts.headingLevel}`;

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: isPaper ? 'rgba(253,248,243,0.97)' : 'rgba(9,14,20,0.97)',
        borderBottom: `1px solid ${borderC}`,
        height: '40px',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        animation: 'ig-toolbar-in 120ms ease-out',
        flexShrink: 0,
      }}
      onMouseDown={e => e.preventDefault()}
    >
      {/* ── Group 1: AI + Text Type ── */}
      <button
        type="button"
        aria-label="AI actions"
        onMouseDown={e => e.preventDefault()}
        onClick={() => {
          if (ts.hasSelection && editor && onPresetSelect) {
            const sel = editor.state.selection;
            const text = editor.state.doc.textBetween(sel.from, sel.to, ' ').trim();
            const snippet = text.slice(0, 180);
            onPresetSelect(snippet ? `"${snippet}"\n\n` : '');
          } else {
            onFocusIntent?.();
          }
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'linear-gradient(135deg, rgba(74,222,128,0.14), rgba(74,222,128,0.04))',
          border: '1px solid rgba(74,222,128,0.28)',
          color: '#4ade80',
          padding: '3px 9px',
          fontSize: '11px', fontWeight: 600,
          borderRadius: '100px',
          cursor: 'pointer',
          fontFamily: 'var(--ig-font-mono)',
          flexShrink: 0, marginRight: '2px',
          transition: 'opacity 120ms ease',
        }}
        onMouseEnter={e => { (e.currentTarget).style.opacity = '0.8'; }}
        onMouseLeave={e => { (e.currentTarget).style.opacity = '1'; }}
      >
        <Sparkles size={11} />
        AI
      </button>

      {/* Type selector */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          aria-label="Text type"
          title="Text type"
          onMouseDown={e => e.preventDefault()}
          onClick={() => toggleMenu('type')}
          style={{
            display: 'flex', alignItems: 'center', gap: '2px',
            height: '28px', padding: '0 7px',
            borderRadius: '6px', border: 'none',
            background: openMenu === 'type' ? pressedBg : 'transparent',
            color: openMenu === 'type' ? '#4ade80' : textSec,
            cursor: 'pointer',
            fontSize: '12px', fontWeight: 600,
            fontFamily: 'var(--ig-font-mono)',
            transition: 'background 80ms ease, color 80ms ease',
          }}
          onMouseEnter={e => { if (openMenu !== 'type') (e.currentTarget).style.background = hoverBg; }}
          onMouseLeave={e => { if (openMenu !== 'type') (e.currentTarget).style.background = 'transparent'; }}
        >
          {typeLabel}
          <ChevronDown size={10} style={{ opacity: 0.5, marginLeft: '1px' }} />
        </button>

        {openMenu === 'type' && (
          <div style={{ ...dropStyle, left: 0, minWidth: '136px' }}>
            {([
              { label: 'Paragraph', key: 'P',
                action: () => editor?.chain().focus().setParagraph().run(),
                active: ts.headingLevel === 0,
                fontSize: '13px', fontWeight: 400 },
              { label: 'Heading 1', key: 'H1',
                action: () => editor?.chain().focus().setHeading({ level: 1 }).run(),
                active: ts.headingLevel === 1,
                fontSize: '16px', fontWeight: 700 },
              { label: 'Heading 2', key: 'H2',
                action: () => editor?.chain().focus().setHeading({ level: 2 }).run(),
                active: ts.headingLevel === 2,
                fontSize: '14px', fontWeight: 600 },
              { label: 'Heading 3', key: 'H3',
                action: () => editor?.chain().focus().setHeading({ level: 3 }).run(),
                active: ts.headingLevel === 3,
                fontSize: '13px', fontWeight: 600 },
            ]).map(({ label, key, action, active, fontSize, fontWeight }) => (
              <button
                key={key}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { action(); setOpenMenu(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '7px 12px',
                  border: 'none',
                  background: active ? pressedBg : 'transparent',
                  color: active ? '#4ade80' : textSec,
                  cursor: 'pointer', textAlign: 'left',
                  fontSize, fontWeight,
                  fontFamily: 'var(--ig-font-sans)',
                  transition: 'background 80ms ease',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget).style.background = hoverBg; }}
                onMouseLeave={e => { if (!active) (e.currentTarget).style.background = active ? pressedBg : 'transparent'; }}
              >
                <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.45, fontFamily: 'var(--ig-font-mono)', minWidth: '16px' }}>{key}</span>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* ── Group 2: Bold / Italic / Underline / Text Color ── */}
      <Btn pressed={ts.bold}      onClick={() => editor?.chain().focus().toggleBold().run()}      icon={Bold}      label="Bold (⌘B)" />
      <Btn pressed={ts.italic}    onClick={() => editor?.chain().focus().toggleItalic().run()}    icon={Italic}    label="Italic (⌘I)" />
      <Btn pressed={ts.underline} onClick={() => editor?.chain().focus().toggleUnderline().run()} icon={Underline} label="Underline (⌘U)" />

      {/* Text color */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          aria-label="Text color"
          title="Text color"
          onMouseDown={e => e.preventDefault()}
          onClick={() => toggleMenu('color')}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', gap: '2px',
            borderRadius: '6px', border: 'none',
            background: openMenu === 'color' ? pressedBg : 'transparent',
            cursor: 'pointer',
            transition: 'background 80ms ease',
            flexShrink: 0, padding: 0,
          }}
          onMouseEnter={e => { if (openMenu !== 'color') (e.currentTarget).style.background = hoverBg; }}
          onMouseLeave={e => { if (openMenu !== 'color') (e.currentTarget).style.background = 'transparent'; }}
        >
          <span style={{
            fontSize: '13px', fontWeight: 700, lineHeight: 1,
            color: ts.textColor ?? textSec,
            fontFamily: 'var(--ig-font-sans)',
            transition: 'color 120ms ease',
          }}>A</span>
          <div style={{
            width: '14px', height: '2px', borderRadius: '1px',
            backgroundColor: ts.textColor ?? 'rgba(148,163,184,0.4)',
            transition: 'background-color 120ms ease',
          }} />
        </button>

        {openMenu === 'color' && (
          <div style={{
            ...dropStyle,
            left: '50%', transform: 'translateX(-50%)',
            padding: '10px',
            overflow: 'visible',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {([
                '#f8fafc', '#94a3b8', '#64748b', '#1e293b',
                '#4ade80', '#38bdf8', '#fb923c', '#f87171',
                '#c084fc', '#fde68a',
              ]).map(color => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Set text color ${color}`}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { editor?.chain().focus().setColor(color).run(); setOpenMenu(null); }}
                  style={{
                    width: '22px', height: '22px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: ts.textColor === color
                      ? '2px solid #4ade80'
                      : `2px solid ${isPaper ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                    cursor: 'pointer', padding: 0,
                    outline: 'none',
                    transition: 'border-color 80ms ease, transform 80ms ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget).style.transform = 'scale(1.15)'; }}
                  onMouseLeave={e => { (e.currentTarget).style.transform = 'scale(1)'; }}
                />
              ))}
            </div>
            {ts.textColor && (
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { editor?.chain().focus().unsetColor().run(); setOpenMenu(null); }}
                style={{
                  marginTop: '8px', width: '100%',
                  padding: '4px 6px', border: 'none',
                  background: 'transparent', color: textSec,
                  fontSize: '10.5px', cursor: 'pointer',
                  borderRadius: '4px',
                  fontFamily: 'var(--ig-font-mono)',
                  transition: 'background 80ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget).style.background = hoverBg; }}
                onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; }}
              >
                Clear color
              </button>
            )}
          </div>
        )}
      </div>

      <Divider />

      {/* ── Group 3: Alignment ── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          aria-label="Text alignment"
          title="Text alignment"
          onMouseDown={e => e.preventDefault()}
          onClick={() => toggleMenu('align')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px',
            borderRadius: '6px', border: 'none',
            background: openMenu === 'align' ? pressedBg : 'transparent',
            color: openMenu === 'align' ? '#4ade80' : textSec,
            cursor: 'pointer',
            transition: 'background 80ms ease, color 80ms ease',
          }}
          onMouseEnter={e => { if (openMenu !== 'align') (e.currentTarget).style.background = hoverBg; }}
          onMouseLeave={e => { if (openMenu !== 'align') (e.currentTarget).style.background = 'transparent'; }}
        >
          <AlignIcon size={14} />
        </button>

        {openMenu === 'align' && (
          <div style={{ ...dropStyle, left: 0, minWidth: '148px' }}>
            {([
              { label: 'Left',    icon: AlignLeft,    value: 'left'    as const },
              { label: 'Center',  icon: AlignCenter,  value: 'center'  as const },
              { label: 'Right',   icon: AlignRight,   value: 'right'   as const },
              { label: 'Justify', icon: AlignJustify, value: 'justify' as const },
            ]).map(({ label, icon: Icon, value }) => {
              const active = ts.textAlign === value;
              return (
                <button
                  key={value}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { editor?.chain().focus().setTextAlign(value).run(); setOpenMenu(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '7px 12px',
                    border: 'none',
                    background: active ? pressedBg : 'transparent',
                    color: active ? '#4ade80' : textSec,
                    cursor: 'pointer', textAlign: 'left',
                    fontSize: '12px',
                    transition: 'background 80ms ease',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget).style.background = hoverBg; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget).style.background = 'transparent'; }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Divider />

      {/* ── Group 4: Attachment ── */}
      <button
        type="button"
        aria-label="Attach file"
        title="Attach file"
        onMouseDown={e => e.preventDefault()}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.click();
        }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '28px', height: '28px',
          borderRadius: '6px', border: 'none',
          background: 'transparent', color: textSec,
          cursor: 'pointer',
          transition: 'background 80ms ease',
          flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget).style.background = hoverBg; }}
        onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; }}
      >
        <Paperclip size={14} />
      </button>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Group 5: More (⋯) ── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          aria-label="More formatting"
          title="More formatting"
          onMouseDown={e => e.preventDefault()}
          onClick={() => toggleMenu('more')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px',
            borderRadius: '6px', border: 'none',
            background: openMenu === 'more' ? pressedBg : 'transparent',
            color: openMenu === 'more' ? '#4ade80' : textSec,
            cursor: 'pointer',
            transition: 'background 80ms ease, color 80ms ease',
          }}
          onMouseEnter={e => { if (openMenu !== 'more') (e.currentTarget).style.background = hoverBg; }}
          onMouseLeave={e => { if (openMenu !== 'more') (e.currentTarget).style.background = 'transparent'; }}
        >
          <MoreHorizontal size={14} />
        </button>

        {openMenu === 'more' && (
          <div style={{ ...dropStyle, right: 0, minWidth: '180px' }}>
            {([
              {
                label: 'Strikethrough', icon: Strikethrough,
                action: () => editor?.chain().focus().toggleStrike().run(),
                active: ts.strike,
              },
              {
                label: 'Inline Code', icon: Code,
                action: () => editor?.chain().focus().toggleCode().run(),
                active: ts.code,
              },
              {
                label: 'Code Block', icon: Terminal,
                action: () => editor?.chain().focus().toggleCodeBlock().run(),
                active: ts.codeBlock,
              },
              {
                label: 'Bullet List', icon: List,
                action: () => editor?.chain().focus().toggleBulletList().run(),
                active: ts.bulletList,
              },
              {
                label: 'Numbered List', icon: ListOrdered,
                action: () => editor?.chain().focus().toggleOrderedList().run(),
                active: ts.orderedList,
              },
              {
                label: 'Task List', icon: CheckSquare,
                action: () => editor?.chain().focus().toggleTaskList().run(),
                active: ts.taskList,
              },
              {
                label: 'Blockquote', icon: Quote,
                action: () => editor?.chain().focus().toggleBlockquote().run(),
                active: ts.blockquote,
              },
              {
                label: 'Divider', icon: Minus,
                action: () => { editor?.chain().focus().setHorizontalRule().run(); setOpenMenu(null); },
                active: false,
              },
            ]).map(({ label, icon: Icon, action, active }) => (
              <button
                key={label}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { action(); if (active || label === 'Divider') setOpenMenu(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  width: '100%', padding: '7px 12px',
                  border: 'none',
                  background: active ? pressedBg : 'transparent',
                  color: active ? '#4ade80' : textSec,
                  cursor: 'pointer', textAlign: 'left',
                  fontSize: '12px',
                  transition: 'background 80ms ease',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget).style.background = hoverBg; }}
                onMouseLeave={e => { if (!active) (e.currentTarget).style.background = 'transparent'; }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
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
  onFocusIntent,
}: TipTapRendererProps) {
  void fs;
  const { state: { settings: gs } } = useGlobalStore();
  const documentTheme = gs.documentTheme;

  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef    = useRef<HTMLDivElement>(null);

  const assignAnchorIds = (dom: HTMLElement) => {
    if (!anchors) return;
    const sectionIds = parseSections(content);
    const h2s = dom.querySelectorAll('h2');
    h2s.forEach((el, i) => {
      const id = sectionIds[i]?.anchorId;
      if (id) (el as HTMLElement).id = id;
    });
  };

  // Re-created whenever `content` changes — correct for read-only; for editable
  // mode, content only changes on artifact switch (not on user typing), so this
  // never discards live edits.
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Highlight.configure({ multicolor: true }),
        Table.configure({ resizable: false }),
        TableRow, TableHeader, TableCell,
        TextStyle,
        Color,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Markdown.configure({ html: false, linkify: false, breaks: false, tightLists: true }),
      ],
      content,
      editable,
      immediatelyRender: false,
      onCreate: ({ editor: ed }) => {
        assignAnchorIds(ed.view.dom as HTMLElement);
      },
      onUpdate: ({ editor: ed }) => {
        assignAnchorIds(ed.view.dom as HTMLElement);
        if (editable && onContentChange) {
          const md = (ed.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();
          onContentChange(md);
        }
      },
    },
    [content],
  );

  // Runtime editable toggle
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable, false);
  }, [editor, editable]);

  // ⌘S save handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!editable || !onSave || !editor) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      const md = (editor.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();
      void onSave(md);
    }
  }, [editable, onSave, editor]);

  // Arrival highlight
  useEffect(() => {
    if (!containerRef.current) return;
    const h2s = containerRef.current.querySelectorAll('.ProseMirror h2');
    h2s.forEach(el => {
      const e = el as HTMLElement;
      e.style.transition = reducedMotion ? 'none' : `background-color ${workspaceMotion.arrivalAccentMs}ms ease-out`;
      e.style.backgroundColor = (!!arrivalId && el.id === arrivalId) ? '#0d1a10' : 'transparent';
    });
  }, [arrivalId, reducedMotion, editor, content]);

  // Selection Bubble
  const [bubble, setBubble] = useState<BubbleState>({ visible: false, top: 0, anchorX: 0 });
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

  useLayoutEffect(() => {
    if (!bubble.visible) return;
    const container = containerRef.current;
    const el = bubbleRef.current;
    if (!container || !el) return;
    const containerWidth = container.getBoundingClientRect().width;
    const bubbleWidth = el.offsetWidth;
    const margin = 4;
    const maxLeft = Math.max(margin, containerWidth - bubbleWidth - margin);
    const left = Math.max(margin, Math.min(bubble.anchorX - bubbleWidth / 2, maxLeft));
    setBubbleLeft(left);
  }, [bubble.visible, bubble.anchorX, bubble.top]);

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
      onKeyDown={handleKeyDown}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <FormattingToolbar
        editor={editor}
        visible={editable}
        documentTheme={documentTheme}
        onPresetSelect={onPresetSelect}
        onFocusIntent={onFocusIntent}
      />

      {editor && <EditorContent editor={editor} />}

      {onPresetSelect && (
        <AnimatePresence>
          {bubble.visible && (
            <motion.div
              ref={bubbleRef}
              role="toolbar"
              aria-label="Selection actions"
              className="ig-selection-bubble"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.92, y: 4 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                top: bubble.top,
                left: bubbleLeft,
                background: documentTheme === 'paper'
                  ? 'rgba(253,248,243,0.97)'
                  : 'var(--ig-surface-overlay)',
                border: `1px solid ${documentTheme === 'paper' ? 'rgba(74,222,128,0.2)' : 'rgba(74,222,128,0.18)'}`,
                boxShadow: 'var(--ig-elev-overlay)',
                borderRadius: 'var(--ig-radius-full)',
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
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
