# 🚀 Idea Gate (Product Multi-Agent Team V2)

A PM lifecycle-driven, multi-agent AI system that transforms:

👉 **IDEA → FULL PRODUCT → PROTOTYPE PROMPT**

---

## 🔥 What This Is

Idea Gate is not a prompt tool.

It is a:

* 🧠 **AI Product Team Simulator**
* ⚙️ **Lifecycle-driven execution engine**
* 📊 **Product Operating System**

It simulates how real product teams work:

* Product Manager
* Designer
* Engineer
* QA

---

## 🧩 Problem

Most AI tools:

* Skip discovery
* Generate shallow PRDs
* Lose context across steps
* Lack structured product thinking

---

## ✅ Solution

Idea Gate enforces a **real product lifecycle**:

```
0 → Idea Intake  
1 → Discovery  
2 → Problem Definition  
3 → Solution Design  
4 → MVP Hypothesis  
5 → Validation  
6 → Prioritization  
7 → PRD  
8 → UX Design  
9 → Usability Planning  
10 → Architecture  
11 → Backlog & Release Planning  
12 → Implementation Planning  
13 → QA & Readiness  
14 → Prototype Prompt  
```

Each stage:

* Applies frameworks
* Generates structured artifacts
* Enforces exit criteria

---

## 🧠 System Architecture

```
User
↓
CLI (cli.js)
↓
CoordinatorAgent (PM Brain)
↓
Lifecycle Engine (Stages 0–14)
↓
Multi-Agent Execution Loop

→ Select Agents (per stage)
→ Pass Journey Context (memory)
→ Run Agents
→ Merge Outputs
→ Validate (exit criteria)
→ Log Decision (go / iterate / kill)
→ Persist Artifacts

↓
Journey Engine (Memory)
↓
Filesystem (workspace/)
↓
Stage 14 → Prototype Prompt
↓
External Builders (Lovable / v0 / Bolt)
```

---

## 🤖 Agents

* **CoordinatorAgent** → lifecycle control + decision engine
* **ProductStrategyAgent** → problem, solution, MVP, PRD
* **ResearchAgent** → discovery + validation
* **UXAgent** → flows + usability
* **ArchitectAgent** → system design
* **CodeAgent** → implementation planning
* **QAAgent** → quality + readiness

⚠️ Notes:

* Data logic is embedded within agents
* GTM layer is planned (future stage)

---

## 🧠 Key Innovations

### 1. Lifecycle Enforcement

Every stage is structured with:

* frameworks
* artifacts
* exit criteria

---

### 2. Coordinator (PM Brain)

Acts as:

* lifecycle controller
* decision engine
* quality gatekeeper

---

### 3. Persistent Memory (Journey Engine)

```json
{
  "currentStage": "...",
  "stages": {},
  "decisions": [],
  "artifacts": {}
}
```

Enables:

* continuity across stages
* traceable decisions
* non-destructive iteration

---

### 4. Multi-Agent Collaboration

Specialized agents co-create outputs per stage.

---

### 5. Prototype Prompt (Final Output)

Final output is NOT documentation.

👉 It is a **build-ready prototype prompt**

Compatible with:

* Lovable
* v0.dev
* Bolt.new

---

## ⚙️ How to Run

```bash
node src/cli.js v2 "your product idea"
```

---

## 🚨 Evolution (V1 → V2)

### V1

* Phase-based pipeline
* Stateless
* No coordination
* Weak outputs

### V2

* Lifecycle-driven system
* Multi-agent architecture
* Memory-backed (Journey Engine)
* Decision-aware execution
* Structured artifacts

---

## 🧪 Example (Coming Next)

```
/examples/upi-escrow-case/
```

Will include:

* Discovery
* Problem
* MVP
* Validation
* PRD
* Prototype Prompt

---

## 🛣️ Roadmap

### Phase 1 — Stabilization

* Improve agent coordination
* Fix parsing issues
* Strengthen artifact linking

### Phase 2 — Productization

* UI (replace CLI)
* Artifact viewer
* Stage progress tracker

### Phase 3 — Autonomy

* Background execution
* Async agent workflows
* Iterative improvement loops

---

## 💡 Why This Matters

This project demonstrates:

* Real product management thinking
* Systems design (multi-agent + lifecycle engine)
* AI + PM integration
* End-to-end execution from idea to prototype

---

## 👨‍💻 Author

Built as a Product + AI Systems project
to simulate real-world product development workflows.

---

## ⭐ Final Thought

This is not a tool.

👉 **This is a Product Operating System**
