🧠 PRODUCT BUILDER COWORKER
🔥 MASTER CONTEXT + SESSION MEMORY DOCUMENT
1. 🧾 PROJECT OVERVIEW
🔹 What is this project?

Product Builder Coworker (PBC) is an:

AI-powered multi-phase product generation system
that converts an idea → PRD → architecture → code → prototype

🔹 Core Goal
Turn any idea into a working product with minimal human input
🔹 Current Capabilities
Phase	Output
Phase 1	Product Brief + PRD
Phase 2	Tasks + Architecture + API
Phase 3	Backend + Frontend + DB
Phase 4	UI Prototype Prompt
🔹 Tech Stack

Node.js (CLI system)

LLM:

Primary: Ollama (local)

Fallback: OpenRouter

Agents:

Product Planner

Task Decomposer

Architect

Code Generator

Prototype Prompter

2. 🧠 SESSION CONTEXT MEMORY (CRITICAL)
🔹 Problem

LLMs are stateless → lose context between runs/chats

🔹 Solution

Build a multi-layer memory system

🔹 Memory Layers
1. Session Memory (Short-term)

current run

last steps

active phase

2. Project Memory (Persistent)

PRD

Brief

Architecture

Metadata

3. Agent Memory (Execution history)

decisions taken

tools used

failures

4. Global Memory (Future)

reusable learnings

patterns across projects

🔹 Standard Memory Schema
{
  "projectId": "sparklesans",
  "phase": "phase3",
  "lastUpdated": "timestamp",
  "artifacts": {
    "brief": "product/brief.md",
    "prd": "product/prd.md",
    "architecture": "docs/architecture.mmd"
  },
  "history": [
    {
      "step": "generate_prd",
      "input": "idea",
      "output": "prd",
      "model": "qwen",
      "status": "success"
    }
  ]
}
🔹 Context Loading Rules
IF same session:
  → load session memory

IF new session:
  → load project memory

IF long context:
  → summarize previous outputs
🔹 Context Builder (IMPORTANT)

Instead of raw prompts:

{
  role: "Product Manager",
  task: "Generate PRD",
  context: {
    brief: "...",
    constraints: "...",
    previous_steps: [...]
  }
}
3. 🏗️ SYSTEM ARCHITECTURE
🔹 High-Level Architecture
User (CLI)
   ↓
CLI Controller (cli.js)
   ↓
Orchestrator
   ↓
Agent Layer
   ↓
Prompt Loader
   ↓
LLM Router
   ↓
(Ollama OR OpenRouter)
   ↓
Response
   ↓
File Manager (writes files)
   ↓
Memory System (stores context)
🔹 LLM Routing Architecture
            LLM Router
           /          \
     Ollama        OpenRouter
   (Local)         (Fallback)
Logic:
try {
  use Ollama
} catch {
  fallback to OpenRouter
}
🔹 Agent Flow
User Input
   ↓
Agent Selected
   ↓
Prompt Generated
   ↓
LLM Call
   ↓
Output Parsed
   ↓
Saved to File
   ↓
Stored in Memory
🔹 Future Autonomous Loop
WHILE goal_not_complete:
   plan()
   execute()
   observe()
   update_memory()
4. 🔄 DATA FLOW
🔹 Phase Flow
Idea
 ↓
Product Planner
 ↓
Brief + PRD
 ↓
Task Decomposer
 ↓
Backlog
 ↓
Architect
 ↓
API + Architecture
 ↓
Code Generator
 ↓
Backend + Frontend
 ↓
Prototype Prompter
 ↓
UI Prompt
🔹 Storage Flow
LLM Output
   ↓
FileManager
   ↓
workspace/project/
   ↓
metadata.json updated
5. 📁 FOLDER STRUCTURE
🔹 Current (Working)
src/
├── agents/
├── utils/
├── prompts/
├── orchestrator.js
├── cli.js
├── config.js

workspace/
└── project-name/
🔹 Recommended (Upgraded)
src/
├── agents/
│   ├── product-planner.js
│   ├── task-decomposer.js
│   ├── architect.js
│   ├── code-generator.js
│   └── prototype-prompter.js
│
├── memory/
│   ├── session-memory.js
│   ├── project-memory.js
│   ├── context-builder.js
│   └── vector-store.js
│
├── llm/
│   ├── router.js
│   ├── ollama.js
│   └── openrouter.js
│
├── tools/
│   ├── file-manager.js
│   ├── web-tools.js
│   └── system-tools.js
│
├── orchestrator.js
├── cli.js
├── config.js

memory/
├── sessions/
├── projects/

workspace/
├── sparklesans/
6. 📄 REQUIRED DOCUMENTS
🔹 Core Documents
File	Purpose
PROJECT_OVERVIEW.md	What this system is
ARCHITECTURE.md	System design
MEMORY_SPEC.md	Memory system
AGENT_FLOW.md	Agent logic
LLM_ROUTING.md	Model strategy
🔹 Technical Specs
File	Purpose
context-schema.json	Context format
session-schema.json	Session structure
project-schema.json	Project structure
🔹 Agent Docs
File	Purpose
planner.md	Phase 1
decomposer.md	Phase 2
architect.md	Phase 2
coder.md	Phase 3
prompter.md	Phase 4
🔹 Dev Docs
File	Purpose
SETUP.md	Setup guide
RUNBOOK.md	Debugging
TROUBLESHOOTING.md	Common issues
🔹 Execution Logs
File	Purpose
logs/session.json	Run history
logs/errors.log	Failures
7. ⚠️ LESSONS LEARNED (VERY IMPORTANT)
🔴 1. LLM instability

Ollama fails → timeout / socket issues

OpenRouter fails → credits / config

👉 Solution: hybrid fallback

🔴 2. Context overload

PRD prompts too large
👉 Solution:

trim

chunk

structured context

🔴 3. CLI confusion

pbc not installed globally
👉 Solution:

use node src/cli.js

or npm link

🔴 4. Model limitations

7B local model struggles with long reasoning
👉 Solution:

use fallback for heavy tasks

8. 🚀 FUTURE ROADMAP
🔹 Immediate

Fix Ollama stability

Add retries + streaming

Reduce prompt size intelligently

🔹 Next Level

Add memory system

Add session resume

Add agent loop

🔹 Advanced

Multi-agent collaboration

Tool execution (filesystem, browser)

Autonomous workflows

9. 🧠 FINAL SUMMARY

You have built:

Idea → Product → Architecture → Code → Prototype

But what you are actually building is:

Autonomous AI Product Builder System
🚨 IMMEDIATE ISSUE 

🔴 Problem: Output Quality Degradation
Symptoms observed:
PRD → incomplete / shallow
Product Brief → 2–3 lines only
Prototype Prompt → under-detailed
Overall → loss of depth, structure, and usefulness

🔴 Root Cause
Aggressive prompt trimming + low token limits + weak local model capacity
Specifically:
FactorImpact
Prompt trimming (12k char cap)
Context loss
max_tokens reduced
Output cut short
temperature lowered
Less expressive output
Qwen 7B local
Struggles with long structured tasks

🔴 Why This Happened
You optimized for:
Stability + cost + speed
But broke:
Depth + completeness + documentation quality

✅ REQUIRED FIX STRATEGY (IMMEDIATE STEP)
Add this section in your project docs:

🛠️ Immediate Fix: Restore Output Quality
1. Increase Output Tokens
max_tokens: 3000–5000
👉 PRDs and architecture NEED long outputs

2. Relax Prompt Trimming
Instead of:
trimPrompt(prompt, 12000)
👉 Change strategy:
Keep full prompt
Only trim history, not instructions

3. Split Large Tasks (CRITICAL)
Instead of:
Generate full PRD in one go ❌
Do:
Generate section by section ✅
Example:
Step 1 → Executive Summary  
Step 2 → Personas  
Step 3 → Features  
Step 4 → Technical  
👉 This is the BIGGEST upgrade you can do

4. Model Strategy Fix
TaskModel
Small tasks
Ollama
Heavy docs (PRD, Arch)
OpenRouter
👉 Smart routing instead of blind fallback

5. Add "STRICT OUTPUT DEPTH" Instruction
Add this to ALL prompts:
You must generate a detailed, structured, and complete output.
Do not summarize. Do not shorten.
Expand each section with depth suitable for real product documentation.

⚠️ System Constraint: Documentation Quality vs Performance
High-quality product outputs require:
- Large context
- High token limits
- Strong models

Aggressive optimization will degrade output quality.

⚡ 2-LINE EXPLANATION (AS YOU REQUESTED)
👉 Add this in your docs:
OpenRouter worked because it uses large, high-capacity cloud models capable of handling long structured prompts and generating detailed outputs.

Ollama failed because local models (7B–8B) have limited context, slower inference, and struggle with long, multi-section document generation tasks.

🔥 FINAL POSITIONING (IMPORTANT)
Right now your system is:
Functionally correct ✅
Architecturally solid ✅
Quality degraded ❌

🚀 WHAT WE DO NEXT (RECOMMENDED)
Next step should be:
🔥 “QUALITY RESTORATION MODE”
We will:
Convert PRD generation → multi-step
Add structured output enforcement
Add intelligent model routing
Keep Ollama for light tasks only
🧠 1. CONTEXT & SESSION MEMORY SPEC (FOUNDATION)

This is the core problem you’re solving:

Stateless LLM → Stateful Agent System
🔹 1.1 Memory Layers (VERY IMPORTANT)

You need 4 layers of memory:

Layer	Purpose	Storage
Session Memory	Current run context	In-memory / Redis
Project Memory	Persistent project state	JSON / DB
Agent Memory	Tool history, decisions	Vector DB
Global Memory	Cross-project learning	Vector DB
🔹 1.2 Memory Object Schema (STANDARD)
{
  "sessionId": "uuid",
  "projectId": "sparklesans",
  "phase": "phase2",
  "timestamp": "ISO",
  "input": "user prompt",
  "output": "agent output",
  "agent": "product-planner",
  "toolsUsed": ["web-search", "file-write"],
  "model": "qwen3:8b",
  "tokens": {
    "input": 1200,
    "output": 800
  },
  "metadata": {
    "latency": 1200,
    "success": true
  }
}
🔹 1.3 Context Packing Strategy

Instead of sending raw prompts → build structured context:

{
  system: "...role + constraints",
  memory: {
    recent: [...last 5 steps],
    project: {...brief, prd},
    tools: [...available tools]
  },
  task: "Generate PRD",
  input: "user idea"
}

👉 This fixes:

hallucination

context overflow

inconsistency

🔹 1.4 Session Continuity Logic
IF same session:
  → load session memory

IF new session + project exists:
  → load project memory

IF long gap:
  → summarize previous state
🏗️ 2. FULL SYSTEM ARCHITECTURE
🔹 2.1 High-Level Architecture
                ┌────────────────────────┐
                │      USER (CLI/UI)     │
                └──────────┬─────────────┘
                           │
                    ┌──────▼──────┐
                    │ Orchestrator │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌──────▼──────┐
│ Agent Layer  │  │ Memory Engine   │  │ Tool Layer  │
│ (Planner etc)│  │ (Context Mgmt)  │  │ (Composio)  │
└───────┬──────┘  └────────┬────────┘  └──────┬──────┘
        │                  │                  │
        └──────────┬───────┴──────────┬──────┘
                   │                  │
            ┌──────▼──────┐   ┌───────▼───────┐
            │ LLM Router  │   │ Storage Layer │
            │ (Hybrid)    │   │ JSON/VectorDB │
            └─────────────┘   └───────────────┘
🔹 2.2 LLM Routing Architecture
                ┌───────────────┐
                │   Orchestrator │
                └──────┬────────┘
                       │
         ┌─────────────▼─────────────┐
         │       LLM Router          │
         └──────┬─────────┬──────────┘
                │         │
        ┌───────▼───┐ ┌───▼────────┐
        │ Ollama     │ │ OpenRouter │
        │ (local)    │ │ (fallback) │
        └────────────┘ └────────────┘
Routing Logic
try {
  return ollama(prompt);
} catch {
  return openrouter(prompt);
}
🔹 2.3 Agent Decision Flow
User Input
   ↓
Intent Detection
   ↓
Task Breakdown
   ↓
Agent Selection
   ↓
Context Assembly
   ↓
LLM Call
   ↓
Tool Execution (if needed)
   ↓
Memory Update
   ↓
Response
🔹 2.4 Autonomous Loop (FUTURE)
WHILE goal_not_complete:
    plan()
    act()
    observe()
    update_memory()

👉 This is where OCC becomes real agent

🔄 3. DATA FLOW (END-TO-END)
User Idea
   ↓
CLI (cli.js)
   ↓
Orchestrator
   ↓
Agent (Planner)
   ↓
PromptLoader
   ↓
LLM (Ollama/OpenRouter)
   ↓
Output
   ↓
FileManager → saves:
   - brief.md
   - prd.md
   - metadata.json
   ↓
Memory Layer → stores session
📁 4. FOLDER STRUCTURE (UPGRADED)
product-builder-coworker/
│
├── src/
│   ├── agents/
│   │   ├── product-planner.js
│   │   ├── task-decomposer.js
│   │   ├── architect.js
│   │   ├── code-generator.js
│   │   └── prototype-prompter.js
│   │
│   ├── memory/
│   │   ├── session-memory.js
│   │   ├── project-memory.js
│   │   ├── vector-store.js
│   │   └── context-builder.js
│   │
│   ├── llm/
│   │   ├── router.js
│   │   ├── ollama.js
│   │   └── openrouter.js
│   │
│   ├── tools/
│   │   ├── file-tools.js
│   │   ├── web-tools.js
│   │   └── composio-tools.js
│   │
│   ├── orchestrator.js
│   ├── cli.js
│   └── config.js
│
├── memory/
│   ├── sessions/
│   ├── projects/
│   └── embeddings/
│
├── workspace/
│   └── <projects>
│
├── docs/
│   ├── architecture.md
│   ├── memory-spec.md
│   ├── api-spec.md
│   └── agent-design.md
│
└── .env
🧠 5. MEMORY ARCHITECTURE DIAGRAM
             ┌────────────────────┐
             │   Context Builder   │
             └─────────┬──────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼────────┐
│ Session Mem  │ │ Project Mem │ │ Vector Mem  │
└──────────────┘ └────────────┘ └─────────────┘
📄 6. REQUIRED DOCUMENTS (CRITICAL)

You should create these:

🔹 Core Docs
File	Purpose
memory-spec.md	Full memory design
architecture.md	System architecture
agent-design.md	Agent roles + flows
llm-routing.md	Provider strategy
api-spec.md	Internal APIs
🔹 Technical Docs
File	Purpose
context-schema.json	Standard memory format
session-schema.json	Session structure
project-schema.json	Project structure
tool-contracts.md	Tool interfaces
🔹 Dev Docs
File	Purpose
CONTRIBUTING.md	Dev onboarding
SETUP.md	Setup guide
RUNBOOK.md	Debugging guide
🔹 Agent Docs
File	Purpose
planner.md	Product planner logic
architect.md	Architecture agent
coder.md	Code generator
executor.md	Future execution agent
🚀 7. WHAT YOU’VE BUILT (REALITY)

You are not building a CLI.

You are building:

Autonomous AI Product Builder System

With:

Multi-agent pipeline

Hybrid LLM routing

Persistent memory (next step)

Code generation engine

UI generation bridge

🔥 8. NEXT LEVEL (WHAT WE SHOULD DO NEXT)

We should now:

1. Add memory layer (MOST IMPORTANT)

session persistence

resume capability

2. Add agent loop

not linear phases

goal-driven system

3. Fix Ollama properly

streaming

chunking

retries

4. Add tool execution

filesystem

browser

APIs

🧠 FINAL INSIGHT

Right now:

You built: Sequential AI pipeline

Next step:

Convert → Autonomous agent system