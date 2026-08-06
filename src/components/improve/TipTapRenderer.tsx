'use client';

// src/components/improve/TipTapRenderer.tsx
//
// MISSION 1 — Document Render Swap (Phase B, read-only).
// MISSION 2 — Selection Bubble Menu (additive, read-only-safe).
// MISSION 3 — Collaborative Document Editor (additive, editable mode).
// MISSION 30 — Premium Collaborative Toolbar: floating rounded card, animated
//              dropdowns, 5 logical groups, attachment menu, future-ready More.
//
// All missions are additive. When editable=false (default), behaviour is
// byte-for-byte what shipped after Mission 2.
//
// Constitution references:
//   §5   — editing philosophy; §7 — save state; §11 — toolbar spec;
//   §13  — 120ms entrance; §14 — aria-labels; §27 — one editor per artifact

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
  FileText, Image, FileCode, FileType, Table2, Pen, Globe,
  BarChart2, Calculator, Type,
  type LucideIcon,
} from 'lucide-react';
import { parseSections } from '@/lib/parseSections';
import { workspaceMotion } from '@/components/workspace/motion';
import { useGlobalStore } from '@/lib/GlobalStore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TipTapRendererProps {
  content:          string;
  fs?:              number;
  anchors?:         boolean;
  arrivalId?:       string | null;
  reducedMotion?:   boolean;
  onPresetSelect?:  (intent: string) => void;
  editable?:        boolean;
  onContentChange?: (md: string) => void;
  onSave?:          (md: string) => Promise<void>;
  onFocusIntent?:   () => void;
}

// ── Toolbar reactive state ────────────────────────────────────────────────────

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

// ── Design tokens — toolbar is ALWAYS dark regardless of document theme ───────

const T = {
  bg:          'rgba(13, 17, 27, 0.97)',
  border:      'rgba(255,255,255,0.09)',
  shadow:      '0 4px 24px rgba(0,0,0,0.45), 0 1px 6px rgba(0,0,0,0.25)',
  text:        'rgba(148,163,184,0.80)',
  textActive:  '#4ade80',
  hover:       'rgba(255,255,255,0.07)',
  pressed:     'rgba(74,222,128,0.11)',
  divider:     'rgba(255,255,255,0.08)',
  dropBg:      'rgb(17, 22, 34)',
  dropBorder:  'rgba(255,255,255,0.09)',
  dropShadow:  '0 12px 40px rgba(0,0,0,0.55), 0 2px 10px rgba(0,0,0,0.35)',
  radius:      '12px',
  dropRadius:  '11px',
};

// ── Dropdown animation spring ─────────────────────────────────────────────────

const DROP_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: -6 },
  shown:  { opacity: 1, scale: 1,    y: 0  },
  exit:   { opacity: 0, scale: 0.95, y: -6 },
};
const DROP_TRANSITION = { duration: 0.14, ease: [0.16, 1, 0.3, 1] as const };

// ── Reusable toolbar button ────────────────────────────────────────────────────

function ToolbarBtn({
  pressed = false, onClick, icon: Icon, label, children, wide,
}: {
  pressed?: boolean; onClick: () => void; icon?: LucideIcon;
  label: string; children?: React.ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={e => {
        e.preventDefault();
        if (ref.current) ref.current.style.transform = 'scale(0.92)';
      }}
      onMouseUp={() => { if (ref.current) ref.current.style.transform = 'scale(1)'; }}
      onMouseLeave={() => {
        const el = ref.current; if (!el) return;
        el.style.background = pressed ? T.pressed : 'transparent';
        el.style.boxShadow  = 'none';
        el.style.transform  = 'scale(1)';
      }}
      onMouseEnter={() => {
        const el = ref.current; if (!el) return;
        if (!pressed) el.style.background = T.hover;
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.20)';
      }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
        width: wide ? 'auto' : '28px', height: '28px',
        padding: wide ? '0 8px' : '0',
        borderRadius: '7px', border: 'none',
        background: pressed ? T.pressed : 'transparent',
        color: pressed ? T.textActive : T.text,
        cursor: 'pointer',
        transition: 'background 80ms ease, color 80ms ease, box-shadow 80ms ease',
        flexShrink: 0,
      }}
    >
      {Icon && <Icon size={14} strokeWidth={1.8} />}
      {children}
    </button>
  );
}

function TDivider() {
  return (
    <div style={{
      width: '1px', height: '18px', margin: '0 4px',
      backgroundColor: T.divider, flexShrink: 0,
    }} aria-hidden />
  );
}

// ── Shared dropdown wrapper ────────────────────────────────────────────────────

function DropPanel({
  children, align = 'left',
}: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  const posStyle: React.CSSProperties =
    align === 'right'  ? { right: 0 } :
    align === 'center' ? { left: '50%', transform: 'translateX(-50%)' } :
    { left: 0 };

  return (
    <motion.div
      variants={DROP_VARIANTS}
      initial="hidden"
      animate="shown"
      exit="exit"
      transition={DROP_TRANSITION}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)',
        ...posStyle,
        background: T.dropBg,
        border: `1px solid ${T.dropBorder}`,
        borderRadius: T.dropRadius,
        boxShadow: T.dropShadow,
        zIndex: 300,
        overflow: 'hidden',
        minWidth: '160px',
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Dropdown item row ──────────────────────────────────────────────────────────

function DropItem({
  icon: Icon, label, active, disabled, badge, onClick,
}: {
  icon: LucideIcon; label: string; active?: boolean;
  disabled?: boolean; badge?: string; onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      onMouseEnter={() => {
        const el = ref.current;
        if (el && !disabled) el.style.background = T.hover;
      }}
      onMouseLeave={() => {
        const el = ref.current;
        if (el) el.style.background = active ? T.pressed : 'transparent';
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        width: '100%', padding: '7px 13px',
        border: 'none',
        background: active ? T.pressed : 'transparent',
        color: disabled ? 'rgba(148,163,184,0.30)' : active ? T.textActive : T.text,
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left', fontSize: '12px',
        transition: 'background 80ms ease',
      }}
    >
      <Icon size={13} strokeWidth={1.8} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: '9px', fontFamily: 'var(--ig-font-mono)',
          color: 'rgba(148,163,184,0.35)',
          background: 'rgba(255,255,255,0.05)',
          padding: '1px 5px', borderRadius: '4px',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{badge}</span>
      )}
    </button>
  );
}

// ── FormattingToolbar ─────────────────────────────────────────────────────────

interface ToolbarProps {
  editor:          Editor | null;
  visible:         boolean;
  documentTheme:   'dark' | 'paper';
  onPresetSelect?: (intent: string) => void;
  onFocusIntent?:  () => void;
}

type OpenMenu = 'type' | 'color' | 'align' | 'attach' | 'more' | null;

function FormattingToolbar({ editor, visible, documentTheme, onPresetSelect, onFocusIntent }: ToolbarProps) {
  const [ts, setTs]       = useState<ToolbarState>(EMPTY_TOOLBAR);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const toolbarRef  = useRef<HTMLDivElement>(null);
  const openMenuRef = useRef<OpenMenu>(null);
  openMenuRef.current = openMenu;

  // ── Reactive state ────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    if (!editor) { setTs(EMPTY_TOOLBAR); return; }
    const sel       = editor.state.selection;
    const hlAttrs   = editor.isActive('highlight') ? editor.getAttributes('highlight') : null;
    const colorAttrs = editor.getAttributes('textStyle');
    const headingLevel =
      editor.isActive('heading', { level: 1 }) ? 1 :
      editor.isActive('heading', { level: 2 }) ? 2 :
      editor.isActive('heading', { level: 3 }) ? 3 : 0;
    const pa = editor.getAttributes('paragraph');
    const ha = editor.getAttributes('heading');
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
      textAlign:       ((pa.textAlign ?? ha.textAlign) || 'left') as ToolbarState['textAlign'],
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on('selectionUpdate', refresh);
    editor.on('transaction',    refresh);
    refresh();
    return () => { editor.off('selectionUpdate', refresh); editor.off('transaction', refresh); };
  }, [editor, refresh]);

  // ── Close dropdown on outside click (single mount listener) ──────────────
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!openMenuRef.current) return;
      if (toolbarRef.current?.contains(e.target as Node)) return;
      setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // ── Close on Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenu(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleMenu = (name: NonNullable<OpenMenu>) =>
    setOpenMenu(m => m === name ? null : name);

  const close = () => setOpenMenu(null);

  // ── Derived state ─────────────────────────────────────────────────────────
  const typeLabel = ts.headingLevel === 0 ? 'Text' : `H${ts.headingLevel}`;
  const AlignIcon: LucideIcon =
    ts.textAlign === 'center'  ? AlignCenter  :
    ts.textAlign === 'right'   ? AlignRight   :
    ts.textAlign === 'justify' ? AlignJustify : AlignLeft;

  // ── Wrapper bg — bleeds the sticky area so content scrolls cleanly ────────
  const isPaper = documentTheme === 'paper';
  const wrapBg  = isPaper ? 'rgba(255,255,255,0.97)' : 'rgba(9,14,20,0.97)';

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '7px 14px 7px',
        background: wrapBg,
        flexShrink: 0,
      }}
      onMouseDown={e => e.preventDefault()}
    >
      {/* ── Floating rounded toolbar card ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        height: '40px', padding: '0 10px',
        background: T.bg,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        boxShadow: T.shadow,
        animation: 'ig-toolbar-in 120ms ease-out',
        overflow: 'visible',
      }}>

        {/* ── Group 1: AI + Text Type ─────────────────────────────────────── */}
        {/* AI pill */}
        <button
          type="button"
          aria-label="AI actions"
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            if (ts.hasSelection && editor && onPresetSelect) {
              const sel  = editor.state.selection;
              const text = editor.state.doc.textBetween(sel.from, sel.to, ' ').trim();
              onPresetSelect(text ? `"${text.slice(0, 180)}"\n\n` : '');
            } else {
              onFocusIntent?.();
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'linear-gradient(135deg, rgba(74,222,128,0.14), rgba(74,222,128,0.05))',
            border: '1px solid rgba(74,222,128,0.28)',
            color: '#4ade80',
            padding: '3px 10px 3px 8px',
            fontSize: '11.5px', fontWeight: 600,
            borderRadius: '100px',
            cursor: 'pointer',
            fontFamily: 'var(--ig-font-mono)',
            flexShrink: 0, marginRight: '2px',
            transition: 'opacity 120ms ease, box-shadow 120ms ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 1px rgba(74,222,128,0.3), 0 2px 8px rgba(74,222,128,0.15)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          <Sparkles size={11} strokeWidth={2} />
          AI
        </button>

        {/* Type selector */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ToolbarBtn
            pressed={openMenu === 'type'}
            onClick={() => toggleMenu('type')}
            label="Text type"
            wide
          >
            <span style={{
              fontSize: '11.5px', fontWeight: 600,
              fontFamily: 'var(--ig-font-mono)',
              color: openMenu === 'type' ? T.textActive : T.text,
              minWidth: '30px', textAlign: 'center',
            }}>{typeLabel}</span>
            <ChevronDown size={10} strokeWidth={2} style={{
              opacity: 0.5,
              transform: openMenu === 'type' ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 150ms ease',
            }} />
          </ToolbarBtn>

          <AnimatePresence>
            {openMenu === 'type' && (
              <DropPanel>
                {([
                  { label: 'Text',      key: 'Text', level: 0 as const,
                    action: () => editor?.chain().focus().setParagraph().run(),
                    active: ts.headingLevel === 0, size: '13px', weight: 400 },
                  { label: 'Heading 1', key: 'H1',  level: 1 as const,
                    action: () => editor?.chain().focus().setHeading({ level: 1 }).run(),
                    active: ts.headingLevel === 1, size: '16px', weight: 700 },
                  { label: 'Heading 2', key: 'H2',  level: 2 as const,
                    action: () => editor?.chain().focus().setHeading({ level: 2 }).run(),
                    active: ts.headingLevel === 2, size: '14px', weight: 600 },
                  { label: 'Heading 3', key: 'H3',  level: 3 as const,
                    action: () => editor?.chain().focus().setHeading({ level: 3 }).run(),
                    active: ts.headingLevel === 3, size: '13px', weight: 600 },
                ]).map(({ label, key, action, active, size, weight }) => (
                  <DropItem
                    key={key}
                    icon={Type}
                    label={label}
                    active={active}
                    onClick={() => { action(); close(); }}
                  />
                ))}
              </DropPanel>
            )}
          </AnimatePresence>
        </div>

        <TDivider />

        {/* ── Group 2: Bold / Italic / Underline / Text Color ─────────────── */}
        <ToolbarBtn pressed={ts.bold}      onClick={() => editor?.chain().focus().toggleBold().run()}      icon={Bold}      label="Bold (⌘B)" />
        <ToolbarBtn pressed={ts.italic}    onClick={() => editor?.chain().focus().toggleItalic().run()}    icon={Italic}    label="Italic (⌘I)" />
        <ToolbarBtn pressed={ts.underline} onClick={() => editor?.chain().focus().toggleUnderline().run()} icon={Underline} label="Underline (⌘U)" />

        {/* Text Color */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ToolbarBtn pressed={openMenu === 'color'} onClick={() => toggleMenu('color')} label="Text color">
            <span style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            }}>
              <span style={{
                fontSize: '13px', fontWeight: 700, lineHeight: 1,
                color: ts.textColor ?? T.text,
                fontFamily: 'var(--ig-font-sans)',
                transition: 'color 120ms ease',
              }}>A</span>
              <span style={{
                display: 'block', width: '14px', height: '2.5px', borderRadius: '1.5px',
                backgroundColor: ts.textColor ?? 'rgba(148,163,184,0.35)',
                transition: 'background-color 120ms ease',
              }} />
            </span>
          </ToolbarBtn>

          <AnimatePresence>
            {openMenu === 'color' && (
              <DropPanel align="center">
                <div style={{ padding: '12px', minWidth: '188px' }}>
                  {/* Color grid */}
                  <p style={{
                    fontSize: '10px', fontFamily: 'var(--ig-font-mono)',
                    color: 'rgba(148,163,184,0.40)', letterSpacing: '0.06em',
                    textTransform: 'uppercase', margin: '0 0 8px',
                  }}>Color</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                    {[
                      { hex: '#f8fafc', name: 'White'   },
                      { hex: '#94a3b8', name: 'Slate'   },
                      { hex: '#64748b', name: 'Steel'   },
                      { hex: '#4ade80', name: 'Emerald' },
                      { hex: '#38bdf8', name: 'Sky'     },
                      { hex: '#818cf8', name: 'Indigo'  },
                      { hex: '#c084fc', name: 'Violet'  },
                      { hex: '#fb923c', name: 'Orange'  },
                      { hex: '#f87171', name: 'Red'     },
                      { hex: '#fde68a', name: 'Amber'   },
                      { hex: '#86efac', name: 'Mint'    },
                      { hex: '#7dd3fc', name: 'Blue'    },
                    ].map(({ hex, name }) => {
                      const isActive = ts.textColor === hex;
                      return (
                        <button
                          key={hex}
                          type="button"
                          aria-label={name}
                          title={name}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { editor?.chain().focus().setColor(hex).run(); close(); }}
                          style={{
                            width: '22px', height: '22px',
                            borderRadius: '50%',
                            backgroundColor: hex,
                            border: isActive ? '2px solid #4ade80' : '2px solid rgba(255,255,255,0.10)',
                            cursor: 'pointer', padding: 0, outline: 'none',
                            transition: 'transform 80ms ease, border-color 80ms ease',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.18)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                        />
                      );
                    })}
                  </div>

                  {ts.textColor && (
                    <>
                      <div style={{ height: '1px', background: T.divider, margin: '10px 0 6px' }} />
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { editor?.chain().focus().unsetColor().run(); close(); }}
                        style={{
                          width: '100%', padding: '4px 8px',
                          border: 'none', background: 'transparent',
                          color: 'rgba(148,163,184,0.45)',
                          fontSize: '11px', cursor: 'pointer',
                          borderRadius: '5px', textAlign: 'left',
                          fontFamily: 'var(--ig-font-mono)',
                          transition: 'background 80ms ease',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.hover; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        Clear color
                      </button>
                    </>
                  )}
                </div>
              </DropPanel>
            )}
          </AnimatePresence>
        </div>

        <TDivider />

        {/* ── Group 3: Alignment ───────────────────────────────────────────── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ToolbarBtn pressed={openMenu === 'align'} onClick={() => toggleMenu('align')} label="Text alignment">
            <AlignIcon size={14} strokeWidth={1.8} />
          </ToolbarBtn>

          <AnimatePresence>
            {openMenu === 'align' && (
              <DropPanel>
                {([
                  { label: 'Left',    icon: AlignLeft,    value: 'left'    as const },
                  { label: 'Center',  icon: AlignCenter,  value: 'center'  as const },
                  { label: 'Right',   icon: AlignRight,   value: 'right'   as const },
                  { label: 'Justify', icon: AlignJustify, value: 'justify' as const },
                ]).map(({ label, icon, value }) => (
                  <DropItem
                    key={value}
                    icon={icon}
                    label={label}
                    active={ts.textAlign === value}
                    onClick={() => { editor?.chain().focus().setTextAlign(value).run(); close(); }}
                  />
                ))}
              </DropPanel>
            )}
          </AnimatePresence>
        </div>

        <TDivider />

        {/* ── Group 4: Attachment ─────────────────────────────────────────── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ToolbarBtn pressed={openMenu === 'attach'} onClick={() => toggleMenu('attach')} label="Attach file" icon={Paperclip} />

          <AnimatePresence>
            {openMenu === 'attach' && (
              <DropPanel>
                {/* Supported now */}
                <div style={{
                  padding: '7px 13px 4px',
                  fontSize: '9.5px', fontFamily: 'var(--ig-font-mono)',
                  color: 'rgba(148,163,184,0.38)',
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                }}>Attach file</div>
                {([
                  { icon: FileText, label: 'PDF document',    accept: '.pdf' },
                  { icon: FileType, label: 'Word document',   accept: '.doc,.docx' },
                  { icon: Image,    label: 'Image',           accept: '.png,.jpg,.jpeg,.svg,.webp' },
                  { icon: FileCode, label: 'Markdown / Text', accept: '.md,.txt' },
                ] as const).map(({ icon, label, accept }) => (
                  <DropItem
                    key={label}
                    icon={icon}
                    label={label}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file'; input.accept = accept; input.multiple = false;
                      input.click();
                      close();
                    }}
                  />
                ))}

                <div style={{ height: '4px' }} />
              </DropPanel>
            )}
          </AnimatePresence>
        </div>

        <TDivider />

        {/* ── Group 5: Promoted — Strikethrough / Task / Numbered / Code ── */}
        <ToolbarBtn pressed={ts.strike}      onClick={() => editor?.chain().focus().toggleStrike().run()}      icon={Strikethrough} label="Strikethrough" />
        <ToolbarBtn pressed={ts.taskList}    onClick={() => editor?.chain().focus().toggleTaskList().run()}    icon={CheckSquare}   label="Task list" />
        <ToolbarBtn pressed={ts.orderedList} onClick={() => editor?.chain().focus().toggleOrderedList().run()} icon={ListOrdered}   label="Numbered list" />
        <ToolbarBtn pressed={ts.code}        onClick={() => editor?.chain().focus().toggleCode().run()}        icon={Code}          label="Inline code" />

        {/* ── Spacer ──────────────────────────────────────────────────────── */}
        <div style={{ flex: 1 }} />

        {/* ── Group 5: More (⋯) ───────────────────────────────────────────── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ToolbarBtn pressed={openMenu === 'more'} onClick={() => toggleMenu('more')} label="More formatting" icon={MoreHorizontal} />

          <AnimatePresence>
            {openMenu === 'more' && (
              <DropPanel align="right">
                <DropItem icon={Terminal}    label="Code block"     active={ts.codeBlock}
                  onClick={() => { editor?.chain().focus().toggleCodeBlock().run(); close(); }} />
                <DropItem icon={List}        label="Bullet list"    active={ts.bulletList}
                  onClick={() => { editor?.chain().focus().toggleBulletList().run(); close(); }} />
                <DropItem icon={Quote}       label="Blockquote"     active={ts.blockquote}
                  onClick={() => { editor?.chain().focus().toggleBlockquote().run(); close(); }} />

                <div style={{ height: '1px', background: T.divider, margin: '4px 0' }} />

                <DropItem icon={Minus}  label="Horizontal rule"
                  onClick={() => { editor?.chain().focus().setHorizontalRule().run(); close(); }} />
                <DropItem icon={Table2} label="Table"
                  onClick={() => {
                    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    close();
                  }} />
                <div style={{ height: '4px' }} />
              </DropPanel>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Bubble presets (Mission 2 — unchanged) ────────────────────────────────────

const BUBBLE_PRESETS = [
  { label: 'More concise',      intent: 'Make this more concise — remove redundancy, preserve all PM insights' },
  { label: 'Sharpen summary',   intent: 'Rewrite summary to be crisper and interview-ready — one PM insight per sentence' },
  { label: 'Add evidence',      intent: 'Ground every claim in frameworks, data, or explicitly labelled assumptions' },
  { label: 'Improve structure', intent: 'Reorganise for PM logic — problem → insight → decision → artifact' },
  { label: 'More strategic',    intent: 'Strengthen strategic reasoning — sharper market framing, competitive logic, positioning' },
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
    dom.querySelectorAll('h2').forEach((el, i) => {
      const id = sectionIds[i]?.anchorId;
      if (id) (el as HTMLElement).id = id;
    });
  };

  // Re-created only when `content` changes (artifact switch, never on user typing)
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
      onCreate: ({ editor: ed }) => { assignAnchorIds(ed.view.dom as HTMLElement); },
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

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable, false);
  }, [editor, editable]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!editable || !onSave || !editor) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      const md = (editor.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();
      void onSave(md);
    }
  }, [editable, onSave, editor]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.querySelectorAll('.ProseMirror h2').forEach(el => {
      const e = el as HTMLElement;
      e.style.transition = reducedMotion ? 'none' : `background-color ${workspaceMotion.arrivalAccentMs}ms ease-out`;
      e.style.backgroundColor = (!!arrivalId && el.id === arrivalId) ? '#0d1a10' : 'transparent';
    });
  }, [arrivalId, reducedMotion, editor, content]);

  // ── Selection bubble (Mission 2 — unchanged) ──────────────────────────────
  const [bubble, setBubble] = useState<BubbleState>({ visible: false, top: 0, anchorX: 0 });
  const [bubbleLeft, setBubbleLeft] = useState(0);

  useEffect(() => {
    const handle = () => {
      const container = containerRef.current;
      if (!container) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed || sel.toString().length === 0) {
        setBubble(b => b.visible ? { ...b, visible: false } : b);
        return;
      }
      if (!container.contains(sel.anchorNode)) {
        setBubble(b => b.visible ? { ...b, visible: false } : b);
        return;
      }
      const range = sel.getRangeAt(0);
      const selRect = range.getBoundingClientRect();
      if (selRect.width === 0 && selRect.height === 0) { setBubble(b => b.visible ? { ...b, visible: false } : b); return; }
      const cRect = container.getBoundingClientRect();
      const GAP = 8; const BH = 40;
      let top = selRect.top - cRect.top - BH - GAP;
      if (top < 0) top = selRect.bottom - cRect.top + GAP;
      setBubble({ visible: true, top, anchorX: selRect.left - cRect.left + selRect.width / 2 });
    };
    document.addEventListener('selectionchange', handle);
    return () => document.removeEventListener('selectionchange', handle);
  }, []);

  useLayoutEffect(() => {
    if (!bubble.visible) return;
    const container = containerRef.current;
    const el = bubbleRef.current;
    if (!container || !el) return;
    const cw = container.getBoundingClientRect().width;
    const bw = el.offsetWidth;
    const m = 4;
    setBubbleLeft(Math.max(m, Math.min(bubble.anchorX - bw / 2, Math.max(m, cw - bw - m))));
  }, [bubble.visible, bubble.anchorX, bubble.top]);

  const handlePresetClick = (intent: string) => {
    onPresetSelect?.(intent);
    window.getSelection()?.removeAllRanges();
    setBubble(b => ({ ...b, visible: false }));
  };

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
                top: bubble.top, left: bubbleLeft,
                background: documentTheme === 'paper' ? 'rgba(253,248,243,0.97)' : 'var(--ig-surface-overlay)',
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
