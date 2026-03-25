export class LifecycleEngine {
  constructor(journey) {
    this.journey = journey;

    this.order = [
      "0","1","2","3","4","5",
      "6","7","8","9","10",
      "11","12","13","14"
    ];

    this.definitions = this.buildDefinitions();
  }

  getCurrentStage() {
    return this.journey.state.currentStage || "0";
  }

  nextStage() {
    const current = this.getCurrentStage();
    const idx = this.order.indexOf(current);
    return this.order[idx + 1] || null;
  }

  getPreviousStage(stage) {
    const idx = this.order.indexOf(stage);
    return this.order[idx - 1] || "0";
  }

  getStageDefinition(stage) {
    return this.definitions[stage];
  }

  // 🔥 MERGED: RICH + STAGE 14
  buildDefinitions() {
    return {

      "0": {
        name: "Idea Intake",
        domain: "problem",
        frameworks: ["NSM lens"],
        artifacts: ["idea_entry"],
        jobDone: "Idea is clearly articulated, scoped, and logged with initial intent and outcome hypothesis",
        agents: ["ProductStrategyAgent"]
      },

      "1": {
        name: "Discovery",
        domain: "problem",
        frameworks: ["PESTEL", "Porter", "JTBD"],
        artifacts: ["discovery_brief", "market_snapshot", "user_insights"],
        jobDone: "Clear understanding of users, market, and opportunity space with evidence-backed insights",
        agents: ["ResearchAgent", "ProductStrategyAgent", "DataAgent"]
      },

      "2": {
        name: "Problem Definition",
        domain: "problem",
        frameworks: ["JTBD", "Problem framing"],
        artifacts: ["problem_one_pager", "assumption_map"],
        jobDone: "Single, well-defined problem statement with key assumptions and user pain validated",
        agents: ["ProductStrategyAgent"]
      },

      "3": {
        name: "Solution Design",
        domain: "solution",
        frameworks: ["OST", "Solution mapping"],
        artifacts: ["solution_concept_doc"],
        jobDone: "Solution approach selected and mapped to problem with clear reasoning",
        agents: ["ProductStrategyAgent", "UXAgent"]
      },

      "4": {
        name: "MVP Hypothesis",
        domain: "solution",
        frameworks: ["MVP test cards"],
        artifacts: ["mvp_hypothesis_sheet"],
        jobDone: "Clear hypotheses, success metrics, and MVP scope defined",
        agents: ["ProductStrategyAgent", "DataAgent"]
      },

      "5": {
        name: "Validation",
        domain: "solution",
        frameworks: ["Experiments", "AARRR"],
        artifacts: ["experiment_plan", "validation_summary", "decision_note"],
        jobDone: "Validated learning achieved and go/kill/iterate decision made with evidence",
        agents: ["ResearchAgent", "DataAgent"]
      },

      "6": {
        name: "Prioritization",
        domain: "solution",
        frameworks: ["RICE", "MoSCoW"],
        artifacts: ["roadmap_entry", "prioritization_matrix"],
        jobDone: "Initiative prioritized against alternatives and placed on roadmap with trade-offs",
        agents: ["ProductStrategyAgent"]
      },

      "7": {
        name: "PRD",
        domain: "delivery",
        frameworks: ["PRD structure"],
        artifacts: ["prd"],
        jobDone: "PRD approved with scope, flows, and requirements clearly defined",
        agents: ["ProductStrategyAgent"]
      },

      "8": {
        name: "UX Design",
        domain: "delivery",
        frameworks: ["User flows", "Journey mapping"],
        artifacts: ["ux_spec", "journey_map"],
        jobDone: "UX flows and journeys clearly defined and aligned with PRD",
        agents: ["UXAgent"]
      },

      "9": {
        name: "Usability Planning",
        domain: "delivery",
        frameworks: ["Usability testing"],
        artifacts: ["usability_plan"],
        jobDone: "Design validated for usability and ready for implementation",
        agents: ["UXAgent"]
      },

      "10": {
        name: "Architecture",
        domain: "delivery",
        frameworks: ["System design"],
        artifacts: ["architecture_overview", "data_model", "api_outline"],
        jobDone: "Architecture approved with clear system boundaries and data flow",
        agents: ["ArchitectAgent"]
      },

      "11": {
        name: "Backlog & Release Planning",
        domain: "delivery",
        frameworks: ["Backlog slicing"],
        artifacts: ["backlog_outline", "release_plan"],
        jobDone: "MVP scope broken into actionable backlog and release plan defined",
        agents: ["ProductStrategyAgent", "CodeAgent"]
      },

      "12": {
        name: "Implementation Planning",
        domain: "delivery",
        frameworks: ["DoR / DoD"],
        artifacts: ["implementation_plan", "pm_side_DoR_DoD"],
        jobDone: "Clear expectations for build quality, scope, and execution readiness",
        agents: ["CodeAgent"]
      },

      "13": {
        name: "QA & Readiness",
        domain: "delivery",
        frameworks: ["QA strategy"],
        artifacts: ["qa_strategy", "readiness_criteria"],
        jobDone: "System meets quality thresholds and is ready for release",
        agents: ["QAAgent"]
      },

      // 🔥 FINAL STAGE (ADDED WITHOUT LOSING RICHNESS)
      "14": {
        name: "Prototype Prompt",
        domain: "delivery",
        frameworks: ["Prompt Packing", "MVP scoping"],
        artifacts: ["prototype_prompt"],
        jobDone: "High-quality prototype prompt generated using all validated lifecycle artifacts",
        agents: ["ProductStrategyAgent", "CodeAgent"]
      }

    };
  }
}