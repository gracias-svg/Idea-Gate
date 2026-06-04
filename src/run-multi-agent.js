import { AgentOrchestrator } from './core/agent-orchestrator.js';
import { createAgents } from './agents-v2/index.js';
import { llm } from './utils/llm.js';
import { saveOutputs } from './core/output-writer.js';

export async function runMultiAgent(projectDir, inputs) {
  const orchestrator = new AgentOrchestrator({
    agents: createAgents(),
    llm
  });

  const result = await orchestrator.runPipeline({
    projectDir,
    inputs
  });

  // 🔥 SAVE OUTPUTS
  saveOutputs(projectDir, result);

  return result;
}