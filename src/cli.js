#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import { ProductBuilderOrchestrator } from './orchestrator.js';
import { config } from './config.js';

const program = new Command();

program
  .name('pbc')
  .description('Product Builder Coworker - Turn ideas into shipped products')
  .version('0.1.0');

program
  .command('build')
  .description('Start building a product from a rough idea')
  .argument('[idea]', 'Your product idea (optional, will prompt if not provided)')
  .option('-o, --output <path>', 'Output directory', './workspace')
  .option('-n, --name <name>', 'Project name')
  .option('--skip-questions', 'Skip clarifying questions')
  .action(async (idea, options) => {
    try {
      console.log(chalk.blue.bold('\n🚀 Product Builder Coworker\n'));

      // Get idea if not provided
      let productIdea = idea;
      if (!productIdea) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'idea',
            message: 'What product do you want to build?',
            validate: (input) => input.length > 10 || 'Please provide more detail about your idea'
          }
        ]);
        productIdea = answers.idea;
      }

      // Initialize orchestrator
      const orchestrator = new ProductBuilderOrchestrator({
        outputDir: options.output,
        projectName: options.name,
        skipQuestions: options.skipQuestions
      });

      console.log(chalk.gray(`\n📝 Processing idea: "${productIdea}"\n`));

      // Run Phase 1: Idea → Brief → PRD
      const spinner = ora('Starting Product Planner Agent...').start();

      const result = await orchestrator.runPhase1(productIdea);

      spinner.succeed(chalk.green('✓ Phase 1 Complete!'));

      // Display results
      console.log(chalk.blue('\n📊 Generated Artifacts:\n'));
      console.log(chalk.green('  ✓ Product Brief:'), result.briefPath);
      console.log(chalk.green('  ✓ Product PRD:'), result.prdPath);
      console.log(chalk.green('  ✓ Project Directory:'), result.projectDir);

      console.log(chalk.yellow('\n💡 Next Steps:\n'));
      console.log('  1. Review the generated brief and PRD');
      console.log('  2. Run', chalk.cyan('pbc continue'), 'to generate tasks and architecture');
      console.log('  3. Or edit the files and run', chalk.cyan('pbc build --continue\n'));

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      if (config.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('continue')
  .description('Continue to Phase 2 (generate tasks and architecture)')
  .argument('[project]', 'Project directory path')
  .action(async (projectPath) => {
    try {
      console.log(chalk.blue.bold('\n🚀 Product Builder Coworker - Phase 2\n'));

      // Determine project directory
      let projectDir = projectPath;

      if (!projectDir) {
        // Find most recent project in workspace
        const fs = await import('fs/promises');
        const workspaceDir = './workspace';

        try {
          const projects = await fs.readdir(workspaceDir);
          if (projects.length === 0) {
            throw new Error('No projects found. Run "pbc build" first.');
          }

          // Get the most recently modified project
          const projectStats = await Promise.all(
            projects.map(async (p) => {
              const stat = await fs.stat(path.join(workspaceDir, p));
              return { name: p, mtime: stat.mtime };
            })
          );

          projectStats.sort((a, b) => b.mtime - a.mtime);
          projectDir = path.join(workspaceDir, projectStats[0].name);

          console.log(chalk.gray(`Using most recent project: ${projectStats[0].name}\n`));
        } catch (err) {
          throw new Error('Could not find project directory');
        }
      }

      // Verify Phase 1 is complete
      const metadataPath = path.join(projectDir, 'metadata.json');
      const { default: fs2 } = await import('fs');
      if (!fs2.existsSync(metadataPath)) {
        throw new Error(`Project not found at: ${projectDir}`);
      }

      const orchestrator = new ProductBuilderOrchestrator({
        outputDir: path.dirname(projectDir)
      });

      const spinner = ora('Running Phase 2: Tasks & Architecture...').start();

      const result = await orchestrator.runPhase2(projectDir);

      spinner.succeed(chalk.green('✓ Phase 2 Complete!'));

      // Display results
      console.log(chalk.blue('\n📊 Generated Artifacts:\n'));
      console.log(chalk.green('  ✓ Task Breakdown:'), result.taskBreakdownPath);
      console.log(chalk.green('  ✓ GitHub Issues:'), result.githubIssuesPath);
      console.log(chalk.green('  ✓ Architecture Diagram:'), result.architecturePath);
      console.log(chalk.green('  ✓ API Schema:'), result.apiSchemaPath);
      console.log(chalk.green('  ✓ Data Model:'), result.dataModelPath);
      console.log(chalk.green('  ✓ Tech Architecture:'), result.techArchPath);

      console.log(chalk.blue('\n📈 Project Summary:\n'));
      console.log(chalk.gray(`  Epics: ${result.summary.epics}`));
      console.log(chalk.gray(`  Stories: ${result.summary.stories}`));
      console.log(chalk.gray(`  Tasks: ${result.summary.tasks}`));
      console.log(chalk.gray(`  Estimated: ${result.summary.estimatedHours} hours (~${result.summary.estimatedDays} days)`));

      console.log(chalk.yellow('\n💡 Next Steps:\n'));
      console.log('  1. Review the generated architecture and tasks');
      console.log('  2. Visualize architecture: Use Mermaid Live Editor');
      console.log('  3. Test API schema: Import api.yaml into Postman/Insomnia');
      console.log('  4. Run', chalk.cyan('pbc generate-code'), 'to generate working code!\n');

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      if (config.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('generate-code')
  .description('Generate working code (Phase 3)')
  .argument('[project]', 'Project directory path')
  .action(async (projectPath) => {
    try {
      console.log(chalk.blue.bold('\n🚀 Product Builder Coworker - Phase 3\n'));

      // Determine project directory
      let projectDir = projectPath;

      if (!projectDir) {
        // Find most recent project
        const fs = await import('fs/promises');
        const workspaceDir = './workspace';

        try {
          const projects = await fs.readdir(workspaceDir);
          if (projects.length === 0) {
            throw new Error('No projects found. Run "pbc build" first.');
          }

          const projectStats = await Promise.all(
            projects.map(async (p) => {
              const stat = await fs.stat(path.join(workspaceDir, p));
              return { name: p, mtime: stat.mtime };
            })
          );

          projectStats.sort((a, b) => b.mtime - a.mtime);
          projectDir = path.join(workspaceDir, projectStats[0].name);

          console.log(chalk.gray(`Using most recent project: ${projectStats[0].name}\n`));
        } catch (err) {
          throw new Error('Could not find project directory');
        }
      }

      // Verify Phase 2 is complete
      const metadataPath = path.join(projectDir, 'metadata.json');
      const { default: fs2 } = await import('fs');
      if (!fs2.existsSync(metadataPath)) {
        throw new Error(`Project not found at: ${projectDir}`);
      }

      const orchestrator = new ProductBuilderOrchestrator({
        outputDir: path.dirname(projectDir)
      });

      const spinner = ora('Running Phase 3: Code Generation...').start();

      const result = await orchestrator.runPhase3(projectDir);

      spinner.succeed(chalk.green('✓ Phase 3 Complete!'));

      // Display results
      console.log(chalk.blue('\n📊 Generated Code:\n'));
      console.log(chalk.green('  ✓ Database:'), `${result.databaseFiles.length} files`);
      console.log(chalk.green('  ✓ Backend:'), `${result.backendFiles.length} files`);
      console.log(chalk.green('  ✓ Frontend:'), `${result.frontendFiles.length} files`);

      console.log(chalk.blue('\n📂 Project Structure:\n'));
      console.log(chalk.gray('  workspace/your-project/'));
      console.log(chalk.gray('  ├── backend/       # Express API'));
      console.log(chalk.gray('  ├── frontend/      # Next.js app'));
      console.log(chalk.gray('  ├── database/      # SQL schema'));
      console.log(chalk.gray('  └── README.md      # Setup instructions'));

      console.log(chalk.yellow('\n💡 Next Steps:\n'));
      console.log('  1. Read the README.md for setup instructions');
      console.log('  2. Install backend: cd backend && npm install');
      console.log('  3. Install frontend: cd frontend && npm install');
      console.log('  4. Run backend: cd backend && npm run dev');
      console.log('  5. Run frontend: cd frontend && npm run dev');
      console.log('  6. Or run', chalk.cyan('pbc generate-prototype'), 'for UI builder prompt!\n');

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      if (config.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('generate-prototype')
  .description('Generate prototype prompt for UI builders (Phase 4)')
  .argument('[project]', 'Project directory path')
  .action(async (projectPath) => {
    try {
      console.log(chalk.blue.bold('\n🚀 Product Builder Coworker - Phase 4\n'));

      // Determine project directory
      let projectDir = projectPath;

      if (!projectDir) {
        // Find most recent project
        const fs = await import('fs/promises');
        const workspaceDir = './workspace';

        try {
          const projects = await fs.readdir(workspaceDir);
          if (projects.length === 0) {
            throw new Error('No projects found. Run "pbc build" first.');
          }

          const projectStats = await Promise.all(
            projects.map(async (p) => {
              const stat = await fs.stat(path.join(workspaceDir, p));
              return { name: p, mtime: stat.mtime };
            })
          );

          projectStats.sort((a, b) => b.mtime - a.mtime);
          projectDir = path.join(workspaceDir, projectStats[0].name);

          console.log(chalk.gray(`Using most recent project: ${projectStats[0].name}\n`));
        } catch (err) {
          throw new Error('Could not find project directory');
        }
      }

      // Verify project exists
      const metadataPath = path.join(projectDir, 'metadata.json');
      const { default: fs2 } = await import('fs');
      if (!fs2.existsSync(metadataPath)) {
        throw new Error(`Project not found at: ${projectDir}`);
      }

      const orchestrator = new ProductBuilderOrchestrator({
        outputDir: path.dirname(projectDir)
      });

      const spinner = ora('Running Phase 4: Prototype Prompt Generation...').start();

      const result = await orchestrator.runPhase4(projectDir);

      spinner.succeed(chalk.green('✓ Phase 4 Complete!'));

      // Display results
      console.log(chalk.blue('\n📊 Generated Artifact:\n'));
      console.log(chalk.green('  ✓ Prototype Prompt:'), result.promptPath);

      console.log(chalk.yellow('\n💡 Next Steps:\n'));
      console.log('  1. Copy the contents of prototype/Prototype-prompt.txt');
      console.log('  2. Paste into any of these UI builders:');
      console.log('     • Lovable.dev (https://lovable.dev)');
      console.log('     • v0.dev (https://v0.dev)');
      console.log('     • Framer AI (https://framer.com)');
      console.log('     • Base44 (https://base44.com)');
      console.log('  3. Generate your UI prototype instantly!\n');

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      if (config.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize configuration')
  .action(async () => {
    console.log(chalk.blue.bold('\n🔧 Product Builder Coworker Setup\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your Anthropic API key:',
        validate: (input) => input.length > 0 || 'API key is required'
      },
      {
        type: 'confirm',
        name: 'setupGithub',
        message: 'Do you want to set up GitHub integration now?',
        default: false
      }
    ]);

    // Save config
    const fs = await import('fs/promises');
    await fs.writeFile('.env', `ANTHROPIC_API_KEY=${answers.apiKey}\n`);

    console.log(chalk.green('\n✓ Configuration saved!'));
    console.log(chalk.gray('\nYou can now run:'), chalk.cyan('pbc build "your product idea"\n'));
  });

program.parse();
