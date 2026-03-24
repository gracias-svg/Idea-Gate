# Visual Guide to Product Builder Coworker

## What You Built - Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  INPUT: "UPI escrow app for rental deposits, mobile-first"     │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                  ╔═══════════════════╗
                  ║   CLI Interface   ║
                  ║   (src/cli.js)    ║
                  ╚═════════┬═════════╝
                            │
                            ▼
         ┌──────────────────────────────────┐
         │  Clarifying Questions Agent      │
         │  • Who are target users?         │
         │  • What platform?                │
         │  • Budget constraints?           │
         └──────────────┬───────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │  User Answers                    │
         │  • Renters aged 25-35            │
         │  • Mobile PWA                    │
         │  • Zero-cost infra               │
         └──────────────┬───────────────────┘
                        │
                        ▼
         ╔══════════════════════════════════╗
         ║  Product Planner Agent           ║
         ║  (src/agents/product-planner.js) ║
         ╚══════════════╤═══════════════════╝
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ Prompt  │   │ Anthropic│   │ Prompt  │
    │ Loader  │───│  Claude  │───│ Loader  │
    └─────────┘   └─────────┘   └─────────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
                        ▼
         ╔══════════════════════════════════╗
         ║        File Manager              ║
         ║    (src/utils/file-manager.js)   ║
         ╚══════════════╤═══════════════════╝
                        │
                        ▼
         ┌──────────────────────────────────┐
         │  workspace/upi-escrow-app/       │
         │  ├── product/                    │
         │  │   ├── brief.md      ✅       │
         │  │   └── prd.md        ✅       │
         │  ├── docs/                       │
         │  ├── ui/                         │
         │  ├── backend/                    │
         │  ├── frontend/                   │
         │  ├── logs/                       │
         │  │   └── build.log               │
         │  ├── metadata.json               │
         │  └── README.md                   │
         └──────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │  OUTPUT: Complete Product Spec   │
         │  • Problem statement             │
         │  • Target users & personas       │
         │  • User stories (5-7)            │
         │  • Features with acceptance      │
         │  • Technical constraints         │
         │  • Success metrics               │
         └──────────────────────────────────┘
```

## File Flow Diagram

```
User runs: node src/cli.js build "idea"
   │
   ├─► src/cli.js
   │      │
   │      ├─► Parses arguments
   │      ├─► Shows spinner
   │      └─► Calls orchestrator
   │
   ├─► src/orchestrator.js
   │      │
   │      ├─► Validates config
   │      ├─► Calls ProductPlannerAgent
   │      └─► Calls FileManager to save
   │
   ├─► src/agents/product-planner.js
   │      │
   │      ├─► askClarifyingQuestions()
   │      │      │
   │      │      └─► src/prompts/prompt-loader.js
   │      │             │
   │      │             └─► loads clarifying-questions.txt
   │      │                    │
   │      │                    └─► calls Claude API
   │      │
   │      ├─► generateBrief()
   │      │      │
   │      │      └─► loads product-brief.txt
   │      │             │
   │      │             └─► calls Claude API
   │      │
   │      └─► generatePRD()
   │             │
   │             └─► loads product-prd.txt
   │                    │
   │                    └─► calls Claude API
   │
   └─► src/utils/file-manager.js
          │
          ├─► createProjectStructure()
          ├─► saveFile(brief.md)
          ├─► saveFile(prd.md)
          ├─► saveJSON(metadata.json)
          └─► generateReadme()
```

## Prompt Template System

```
src/prompts/
├── prompt-loader.js
│   ├── load(templateName, variables)
│   ├── interpolate {{variables}}
│   └── cache templates
│
├── clarifying-questions.txt
│   INPUT: {{idea}}
│   OUTPUT: JSON with questions array
│   PURPOSE: Get specifics about users, platform, constraints
│
├── product-brief.txt
│   INPUT: {{idea}} (enriched with answers)
│   OUTPUT: Markdown brief (500 words)
│   SECTIONS: Problem, Users, Solution, Constraints, Success
│
└── product-prd.txt
    INPUT: {{idea}}, {{brief}}
    OUTPUT: Markdown PRD (2000 words)
    SECTIONS: Goals, Personas, Stories, Features, Requirements
```

## Example: UPI Escrow App Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER INPUT                                                   │
│ "UPI escrow app for rental deposits, mobile-first"          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CLARIFYING QUESTIONS                                         │
│ 1. Who exactly are the target users?                        │
│    → Renters aged 25-35 in Indian metros                   │
│ 2. What platform should this be built for?                  │
│    → Mobile-first Progressive Web App                       │
│ 3. What are your budget constraints?                        │
│    → Zero-cost infrastructure                               │
│ 4. What is the ONE feature that must work?                  │
│    → Auto-release escrow after 30 days                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ PRODUCT BRIEF (brief.md)                                    │
│                                                              │
│ # UPI Escrow for Rental Deposits                           │
│                                                              │
│ ## Problem Statement                                        │
│ Renters in Indian metros lose deposits due to lack of      │
│ trust between landlords and tenants. 70% report issues     │
│ with deposit refunds. No transparent escrow exists.         │
│                                                              │
│ ## Target Users                                             │
│ - Primary: Renters aged 25-35 in Bangalore, Mumbai, Delhi │
│ - Secondary: Landlords managing 1-5 properties             │
│                                                              │
│ ## Proposed Solution                                        │
│ Mobile-first PWA that holds rental deposits in escrow...   │
│                                                              │
│ ## Core Constraints                                         │
│ - Platform: Progressive Web App (mobile-first)             │
│ - Budget: Zero infrastructure cost                          │
│ - Timeline: MVP in 4 weeks                                  │
│                                                              │
│ [... 500 words total]                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ PRODUCT PRD (prd.md)                                        │
│                                                              │
│ # UPI Escrow - Product Requirements Document               │
│                                                              │
│ ## 1. Executive Summary                                     │
│ This PRD defines the MVP for a UPI-based escrow...         │
│                                                              │
│ ## 2. Goals & Success Metrics                              │
│ Primary Goal: Enable transparent rental deposit escrow     │
│ Metrics:                                                     │
│ - 100 deposits locked in escrow within 30 days             │
│ - 90%+ user trust score                                     │
│ - Zero fraudulent releases                                  │
│                                                              │
│ ## 3. User Personas                                         │
│ ### Primary: Priya (Renter)                                │
│ - Age 28, Software Engineer, Bangalore                     │
│ - Needs: Trust that deposit will be returned               │
│                                                              │
│ ## 4. User Stories                                          │
│ 1. As a renter, I want to lock my deposit in escrow...    │
│ 2. As a landlord, I want to request release if damage...  │
│ 3. As a renter, I want auto-release after 30 days...      │
│                                                              │
│ ## 5. Functional Requirements                               │
│ Feature 1: Escrow Lock                                     │
│ - User enters deposit amount                                │
│ - System generates UPI payment request                      │
│ - Acceptance criteria:                                      │
│   [ ] Amount validation (₹5K - ₹5L)                        │
│   [ ] UPI request generation                                │
│   [ ] Payment confirmation within 5 minutes                 │
│                                                              │
│ [... 2000 words total with 10+ features]                   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure (Visual Tree)

```
product-builder-coworker/
│
├── 📦 package.json              Configuration & dependencies
├── 🔐 .env.example              Template for API keys
├── 📋 .gitignore                Git ignore rules
│
├── 📜 README.md                 Main documentation
├── 📜 QUICKSTART.md             5-minute setup guide
├── 📜 USAGE.md                  Detailed usage instructions
├── 📜 ARCHITECTURE.md           System design deep-dive
├── 📜 PHASE1_COMPLETE.md        Phase 1 summary & metrics
│
├── 🔧 setup.sh                  Automated setup script
│
├── 📂 src/                      Source code
│   ├── 🎯 cli.js                CLI entry point
│   ├── 🎯 orchestrator.js       Workflow coordinator
│   ├── 🎯 config.js             Configuration management
│   ├── 🎯 index.js              Library exports
│   │
│   ├── 📂 agents/               AI agents
│   │   └── 🤖 product-planner.js
│   │
│   ├── 📂 prompts/              Prompt templates
│   │   ├── 🔧 prompt-loader.js
│   │   ├── 📝 clarifying-questions.txt
│   │   ├── 📝 product-brief.txt
│   │   └── 📝 product-prd.txt
│   │
│   └── 📂 utils/                Utility functions
│       └── 🔧 file-manager.js
│
├── 📂 examples/                 Example inputs
│   └── 📄 test-idea.txt
│
└── 📂 workspace/                Generated projects
    └── 📂 [project-name]/
        ├── 📂 product/
        │   ├── 📄 brief.md      Product brief
        │   └── 📄 prd.md        Requirements doc
        ├── 📂 docs/
        ├── 📂 ui/
        ├── 📂 backend/
        ├── 📂 frontend/
        ├── 📂 logs/
        │   └── 📄 build.log
        ├── 📄 metadata.json
        └── 📄 README.md
```

## Phase Progression (Roadmap)

```
CURRENT: Phase 1 ✅
┌─────────────────────────────────────────┐
│  Idea → Brief → PRD                     │
│                                          │
│  INPUT:  Rough idea                     │
│  OUTPUT: Product documentation          │
│  TIME:   30-60 seconds                  │
│  COST:   ~$0.04                         │
└─────────────────────────────────────────┘

NEXT: Phase 2 🚧
┌─────────────────────────────────────────┐
│  PRD → Tasks → Architecture             │
│                                          │
│  INPUT:  PRD from Phase 1               │
│  OUTPUT: • GitHub Issues                │
│          • Mermaid diagram              │
│          • OpenAPI schema               │
│  TIME:   45-90 seconds                  │
│  COST:   ~$0.06                         │
└─────────────────────────────────────────┘

FUTURE: Phase 3 📅
┌─────────────────────────────────────────┐
│  Architecture → Code                    │
│                                          │
│  INPUT:  API schema, PRD                │
│  OUTPUT: • Backend skeleton             │
│          • Frontend scaffold            │
│          • Landing page                 │
│  TIME:   2-3 minutes                    │
│  COST:   ~$0.15                         │
└─────────────────────────────────────────┘

FUTURE: Phase 4 📅
┌─────────────────────────────────────────┐
│  Code → Deployment                      │
│                                          │
│  INPUT:  Generated code                 │
│  OUTPUT: • GitHub repo                  │
│          • Live URL (Vercel)            │
│          • API URL (Render)             │
│  TIME:   3-5 minutes                    │
│  COST:   $0 (free tier hosting)         │
└─────────────────────────────────────────┘

COMPLETE PIPELINE (All Phases)
┌─────────────────────────────────────────┐
│  Idea → Deployed Product                │
│                                          │
│  TOTAL TIME:  ~10 minutes               │
│  TOTAL COST:  ~$0.30 + $0 hosting       │
└─────────────────────────────────────────┘
```

## Command Cheat Sheet

```
┌────────────────────────────────────────────────────────────┐
│  COMMAND                              │  WHAT IT DOES       │
├───────────────────────────────────────┼────────────────────┤
│  ./setup.sh                           │  Initial setup      │
│  node src/cli.js init                 │  Configure API key  │
│  node src/cli.js build                │  Interactive mode   │
│  node src/cli.js build "idea"         │  Direct mode        │
│  ... --skip-questions                 │  Skip Q&A           │
│  ... --output ~/dir                   │  Custom output dir  │
│  ... --name project-name              │  Custom name        │
└────────────────────────────────────────────────────────────┘
```

## Cost Breakdown (Visual)

```
Single Project (Phase 1):
┌────────────────────────────────┐
│ Clarifying Questions  $0.006   │ ▓░░░░░░░░░░░░░░
│ Brief Generation      $0.015   │ ▓▓▓░░░░░░░░░░░░
│ PRD Generation        $0.024   │ ▓▓▓▓▓░░░░░░░░░░
├────────────────────────────────┤
│ TOTAL                 ~$0.045  │ ▓▓▓▓▓▓▓▓▓░░░░░░
└────────────────────────────────┘

Portfolio of 20 Projects:
┌────────────────────────────────┐
│ 20 × $0.045         = $0.90    │
│ Equivalent PM Time  = 40 hours │
│ Equivalent Cost     = $1,200   │
│ Savings             = 99.9%    │
└────────────────────────────────┘
```

## Success Indicators

```
✅ You succeeded if:
   ├─ ./setup.sh runs without errors
   ├─ node src/cli.js build "test" generates output
   ├─ workspace/test/product/brief.md exists
   ├─ workspace/test/product/prd.md has 1500+ words
   ├─ PRD has user stories with acceptance criteria
   ├─ Brief identifies constraints clearly
   └─ Total time < 60 seconds

❌ Check these if issues:
   ├─ .env file has ANTHROPIC_API_KEY
   ├─ Node.js version >= 18
   ├─ npm install completed successfully
   ├─ API key is valid (not expired)
   └─ Internet connection is active
```

---

## Ready to Test!

```bash
cd product-builder-coworker
./setup.sh
# Add your API key to .env
node src/cli.js build "Your amazing product idea"
```

**🎉 You've built a working AI coworker!**
