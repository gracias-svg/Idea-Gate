'use client';

// src/lib/workspaceDocuments.ts
// Mission 27 — Workspace document store.
// localStorage-backed, BroadcastChannel-synced.
// Holds user-created documents (New Document, Upload, Template).
// Lifecycle artifacts are NOT stored here — they live in the backend workspace/.

import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkspaceDocument {
  id:         string;
  folderId:   string;    // 'align' | 'plan' | 'measure' | 'archive' etc.
  title:      string;
  content:    string;    // markdown
  template?:  string;    // template name if created from a template
  createdAt:  number;
  updatedAt:  number;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORE_KEY    = 'ig-workspace-docs';
const CHANNEL_NAME = 'ig-workspace-docs';

function readStore(): WorkspaceDocument[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORE_KEY) : null;
    return raw ? (JSON.parse(raw) as WorkspaceDocument[]) : [];
  } catch { return []; }
}

function writeStore(docs: WorkspaceDocument[]): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(docs)); } catch {}
}

function broadcast(msg: { type: string; id?: string }): void {
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage(msg);
    ch.close();
  } catch {}
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function listDocs(): WorkspaceDocument[] {
  return readStore();
}

export function listDocsForFolder(folderId: string): WorkspaceDocument[] {
  return readStore().filter(d => d.folderId === folderId);
}

export function getDoc(id: string): WorkspaceDocument | null {
  return readStore().find(d => d.id === id) ?? null;
}

export function createDoc(
  folderId: string,
  title:    string,
  content:  string,
  template?: string,
): WorkspaceDocument {
  const now = Date.now();
  const id  = `wdoc-${now}-${Math.random().toString(36).slice(2, 7)}`;
  const doc: WorkspaceDocument = {
    id, folderId, title: title || 'Untitled', content, template,
    createdAt: now, updatedAt: now,
  };
  const docs = readStore();
  docs.push(doc);
  writeStore(docs);
  broadcast({ type: 'created', id });
  return doc;
}

export function updateDoc(id: string, patch: Partial<Pick<WorkspaceDocument, 'title' | 'content'>>): WorkspaceDocument | null {
  const docs = readStore();
  const idx  = docs.findIndex(d => d.id === id);
  if (idx === -1) return null;
  const updated = { ...docs[idx], ...patch, updatedAt: Date.now() };
  docs[idx] = updated;
  writeStore(docs);
  broadcast({ type: 'updated', id });
  return updated;
}

export function deleteDoc(id: string): void {
  writeStore(readStore().filter(d => d.id !== id));
  broadcast({ type: 'deleted', id });
}

// ── React hook ────────────────────────────────────────────────────────────────

export function useWorkspaceDocs(): WorkspaceDocument[] {
  const [docs, setDocs] = useState<WorkspaceDocument[]>([]);

  useEffect(() => {
    setDocs(readStore());
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.onmessage = () => setDocs(readStore());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) setDocs(readStore());
    };
    window.addEventListener('storage', onStorage);
    return () => { ch.close(); window.removeEventListener('storage', onStorage); };
  }, []);

  return docs;
}
