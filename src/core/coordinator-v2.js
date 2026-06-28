import fs from 'fs';
import path from 'path';
import { LifecycleEngine } from './lifecycle-engine.js';
import { JourneyEngine } from './journey-engine.js';

export class CoordinatorV2 {
  constructor({ agents, llm, projectDir }) {
    this.agents = agents;
    this.llm = llm;
    this.projectDir = projectDir;

    this.journey = new JourneyEngine(projectDir);
    this.lifecycle = new LifecycleEngine(this.journey);

    this.artifactDir = path.join(projectDir, 'artifacts');
    fs.mkdirSync(this.artifactDir, { recursive: true });
  }

  async run(initialInput) {
    let currentStage = this.lifecycle.getCurrentStage();

    // ── BUG FIX: per-stage iteration counter ─────────────────────────────
    // Without this, decision:"iterate" (which the merge fallback sets when
    // the LLM call fails) causes an infinite loop on the same stage.
    // The stage artifacts directory fills up with repeated "fallback merge"
    // overwrites of the same file, and the CLI never advances.
    // With this guard: after 2 iterate attempts on any single stage, the
    // coordinator force-advances to keep the lifecycle moving.
    const stageIterations = {};
    const MAX_ITERATIONS_PER_STAGE = 2;

    while (currentStage) {
      const stageDef = this.lifecycle.getStageDefinition(currentStage);

      if (!stageDef) {
        console.log(`❌ Undefined stage: ${currentStage}`);
        break;
      }

      console.log(`\n📍 Stage ${currentStage}: ${stageDef.name}`);

      const context = this.buildContext(initialInput);

      // ── TIMING FIX: record start time BEFORE agents execute ──────────────
      // Previously startedAt was set inside journeyEngine.updateStage() which
      // always ran AFTER completion, making durationMs permanently 0.
      const stageStartedAt = new Date().toISOString();

      const agentData = await this.runStageAgents(stageDef, context);

      const merged = await this.mergeOutputs(
        currentStage,
        stageDef,
        agentData,
        context
      );

      // ── LIGHTWEIGHT QUALITY GATE ──────────────────────────────────────────
      // If the merged output is very short AND marked low confidence, the stage
      // likely produced degraded output (agent 429, merge 429, or empty fallback).
      // In this case, force one iterate before advancing — UNLESS we have already
      // iterated on this stage (hasNotIteratedYet guard prevents double-iterate).
      // MAX_ITERATIONS_PER_STAGE is the hard ceiling so this can never loop.
      const outputWords = (merged.output ?? '').trim().split(/\s+/).filter(Boolean).length;
      const isLowQuality = outputWords < 150 && merged.confidence === 'low';
      const hasNotIteratedYet = (stageIterations[currentStage] ?? 0) === 0;

      if (isLowQuality && hasNotIteratedYet) {
        console.log(`[QUALITY] Stage ${currentStage} output has ${outputWords} words and low confidence — marking iterate`);
        merged.decision = 'iterate';
        merged.reasoning = (merged.reasoning || '') +
          ` [Quality gate: ${outputWords} words below 150-word minimum — retrying stage]`;
      }
      // ── END QUALITY GATE ──────────────────────────────────────────────────

      const filePath = this.persistArtifacts(currentStage, stageDef, merged, agentData);

      merged.outputFile = filePath;
      merged.artifacts = stageDef.artifacts;

      this.logDecision(currentStage, stageDef, agentData, merged);

      merged.startedAt = stageStartedAt;  // carry the pre-execution timestamp
      this.journey.updateStage(currentStage, merged);

      const decision = merged.decision || "go";

      if (decision === "kill") {
        console.log("🛑 Lifecycle stopped (KILL)");
        break;
      }

      if (decision === "iterate") {
        stageIterations[currentStage] = (stageIterations[currentStage] || 0) + 1;
        if (stageIterations[currentStage] >= MAX_ITERATIONS_PER_STAGE) {
          console.log(`⚠️ Stage ${currentStage} hit max iterations (${MAX_ITERATIONS_PER_STAGE}) — force-advancing`);
          stageIterations[currentStage] = 0;
          currentStage = this.lifecycle.nextStage();
        } else {
          console.log(`🔁 Re-running stage ${currentStage} (attempt ${stageIterations[currentStage]}/${MAX_ITERATIONS_PER_STAGE})`);
        }
        continue;
      }

      if (decision === "reshape") {
        console.log("↩️ Moving back one stage");
        currentStage = this.lifecycle.getPreviousStage(currentStage);
        continue;
      }

      if (!this.checkExitCriteria(stageDef, merged)) {
        console.log("⚠️ Exit criteria weak (continuing)");
      }

      // Reset iteration counter on clean advance
      stageIterations[currentStage] = 0;
      currentStage = this.lifecycle.nextStage();
    }

    return this.journey.getContext();
  }

  buildContext(initialInput) {
    return {
      idea: initialInput,
      journey: this.journey.getContext(),
      previousStages: this.journey.state.stages,
      decisions: this.journey.state.decisions
    };
  }

  buildPriorContext(context) {
    const completed = Object.entries(context.journey?.stages || {})
      .filter(([, stage]) => stage.summary && stage.summary !== 'parse recovered')
      .slice(-3);
    if (completed.length === 0) return '';
    return completed
      .map(([id, stage]) => `Stage ${id}: ${String(stage.summary).slice(0, 100)}`)
      .join('\n');
  }

  async runStageAgents(stageDef, context) {
    const outputs = {};
    const executionLog = {};

    for (const agentName of stageDef.agents || []) {
      const agent = this.agents[agentName];

      if (!agent) {
        executionLog[agentName] = {
          success: false,
          reason: "agent not found"
        };
        continue;
      }

      console.log(`→ ${agentName}`);

      const prompt = agent.buildPrompt({
        ...context,
        stageId: stageDef.name,
        frameworks: stageDef.frameworks,
        requiredArtifacts: stageDef.artifacts,
        jobDone: stageDef.jobDone
      });

      // Agent-level model fallback — mirrors the merge fallback pattern.
      // If the user-selected model returns 404/429, retry with owl-alpha
      // before falling through to empty output. Uses process.env + try/finally
      // (Option A) so llm.js is not modified.
      const AGENT_FALLBACKS = [
        process.env.OPENROUTER_MODEL,  // user-selected (primary)
        'openrouter/owl-alpha',        // fallback
      ].filter(Boolean);
      const uniqueAgentModels = [...new Set(AGENT_FALLBACKS)];

      let parsed = { summary: "failed", output: "", confidence: "low" };
      let success = false;

      for (let attempt = 0; attempt < uniqueAgentModels.length; attempt++) {
        const agentModel = uniqueAgentModels[attempt];
        const originalModel = process.env.OPENROUTER_MODEL;
        try {
          process.env.OPENROUTER_MODEL = agentModel;
          if (attempt > 0) {
            console.log(`[AGENT] Fallback to ${agentModel} for ${agentName}`);
            await new Promise(r => setTimeout(r, 2000));
          }
          const response = await this.llm.generate({
            prompt,
            taskType: stageDef.taskType || "heavy"
          });
          const candidate = this.safeParse(response);
          const safeOut = typeof candidate.output === 'string'
            ? candidate.output
            : JSON.stringify(candidate.output ?? '');
          if (safeOut.trim().length > 30) {
            parsed = candidate;
            success = true;
            if (attempt > 0) {
              console.log(`[AGENT] ✅ ${agentName} recovered with ${agentModel}`);
            }
            break;
          }
        } catch (err) {
          console.log(`[AGENT] ${agentName} attempt ${attempt + 1} failed: ${err.message?.slice(0, 60)}`);
        } finally {
          process.env.OPENROUTER_MODEL = originalModel; // always restore
        }
      }

      outputs[agentName] = parsed;

      executionLog[agentName] = {
        success,
        confidence: parsed?.confidence || "unknown"
      };
    }

    return { outputs, executionLog };
  }

  async mergeOutputs(stage, stageDef, agentData, context) {
    const buildPrompt = () => {
      if (stage === "14") {
        return `
You are a Senior Product Manager + Architect.

Generate ONE high-quality prototype prompt using ALL lifecycle artifacts.

Use:
- Discovery
- Problem
- Solution
- MVP
- Validation
- PRD
- UX
- Architecture
- Backlog

Also include:
- Desirability
- Feasibility
- Viability

Journey:
${JSON.stringify(context.journey.stages).substring(0, 12000)}

Return STRICT JSON:
{
  "summary": "final prototype prompt",
  "output": "<FULL BUILD-READY PROMPT>",
  "confidence": "high",
  "decision": "go",
  "reasoning": "based on lifecycle",
  "conflicts": ""
}
`;
      }

      let agentJson = JSON.stringify(agentData.outputs, null, 2);

      if (agentJson.length > 10000) {
        agentJson = agentJson.substring(0, 10000) + "\n...[truncated]";
      }

      // If some agents returned empty output, reinforce the idea in the agent block
      const agentJsonWithContext = agentJson.includes('"output": ""')
        ? agentJson + `\n\nNOTE: Some agents failed to produce output. Generate ${stageDef.name} content specifically for: "${context.idea}".`
        : agentJson;

      const priorContext = this.buildPriorContext(context);

      return `
You are a Senior Product Manager.

PRODUCT IDEA BEING EVALUATED:
"${context.idea || 'the product idea'}"

You are generating the ${stageDef.name} document FOR THIS SPECIFIC IDEA ONLY.
Do not generate documents for any other product, company, or idea.
Do not use generic placeholders like [Product Idea] or [To Be Defined].
Every section of your output must specifically address this idea.
${priorContext ? `\nPRIOR STAGE CONTEXT (use this to maintain consistency):\n${priorContext}\n` : ''}
Stage: ${stageDef.name}

Frameworks:
${stageDef.frameworks.join(", ")}

Artifacts:
${stageDef.artifacts.join(", ")}

Job Done:
${stageDef.jobDone}

Agent Outputs:
${agentJsonWithContext}

Important: Do NOT include attribution lines, footers, sign-offs, or phrases like
"Produced by PM Office" or "Generated by [name]" in the output field.
The system handles attribution automatically.

Output quality requirements:
- Open with a heading that names the stage and the product idea
- Structure content using the frameworks listed above as section headers
- Be specific and evidence-based — reference earlier stage context where relevant
- Write at the level of a Senior Product Manager at a top tech company
- Do NOT include meta-commentary about the generation process
- Minimum output length: 400 words for standard stages, 200 words for short stages

Return STRICT JSON:
{
  "summary": "...",
  "output": "...",
  "confidence": "high/medium/low",
  "decision": "go/iterate/kill/reshape",
  "reasoning": "...",
  "conflicts": "..."
}
`;
    };

    const prompt = buildPrompt();

    // ── Model fallback list for merge retries ──────────────────────────────
    // On 429 or too-short output, try each model in sequence before falling
    // back to the Mission 7 agent-output extraction path.
    // Primary is whatever the user selected (OPENROUTER_MODEL env var).
    // Fallbacks are free-tier models from different providers so a rate-limit
    // on one provider doesn't block the others.
    //
    // llm.js reads process.env.OPENROUTER_MODEL directly and has no parameter
    // override (protected file — cannot add one). Option A: temporarily set
    // the env var before each call, restore with try/finally to guarantee
    // the original value is always put back regardless of error or success.
    const MERGE_FALLBACK_MODELS = [
      process.env.OPENROUTER_MODEL,              // primary (user-selected)
      'openrouter/owl-alpha',                    // fallback 1: IdeaGate default
      'nvidia/nemotron-3-super-120b-a12b:free',  // fallback 2: different provider
    ].filter(Boolean);
    const uniqueModels = [...new Set(MERGE_FALLBACK_MODELS)];

    for (let attempt = 0; attempt < uniqueModels.length; attempt++) {
      const modelForThisAttempt = uniqueModels[attempt];

      if (attempt > 0) {
        // Progressive delay before switching providers: 3s, 6s, ...
        // Gives the rate limiter headroom and signals a real retry, not a spam.
        const delayMs = attempt * 3000;
        console.log(`[MERGE] Switching to fallback model: ${modelForThisAttempt} (waiting ${delayMs}ms)`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      // Temporarily override the model env var for this single call.
      // try/finally guarantees restore on success, error, or short-output path.
      const originalModel = process.env.OPENROUTER_MODEL;
      let response;
      try {
        process.env.OPENROUTER_MODEL = modelForThisAttempt;
        response = await this.llm.generate({
          prompt,
          taskType: stageDef.taskType || "heavy"
        });
      } catch (err) {
        console.log(`⚠️ Merge attempt ${attempt + 1} failed (${modelForThisAttempt}): ${err.message?.slice(0, 80)}`);
        if (attempt === uniqueModels.length - 1) {
          break; // all models exhausted — fall through to agent output fallback
        }
        continue; // try next model
      } finally {
        process.env.OPENROUTER_MODEL = originalModel; // always restore
      }

      const parsed = this.safeParse(response);
      // Type-safe output coercion: parsed.output may be object/null/array when
      // the model returns malformed JSON. .trim() on a non-string throws TypeError
      // which crashes the lifecycle. JSON.stringify preserves content; String()
      // would hide objects as "[object Object]".
      const safeOutput = typeof parsed.output === 'string'
        ? parsed.output
        : JSON.stringify(parsed.output ?? '');
      if (safeOutput.trim().length > 100) {
        if (attempt > 0) {
          console.log(`[MERGE] ✅ Fallback model ${modelForThisAttempt} succeeded at attempt ${attempt + 1}`);
        }
        return parsed;
      }

      // Output present but too short — treat as soft failure, try next model
      console.log(`⚠️ Merge attempt ${attempt + 1} output too short (${safeOutput.length} chars) — trying next model`);
    }

    // ── All model attempts failed — extract agent output content ────────────
    // (Mission 7 fallback: instead of raw JSON, use agent text directly)
    console.log("❌ All merge models exhausted — using agent output fallback");

    const agentContents = [];
    for (const [agentName, result] of Object.entries(agentData.outputs)) {
      if (result && result.output && result.output.trim().length > 50) {
        agentContents.push(`## ${agentName} Analysis\n\n${result.output}`);
      }
    }

    if (agentContents.length > 0) {
      return {
        summary: `Draft output (merge unavailable — ${agentContents.length} agent(s) contributed)`,
        output: agentContents.join('\n\n---\n\n'),
        decision: 'go',
        reasoning: 'All merge models exhausted (rate limit). Using raw agent output as fallback.',
        confidence: 'low',
        conflicts: ''
      };
    } else {
      return {
        summary: 'Stage incomplete — provider rate limit prevented output generation',
        output: `# ${stageDef.name} — Incomplete\n\nThis stage could not be completed because the AI provider was rate-limited during this run.\n\n**To resolve:** Re-run this idea with a different model or try again in a few minutes.\n\n**Stage:** ${stageDef.name}\n**Reason:** Provider 429 (rate limit) on all attempts across all fallback models`,
        decision: 'go',
        reasoning: 'Forced advance with placeholder — no agent output available from any model.',
        confidence: 'low',
        conflicts: ''
      };
    }
  }

  logDecision(stage, stageDef, agentData, merged) {
    this.journey.addDecision({
      stage,
      stageName: stageDef.name,
      frameworksUsed: stageDef.frameworks,
      agentExecution: agentData.executionLog,
      decision: merged.decision,
      reasoning: merged.reasoning,
      conflicts: merged.conflicts
    });
  }

  persistArtifacts(stage, stageDef, merged, agentData) {
    const fileName = `${stage}-${stageDef.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = path.join(this.artifactDir, `${fileName}.md`);

    const outputStr = typeof merged.output === 'string'
      ? merged.output
      : JSON.stringify(merged.output, null, 2);

    const outputWords = outputStr.trim().split(/\s+/).filter(Boolean).length;
    const qualityNote = outputWords < 150 && merged.confidence === 'low'
      ? `> ⚠️ This artifact was generated under degraded conditions (${outputWords} words, low confidence). Re-run for better quality.\n\n`
      : '';

    const agentAttribution = Object.entries(agentData?.executionLog || {})
      .filter(([, info]) => info.success)
      .map(([name]) => `- ${name}`)
      .join('\n') || '- Coordinator (direct merge)';

    const content = `
# ${stageDef.name}

## Summary
${merged.summary}

---

${qualityNote}${outputStr}

---

## Decision
${merged.decision}

## Reasoning
${merged.reasoning}

## Confidence
${merged.confidence}

## Generated By
${agentAttribution}
`;

    fs.writeFileSync(filePath, content);

    return `artifacts/${fileName}.md`;
  }

  checkExitCriteria(stageDef, merged) {
    return merged && merged.output && merged.confidence !== "low";
  }

  safeParse(response) {
    if (!response) {
      return {
        summary: "empty response",
        output: "",
        confidence: "low"
      };
    }

    try {
      let cleaned = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      if (parsed && parsed.output) {
        return parsed;
      }

      throw new Error("Invalid structure");
    } catch {
      try {
        const match = response.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      } catch {}

      // Both JSON.parse attempts failed (e.g. unescaped control characters).
      // Try to extract just the "output" field value character-by-character
      // so the disk artifact contains the intended content, not the raw JSON wrapper.
      try {
        const keyIdx = response.indexOf('"output"');
        if (keyIdx !== -1) {
          let i = keyIdx + 8; // skip past '"output"'
          while (i < response.length && /[\s:]/.test(response[i])) i++;
          if (response[i] === '"') {
            i++;
            let extracted = '';
            let esc = false;
            while (i < response.length) {
              const ch = response[i];
              if (esc) {
                if (ch === 'n')      extracted += '\n';
                else if (ch === 't') extracted += '\t';
                else if (ch === 'r') extracted += '\r';
                else if (ch === '"') extracted += '"';
                else if (ch === '\\') extracted += '\\';
                else                 extracted += ch;
                esc = false;
              } else if (ch === '\\') {
                esc = true;
              } else if (ch === '"') {
                break;
              } else {
                extracted += ch;
              }
              i++;
            }
            if (extracted.trim().length > 20) {
              return {
                summary: "parse recovered",
                output: extracted.trim(),
                confidence: "low"
              };
            }
          }
        }
      } catch {}

      return {
        summary: "parse failed",
        output: response,
        confidence: "low"
      };
    }
  }
}