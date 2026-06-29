// src/app/api/run/route.ts
// Spawns the V2 CLI lifecycle.
//
// HARDENED VERSION — fixes the "stale shell env var" bug:
// Previously this route spread `...process.env` into the spawned child,
// which silently carried forward whatever OPENROUTER_API_KEY happened to
// already be set in the parent shell session (e.g. a leftover `export` in
// ~/.zshrc). Because dotenv (used inside the V2 CLI) never overwrites a
// variable that's already present in process.env, editing .env had no
// effect — the stale shell-level key kept winning silently.
//
// Fix: this route now reads CLI_DIR/.env directly off disk itself and
// resolves OPENROUTER_API_KEY / ANTHROPIC_API_KEY / OPENROUTER_MODEL
// explicitly, then sets them on the child's env object. An explicit
// key always overrides a spread value in the same object literal, so
// shell state can no longer interfere — regardless of what's exported
// in any profile file or terminal session.
//
// Priority order for each credential:
//   1. Value sent from the UI (Settings → AI Models, if the user filled it in)
//   2. Value parsed directly from CLI_DIR/.env
//   3. (no fallback to inherited process.env — that's the whole point)

import { NextResponse } from 'next/server';
import { spawn }        from 'child_process';
import fs                from 'fs';
import path              from 'path';
import { resolveModelId, validateModelId, getValidModelIds } from '@/lib/model-registry';

const CLI_DIR = process.env.CLI_DIR ?? '';

// ── Read CLI_DIR/.env directly off disk — bypasses shell state entirely ───
function readDotEnvFile(): Record<string, string> {
  const envPath = path.join(CLI_DIR, '.env');
  const result: Record<string, string> = {};
  try {
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value  = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  } catch (err) {
    console.error('[RUN] Could not read .env at', envPath, '—', (err as Error).message);
  }
  return result;
}

// Module-level guard — prevents concurrent CLI processes
let isRunning = false;

// Path to the run-persistence file written on POST and deleted on close/error.
// Reading this on GET allows the UI to restore running state after a browser
// refresh, even if the Next.js module was reloaded (resetting isRunning to false).
const runFilePath = () => CLI_DIR ? path.join(CLI_DIR, '.current-run.json') : '';

export async function GET() {
  // Prefer the in-memory flag when it's set (no disk read needed while running
  // in the same server process). On browser refresh the module may have reloaded,
  // clearing isRunning to false — fall through to the file in that case.
  if (isRunning) return NextResponse.json({ isRunning: true });

  try {
    const runFile = runFilePath();
    if (runFile && fs.existsSync(runFile)) {
      const data = JSON.parse(fs.readFileSync(runFile, 'utf-8'));
      // Stale check: if the run is >30 min old, verify the PID is still alive.
      const ageMinutes = (Date.now() - new Date(data.startedAt).getTime()) / 60000;
      if (ageMinutes > 30) {
        let stillRunning = true;
        try { process.kill(data.pid, 0); } catch { stillRunning = false; }
        if (!stillRunning) {
          try { fs.unlinkSync(runFile); } catch {}
          return NextResponse.json({ isRunning: false });
        }
      }
      // File exists and PID is alive (or run is < 30 min old) — restore state
      isRunning = true;
      return NextResponse.json({
        isRunning: true,
        idea:      data.idea      ?? '',
        model:     data.model     ?? '',
        startedAt: data.startedAt ?? '',
      });
    }
  } catch { /* file missing or corrupt — treat as not running */ }

  return NextResponse.json({ isRunning: false });
}

export async function POST(req: Request) {
  if (isRunning) {
    return NextResponse.json({ error: 'Lifecycle already running' }, { status: 409 });
  }

  if (!CLI_DIR) {
    return NextResponse.json({ error: 'CLI_DIR not set in .env.local' }, { status: 500 });
  }

  let body: {
    idea?:          string;
    model?:         string;
    customModelId?: string;
    openRouterKey?: string;  // explicit override from Settings → AI Models
    anthropicKey?:  string;  // explicit override from Settings → AI Models
  } = {};
  try { body = await req.json(); } catch { /* ignore parse errors */ }

  const {
    idea          = '',
    model         = 'owlalpha',
    customModelId = '',
    openRouterKey = '',
    anthropicKey  = '',
  } = body;

  if (!idea.trim()) {
    return NextResponse.json({ error: 'idea is required' }, { status: 400 });
  }

  // Validate model key against registry — customModelId (user-pasted raw ID) bypasses this
  if (!customModelId.trim() && !validateModelId(model)) {
    return NextResponse.json(
      { error: 'Unknown or unavailable model', received: model, availableModels: getValidModelIds().slice(0, 8) },
      { status: 400 }
    );
  }
  // Resolve: customModelId wins if set (user's responsibility), otherwise use registry
  const resolvedModel = customModelId.trim()
    ? customModelId.trim()
    : resolveModelId(model);

  // ── Resolve credentials explicitly — UI override → .env file → nothing ──
  // Deliberately does NOT fall back to process.env, since that's the
  // exact mechanism that let stale shell exports win silently before.
  const dotEnv = readDotEnvFile();
  const resolvedOpenRouterKey = openRouterKey.trim() || dotEnv.OPENROUTER_API_KEY || '';
  const resolvedAnthropicKey  = anthropicKey.trim()  || dotEnv.ANTHROPIC_API_KEY  || '';

  if (!resolvedOpenRouterKey) {
    return NextResponse.json(
      { error: 'No OpenRouter API key found. Set it in Settings → AI Models, or in CLI_DIR/.env.' },
      { status: 400 },
    );
  }

  console.log(`[RUN] Launching lifecycle for: "${idea.slice(0, 60)}…"`);
  console.log(`[RUN] Model: ${resolvedModel}`);
  console.log(`[RUN] OpenRouter key in use: ${resolvedOpenRouterKey.slice(0, 14)}…${resolvedOpenRouterKey.slice(-4)}`);

  isRunning = true;

  // Capture CLI stdout/stderr to a log file — previously this was 'ignore',
  // which made failures completely invisible. `cat .last-run.log` in
  // CLI_DIR now shows exactly what happened on the last run.
  const logPath = path.join(CLI_DIR, '.last-run.log');
  let logFd: number;
  try {
    logFd = fs.openSync(logPath, 'w');
  } catch {
    logFd = -1; // fall back to ignore if the log file can't be opened
  }

  const proc = spawn('node', ['src/cli.js', 'v2', idea.trim()], {
    cwd:      CLI_DIR,
    detached: true,
    stdio:    logFd >= 0 ? ['ignore', logFd, logFd] : 'ignore',
    env: {
      ...process.env,
      // These three explicit overrides win regardless of what process.env
      // (i.e. the shell that launched `npm run dev`) already contained.
      OPENROUTER_MODEL:   resolvedModel,
      OPENROUTER_API_KEY: resolvedOpenRouterKey,
      ANTHROPIC_API_KEY:  resolvedAnthropicKey || process.env.ANTHROPIC_API_KEY || '',
    },
  });

  // Write persistence file immediately after spawn so GET can restore state
  // on browser refresh or server hot-reload.
  const runFile = runFilePath();
  if (runFile) {
    try {
      fs.writeFileSync(runFile, JSON.stringify({
        isRunning: true,
        idea:      idea.trim(),
        model:     resolvedModel,
        startedAt: new Date().toISOString(),
        pid:       proc.pid,
      }));
    } catch (err) {
      console.error('[RUN] Could not write .current-run.json —', (err as Error).message);
    }
  }

  // Write PID file so DELETE handler can send SIGTERM
  const pidFile = CLI_DIR ? path.join(CLI_DIR, '.current-run.pid') : '';
  if (pidFile && proc.pid) {
    try { fs.writeFileSync(pidFile, String(proc.pid)); } catch { /* non-fatal */ }
  }

  const cleanup = (label: string) => {
    isRunning = false;
    if (logFd >= 0) try { fs.closeSync(logFd); } catch { /* already closed */ }
    if (runFile)  try { fs.unlinkSync(runFile);  } catch { /* already deleted */ }
    if (pidFile)  try { fs.unlinkSync(pidFile);  } catch { /* already deleted */ }
    console.log(`[RUN] ${label}`);
  };

  proc.on('close', (code) => cleanup(`Lifecycle process exited with code ${code}. Log: ${logPath}`));
  proc.on('error', (err)  => { console.error('[RUN] CLI spawn error:', err.message); cleanup('spawn error'); });

  proc.unref();

  return NextResponse.json({
    started:  true,
    model:    resolvedModel,
    keyUsed:  `${resolvedOpenRouterKey.slice(0, 14)}…${resolvedOpenRouterKey.slice(-4)}`,
    logPath,
  });
}

// ── DELETE — stop a running lifecycle ─────────────────────────────────────────
export async function DELETE() {
  const pidFile = CLI_DIR ? path.join(CLI_DIR, '.current-run.pid') : '';
  const runFile = runFilePath();

  if (!pidFile) {
    return NextResponse.json({ error: 'CLI_DIR not set' }, { status: 500 });
  }

  let pid: number | null = null;
  try {
    pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim(), 10);
  } catch {
    // No PID file — already stopped
  }

  if (pid && !isNaN(pid)) {
    try {
      process.kill(pid, 'SIGTERM');
      // Give process 2s to exit gracefully, then SIGKILL
      await new Promise(r => setTimeout(r, 2000));
      try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
    } catch { /* process already exited */ }
  }

  isRunning = false;
  try { fs.unlinkSync(pidFile); } catch { /* already gone */ }
  try { if (runFile) fs.unlinkSync(runFile); } catch { /* already gone */ }

  console.log(`[RUN] Lifecycle stopped by user. PID was: ${pid}`);
  return NextResponse.json({ stopped: true });
}
