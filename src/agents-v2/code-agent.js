import { BaseAgent } from './base-agent.js';

export class CodeAgent extends BaseAgent {
  constructor() {
    super({
      name: "CodeAgent",
      role: "Senior Software Engineer generating production-ready code"
    });
  }
}