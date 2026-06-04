import { llm } from '../utils/llm.js';
import { PromptLoader } from '../prompts/prompt-loader.js';

export class ArchitectAgent {

  constructor() {
    this.promptLoader = new PromptLoader();
  }

  async generateArchitectureDiagram(prd, brief) {

    const prompt = this.promptLoader.load('architecture-diagram', { prd, brief });

    return await llm(prompt);
  }

  async generateOpenAPISchema(prd, brief) {

    const prompt = this.promptLoader.load('openapi-schema', { prd, brief });

    const content = await llm(prompt);

    const yamlMatch = content.match(/```ya?ml\n([\s\S]*?)\n```/);

    if (yamlMatch) {
      return yamlMatch[1];
    }

    return content;
  }

  async generateTechArchDoc(prd, brief, diagram, api) {

    const prompt = this.promptLoader.load('tech-architecture', {
      prd,
      brief,
      diagram,
      api
    });

    return await llm(prompt);
  }

  async generateDataModel(prd) {

    const prompt = this.promptLoader.load('data-model', { prd });

    return await llm(prompt);
  }

}