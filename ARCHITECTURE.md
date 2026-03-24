# Product Builder Coworker - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Interface                        │
│                       (src/cli.js)                          │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      Orchestrator                            │
│                  (src/orchestrator.js)                      │
│  • Manages workflow phases                                  │
│  • Coordinates agents                                       │
│  • Handles file I/O                                         │
└───┬───────────────────┬──────────────────┬──────────────────┘
    │                   │                  │
    ▼                   ▼                  ▼
┌─────────┐      ┌──────────┐      ┌──────────┐
│ Phase 1 │      │ Phase 2  │      │ Phase 3  │
│ (Done)  │      │ (TODO)   │      │ (TODO)   │
└────┬────┘      └─────┬────┘      └────┬─────┘
     │                 │                 │
     ▼                 ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Product    │ │     Task     │ │     Code     │
│   Planner    │ │  Decomposer  │ │  Generator   │
│    Agent     │ │    Agent     │ │    Agent     │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Phase 1 Flow (Current Implementation)

```
User Input: "Rough product idea"
       │
       ▼
┌──────────────────────────────────────┐
│  Clarifying Questions Agent          │
│  • Loads prompt template             │
│  • Calls Claude API                  │
│  • Returns structured questions      │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  User Answers (via inquirer)         │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Brief Generation                    │
│  • Combines idea + answers           │
│  • Loads brief prompt template       │
│  • Generates 1-page brief            │
│  • Saves to product/brief.md         │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  PRD Generation                      │
│  • Uses brief as context             │
│  • Loads PRD prompt template         │
│  • Generates full PRD                │
│  • Saves to product/prd.md           │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  File Management                     │
│  • Creates project structure         │
│  • Saves all artifacts               │
│  • Generates README                  │
│  • Saves metadata.json               │
└──────────────────────────────────────┘
```

## Component Details

### 1. CLI Interface (`src/cli.js`)

**Responsibilities:**
- Parse command-line arguments
- Handle user interaction (prompts, confirmations)
- Display progress (spinners, colors)
- Error handling and user feedback

**Dependencies:**
- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `chalk` - Terminal colors
- `ora` - Spinners

### 2. Orchestrator (`src/orchestrator.js`)

**Responsibilities:**
- Coordinate workflow phases
- Manage agent lifecycle
- Handle file operations via FileManager
- Extract and structure data between phases

**Key Methods:**
- `runPhase1(idea)` - Product discovery
- `runPhase2(projectDir)` - Task decomposition (TODO)
- `runPhase3(projectDir)` - Code generation (TODO)
- `runPhase4(projectDir)` - Deployment (TODO)

### 3. Product Planner Agent (`src/agents/product-planner.js`)

**Responsibilities:**
- Load and execute prompts
- Call Claude API
- Parse and structure responses
- Extract metadata from generated docs

**Key Methods:**
- `askClarifyingQuestions(idea)` - Generate questions
- `generateBrief(enrichedIdea)` - Create brief
- `generatePRD(idea, brief)` - Create PRD
- `extractPRDMetadata(prd)` - Parse PRD sections

### 4. Prompt System (`src/prompts/`)

**Templates:**
- `clarifying-questions.txt` - Question generation
- `product-brief.txt` - Brief structure
- `product-prd.txt` - PRD structure

**Loader (`prompt-loader.js`):**
- Loads templates from disk
- Interpolates variables `{{variable}}`
- Caches templates for performance

### 5. File Manager (`src/utils/file-manager.js`)

**Responsibilities:**
- Create project directory structure
- Save files (markdown, JSON)
- Read files
- Generate boilerplate (README)
- Log operations

**Standard Project Structure:**
```
workspace/project-name/
├── product/
│   ├── brief.md
│   └── prd.md
├── docs/
├── ui/
├── backend/
├── frontend/
├── logs/
│   └── build.log
├── metadata.json
└── README.md
```

## Data Flow

### Input → Output

```
Input:
  "UPI escrow app for rental deposits"

Step 1: Clarifying Questions
  → Questions: JSON array
  → User answers: String array

Step 2: Brief Generation
  → Input: idea + answers
  → Output: Markdown document (500 words)

Step 3: PRD Generation
  → Input: idea + brief
  → Output: Markdown document (2000 words)

Step 4: File Operations
  → Saves all to workspace/[sanitized-name]/
  → Returns paths to saved files

Final Output:
  {
    projectName: "upi-escrow-app",
    projectDir: "/path/to/workspace/upi-escrow-app",
    briefPath: "/path/to/workspace/upi-escrow-app/product/brief.md",
    prdPath: "/path/to/workspace/upi-escrow-app/product/prd.md",
    brief: "<full brief content>",
    prd: "<full prd content>"
  }
```

## Prompt Engineering Strategy

### 1. Clarifying Questions Prompt

**Goal:** Generate 3-5 focused questions
**Structure:**
- Context: User's rough idea
- Instructions: Ask about users, problem, platform, constraints, features
- Format: JSON with questions + suggestions

**Why this works:**
- Structured output (JSON) for easy parsing
- Suggestions guide user input
- Focus on constraints (critical for technical decisions)

### 2. Brief Prompt

**Goal:** 1-page concise overview
**Structure:**
- Problem statement (WHY)
- Target users (WHO)
- Solution (WHAT)
- Constraints (HOW/LIMITS)
- Success criteria (METRICS)

**Why this works:**
- Forces constraint thinking
- Creates alignment before diving deep
- Reusable for stakeholder communication

### 3. PRD Prompt

**Goal:** Comprehensive technical spec
**Structure:**
- User stories (behavior-focused)
- Functional requirements (acceptance criteria)
- Technical constraints (platform, budget)
- UX requirements (screens, flows)
- Launch criteria (definition of done)

**Why this works:**
- Detailed enough for developers
- Includes acceptance criteria (testable)
- Balanced: not too abstract, not too prescriptive

## Configuration System

### Environment Variables (`.env`)

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx    # Required
GITHUB_TOKEN=ghp_xxxxx             # Phase 2
COMPOSIO_API_KEY=xxxxx             # Phase 2
MODEL=claude-sonnet-4-20250514     # Optional
```

### Config Object (`src/config.js`)

**Exports:**
- API keys
- Model settings (model, temperature, max_tokens)
- Directory paths (prompts, templates, workspace)
- Validation method

## Error Handling

### Levels:

1. **CLI Level** (`src/cli.js`)
   - User-friendly messages
   - Suggest fixes
   - Exit with proper code

2. **Orchestrator Level** (`src/orchestrator.js`)
   - Log errors to build.log
   - Clean up partial outputs
   - Return structured errors

3. **Agent Level** (`src/agents/product-planner.js`)
   - Retry API calls (TODO)
   - Fallback parsing
   - Validate outputs

## Future Architecture (Phase 2-4)

### Phase 2: Task Decomposer Agent
- Parse PRD → extract features
- Convert features → user stories → tasks
- Generate GitHub Issues JSON
- Create architecture.mmd (Mermaid)
- Generate api.yaml (OpenAPI)

### Phase 3: Code Generator Agent
- Parse api.yaml → generate backend routes
- Parse PRD → generate frontend pages
- Create landing page from brief
- Add basic styling

### Phase 4: Deployment Agent
- Initialize Git repo
- Push to GitHub (via Composio)
- Deploy to Vercel (frontend)
- Deploy to Render (backend)
- Return live URLs

## Design Decisions & Trade-offs

### 1. Why Separate Phases?
**Decision:** Break into 4 distinct phases
**Rationale:**
- User can review/edit between phases
- Easier to debug
- Allows partial completion
- Clear milestones for portfolio demo

### 2. Why Anthropic Claude?
**Decision:** Use Claude instead of GPT
**Rationale:**
- Better at following complex instructions
- Stronger at structured output
- Good balance of cost/quality
- Long context window (for PRD generation)

### 3. Why Text Prompts vs JSON Schemas?
**Decision:** Use `.txt` prompt templates
**Rationale:**
- Easier to edit/iterate
- Version control friendly
- Human-readable
- Can include examples inline

### 4. Why Local File System vs Database?
**Decision:** Save to files, not DB
**Rationale:**
- Simpler to inspect (cat/less)
- Git-friendly
- No setup required
- Portable across systems

### 5. Why Node.js vs Python?
**Decision:** Node.js for implementation
**Rationale:**
- Better for CLI tools (inquirer, commander)
- Async by default (good for API calls)
- Easy to package (npm)
- Target users (web devs) likely have Node

## Performance Considerations

### Current (Phase 1):
- **Time:** ~30-60 seconds per project
- **Cost:** ~$0.04-0.10 per project
- **API Calls:** 3-4 (questions, brief, PRD)

### Optimization Opportunities:
1. **Parallel API calls** (where possible)
2. **Caching** common responses
3. **Streaming** for long outputs
4. **Retry logic** with exponential backoff

## Testing Strategy (TODO)

### Unit Tests:
- Prompt loader
- File manager operations
- Config validation
- Name sanitization

### Integration Tests:
- Full Phase 1 flow
- Agent API calls (mocked)
- File creation

### E2E Tests:
- CLI commands
- User interaction flows
- Output validation

---

**Note:** This architecture is designed for iterative development. Each phase can be built, tested, and demoed independently.
