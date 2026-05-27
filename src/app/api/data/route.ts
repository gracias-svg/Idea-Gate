import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BASE_PATH =
  process.env.PROJECT_PATH ||
  '/Users/apple/idea-gate-ui-safe/workspace';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('file');

    const allEntries = fs.readdirSync(BASE_PATH);
    const projects = allEntries
      .filter((name) => {
        if (name.startsWith('.')) return false;
        try {
          return fs.statSync(path.join(BASE_PATH, name)).isDirectory();
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by timestamp suffix (newest project first)
        const timeA = parseInt(a.split('-').pop() || '0');
        const timeB = parseInt(b.split('-').pop() || '0');
        return timeB - timeA;
      });

    console.log('[API] BASE_PATH:', BASE_PATH);
    console.log('[API] Found projects:', projects);

    if (!projects.length) {
      console.warn('[API] No project directories found in BASE_PATH');
      return NextResponse.json({
        currentStage: 0,
        artifacts: [],
      });
    }

    const projectPath = path.join(BASE_PATH, projects[0]);
    console.log('[API] Using projectPath:', projectPath);

    // 🔹 FILE CONTENT FETCH
    if (fileName) {
      const filePath = path.join(projectPath, 'artifacts', fileName);

      if (!fs.existsSync(filePath)) {
        console.warn('[API] File not found:', filePath);
        return NextResponse.json({ content: 'File not found' });
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return NextResponse.json({ content });
    }

    // 🔹 STAGE + ARTIFACTS
    let currentStage = 0;

    const journeyPath = path.join(projectPath, 'journey.json');
    if (fs.existsSync(journeyPath)) {
      const journey = JSON.parse(fs.readFileSync(journeyPath, 'utf-8'));
      currentStage = journey.currentStage || 0;
    } else {
      console.warn('[API] journey.json not found at:', journeyPath);
    }

    const artifactsDir = path.join(projectPath, 'artifacts');
    let artifacts: string[] = [];

    if (fs.existsSync(artifactsDir)) {
      artifacts = fs.readdirSync(artifactsDir).filter(
        (name) => !name.startsWith('.')
      );
    } else {
      console.warn('[API] artifacts dir not found at:', artifactsDir);
    }

    console.log('[API] Returning artifacts:', artifacts);

    return NextResponse.json({
      currentStage,
      artifacts,
    });
  } catch (error) {
    console.error('[API] Critical error:', error);
    return NextResponse.json({
      currentStage: 0,
      artifacts: [],
      error: 'Internal server error',
    });
  }
}