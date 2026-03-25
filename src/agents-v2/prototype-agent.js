import { BaseAgent } from './base-agent.js';

export class PrototypeAgent extends BaseAgent {
  constructor() {
    super({
      name: "PrototypeAgent",
      role: "Product Designer creating high-quality prototype instructions"
    });
  }
}