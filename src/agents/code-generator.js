import { llm } from '../utils/llm.js';
import { PromptLoader } from '../prompts/prompt-loader.js';

export class CodeGeneratorAgent {
  constructor() {
    this.promptLoader = new PromptLoader();
  }

  async generateBackend(apiSpec, dataModel, techArch) {

    const apiSummary = this.extractAPIEndpoints(apiSpec);
    const dbSummary = this.extractDatabaseSchema(dataModel);

    const prompt = this.promptLoader.load('code-backend', {
      apiSpec: apiSummary,
      dataModel: dbSummary,
      techStack: this.extractTechStack(techArch)
    });

    const text = await llm(prompt);

    return this.parseBackendCode(text);
  }

  async generateFrontend(prd, brief, apiSpec) {

    const userFlows = this.extractUserFlows(prd);
    const apiEndpoints = this.extractAPIEndpoints(apiSpec);

    const prompt = this.promptLoader.load('code-frontend', {
      brief: this.summarizeBrief(brief),
      userFlows,
      apiEndpoints
    });

    const text = await llm(prompt);

    return this.parseFrontendCode(text);
  }

  async generateDatabase(dataModel) {

    const prompt = this.promptLoader.load('code-database', {
      dataModel: this.extractDatabaseSchema(dataModel)
    });

    const text = await llm(prompt);

    return this.parseDatabaseCode(text);
  }

  extractAPIEndpoints(apiSpec) {
    if (typeof apiSpec !== 'string') return '';
    return apiSpec.slice(0, 3000);
  }

  extractDatabaseSchema(dataModel) {
    if (typeof dataModel !== 'string') return '';
    return dataModel.slice(0, 4000);
  }

  extractTechStack(techArch) {
    if (!techArch) return 'Node.js, Express, SQLite, Next.js, Tailwind';
    return techArch.slice(0, 1000);
  }

  extractUserFlows(prd) {
    if (!prd) return '';
    return prd.slice(0, 2000);
  }

  summarizeBrief(brief) {
    if (!brief) return '';
    return brief.slice(0, 1000);
  }

  parseBackendCode(response) {
    return { "index.js": response };
  }

  parseFrontendCode(response) {
    return { "page.tsx": response };
  }

  parseDatabaseCode(response) {
    return { "schema.sql": response };
  }
}