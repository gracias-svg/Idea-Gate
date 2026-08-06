'use client';

// src/components/studio/FloatingTaskPill.tsx
// Mission 20 — G5: Floating personal task pill, visible on every page.
//
// Fixed position: bottom-right (24px / 24px), z-index 200.
// Pill: "✓ Tasks (N)" — N = incomplete count.
// Panel: 280px wide, framer-motion spring, slides up from pill.
// Data: localStorage['ig_personal_tasks'] — survives page reload.
// Features: add task (input + Enter), toggle complete, delete.
// Close: click outside.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Task {
  id:        string;
  text:      string;
  completed: boolean;
}

const STORAGE_KEY = 'ig_personal_tasks';

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is Task =>
      typeof t === 'object' && t !== null &&
      typeof t.id === 'string' && typeof t.text === 'string' && typeof t.completed === 'boolean'
    );
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch { /* quota */ }
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FloatingTaskPill() {
  const [tasks,   setTasks]   = useState<Task[]>([]);
  const [open,    setOpen]    = useState(false);
  const [newText, setNewText] = useState('');
  const [mounted, setMounted] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage after mount (SSR-safe)
  useEffect(() => {
    setMounted(true);
    setTasks(loadTasks());
  }, []);

  // Persist on change
  useEffect(() => {
    if (mounted) saveTasks(tasks);
  }, [tasks, mounted]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const addTask = useCallback(() => {
    const text = newText.trim();
    if (!text) return;
    setTasks(prev => [...prev, { id: newId(), text, completed: false }]);
    setNewText('');
  }, [newText]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // Don't render until mounted (avoids SSR/hydration mismatch)
  if (!mounted) return null;

  const incompleteCount = tasks.filter(t => !t.completed).length;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom:   '24px',
        right:    '24px',
        zIndex:   200,
        display:  'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      {/* ── Task panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              width: '280px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#0f172a',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)',
                fontSize: '12px',
                fontWeight: 600,
                color: '#e2e8f0',
                letterSpacing: '0.01em',
              }}>
                Personal Tasks
              </span>
              {tasks.length > 0 && (
                <span style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.3)',
                }}>
                  {tasks.filter(t => t.completed).length}/{tasks.length}
                </span>
              )}
            </div>

            {/* Task list */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '4px 0' }}>
              <AnimatePresence initial={false}>
                {tasks.length === 0 && (
                  <div style={{
                    padding: '16px 14px',
                    fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.2)',
                    textAlign: 'center',
                  }}>
                    No tasks yet
                  </div>
                )}
                {tasks.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 14px',
                      transition: 'background 150ms ease',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Toggle button */}
                      <button
                        type="button"
                        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                        onClick={() => toggleTask(task.id)}
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          border: `1.5px solid ${task.completed ? '#4ade80' : 'rgba(255,255,255,0.2)'}`,
                          background: task.completed ? '#4ade8033' : 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'border-color 150ms ease, background 150ms ease',
                        }}
                      >
                        {task.completed && (
                          <svg viewBox="0 0 10 10" width="8" height="8" fill="none" aria-hidden="true">
                            <path d="M1.5 5.5L3.5 7.5L8.5 2.5" stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>

                      {/* Task text */}
                      <span style={{
                        flex: 1,
                        fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)',
                        fontSize: '12px',
                        color: task.completed ? 'rgba(255,255,255,0.25)' : '#cbd5e1',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        textDecorationColor: 'rgba(255,255,255,0.15)',
                        transition: 'color 150ms ease',
                        wordBreak: 'break-word',
                      }}>
                        {task.text}
                      </span>

                      {/* Delete button */}
                      <button
                        type="button"
                        aria-label="Delete task"
                        onClick={() => deleteTask(task.id)}
                        style={{
                          width: '16px',
                          height: '16px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: 'rgba(255,255,255,0.2)',
                          fontSize: '14px',
                          lineHeight: 1,
                          transition: 'color 150ms ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                      >
                        ×
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add task input */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '8px 14px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Add task…"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)',
                  fontSize: '12px',
                  color: '#e2e8f0',
                  caretColor: '#4ade80',
                  padding: 0,
                }}
              />
              <button
                type="button"
                aria-label="Add task"
                onClick={addTask}
                disabled={!newText.trim()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: newText.trim() ? 'pointer' : 'default',
                  padding: 0,
                  color: newText.trim() ? '#4ade80' : 'rgba(255,255,255,0.15)',
                  fontSize: '16px',
                  lineHeight: 1,
                  transition: 'color 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                +
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pill trigger ── */}
      <motion.button
        type="button"
        aria-label={open ? 'Close personal tasks' : 'Open personal tasks'}
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 13px',
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: open ? 'rgba(74,222,128,0.1)' : 'rgba(15,23,42,0.92)',
          backdropFilter: 'blur(8px)',
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          transition: 'background 200ms ease, border-color 200ms ease',
          borderColor: open ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)',
        }}
      >
        {/* Check icon */}
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true"
          style={{ color: incompleteCount === 0 && tasks.length > 0 ? '#4ade80' : 'rgba(255,255,255,0.55)' }}>
          <path d="M2.5 8.5L6 12L13.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{
          fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)',
          fontSize: '11px',
          fontWeight: 500,
          color: open ? '#4ade80' : '#94a3b8',
          letterSpacing: '0.01em',
          transition: 'color 200ms ease',
          whiteSpace: 'nowrap',
        }}>
          Tasks{incompleteCount > 0 ? ` (${incompleteCount})` : ''}
        </span>
      </motion.button>
    </div>
  );
}
