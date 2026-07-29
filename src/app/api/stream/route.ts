// src/app/api/stream/route.ts
// S1 — Server-Sent Events endpoint for real-time coordinator progress.
//
// Architecture note (Mission 8):
// The coordinator is spawned detached with stdio → file, not piped. Stdout
// is not accessible from the API route at runtime. This endpoint tails
// CLI_DIR/.last-run.log (opened fresh on each run with 'w') by polling
// for new bytes every 500ms and parsing coordinator log lines.
//
// The approach:
//   1. Track byte offset in the log file
//   2. Poll every 500ms for bytes beyond the current offset
//   3. Parse new lines for known coordinator log patterns
//   4. Emit SSE events via ReadableStream
//   5. Close on run_complete, run_stopped, or client disconnect
//   6. Send keepalive comment every 15s to prevent proxy timeouts
//
// Event shape (all events are JSON in the `data:` field):
//   { type: 'stage_start',  stage: N, name: 'Stage Name' }
//   { type: 'agent_active', agent: 'AgentName' }
//   { type: 'stage_retry',  stage: N }
//   { type: 'agent_error',  message: '...' }
//   { type: 'run_complete' }
//   { type: 'run_stopped' }
//   { type: 'error',        message: '...' }
//   { type: 'connected' }   ← sent immediately on open

import { NextRequest } from 'next/server';
import fs               from 'fs';
import path             from 'path';

// Force dynamic — never statically cached by Next.js
export const dynamic = 'force-dynamic';

const CLI_DIR = process.env.CLI_DIR ?? '';

// S3 — Merge fields into .current-run.json for page-refresh recovery.
// Additive only: existing fields (isRunning, idea, model, startedAt, pid) are
// never removed or overwritten — only the new S3 fields (currentStage,
// currentAgent) are written. Silently no-ops if the file is missing or
// CLI_DIR is unset — SSE is best-effort and polling remains the authority.
function mergeRunState(fields: Record<string, unknown>): void {
  if (!CLI_DIR) return;
  const runFile = path.join(CLI_DIR, '.current-run.json');
  try {
    let existing: Record<string, unknown> = {};
    if (fs.existsSync(runFile)) {
      try { existing = JSON.parse(fs.readFileSync(runFile, 'utf-8')); } catch { /* corrupt — start fresh */ }
    }
    fs.writeFileSync(runFile, JSON.stringify({ ...existing, ...fields }));
  } catch { /* non-fatal — polling remains the authority */ }
}

// Strip ANSI CSI color sequences (e.g. \x1b[36m, \x1b[39m, \x1b[32m)
const ANSI_RE = /\x1b\[[0-9;]*m/g;

function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, '');
}

// Known coordinator log patterns (from actual .last-run.log output)
// All patterns matched against the ANSI-stripped, trimmed line.
function parseLine(line: string): Record<string, unknown> | null {
  const clean = stripAnsi(line).trim();
  if (!clean) return null;

  // Stage start:   📍 Stage 0: Idea Intake
  const stageMatch = clean.match(/^📍 Stage (\d+): (.+)/);
  if (stageMatch) {
    return { type: 'stage_start', stage: parseInt(stageMatch[1], 10), name: stageMatch[2].trim() };
  }

  // Agent assigned: → ProductStrategyAgent
  // The arrow is U+2192 (→), not ASCII. The coordinator emits it via console.log(`→ ${agentName}`)
  const agentMatch = clean.match(/^→ (\w+)/);
  if (agentMatch) {
    return { type: 'agent_active', agent: agentMatch[1] };
  }

  // Stage retry:   🔁 Re-running stage 7 (attempt 1/2)
  const retryMatch = clean.match(/^🔁 Re-running stage (\d+)/);
  if (retryMatch) {
    return { type: 'stage_retry', stage: parseInt(retryMatch[1], 10) };
  }

  // Run complete:  ✅ Lifecycle complete
  if (clean.includes('✅ Lifecycle complete')) {
    return { type: 'run_complete' };
  }

  // Lifecycle stopped: 🛑 Lifecycle stopped (KILL)
  if (clean.includes('🛑 Lifecycle stopped')) {
    return { type: 'run_stopped' };
  }

  // Hard error: ❌ Undefined stage: ...
  if (clean.startsWith('❌')) {
    return { type: 'error', message: clean.slice(1).trim() };
  }

  // Agent error: [AGENT] ProductStrategyAgent attempt 1 failed: ...
  const agentErrMatch = clean.match(/^\[AGENT\] (.+)/);
  if (agentErrMatch) {
    return { type: 'agent_error', message: agentErrMatch[1] };
  }

  return null;
}

export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder();

  // Validate CLI_DIR is configured — cannot tail without it
  if (!CLI_DIR) {
    const errStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"error","message":"CLI_DIR not set in .env.local"}\n\n'));
        controller.close();
      }
    });
    return new Response(errStream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      }
    });
  }

  const logPath = path.join(CLI_DIR, '.last-run.log');

  // Shared state between the ReadableStream callbacks.
  // Note: these refs are captured in the start/cancel closures —
  // they are NOT shared across concurrent SSE connections (each GET
  // call creates new locals for its own stream).
  let closed         = false;
  let offset         = 0;
  let pollId:      ReturnType<typeof setInterval> | null = null;
  let keepaliveId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Helper — safe enqueue that swallows errors if the stream closed
      const enqueue = (chunk: string) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(chunk)); } catch { /* stream ended */ }
      };

      const closeStream = () => {
        if (closed) return;
        closed = true;
        if (pollId)      clearInterval(pollId);
        if (keepaliveId) clearInterval(keepaliveId);
        try { controller.close(); } catch { /* already closed */ }
      };

      // Immediate connected confirmation — client can use this to know
      // the stream is open and healthy before the first stage event
      enqueue('data: {"type":"connected"}\n\n');

      // Keepalive comment every 15s — prevents proxy/browser from
      // timing out a connection that has no stage events for a while
      keepaliveId = setInterval(() => enqueue(': keepalive\n\n'), 15_000);

      // File-tail poll: read new bytes from the log file every 500ms
      const poll = () => {
        if (closed) return;

        try {
          if (!fs.existsSync(logPath)) return; // run hasn't started yet

          const stat = fs.statSync(logPath);
          const fileSize = stat.size;

          // File was truncated → new run started; reset to beginning
          if (fileSize < offset) { offset = 0; }

          // Nothing new since last poll
          if (fileSize === offset) return;

          const bytesToRead = fileSize - offset;
          const buf = Buffer.alloc(bytesToRead);
          const fd  = fs.openSync(logPath, 'r');
          const bytesRead = fs.readSync(fd, buf, 0, bytesToRead, offset);
          fs.closeSync(fd);
          offset += bytesRead;

          // Split into lines and parse each one
          const text  = buf.slice(0, bytesRead).toString('utf-8');
          const lines = text.split('\n');

          for (const line of lines) {
            const event = parseLine(line);
            if (!event) continue;

            enqueue(`data: ${JSON.stringify(event)}\n\n`);

            // S3 — persist stage/agent into .current-run.json so that a
            // browser refresh can restore the real-time display position
            // without waiting for the next polling cycle.
            if (event.type === 'stage_start' && typeof event.stage === 'number') {
              mergeRunState({ currentStage: event.stage, currentAgent: null });
            } else if (event.type === 'agent_active' && event.agent) {
              mergeRunState({ currentAgent: event.agent });
            }

            // Terminal events close the stream
            if (event.type === 'run_complete' || event.type === 'run_stopped') {
              closeStream();
              return; // stop processing further lines
            }
          }
        } catch (err) {
          // Log file disappeared or other transient I/O error — not fatal,
          // just skip this poll cycle. If the run ended and the file was
          // cleaned up, the next poll will keep finding nothing until
          // the client disconnects.
          console.error('[STREAM] poll error:', (err as Error).message);
        }
      };

      // Start polling immediately and then every 500ms
      poll();
      pollId = setInterval(poll, 500);
    },

    cancel() {
      // Client disconnected (navigated away, tab closed, etc.)
      closed = true;
      if (pollId)      clearInterval(pollId);
      if (keepaliveId) clearInterval(keepaliveId);
    }
  });

  return new Response(stream, {
    status:  200,
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      // Prevent Next.js from buffering the stream
      'X-Accel-Buffering': 'no',
    }
  });
}
