import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

const CLI_DIR =
  process.env.CLI_DIR ||
  '/Users/apple/idea-gate-ui-safe';

// Module-level guard — prevents double-runs
let isRunning = false;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idea = body?.idea?.trim();

    if (!idea) {
      return NextResponse.json({ error: 'Idea text is required' }, { status: 400 });
    }

    if (isRunning) {
      return NextResponse.json({ error: 'A lifecycle is already running. Please wait.' }, { status: 409 });
    }

    console.log('[RUN] Starting lifecycle:', idea);
    console.log('[RUN] CLI_DIR:', CLI_DIR);

    isRunning = true;

    const child = spawn('node', ['src/cli.js', 'v2', idea], {
      cwd: CLI_DIR,
      detached: true,
      stdio: 'ignore',
    });

    child.on('error', (err) => {
      console.error('[RUN] Spawn error:', err);
      isRunning = false;
    });

    child.on('exit', (code) => {
      console.log('[RUN] CLI exited with code:', code);
      isRunning = false;
    });

    child.unref();

    console.log('[RUN] CLI spawned, PID:', child.pid);

    return NextResponse.json({
      started: true,
      message: `Lifecycle started for: "${idea}"`,
      pid: child.pid,
    });
  } catch (err: any) {
    isRunning = false;
    console.error('[RUN] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to start' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ isRunning });
}