// src/app/api/improve/route.ts
// Multi-model improvement API. Supports 8 OpenRouter providers.
// GET  ?file=name        → read artifact content
// POST action:preview   → LLM call, returns improved + reasoning + tokens + cost
// POST action:accept    → write to disk

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const PROJECT_PATH   = process.env.PROJECT_PATH!;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!;

// ── Full model catalog ────────────────────────────────────────────────────────
const MODELS: Record<string, { id: string; inputCost: number; outputCost: number }> = {
  'haiku':      { id: 'anthropic/claude-haiku-4-5',            inputCost: 0.25,   outputCost: 1.25  },
  'sonnet':     { id: 'anthropic/claude-sonnet-4-5',           inputCost: 3.00,   outputCost: 15.00 },
  'deepseek':   { id: 'deepseek/deepseek-r1',                  inputCost: 0.55,   outputCost: 2.19  },
  'llama':      { id: 'meta-llama/llama-3.3-70b-instruct',    inputCost: 0.59,   outputCost: 0.79  },
  'qwen':       { id: 'qwen/qwen-2.5-72b-instruct',           inputCost: 0.13,   outputCost: 0.40  },
  'mistral':    { id: 'mistralai/mistral-large-2411',          inputCost: 2.00,   outputCost: 6.00  },
  'gpt4o':      { id: 'openai/gpt-4o',                        inputCost: 2.50,   outputCost: 10.00 },
  'gemini':     { id: 'google/gemini-flash-1.5',              inputCost: 0.075,  outputCost: 0.30  },
};

const DEFAULT_MODEL = 'haiku';

function getModelConfig(modelKey: string) {
  return MODELS[modelKey] ?? MODELS[DEFAULT_MODEL];
}

function estimateCost(modelKey: string, inputT: number, outputT: number): number {
  const m = getModelConfig(modelKey);
  return (inputT / 1_000_000) * m.inputCost + (outputT / 1_000_000) * m.outputCost;
}

// ── Workspace ─────────────────────────────────────────────────────────────────
function getLatestProjectDir(): string {
  if (!PROJECT_PATH) throw new Error('PROJECT_PATH not set in .env.local');
  const dirs = readdirSync(PROJECT_PATH)
    .filter(n => !n.startsWith('.') && statSync(join(PROJECT_PATH, n)).isDirectory())
    .sort((a, b) => parseInt(b.split('-').pop()??'0',10) - parseInt(a.split('-').pop()??'0',10));
  if (!dirs.length) throw new Error('No project directories found');
  return join(PROJECT_PATH, dirs[0]);
}

// ── Prompt ────────────────────────────────────────────────────────────────────
function buildPrompt(intent: string, extent: string, scope: string, content: string, refDocs?: string[] | null): string {
  const extentGuide: Record<string,string> = {
    light:  'Minor edits — improve clarity and wording only. Preserve all structure.',
    medium: 'Rewrite weak sections. Add depth. Improve frameworks. Keep overall structure.',
    strong: 'Restructure and deepen substantially. Apply PM frameworks rigorously.',
  };
  const scopeGuide: Record<string,string> = {
    block:   'Focus only on the most relevant section.',
    stage:   'Improve the full artifact for this lifecycle stage.',
    project: 'Improve with cross-artifact PM consistency in mind.',
  };
  const refSection = refDocs?.length
    ? `\nREFERENCE DOCUMENTS:\n${refDocs.map((d,i)=>`--- Ref ${i+1} ---\n${d}`).join('\n')}\n`
    : '';

  return `You are a senior PM improving a product lifecycle artifact.

INTENT: ${intent}
EXTENT (${extent}): ${extentGuide[extent]??extentGuide.medium}
SCOPE (${scope}): ${scopeGuide[scope]??scopeGuide.stage}
${refSection}
CURRENT ARTIFACT:
---
${content}
---

Return ONLY raw JSON (no markdown fences, no preamble):
{
  "improved": "complete improved artifact text in well-structured Markdown",
  "reasoning": "2-4 sentences: what PM judgment was applied, what framework, what was strengthened/removed and why",
  "impactWarnings": ["0-3 downstream lifecycle stages this change may affect and why"]
}`;
}

// ── GET: read artifact ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const file = new URL(req.url).searchParams.get('file');
    if (!file) return NextResponse.json({ error: 'file param required' }, { status: 400 });
    const dir     = getLatestProjectDir();
    const content = readFileSync(join(dir, 'artifacts', file), 'utf-8');
    return NextResponse.json({ content, fileName: file });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── POST: preview or accept ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Accept: write to disk
    if (action === 'accept') {
      const { artifactName, content } = body;
      if (!artifactName || !content) return NextResponse.json({ error: 'artifactName and content required' }, { status: 400 });
      const dir = getLatestProjectDir();
      writeFileSync(join(dir, 'artifacts', artifactName), content, 'utf-8');
      console.log(`[improve/accept] saved ${artifactName}`);
      return NextResponse.json({ success: true, artifactName });
    }

    // Preview: call LLM
    const { artifactName, intent, extent='medium', scope='stage', modelKey='haiku', extractedDocuments=null } = body;
    if (!artifactName)    return NextResponse.json({ error: 'artifactName required' }, { status: 400 });
    if (!intent?.trim()) return NextResponse.json({ error: 'intent required' }, { status: 400 });
    if (!OPENROUTER_KEY) return NextResponse.json({ error: 'OPENROUTER_API_KEY not in .env.local' }, { status: 500 });

    const dir     = getLatestProjectDir();
    const content = readFileSync(join(dir, 'artifacts', artifactName), 'utf-8');
    const model   = getModelConfig(modelKey);
    const prompt  = buildPrompt(intent, extent, scope, content, extractedDocuments);

    console.log(`[improve] ${artifactName} | ${extent}/${scope} | ${modelKey} (${model.id})`);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  'https://ideagate.site',
        'X-Title':       'IdeaGate',
      },
      body: JSON.stringify({
        model:      model.id,
        max_tokens: 4000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[improve] OpenRouter error:', err.slice(0, 300));
      return NextResponse.json({ error: `OpenRouter ${res.status}: ${err.slice(0, 200)}` }, { status: 502 });
    }

    const data        = await res.json();
    let   raw         = data.choices?.[0]?.message?.content ?? '';
    const usage       = data.usage ?? {};
    const inputTokens = usage.prompt_tokens     ?? 0;
    const outTokens   = usage.completion_tokens ?? 0;
    const totalTokens = usage.total_tokens      ?? (inputTokens + outTokens);
    const cost        = estimateCost(modelKey, inputTokens, outTokens);

    // Strip DeepSeek / o1-style thinking blocks before parsing
    raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Strip markdown fences
    raw = raw.replace(/^```json\s*/m,'').replace(/^```\s*/m,'').replace(/\s*```\s*$/m,'').trim();

    let parsed: { improved: string; reasoning: string; impactWarnings: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { improved: raw, reasoning: 'Artifact improved per intent and extent.', impactWarnings: [] };
    }

    return NextResponse.json({
      success: true, artifactName,
      original: content,
      improved: parsed.improved ?? raw,
      reasoning: parsed.reasoning ?? '',
      impactWarnings: parsed.impactWarnings ?? [],
      modelKey,
      modelId: model.id,
      tokens: { input: inputTokens, output: outTokens, total: totalTokens },
      cost: parseFloat(cost.toFixed(6)),
      refDocs: Array.isArray(extractedDocuments) ? extractedDocuments.length : 0,
    });

  } catch (e: any) {
    console.error('[improve] error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
