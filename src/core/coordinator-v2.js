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

    while (currentStage) {
      const stageDef = this.lifecycle.getStageDefinition(currentStage);

      if (!stageDef) {
        console.log(`❌ Undefined stage: ${currentStage}`);
        break;
      }

      console.log(`\n📍 Stage ${currentStage}: ${stageDef.name}`);

      const context = this.buildContext(initialInput);

      const agentData = await this.runStageAgents(stageDef, context);

      const merged = await this.mergeOutputs(
        currentStage,
        stageDef,
        agentData,
        context
      );

      const filePath = this.persistArtifacts(currentStage, stageDef, merged);

      merged.outputFile = filePath;
      merged.artifacts = stageDef.artifacts;

      this.logDecision(currentStage, stageDef, agentData, merged);

      this.journey.updateStage(currentStage, merged);

      const decision = merged.decision || "go";

      if (decision === "kill") {
        console.log("🛑 Lifecycle stopped (KILL)");
        break;
      }

      if (decision === "iterate") {
        console.log("🔁 Re-running same stage");
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

      let parsed;
      let success = false;

      try {
        const response = await this.llm.generate({
          prompt,
          taskType: stageDef.taskType || "heavy"
        });

        parsed = this.safeParse(response);
        success = !!parsed.output;
      } catch (err) {
        parsed = {
          summary: "failed",
          output: "",
          confidence: "low"
        };
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
    if (stage === "14") {
      const prompt = `
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

      const response = await this.llm.generate({
        prompt,
        taskType: "heavy"
      });

      return this.safeParse(response);
    }

    let agentJson = JSON.stringify(agentData.outputs, null, 2);

    if (agentJson.length > 10000) {
      agentJson = agentJson.substring(0, 10000) + "\n...[truncated]";
    }

    const prompt = `
You are a Senior Product Manager.

Stage: ${stageDef.name}

Frameworks:
${stageDef.frameworks.join(", ")}

Artifacts:
${stageDef.artifacts.join(", ")}

Job Done:
${stageDef.jobDone}

Agent Outputs:
${agentJson}

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

    const response = await this.llm.generate({
      prompt,
      taskType: stageDef.taskType || "heavy"
    });

    return this.safeParse(response);
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

  persistArtifacts(stage, stageDef, merged) {
    const fileName = `${stage}-${stageDef.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = path.join(this.artifactDir, `${fileName}.md`);

    const content = `
# ${stageDef.name}

## Summary
${merged.summary}

---

${merged.output}

---

## Decision
${merged.decision}

## Reasoning
${merged.reasoning}

## Confidence
${merged.confidence}
`;

    fs.writeFileSync(filePath, content);

    return `artifacts/${fileName}.md`;
  }

  checkExitCriteria(stageDef, merged) {
    return merged && merged.output && merged.confidence !== "low";
  }

  // 🔥 FIXED SAFE PARSE (ONLY CHANGE)
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

      return {
        summary: "parse failed",
        output: response,
        confidence: "low"
      };
    }
  }
}