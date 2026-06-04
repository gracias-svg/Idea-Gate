import { BaseAgent } from './base-agent.js';

export class ArchitectAgent extends BaseAgent {
  constructor() {
    super({
      name: "ArchitectAgent",
      role: "Staff Software Architect designing scalable systems"
    });
  }
}