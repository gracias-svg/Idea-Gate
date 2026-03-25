import { BaseAgent } from './base-agent.js';

export class UXAgent extends BaseAgent {
  constructor() {
    super({
      name: "UXAgent",
      role: "Senior UX Designer focused on flows, usability, and interaction design"
    });
  }
}