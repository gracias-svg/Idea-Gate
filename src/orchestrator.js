import { ProductPlannerAgent } from './agents/product-planner.js';
import { FileManager } from './utils/file-manager.js';
import { config } from './config.js';
import chalk from 'chalk';
import path from 'path';

export class ProductBuilderOrchestrator {
  constructor(options = {}) {
    config.validate();

    this.outputDir = options.outputDir || config.workspaceDir;
    this.projectName = options.projectName;
    this.skipQuestions = options.skipQuestions || false;

    this.fileManager = new FileManager(this.outputDir);
  }

  /**
   * Phase 1: Idea → Brief → PRD
   */
  async runPhase1(idea) {
    console.log(chalk.gray('Phase 1: Product Discovery & Specification\n'));

    // Initialize Product Planner Agent
    const planner = new ProductPlannerAgent();

    // Step 1: Ask clarifying questions (unless skipped)
    let enrichedIdea = idea;
    if (!this.skipQuestions) {
      console.log(chalk.cyan('🤔 Asking clarifying questions...\n'));
      const clarifications = await planner.askClarifyingQuestions(idea);

      // Show questions and get answers
      enrichedIdea = await this.handleClarifyingQuestions(idea, clarifications);
    }

    // Step 2: Generate Product Brief
    console.log(chalk.cyan('\n📋 Generating product brief...'));
    const brief = await planner.generateBrief(enrichedIdea);

    // Step 3: Generate PRD
    console.log(chalk.cyan('📄 Generating PRD...'));
    const prd = await planner.generatePRD(enrichedIdea, brief);

    // Step 4: Determine project name
    const projectName = this.projectName || this.extractProjectName(brief);

    // Step 5: Save artifacts
    console.log(chalk.cyan(`💾 Saving to workspace/${projectName}/...\n`));
    const projectDir = await this.fileManager.createProjectStructure(projectName);

    const briefPath = await this.fileManager.saveFile(
      path.join(projectDir, 'product', 'brief.md'),
      brief
    );

    const prdPath = await this.fileManager.saveFile(
      path.join(projectDir, 'product', 'prd.md'),
      prd
    );

    // Save metadata
    const metadata = {
      originalIdea: idea,
      enrichedIdea,
      projectName,
      createdAt: new Date().toISOString(),
      phase: 'phase1-complete',
      artifacts: {
        brief: 'product/brief.md',
        prd: 'product/prd.md'
      }
    };

    await this.fileManager.saveJSON(
      path.join(projectDir, 'metadata.json'),
      metadata
    );

    return {
      projectName,
      projectDir,
      briefPath,
      prdPath,
      brief,
      prd
    };
  }

  /**
   * Handle clarifying questions interactively
   */
  async handleClarifyingQuestions(originalIdea, clarifications) {
    const inquirer = (await import('inquirer')).default;

    console.log(chalk.yellow('Please answer a few questions to refine the product:\n'));

    const questions = clarifications.questions.map((q, idx) => ({
      type: 'input',
      name: `q${idx}`,
      message: q,
      default: clarifications.suggestions?.[idx] || ''
    }));

    const answers = await inquirer.prompt(questions);

    // Combine original idea with answers
    const answersText = Object.values(answers).join('\n');
    return `${originalIdea}\n\nAdditional Context:\n${answersText}`;
  }

  /**
   * Extract project name from brief
   */
  extractProjectName(brief) {
    // Try to extract from first heading or use sanitized version
    const match = brief.match(/^#\s+(.+)$/m);
    if (match) {
      return this.sanitizeProjectName(match[1]);
    }

    // Fallback: generate from timestamp
    return `product-${Date.now()}`;
  }

  /**
   * Sanitize project name for filesystem
   */
  sanitizeProjectName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Phase 2: Tasks & Architecture
   */
  async runPhase2(projectDir) {
    console.log(chalk.gray('\nPhase 2: Task Decomposition & Architecture\n'));

    // Load existing artifacts
    const brief = await this.fileManager.readFile(path.join(projectDir, 'product', 'brief.md'));
    const prd = await this.fileManager.readFile(path.join(projectDir, 'product', 'prd.md'));

    const { TaskDecomposerAgent } = await import('./agents/task-decomposer.js');
    const { ArchitectAgent } = await import('./agents/architect.js');

    const taskDecomposer = new TaskDecomposerAgent();
    const architect = new ArchitectAgent();

    // Step 1: Generate task breakdown
    console.log(chalk.cyan('📋 Generating task breakdown...'));
    const taskBreakdown = await taskDecomposer.generateTaskBreakdown(prd, brief);

    // Save task breakdown
    const taskBreakdownPath = await this.fileManager.saveJSON(
      path.join(projectDir, 'product', 'backlog.json'),
      taskBreakdown
    );

    // Generate summary
    const summary = taskDecomposer.generateSummary(taskBreakdown);
    console.log(chalk.gray(`  → ${summary.epics} epics, ${summary.stories} stories, ${summary.tasks} tasks`));
    console.log(chalk.gray(`  → Estimated: ${summary.estimatedHours} hours (~${summary.estimatedDays} days)\n`));

    // Step 2: Generate GitHub Issues
    console.log(chalk.cyan('📝 Generating GitHub Issues format...'));
    const githubIssues = await taskDecomposer.generateGitHubIssues(taskBreakdown);

    await this.fileManager.saveJSON(
      path.join(projectDir, 'product', 'github-issues.json'),
      githubIssues
    );

    // Step 3: Generate Architecture Diagram
    console.log(chalk.cyan('🏗️  Generating architecture diagram...'));
    const architectureDiagram = await architect.generateArchitectureDiagram(prd, brief);

    await this.fileManager.saveFile(
      path.join(projectDir, 'docs', 'architecture.mmd'),
      architectureDiagram
    );

    // Step 4: Generate OpenAPI Schema
    console.log(chalk.cyan('📡 Generating OpenAPI schema...'));
    const openAPISchema = await architect.generateOpenAPISchema(prd, brief);

    await this.fileManager.saveFile(
      path.join(projectDir, 'docs', 'api.yaml'),
      openAPISchema
    );

    // Step 5: Generate Data Model
    console.log(chalk.cyan('💾 Generating data model...'));
    const dataModel = await architect.generateDataModel(prd);

    await this.fileManager.saveFile(
      path.join(projectDir, 'docs', 'data-model.md'),
      dataModel
    );

    // Step 6: Generate Technical Architecture Doc
    console.log(chalk.cyan('📐 Generating technical architecture document...\n'));
    const techArchDoc = await architect.generateTechArchDoc(prd, brief, architectureDiagram, openAPISchema);

    await this.fileManager.saveFile(
      path.join(projectDir, 'docs', 'technical-architecture.md'),
      techArchDoc
    );

    // Update metadata
    const metadata = await this.fileManager.readJSON(path.join(projectDir, 'metadata.json'));
    metadata.phase = 'phase2-complete';
    metadata.phase2CompletedAt = new Date().toISOString();
    metadata.artifacts.backlog = 'product/backlog.json';
    metadata.artifacts.githubIssues = 'product/github-issues.json';
    metadata.artifacts.architecture = 'docs/architecture.mmd';
    metadata.artifacts.api = 'docs/api.yaml';
    metadata.artifacts.dataModel = 'docs/data-model.md';
    metadata.artifacts.techArchitecture = 'docs/technical-architecture.md';
    metadata.summary = summary;

    await this.fileManager.saveJSON(
      path.join(projectDir, 'metadata.json'),
      metadata
    );

    return {
      projectDir,
      taskBreakdownPath,
      githubIssuesPath: path.join(projectDir, 'product', 'github-issues.json'),
      architecturePath: path.join(projectDir, 'docs', 'architecture.mmd'),
      apiSchemaPath: path.join(projectDir, 'docs', 'api.yaml'),
      dataModelPath: path.join(projectDir, 'docs', 'data-model.md'),
      techArchPath: path.join(projectDir, 'docs', 'technical-architecture.md'),
      summary
    };
  }

  /**
   * Phase 3: Code Generation
   */
  async runPhase3(projectDir) {
    console.log(chalk.gray('\nPhase 3: Code Generation\n'));

    // Load Phase 2 artifacts
    const brief = await this.fileManager.readFile(path.join(projectDir, 'product', 'brief.md'));
    const prd = await this.fileManager.readFile(path.join(projectDir, 'product', 'prd.md'));
    const apiSpec = await this.fileManager.readFile(path.join(projectDir, 'docs', 'api.yaml'));
    const dataModel = await this.fileManager.readFile(path.join(projectDir, 'docs', 'data-model.md'));
    const techArch = await this.fileManager.readFile(path.join(projectDir, 'docs', 'technical-architecture.md'));

    const { CodeGeneratorAgent } = await import('./agents/code-generator.js');
    const codeGenerator = new CodeGeneratorAgent();

    // Step 1: Generate database schema
    console.log(chalk.cyan('💾 Generating database schema...'));
    const dbFiles = await codeGenerator.generateDatabase(dataModel);

    for (const [filename, code] of Object.entries(dbFiles)) {
      await this.fileManager.saveFile(
        path.join(projectDir, 'database', filename),
        code
      );
    }

    // Step 2: Generate backend code
    console.log(chalk.cyan('⚙️  Generating backend code...'));
    const backendFiles = await codeGenerator.generateBackend(apiSpec, dataModel, techArch);

    for (const [filename, code] of Object.entries(backendFiles)) {
      const filePath = path.join(projectDir, 'backend', filename);
      await this.fileManager.saveFile(filePath, code);
    }

    // Step 3: Generate frontend code
    console.log(chalk.cyan('🎨 Generating frontend code...'));
    const frontendFiles = await codeGenerator.generateFrontend(prd, brief, apiSpec);

    for (const [filename, code] of Object.entries(frontendFiles)) {
      const filePath = path.join(projectDir, 'frontend', filename);
      await this.fileManager.saveFile(filePath, code);
    }

    // Step 4: Generate project README
    console.log(chalk.cyan('📖 Generating project README...\n'));
    const readme = await this.generateProjectReadme(brief, prd);
    await this.fileManager.saveFile(path.join(projectDir, 'README.md'), readme);

    // Update metadata
    const metadata = await this.fileManager.readJSON(path.join(projectDir, 'metadata.json'));
    metadata.phase = 'phase3-complete';
    metadata.phase3CompletedAt = new Date().toISOString();
    metadata.artifacts.database = 'database/';
    metadata.artifacts.backend = 'backend/';
    metadata.artifacts.frontend = 'frontend/';

    await this.fileManager.saveJSON(
      path.join(projectDir, 'metadata.json'),
      metadata
    );

    return {
      projectDir,
      databaseFiles: Object.keys(dbFiles),
      backendFiles: Object.keys(backendFiles),
      frontendFiles: Object.keys(frontendFiles)
    };
  }

  /**
   * Generate project README
   */
  async generateProjectReadme(brief, prd) {
    // Extract project name from brief
    const nameMatch = brief.match(/^#\s+(.+)$/m);
    const projectName = nameMatch ? nameMatch[1] : 'Product';

    // Extract problem from brief
    const problemMatch = brief.match(/##\s+Problem Statement([\s\S]*?)(?=##|$)/i);
    const problem = problemMatch ? problemMatch[1].trim().split('\n')[0] : '';

    return `# ${projectName}

${problem}

## Generated Project Structure

This project was generated by Product Builder Coworker.

\`\`\`
├── backend/          # Express API server
├── frontend/         # Next.js application
├── database/         # Database schema
├── product/          # Product documentation
└── docs/             # Technical documentation
\`\`\`

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend Setup

\`\`\`bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
\`\`\`

The API will be available at http://localhost:3001

### Frontend Setup

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

The app will be available at http://localhost:3000

### Database Setup

The SQLite database will be created automatically on first run.
Schema is in \`database/schema.sql\`.

## Environment Variables

### Backend (.env)
\`\`\`
PORT=3001
JWT_SECRET=your-secret-key
DATABASE_PATH=./database.sqlite
\`\`\`

### Frontend (.env.local)
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:3001
\`\`\`

## Development

1. Start the backend: \`cd backend && npm run dev\`
2. Start the frontend: \`cd frontend && npm run dev\`
3. Open http://localhost:3000

## Deployment

See deployment/ directory for deployment configurations.

## Documentation

- Product Brief: \`product/brief.md\`
- PRD: \`product/prd.md\`
- API Schema: \`docs/api.yaml\`
- Architecture: \`docs/architecture.mmd\`
- Technical Architecture: \`docs/technical-architecture.md\`

## License

MIT
`;
  }

  /**
   * Phase 4: Prototype Prompt Generation
   */
  async runPhase4(projectDir) {
    console.log(chalk.gray('\nPhase 4: Prototype Prompt Generation\n'));

    // Load Phase 1 and Phase 2 artifacts
    const brief = await this.fileManager.readFile(path.join(projectDir, 'product', 'brief.md'));
    const prd = await this.fileManager.readFile(path.join(projectDir, 'product', 'prd.md'));
    const apiSpec = await this.fileManager.readFile(path.join(projectDir, 'docs', 'api.yaml'));

    const { PrototypePrompterAgent } = await import('./agents/prototype-prompter.js');
    const prototypePrompter = new PrototypePrompterAgent();

    // Generate prototype prompt
    console.log(chalk.cyan('🎨 Generating prototype prompt for UI builders...'));
    const prototypePrompt = prototypePrompter.generatePrototypePrompt(brief, prd, apiSpec);

    // Save to prototype directory
    const promptPath = await this.fileManager.saveFile(
      path.join(projectDir, 'prototype', 'Prototype-prompt.txt'),
      prototypePrompt
    );

    console.log(chalk.gray(`  → Saved to ${path.relative(process.cwd(), promptPath)}\n`));

    // Update metadata
    const metadata = await this.fileManager.readJSON(path.join(projectDir, 'metadata.json'));
    metadata.phase = 'phase4-complete';
    metadata.phase4CompletedAt = new Date().toISOString();
    metadata.artifacts.prototypePrompt = 'prototype/Prototype-prompt.txt';

    await this.fileManager.saveJSON(
      path.join(projectDir, 'metadata.json'),
      metadata
    );

    return {
      projectDir,
      promptPath
    };
  }
}
