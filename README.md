# Idea Gate - A Product Builder Coworker v1.0 🚀

> AI coworker that turns rough product ideas into shipped prototypes

**Current Status:** Phase 1-4 Complete (Idea → Code → Prototype)

## What This Does

Idea Gate is an AI-powered tool that acts as your full-stack product team. Give it a rough idea, and it generates:

- ✅ **Phase 1** (Complete): Product Brief + PRD
- ✅ **Phase 2** (Complete): Task breakdown + Architecture diagrams + API schema
- ✅ **Phase 3** (Complete): Working code (frontend + backend + database)
- ✅ **Phase 4** (Complete): UI prototype prompt for Lovable/v0.dev

## Quick Start

### 1. Installation

```bash
# Clone or download this repository
cd product-builder-coworker

# Install dependencies
npm install

# Set up your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Run Your First Build

```bash
# Interactive mode
npm start

# Or directly with an idea
node src/cli.js build "UPI escrow app for rental deposits, mobile-first, for Indian users"
```

### 3. Generate Architecture & Tasks (Phase 2)

```bash
# Run Phase 2 on your most recent project
node src/cli.js continue

# Or specify a project
node src/cli.js continue workspace/your-project-name
```

### 4. Generate Working Code (Phase 3)

```bash
# Generate complete frontend, backend, and database code
node src/cli.js generate-code

# Or specify a project
node src/cli.js generate-code workspace/your-project-name
```

### 5. Generate Prototype Prompt (Phase 4)

```bash
# Generate UI prototype prompt for Lovable, v0.dev, etc.
node src/cli.js generate-prototype

# Or specify a project
node src/cli.js generate-prototype workspace/your-project-name
```

### 6. Review & Run Output

```bash
# Phase 1 outputs
cat workspace/your-project/product/brief.md
cat workspace/your-project/product/prd.md

# Phase 2 outputs (architecture & tasks)
cat workspace/your-project/docs/architecture.mmd
cat workspace/your-project/docs/api.yaml
cat workspace/your-project/product/backlog.json

# Phase 3 outputs (working code)
cd workspace/your-project/backend
npm install && npm run dev   # Backend on :3001

cd workspace/your-project/frontend
npm install && npm run dev   # Frontend on :3000

# Phase 4 output (prototype prompt)
cat workspace/your-project/prototype/Prototype-prompt.txt
```

## Example Use Cases

### Example 1: Fintech App
```bash
pbc build "UPI escrow simulator for rental deposits. Mobile-first PWA for Indian renters aged 25-35. Zero-cost infrastructure. Must integrate with mock UPI payment gateway."
```

**Output:**
- `product/brief.md` - Problem statement, users, solution
- `product/prd.md` - Full requirements with user stories, features, technical constraints
- `metadata.json` - Build metadata

### Example 2: SaaS Tool
```bash
pbc build "Event RSVP management tool for college clubs. Web-first, supports Google Calendar sync. Free tier hosting."
```

### Example 3: AI Tool
```bash
pbc build "AI-powered recipe generator that uses ingredients you have at home. Mobile app, works offline, targets busy professionals."
```

## Project Structure

```
product-builder-coworker/
├── src/
│   ├── cli.js                 # CLI interface
│   ├── orchestrator.js        # Main workflow coordinator
│   ├── config.js              # Configuration
│   ├── agents/
│   │   └── product-planner.js # Phase 1 agent
│   ├── prompts/
│   │   ├── prompt-loader.js
│   │   ├── clarifying-questions.txt
│   │   ├── product-brief.txt
│   │   └── product-prd.txt
│   └── utils/
│       └── file-manager.js    # File operations
├── workspace/                 # Generated projects go here
│   └── [your-project]/
│       ├── product/
│       │   ├── brief.md
│       │   └── prd.md
│       ├── docs/
│       ├── ui/
│       ├── backend/
│       ├── frontend/
│       ├── logs/
│       └── README.md
└── package.json
```

## How It Works

### Phase 1: Product Discovery (Current)

1. **Input Processing**: Takes your rough idea
2. **Clarifying Questions**: Asks 3-5 targeted questions (can be skipped)
3. **Brief Generation**: Creates 1-page product brief with:
   - Problem statement
   - Target users
   - Proposed solution
   - Constraints & assumptions
   - Success criteria
4. **PRD Generation**: Writes comprehensive PRD with:
   - User personas
   - User stories (MVP scope)
   - Functional requirements
   - Technical constraints
   - UX requirements
   - Launch criteria

### Phase 2: Architecture & Tasks (Complete)

- Break PRD into epics, stories, and tasks
- Generate system architecture diagram (Mermaid)
- Create OpenAPI 3.0 API schema
- Generate data model and database schema
- Output backlog as GitHub Issues format
- Create technical architecture document

### Phase 3: Code Generation (Complete)

- Generate complete Express backend with JWT auth
- Generate Next.js 14 frontend with TypeScript
- Create SQLite database schema
- Add Tailwind CSS styling
- Generate 22-33 working files
- Mobile-first responsive design
- Working authentication system

### Phase 4: Prototype Prompt (Complete)

- Generate comprehensive UI prototype prompt
- Extract product details, features, and flows
- Include design specifications and components
- Mobile-first and accessibility requirements
- Ready for Lovable, v0.dev, Framer AI, Base44

## CLI Commands

```bash
# Phase 1: Generate Brief + PRD
pbc build "your product idea here"
pbc build --skip-questions              # Skip clarifying questions
pbc build --output ./my-projects        # Custom output directory
pbc build --name my-awesome-app         # Custom project name

# Phase 2: Generate Architecture + Tasks
pbc continue                            # Use most recent project
pbc continue workspace/my-project       # Specify project

# Phase 3: Generate Working Code
pbc generate-code                       # Use most recent project
pbc generate-code workspace/my-project  # Specify project

# Phase 4: Generate Prototype Prompt
pbc generate-prototype                  # Use most recent project
pbc generate-prototype workspace/my-project  # Specify project

# Setup
pbc init                                # Initialize configuration
```

## Configuration

Edit `.env` file:

```env
# Required
ANTHROPIC_API_KEY=your_key_here

# Optional (for future phases)
GITHUB_TOKEN=your_token_here
COMPOSIO_API_KEY=your_key_here

# Model settings
MODEL=claude-sonnet-4-20250514
```

## Cost Estimation

**Phase 1:** Brief + PRD generation: ~$0.10-0.20
**Phase 2:** Architecture + Tasks: ~$0.15-0.25
**Phase 3:** Code Generation: ~$0.30-0.40
**Phase 4:** Prototype Prompt: ~$0.05-0.10

**Complete Pipeline (All 4 Phases):** ~$0.60-0.95 per project
**Time:** 5-10 minutes total
**vs Manual:** 20-40 hours, $800-1,600

Uses Claude Sonnet (fast, high quality, cost-optimized)

## Development Roadmap

- [x] **Phase 1:** Product Brief + PRD Generation
  - [x] Clarifying questions agent
  - [x] Brief generation
  - [x] PRD generation
  - [x] File management system
  - [x] CLI interface

- [x] **Phase 2:** Tasks & Architecture
  - [x] Task decomposition agent
  - [x] GitHub Issues format generation
  - [x] System architecture diagram generator (Mermaid)
  - [x] OpenAPI 3.0 schema generator
  - [x] Data model generator
  - [x] Technical architecture document

- [x] **Phase 3:** Code Generation
  - [x] Backend code generator (Express + SQLite)
  - [x] Frontend code generator (Next.js 14 + TypeScript)
  - [x] Database schema generator
  - [x] Authentication system (JWT + bcrypt)
  - [x] Mobile-first responsive design
  - [x] Token-optimized generation

- [x] **Phase 4:** Prototype Prompt
  - [x] Comprehensive UI prompt generator
  - [x] Product detail extraction
  - [x] Design specifications
  - [x] Component requirements
  - [x] Compatible with Lovable, v0.dev, Framer AI, Base44

**All Core Phases Complete! 🎉**

## Contributing

This is a portfolio project demonstrating AI-powered product development. Built by an aspiring AI PM to showcase:

- Product thinking (scope, constraints, user focus)
- Technical execution (architecture, APIs, deployment)
- AI agent design (prompt engineering, workflow orchestration)
- End-to-end delivery (idea to shipped product)

## License

MIT

## Contact

Built as a career portfolio project. Feedback welcome!

---

**Status:** All Phases Complete ✅ | Ready for Production 🚀

**See:** `PHASE3_AND_4_COMPLETE.md` and `IMPLEMENTATION_SUMMARY.md` for detailed documentation
