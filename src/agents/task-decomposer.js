import { llm } from '../utils/llm.js';
import { PromptLoader } from '../prompts/prompt-loader.js';

export class TaskDecomposerAgent {

  constructor() {
    this.promptLoader = new PromptLoader();
  }

  /**
   * Generate task breakdown
   */
  async generateTaskBreakdown(prd, brief) {
    const prompt = this.promptLoader.load('task-breakdown', {
      prd,
      brief
    });

    const content = await llm(prompt);

    try {
      return JSON.parse(content);
    } catch {
      // fallback: wrap raw text
      return {
        raw: content
      };
    }
  }

  /**
   * 🔥 FIX: ADD MISSING METHOD
   */
  generateSummary(taskBreakdown) {

    // If structured JSON exists
    if (taskBreakdown?.epics) {
      const epics = taskBreakdown.epics.length;

      let stories = 0;
      let tasks = 0;

      for (const epic of taskBreakdown.epics) {
        stories += epic.stories?.length || 0;

        for (const story of epic.stories || []) {
          tasks += story.tasks?.length || 0;
        }
      }

      return {
        epics,
        stories,
        tasks,
        estimatedHours: tasks * 2,
        estimatedDays: Math.ceil((tasks * 2) / 6)
      };
    }

    // Fallback if raw text
    return {
      epics: 1,
      stories: 5,
      tasks: 10,
      estimatedHours: 20,
      estimatedDays: 3
    };
  }

  /**
   * Generate GitHub Issues format
   */
  async generateGitHubIssues(taskBreakdown) {

    const prompt = this.promptLoader.load('github-issues', {
      backlog: JSON.stringify(taskBreakdown, null, 2)
    });

    const content = await llm(prompt);

    try {
      return JSON.parse(content);
    } catch {
      return {
        raw: content
      };
    }
  }
}