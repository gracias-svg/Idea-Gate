# Usage Guide

## Getting Started

### Step 1: Install Dependencies

```bash
cd product-builder-coworker
npm install
```

### Step 2: Configure API Key

```bash
# Copy example config
cp .env.example .env

# Edit .env and add your Anthropic API key
# Get one from: https://console.anthropic.com/
```

Your `.env` should look like:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
MODEL=claude-sonnet-4-20250514
```

### Step 3: Run Your First Build

**Option A: Interactive Mode**
```bash
node src/cli.js build
```

**Option B: Direct Mode**
```bash
node src/cli.js build "Your product idea here"
```

## Example Walkthroughs

### Example 1: Fintech App (Detailed)

```bash
node src/cli.js build "UPI escrow app for rental deposits, mobile-first, Indian users"
```

**What happens:**
1. Tool asks 3-5 clarifying questions:
   - Who exactly are the target users?
   - What platform (web/mobile/both)?
   - What are your budget constraints?
   - etc.

2. You answer (or press Enter for defaults)

3. Tool generates:
   - `workspace/upi-escrow-app/product/brief.md`
   - `workspace/upi-escrow-app/product/prd.md`
   - `workspace/upi-escrow-app/README.md`
   - `workspace/upi-escrow-app/metadata.json`

4. Review outputs:
```bash
cat workspace/upi-escrow-app/product/brief.md
cat workspace/upi-escrow-app/product/prd.md
```

### Example 2: Skip Questions (Faster)

```bash
node src/cli.js build "Event RSVP tool for college clubs" --skip-questions
```

This skips clarifying questions and generates based on the initial idea only.

### Example 3: Custom Output Location

```bash
node src/cli.js build "Recipe generator AI app" --output ~/my-projects --name recipe-ai
```

Output goes to: `~/my-projects/recipe-ai/`

## Understanding the Output

### Directory Structure

```
workspace/your-project/
├── product/
│   ├── brief.md          # 1-page product overview
│   └── prd.md            # Full requirements document
├── docs/                 # (Phase 2) Architecture diagrams
├── ui/                   # (Phase 2) Wireframes
├── backend/              # (Phase 3) Generated backend code
├── frontend/             # (Phase 3) Generated frontend code
├── logs/
│   └── build.log         # Build process log
├── metadata.json         # Build metadata
└── README.md             # Project overview
```

### Product Brief (brief.md)

Contains:
- Problem statement (what problem exists?)
- Target users (who has this problem?)
- Proposed solution (how will we solve it?)
- Constraints (platform, budget, timeline)
- Key assumptions & risks
- Success criteria (how we'll measure success)

**Purpose:** Quick overview for stakeholders, investors, or team alignment.

### PRD (prd.md)

Contains:
- Executive summary
- Goals & success metrics
- User personas
- User stories (MVP scope)
- Functional requirements (features with acceptance criteria)
- Technical constraints
- UX requirements
- Data model
- Launch requirements

**Purpose:** Detailed spec for developers, designers, and QA to build from.

## Common Workflows

### Workflow 1: Iterate on PRD

```bash
# Generate initial version
node src/cli.js build "Your idea"

# Review the PRD
cat workspace/your-project/product/prd.md

# Edit manually if needed
nano workspace/your-project/product/prd.md

# Later: Continue to Phase 2 (when implemented)
# pbc continue workspace/your-project
```

### Workflow 2: Generate Multiple Variants

```bash
# Generate variant A
node src/cli.js build "SaaS tool for freelancers" --name freelance-tool-v1

# Generate variant B with different constraints
node src/cli.js build "SaaS tool for freelancers, mobile-first, offline support" --name freelance-tool-v2

# Compare the two PRDs
diff workspace/freelance-tool-v1/product/prd.md workspace/freelance-tool-v2/product/prd.md
```

### Workflow 3: Use for Interview Prep

Generate multiple projects in different domains:

```bash
# Fintech
node src/cli.js build "P2P lending platform for students" --name fintech-demo

# Social
node src/cli.js build "Anonymous feedback tool for teams" --name social-demo

# AI/ML
node src/cli.js build "AI resume analyzer and improver" --name ai-demo

# Now you have 3 diverse projects to showcase
ls workspace/
```

## Tips for Better Results

### 1. Be Specific in Your Idea

❌ **Vague:** "A social media app"
✅ **Specific:** "Instagram-style photo sharing for pet owners, web-first, focuses on local pet adoption events"

### 2. Include Constraints

Always mention:
- Platform (web/mobile/desktop)
- Target users (demographics, behavior)
- Budget constraints
- Geographic/regulatory needs

### 3. Use Domain-Specific Language

❌ **Generic:** "A payment app"
✅ **Domain-specific:** "UPI-based escrow app for rental deposits with auto-release after 30 days"

### 4. Answer Clarifying Questions Thoughtfully

The agent's questions are designed to:
- Narrow scope (prevent over-building)
- Identify technical constraints
- Clarify success criteria

Take 30 seconds to answer each - it dramatically improves output quality.

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY is required"

**Solution:**
```bash
# Make sure .env exists
ls -la .env

# Check it has your key
cat .env

# If missing, create it
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env
```

### Issue: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: Output quality is poor

**Solutions:**
1. Provide more detail in your initial idea
2. Answer clarifying questions (don't skip)
3. Try different phrasing
4. Check you're using Claude Sonnet (not Haiku)

### Issue: Cost concerns

**Current costs (Phase 1):**
- Brief generation: ~5,000 tokens = $0.015
- PRD generation: ~8,000 tokens = $0.024
- **Total per project: ~$0.04-0.10**

**To reduce costs:**
- Use `--skip-questions` flag
- Batch multiple ideas before running
- Use Haiku model (edit MODEL in .env) - faster but lower quality

## Next Steps

Once Phase 2 is implemented:

```bash
# Continue from Phase 1 to Phase 2
pbc continue workspace/your-project

# Or run full pipeline
pbc build "Your idea" --full-pipeline
```

## Getting Help

1. Check the README.md
2. Review generated logs: `cat workspace/your-project/logs/build.log`
3. Examine metadata: `cat workspace/your-project/metadata.json`
4. Check prompt templates: `cat src/prompts/*.txt`

---

**Happy building!** 🚀
