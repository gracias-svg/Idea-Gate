import { llm } from '../utils/llm.js';
import { PromptLoader } from '../prompts/prompt-loader.js';

export class ProductPlannerAgent {

  constructor() {
    this.promptLoader = new PromptLoader();
  }

  async askClarifyingQuestions(idea) {

    const prompt = this.promptLoader.load('clarifying-questions', { idea });

    const content = await llm(prompt);

    try {
      return JSON.parse(content);
    } catch {

      const questions = content
        .split('\n')
        .filter(l => l.trim().match(/^\d+\./))
        .map(l => l.replace(/^\d+\.\s*/, '').trim());

      return { questions };
    }
  }

  async generateBrief(enrichedIdea) {

    const prompt = this.promptLoader.load('product-brief', { idea: enrichedIdea });

    return await llm(prompt);
  }

  async generatePRD(enrichedIdea, brief) {

    const prompt = this.promptLoader.load('product-prd', {
      idea: enrichedIdea,
      brief
    });

    return await llm(prompt);
  }

}