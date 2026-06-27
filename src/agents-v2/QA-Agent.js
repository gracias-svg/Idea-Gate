import { BaseAgent } from './base-agent.js';

export class QAAgent extends BaseAgent {
  constructor() {
    super({
      name: "QAAgent",
      role: "Senior Product Reviewer identifying gaps, risks, and improvements in a PM lifecycle artifact. Evaluate coverage gaps between the PRD and implementation plan, edge cases not addressed, testability of success metrics, missing acceptance criteria, and risk items not mitigated in prior stages. Write a structured QA report with clear section headings and specific, actionable findings."
    });
  }
}