import { loadProjectContext } from '../utils/context-loader.js';

export class AgentOrchestrator {
  constructor({ agents, llm }) {
    this.agents = agents;
    this.llm = llm;
  }

  async runPipeline({ projectDir, inputs }) {
    const externalContext = loadProjectContext(projectDir);

    const sharedContext = {
      ...inputs,
      externalContext
    };

    const results = {};

    // STEP 1 → Strategy
    console.log("→ Product Strategy");
    results.strategy = await this.runAgent("ProductStrategyAgent", sharedContext);

    // STEP 2 → Research
    console.log("→ Research");
    results.research = await this.runAgent("ResearchAgent", {
      ...sharedContext,
      strategy: results.strategy.output
    });

    // STEP 3 → UX
    console.log("→ UX");
    results.ux = await this.runAgent("UXAgent", {
      ...sharedContext,
      strategy: results.strategy.output
    });

    // STEP 4 → Architecture
    console.log("→ Architecture");
    results.architecture = await this.runAgent("ArchitectAgent", {
      ...sharedContext,
      strategy: results.strategy.output,
      ux: results.ux.output
    });

    // STEP 5 → Code
    console.log("→ Code");
    results.code = await this.runAgent("CodeAgent", {
      ...sharedContext,
      architecture: results.architecture.output
    });

    // STEP 6 → Prototype
    console.log("→ Prototype");
    results.prototype = await this.runAgent("PrototypeAgent", {
      ...sharedContext,
      strategy: results.strategy.output
    });

    // STEP 7 → QA (CRITIC)
    console.log("→ QA Review");
    results.qa = await this.runAgent("QAAgent", results);

    return results;
  }

  async runAgent(agentName, context) {
    const agent = this.agents[agentName];

    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    const prompt = agent.buildPrompt(context);

    const response = await this.llm.generate({
      prompt,
      taskType: "heavy"
    });

    return this.parseResponse(response);
  }

  parseResponse(response) {
    try {
      return JSON.parse(response);
    } catch {
      return {
        summary: "Failed to parse structured output",
        output: response,
        confidence: "low"
      };
    }
  }
}