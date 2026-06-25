import fs from 'fs';
import path from 'path';

export class JourneyEngine {
  constructor(projectDir) {
    this.file = path.join(projectDir, 'journey.json');

    this.state = this.load() || {
      currentStage: "0",
      stages: {},
      decisions: [],
      createdAt: new Date().toISOString()
    };
  }

  // ------------------------------
  // LOAD (SAFE)
  // ------------------------------
  load() {
    try {
      if (fs.existsSync(this.file)) {
        return JSON.parse(fs.readFileSync(this.file, 'utf-8'));
      }
    } catch (err) {
      console.log("⚠️ Failed to parse journey.json, starting fresh");
    }
    return null;
  }

  // ------------------------------
  // SAVE
  // ------------------------------
  save() {
    fs.writeFileSync(this.file, JSON.stringify(this.state, null, 2));
  }

  // ------------------------------
  // UPDATE STAGE (WITH METADATA)
  // ------------------------------
  updateStage(stage, data) {
    if (!data) {
      console.log(`⚠️ Skipping stage ${stage} update (empty data)`);
      return;
    }

    const now = new Date().toISOString();

    const existing = this.state.stages[stage] || {};

    // Track history for iterations
    const history = existing.history || [];

    if (existing.output) {
      history.push({
        snapshot: existing.output,
        timestamp: existing.completedAt || now
      });
    }

    this.state.currentStage = stage;

    this.state.stages[stage] = {
      summary: data.summary || "",
      output: data.output || "",
      decision: data.decision || "",
      reasoning: data.reasoning || "",
      confidence: data.confidence || "",
      conflicts: data.conflicts || "",

      // ── TIMING FIX ─────────────────────────────────────────────────────
      // data.startedAt is set by coordinator BEFORE runStageAgents executes,
      // giving us the true stage start time. existing.startedAt is used when
      // a stage is being iterated (already started). Fallback to now only if
      // neither is available (should not occur in normal execution).
      startedAt: data.startedAt || existing.startedAt || now,
      completedAt: now,
      durationMs: (data.startedAt || existing.startedAt)
        ? new Date(now).getTime() - new Date(data.startedAt || existing.startedAt).getTime()
        : 0,

      history,

      // 🔗 ARTIFACT POINTER (filled by Coordinator)
      outputFile: data.outputFile || null,
      artifacts: data.artifacts || []
    };

    this.save();
  }

  // ------------------------------
  // DECISION LOG (NORMALIZED)
  // ------------------------------
  addDecision(decision) {
    const normalized = {
      stage: decision.stage || "",
      stageName: decision.stageName || "",
      decision: decision.decision || "unknown",
      reasoning: decision.reasoning || "",
      conflicts: decision.conflicts || "",
      frameworksUsed: decision.frameworksUsed || [],
      timestamp: new Date().toISOString()
    };

    this.state.decisions.push(normalized);

    this.save();
  }

  // ------------------------------
  // CONTEXT ACCESS
  // ------------------------------
  getContext() {
    return this.state;
  }

  // ------------------------------
  // OPTIONAL HELPERS (FUTURE USE)
  // ------------------------------
  getStage(stage) {
    return this.state.stages[stage] || null;
  }

  getLastDecision() {
    return this.state.decisions[this.state.decisions.length - 1] || null;
  }
}