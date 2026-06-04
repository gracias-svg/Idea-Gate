import { BaseAgent } from './base-agent.js';

export class QAAgent extends BaseAgent {
  constructor() {
    super({
      name: "QAAgent",
      role: "Senior Product Reviewer identifying gaps, risks, and improvements"
    });
  }

  buildPrompt(context) {
    return `
You are a critical reviewer.

Your job:
- Identify gaps
- Identify weak logic
- Improve outputs

Context:
${JSON.stringify(context).substring(0, 8000)}

Return STRICT JSON:
{
  "summary": "issues found",
  "output": "improved version",
  "confidence": "high/medium/low"
}
`;
  }
}