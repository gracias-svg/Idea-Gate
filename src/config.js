import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {

  // Model (used by agents)
  model: process.env.MODEL || "qwen3:8b",

  maxTokens: 2000,
  temperature: 0.4,

  // Paths
  rootDir: join(__dirname, '..'),
  promptsDir: join(__dirname, 'prompts'),
  templatesDir: join(__dirname, 'templates'),
  workspaceDir: process.env.WORKSPACE_DIR || join(__dirname, '../workspace'),

  debug: process.env.DEBUG === 'true',

  validate() {
    // No API validation needed because OpenRouter key is global
    return true;
  }

};