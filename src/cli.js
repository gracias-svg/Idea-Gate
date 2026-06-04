#!/usr/bin/env node

import { ProductBuilderOrchestrator } from './orchestrator.js';
import { runMultiAgent } from './run-multi-agent.js';
import { CoordinatorV2 } from './core/coordinator-v2.js';
import { createAgents } from './agents-v2/index.js';
import { llm } from './utils/llm.js';

import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

// ------------------------------
// SLUGIFY
// ------------------------------
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
}

// ------------------------------
// PROJECT DIR
// ------------------------------
function createProjectDir(idea) {
  const slug = slugify(idea);
  const name = `${slug}-${Date.now()}`;
  const dir = path.join(process.cwd(), 'workspace', name);

  fs.mkdirSync(dir, { recursive: true });

  return dir;
}

// ------------------------------
// CLI
// ------------------------------
const args = process.argv.slice(2);

async function main() {
  const command = args[0];

  // ------------------------------
  // V2 (PM SYSTEM)
  // ------------------------------
  if (command === 'v2') {
    const idea = args.slice(1).join(' ');

    if (!idea) {
      console.log(chalk.red('❌ Please provide an idea'));
      return;
    }

    console.log(chalk.cyan('\n🚀 Running Coordinator V2...\n'));

    const projectDir = createProjectDir(idea);

    const coordinator = new CoordinatorV2({
      agents: createAgents(),
      llm,
      projectDir
    });

    await coordinator.run(idea);

    console.log(chalk.green('\n✅ Lifecycle complete'));
    console.log(chalk.yellow(`📁 Output: ${projectDir}\n`));

    return;
  }

  // ------------------------------
  // MULTI
  // ------------------------------
  if (command === 'multi') {
    const idea = args.slice(1).join(' ');

    if (!idea) {
      console.log(chalk.red('❌ Please provide an idea'));
      return;
    }

    console.log(chalk.cyan('\n🚀 Running Multi-Agent Mode...\n'));

    const projectDir = createProjectDir(idea);

    await runMultiAgent(projectDir, { idea });

    console.log(chalk.green('\n✅ Multi-agent complete'));
    console.log(chalk.yellow(`📁 Output: ${projectDir}\n`));

    return;
  }

  // ------------------------------
  // BUILD (LEGACY)
  // ------------------------------
  if (command === 'build') {
    const idea = args.slice(1).join(' ');

    if (!idea) {
      console.log(chalk.red('❌ Please provide an idea'));
      return;
    }

    console.log(chalk.cyan('\n🏗️ Running legacy build...\n'));

    const orchestrator = new ProductBuilderOrchestrator();

    const phase1 = await orchestrator.runPhase1(idea);
    await orchestrator.runPhase2(phase1.projectDir);
    await orchestrator.runPhase3(phase1.projectDir);
    await orchestrator.runPhase4(phase1.projectDir);

    console.log(chalk.green('\n🎉 Build complete\n'));

    return;
  }

  // ------------------------------
  // HELP
  // ------------------------------
  console.log(`
Usage:

  v2 <idea>
    → Full lifecycle PM system (Coordinator V2)

  multi <idea>
    → Multi-agent pipeline

  build <idea>
    → Legacy system

Examples:

  node src/cli.js v2 "Lume marketplace"

  node src/cli.js multi "AI fitness app"

  node src/cli.js build "Task manager"
`);
}

main();