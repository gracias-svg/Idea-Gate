import { BaseAgent } from './base-agent.js';

export class ResearchAgent extends BaseAgent {
  constructor() {
    super({
      name: "ResearchAgent",
      role: "Product Research Analyst specializing in competitive analysis and user insights"
    });
  }
}