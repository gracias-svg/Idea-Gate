// src/app/api/data/route.ts
// Returns artifacts and project state from the workspace filesystem.
// FIX: artifacts are sorted NUMERICALLY (0,1,2,...,14) not alphabetically
// (alphabetic sorts as 0,1,10,11,12,2,3... which is wrong).

import { NextResponse }                    from 'next/server';
import fs                                  from 'fs';
import path                                from 'path';

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
        // Sort by timestamp suffix (last numeric segment) — descending (newest first)
        const ta = parseInt(a.split('-').pop() ?? '0', 10);
        const tb = parseInt(b.split('-').pop() ?? '0', 10);
        return tb - ta;
      });
    return dirs.length ? dirs[0] : null;
  } catch { return null; }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileParam = searchParams.get('file');

  // ── GET ?file=name — return single artifact content ───────────────────
  if (fileParam) {
    const project = getLatestProject();
    if (!project) {
      return NextResponse.json({ error: 'No project found', content: '' }, { status: 404 });
    }
    const filePath = path.join(BASE_PATH, project, 'artifacts', fileParam);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Artifact not found: ${fileParam}`, content: '' }, { status: 404 });
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return NextResponse.json({ content });
    } catch {
      return NextResponse.json({ error: 'Read error', content: '' }, { status: 500 });
    }
  }

  // ── GET — return project state ────────────────────────────────────────
  console.log('[API] BASE_PATH:', BASE_PATH);

  if (!BASE_PATH) {
    return NextResponse.json(
      { error: 'PROJECT_PATH not set', currentStage: 0, artifacts: [], isRunning: false },
      { status: 500 }
    );
  }

  const projects = (() => {
    try {
      return fs.readdirSync(BASE_PATH)
        .filter(n => !n.startsWith('.') && fs.statSync(path.join(BASE_PATH, n)).isDirectory())
        .sort((a, b) => {
          const ta = parseInt(a.split('-').pop() ?? '0', 10);
          const tb = parseInt(b.split('-').pop() ?? '0', 10);
          return tb - ta; // descending — newest first
        });
    } catch { return []; }
  })();

  console.log('[API] Found projects:', projects);

  if (!projects.length) {
    return NextResponse.json({ currentStage: 0, artifacts: [], isRunning: false });
  }

  const projectPath = path.join(BASE_PATH, projects[0]);
  console.log('[API] Using projectPath:', projectPath);

  // Read journey.json for lifecycle state
  let currentStage = 0;
  try {
    const journey = JSON.parse(fs.readFileSync(path.join(projectPath, 'journey.json'), 'utf-8'));
    currentStage = parseInt(journey.currentStage ?? '0', 10) || 0;
  } catch { /* journey.json missing or malformed — default to 0 */ }

  // Read artifacts directory
  // ╔══════════════════════════════════════════════════════════╗
  // ║  NUMERIC SORT — critical for correct display order       ║
  // ║  Alphabetic sort: 0, 1, 10, 11, 12, 2, 3…  ← WRONG     ║
  // ║  Numeric sort:    0, 1, 2, 3, 4, …, 12, 13, 14  ← RIGHT ║
  // ╚══════════════════════════════════════════════════════════╝
  const artifactsDir = path.join(projectPath, 'artifacts');
  let artifacts: string[] = [];
  try {
    artifacts = fs.readdirSync(artifactsDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('.'))
      .sort((a, b) => {
        // Parse the leading integer: "14-prototype-prompt.md" → 14
        const na = parseInt(a.split('-')[0], 10) || 0;
        const nb = parseInt(b.split('-')[0], 10) || 0;
        return na - nb; // ascending — stage 0 first, stage 14 last
      });
  } catch { /* artifacts directory missing */ }

  console.log('[API] Returning artifacts:', artifacts);

  return NextResponse.json({ currentStage, artifacts, projectPath });
}
