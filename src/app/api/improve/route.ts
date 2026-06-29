// src/app/api/improve/route.ts
// GET  ?file=<filename>  → returns artifact content from filesystem
// POST { artifactName, intent, extent, scope, model, maxTokens, apiKey } → improves via OpenRouter
// Priority 1: maxTokens is now read from request body and passed to LLM max_tokens.
// Priority 1: defaultModel from GlobalStore is passed as `model` in the POST body by the Improve page.

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { resolveModelId, validateModelId, getValidModelIds, getModelById } from '@/lib/model-registry';

const BASE_PATH   = process.env.PROJECT_PATH  ?? '';
const OPENROUTER  = 'https://openrouter.ai/api/v1/chat/completions';
const OR_KEY      = process.env.OPENROUTER_API_KEY ?? '';

// ── Resolve artifact path ──────────────────────────────────────────────────────
function resolveArtifactPath(fileName: string): string | null {
  if (!BASE_PATH) return null;
  try {
    const projects = fs.readdirSync(BASE_PATH)
      .filter(n => !n.startsWith('.') && fs.statSync(path.join(BASE_PATH, n)).isDirectory())
      .sort((a, b) => {
        const ta = parseInt(a.split('-').pop() ?? '0', 10);
        const tb = parseInt(b.split('-').pop() ?? '0', 10);
        return tb - ta;
      });
    if (!projects.length) return null;
    const artifactPath = path.join(BASE_PATH, projects[0], 'artifacts', fileName);
    return fs.existsSync(artifactPath) ? artifactPath : null;
  } catch { return null; }
}

// ── Strip DeepSeek <think>…</think> blocks ────────────────────────────────────
function stripThinkBlocks(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// ── GET — fetch artifact content ──────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  if (!file) return NextResponse.json({ error: 'file param required' }, { status: 400 });

  const filePath = resolveArtifactPath(file);
  if (!filePath) return NextResponse.json({ error: 'File not found', content: '' }, { status: 404 });

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: 'Read error', content: '' }, { status: 500 });
  }
}

// ── POST — improve artifact ───────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      artifactName,
      intent,
      extent        = 'medium',
      scope         = 'stage',
      model         = 'owlalpha',   // short key or full model ID (resolved via registry)
      customModelId = '',          // raw OpenRouter model ID — overrides model key when set
      maxTokens     = 4000,
      apiKey        = '',           // from settings.openRouterApiKey (overrides env var)
    } = body as {
      artifactName: string;
      intent:       string;
      extent?:      'light' | 'medium' | 'strong';
      scope?:       'block' | 'stage' | 'project';
      model?:       string;
      maxTokens?:   number;
      apiKey?:      string;        // user-supplied key from Settings UI
      customModelId?: string;       // raw OpenRouter model string e.g. 'deepseek/deepseek-r1'
    };

    if (!artifactName || !intent) {
      return NextResponse.json({ error: 'artifactName and intent required' }, { status: 400 });
    }

    // Read current content
    const filePath = resolveArtifactPath(artifactName);
    if (!filePath) {
      return NextResponse.json({ error: `Artifact not found: ${artifactName}` }, { status: 404 });
    }
    const currentContent = fs.readFileSync(filePath, 'utf-8');

    // Map extent to instruction language
    const extentMap = {
      light:  'Make only minor, targeted improvements. Preserve structure and most wording.',
      medium: 'Rewrite relevant sections with stronger PM reasoning, frameworks, and specificity. Keep overall structure.',
      strong: 'Restructure and substantially rewrite to maximize PM depth, strategic clarity, and defensibility.',
    };
    const scopeMap = {
      block:   'Improve only the specific section or paragraph most relevant to the intent.',
      stage:   'Improve the full artifact for this lifecycle stage.',
      project: 'Improve considering the full product strategy and all lifecycle stages.',
    };

    // Build prompt
    const systemPrompt = `You are a senior Product Manager improving a PM lifecycle artifact.
Extent of improvement: ${extentMap[extent as keyof typeof extentMap] || extentMap.medium}
Scope: ${scopeMap[scope as keyof typeof scopeMap] || scopeMap.stage}
Return ONLY the complete improved artifact. No preamble, no explanation, no markdown wrapper.
Preserve all section headers and existing structure unless the extent requires restructuring.`;

    const userPrompt = `Improvement intent: ${intent}

Current artifact:
${currentContent}

Return the complete improved artifact.`;

    // Resolve auth key: Settings UI key takes priority over .env.local
    const authKey = (apiKey && apiKey.trim()) ? apiKey.trim() : OR_KEY;
    if (!authKey) {
      return NextResponse.json({
        error: 'No API key. Add your OpenRouter key in Settings → AI Models → API Keys, or set OPENROUTER_API_KEY in .env.local',
      }, { status: 500 });
    }

    // Validate model key against registry — customModelId (user-pasted raw ID) bypasses this
    if (!customModelId.trim() && !validateModelId(model)) {
      return NextResponse.json(
        { error: 'Unknown or unavailable model', received: model, availableModels: getValidModelIds().slice(0, 8) },
        { status: 400 },
      );
    }
    // Resolve: customModelId wins if set (user's responsibility), otherwise use registry
    const resolvedModelId = customModelId.trim()
      ? customModelId.trim()
      : resolveModelId(model);

    // ── LLM call — max_tokens from settings.tokenBudgetPerCall ──────────────
    const llmRes = await fetch(OPENROUTER, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${authKey}`,
        'HTTP-Referer':  'https://ideagate.site',
        'X-Title':       'IdeaGate PMOS',
      },
      body: JSON.stringify({
        model:      resolvedModelId,
        max_tokens: Math.max(500, Math.min(maxTokens, getModelById(resolvedModelId)?.isFree ? 8000 : 16000)),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text().catch(() => 'unknown');
      return NextResponse.json({ error: `LLM error: ${llmRes.status} ${errText}` }, { status: 502 });
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices?.[0]?.message?.content ?? '';
    const improved   = stripThinkBlocks(rawContent); // strips <think> blocks from any model

    if (!improved.trim()) {
      return NextResponse.json({ error: 'LLM returned empty content' }, { status: 502 });
    }

    // Write improved content back to filesystem
    fs.writeFileSync(filePath, improved, 'utf-8');

    // Return improvement metadata alongside content
    return NextResponse.json({
      success:      true,
      content:      improved,
      model:        resolvedModelId,
      tokensUsed:   llmData.usage?.total_tokens   ?? 0,
      inputTokens:  llmData.usage?.prompt_tokens  ?? 0,
      outputTokens: llmData.usage?.completion_tokens ?? 0,
      maxTokensUsed:maxTokens,
    });

  } catch (err) {
    console.error('[improve/route] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
