// src/app/api/artifact/route.ts
// Mission 3 — PUT handler for direct artifact saves (B1).
//
// Path resolution intentionally duplicated from /api/data — not imported —
// to avoid coupling the two routes. Both use the same logic:
//   BASE_PATH (PROJECT_PATH env) → latest project dir → artifacts/<name>
//
// Only PUT is exposed. GET artifact content still goes through /api/data?file=.
// Only artifact files that already exist on disk can be saved (no new-file creation).

import { NextResponse } from 'next/server';
import fs               from 'fs';
import path             from 'path';

const BASE_PATH = process.env.PROJECT_PATH ?? '';

function getLatestProject(): string | null {
  if (!BASE_PATH) return null;
  try {
    const dirs = fs.readdirSync(BASE_PATH)
      .filter(n =>
        !n.startsWith('.') &&
        fs.statSync(path.join(BASE_PATH, n)).isDirectory()
      )
      .sort((a, b) => {
        const ta = parseInt(a.split('-').pop() ?? '0', 10);
        const tb = parseInt(b.split('-').pop() ?? '0', 10);
        return tb - ta; // descending — newest project first
      });
    return dirs.length ? dirs[0] : null;
  } catch { return null; }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json() as { artifactName?: unknown; content?: unknown };
    const { artifactName, content } = body;

    if (typeof artifactName !== 'string' || !artifactName.trim()) {
      return NextResponse.json({ error: 'Missing or invalid artifactName' }, { status: 400 });
    }
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    // Reject path traversal — artifact names must be plain filenames, not paths
    if (artifactName.includes('/') || artifactName.includes('..')) {
      return NextResponse.json({ error: 'Invalid artifactName' }, { status: 400 });
    }

    const project = getLatestProject();
    if (!project) {
      return NextResponse.json({ error: 'No project found' }, { status: 404 });
    }

    const filePath = path.join(BASE_PATH, project, 'artifacts', artifactName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Artifact not found: ${artifactName}` }, { status: 404 });
    }

    fs.writeFileSync(filePath, content, 'utf8');
    return NextResponse.json({ ok: true });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Save failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
