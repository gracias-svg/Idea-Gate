import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export class PromptLoader {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Load a prompt template and interpolate variables
   */
  load(templateName, variables = {}) {
    const templatePath = path.join(config.promptsDir, `${templateName}.txt`);

    // Check cache
    if (!this.cache.has(templateName)) {
      const template = fs.readFileSync(templatePath, 'utf-8');
      this.cache.set(templateName, template);
    }

    let prompt = this.cache.get(templateName);

    // Interpolate variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      prompt = prompt.replace(placeholder, value);
    }

    return prompt;
  }

  /**
   * Clear cache (useful for development)
   */
  clearCache() {
    this.cache.clear();
  }
}
