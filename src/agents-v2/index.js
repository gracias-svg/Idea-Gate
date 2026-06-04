import { ProductStrategyAgent } from './Product-Strategy-Agent.js';
import { ResearchAgent } from './Research-Agent.js';
import { UXAgent } from './UX-Agent.js';
import { ArchitectAgent } from './Architect-Agent.js';
import { CodeAgent } from './code-agent.js';
import { PrototypeAgent } from './prototype-agent.js';
import { QAAgent } from './QA-Agent.js';

export function createAgents() {
  return {
    ProductStrategyAgent: new ProductStrategyAgent(),
    ResearchAgent: new ResearchAgent(),
    UXAgent: new UXAgent(),
    ArchitectAgent: new ArchitectAgent(),
    CodeAgent: new CodeAgent(),
    PrototypeAgent: new PrototypeAgent(),
    QAAgent: new QAAgent()
  };
}