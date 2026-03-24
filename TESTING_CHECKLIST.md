# Testing Checklist - Phase 1

Use this checklist to verify everything works before demo/interview.

## ✅ Pre-Testing Setup

- [ ] Node.js 18+ is installed (`node -v`)
- [ ] Project is in `~/product-builder-coworker/`
- [ ] All files are present (19 files, check with `find . -type f | wc -l`)
- [ ] `.env` file exists with valid `ANTHROPIC_API_KEY`
- [ ] `npm install` completed successfully
- [ ] `workspace/` directory exists

## ✅ Basic Functionality Tests

### Test 1: Setup Script
```bash
./setup.sh
```
- [ ] Script runs without errors
- [ ] Creates `.env` from `.env.example` if missing
- [ ] Reports Node.js version correctly
- [ ] Installs dependencies successfully

### Test 2: Interactive Mode
```bash
node src/cli.js build
```
- [ ] Prompts for product idea
- [ ] Accepts input (try: "Event RSVP tool")
- [ ] Asks 3-5 clarifying questions
- [ ] Shows spinner during generation
- [ ] Completes in <60 seconds
- [ ] Displays success message with paths

### Test 3: Direct Mode
```bash
node src/cli.js build "UPI escrow app for rental deposits"
```
- [ ] Accepts idea from command line
- [ ] Still asks clarifying questions
- [ ] Generates output successfully
- [ ] Creates `workspace/upi-escrow-app/` directory

### Test 4: Skip Questions Mode
```bash
node src/cli.js build "Recipe generator app" --skip-questions
```
- [ ] Skips clarifying questions
- [ ] Generates faster (~20-30 seconds)
- [ ] Still produces quality output

### Test 5: Custom Project Name
```bash
node src/cli.js build "Fitness tracker" --name workout-mvp
```
- [ ] Uses custom name (`workout-mvp`)
- [ ] Creates `workspace/workout-mvp/` directory

### Test 6: Custom Output Directory
```bash
node src/cli.js build "Music app" --output ~/test-projects
```
- [ ] Creates output in `~/test-projects/`
- [ ] Doesn't use default `workspace/`

## ✅ Output Quality Tests

For each generated project, verify:

### Brief Quality (`product/brief.md`)
- [ ] Has clear heading (# Project Name)
- [ ] **Problem Statement** section exists
- [ ] **Target Users** section exists
- [ ] **Proposed Solution** section exists
- [ ] **Core Constraints** section exists
- [ ] **Success Criteria** section exists
- [ ] Total length: 400-600 words
- [ ] Written in clear, jargon-free language
- [ ] Mentions specific constraints (platform, budget)

### PRD Quality (`product/prd.md`)
- [ ] Has document title (# Product Name - PRD)
- [ ] **Executive Summary** section exists
- [ ] **Goals & Success Metrics** section with 3-5 metrics
- [ ] **User Personas** section with at least 1 persona
- [ ] **User Stories** section with 5-7 stories
- [ ] User stories follow format: "As a [persona], I want to [action] so that [benefit]"
- [ ] **Functional Requirements** with features
- [ ] Each feature has acceptance criteria with checkboxes
- [ ] **Technical Constraints** section
- [ ] **Launch Requirements** section
- [ ] Total length: 1500-2500 words
- [ ] Specific and actionable (not vague)

### File Structure
- [ ] `product/` directory exists
- [ ] `docs/` directory exists (empty for now)
- [ ] `ui/` directory exists (empty for now)
- [ ] `backend/` directory exists (empty for now)
- [ ] `frontend/` directory exists (empty for now)
- [ ] `logs/` directory exists
- [ ] `logs/build.log` file exists (optional)
- [ ] `metadata.json` exists
- [ ] `README.md` exists

### Metadata Quality (`metadata.json`)
```bash
cat workspace/your-project/metadata.json
```
- [ ] Valid JSON format
- [ ] Has `originalIdea` field
- [ ] Has `enrichedIdea` field
- [ ] Has `projectName` field
- [ ] Has `createdAt` timestamp
- [ ] Has `phase` field (should be "phase1-complete")
- [ ] Has `artifacts` object with file paths

## ✅ Edge Cases & Error Handling

### Test 7: Missing API Key
```bash
# Temporarily rename .env
mv .env .env.backup
node src/cli.js build "test"
```
- [ ] Shows error: "ANTHROPIC_API_KEY is required"
- [ ] Suggests running `pbc init` or creating `.env`
- [ ] Exits gracefully (no crash)
- [ ] Restore: `mv .env.backup .env`

### Test 8: Invalid API Key
```bash
# Edit .env to use fake key
echo "ANTHROPIC_API_KEY=sk-ant-invalid" > .env
node src/cli.js build "test"
```
- [ ] Shows API error (not crash)
- [ ] Error message is user-friendly
- [ ] Restore valid key after test

### Test 9: Very Short Idea
```bash
node src/cli.js build "app"
```
- [ ] Prompts for more detail OR
- [ ] Generates output with warning OR
- [ ] Clarifying questions help expand it

### Test 10: Very Long Idea
```bash
node src/cli.js build "$(cat examples/test-idea.txt)"
```
- [ ] Handles long input gracefully
- [ ] Generates quality output
- [ ] Doesn't timeout

### Test 11: Special Characters
```bash
node src/cli.js build "App with $pecial ch@rs & symbols!"
```
- [ ] Sanitizes project name correctly
- [ ] Creates valid directory name
- [ ] Content preserves original text

### Test 12: Duplicate Project Names
```bash
node src/cli.js build "Event tool"
node src/cli.js build "Event tool"
```
- [ ] Second run overwrites OR
- [ ] Creates variant name (event-tool-1) OR
- [ ] Warns user about existing project

## ✅ Performance Tests

### Test 13: Speed
```bash
time node src/cli.js build "Quick test app" --skip-questions
```
- [ ] Completes in <30 seconds (with --skip-questions)
- [ ] Completes in <60 seconds (with questions)

### Test 14: Cost Tracking
Run 3 projects and estimate cost:
- [ ] Check your Anthropic Console usage
- [ ] Verify ~15K tokens per project
- [ ] Estimate cost ~$0.04-0.10 per project

### Test 15: Multiple Rapid Builds
```bash
node src/cli.js build "App 1" --skip-questions
node src/cli.js build "App 2" --skip-questions
node src/cli.js build "App 3" --skip-questions
```
- [ ] All complete successfully
- [ ] No rate limiting issues
- [ ] Each creates separate directory
- [ ] Total time <2 minutes for all 3

## ✅ Documentation Tests

### Test 16: README Clarity
- [ ] Open `README.md` in browser or editor
- [ ] Instructions are clear and easy to follow
- [ ] Examples are relevant and helpful
- [ ] Links work (if any)

### Test 17: Quick Start Guide
```bash
# Follow QUICKSTART.md exactly
cat QUICKSTART.md
```
- [ ] Can complete setup in <5 minutes
- [ ] All commands work as documented
- [ ] Output matches expectations

### Test 18: Usage Guide
- [ ] Open `USAGE.md`
- [ ] Try 2-3 example commands from the guide
- [ ] Verify they work as documented

## ✅ Code Quality Tests

### Test 19: Code Runs Without Warnings
```bash
node src/cli.js build "test" 2>&1 | grep -i warning
```
- [ ] No deprecation warnings
- [ ] No security warnings
- [ ] Clean output

### Test 20: All Dependencies Installed
```bash
npm list --depth=0
```
- [ ] No missing dependencies
- [ ] No extraneous packages
- [ ] All versions compatible

## ✅ Demo Readiness Tests

### Test 21: Demo Project (Fintech)
```bash
node src/cli.js build "UPI escrow app for rental deposits, mobile-first, Indian users aged 25-35, zero-cost infrastructure" --name demo-fintech
```
- [ ] Output is impressive and detailed
- [ ] PRD has specific technical details
- [ ] Ready to show in interview

### Test 22: Demo Project (SaaS)
```bash
node src/cli.js build "Anonymous feedback tool for remote teams, Slack integration, free tier hosting" --name demo-saas
```
- [ ] Output demonstrates versatility
- [ ] Different domain from Test 21
- [ ] High-quality output

### Test 23: Demo Project (AI)
```bash
node src/cli.js build "AI resume analyzer that suggests improvements, web app, uses Claude API" --name demo-ai
```
- [ ] Shows you can build AI-on-AI products
- [ ] Meta-level thinking
- [ ] Technical depth

### Test 24: Demo Script Run-Through
Follow the exact demo script from `PHASE1_COMPLETE.md`:
- [ ] Setup (2 min) - smooth and professional
- [ ] Live Demo (3 min) - impressive and fast
- [ ] Deep Dive (5 min) - shows technical depth
- [ ] Total time <10 minutes
- [ ] Leaves time for questions

## ✅ Portfolio Readiness

### Test 25: GitHub Preparation
- [ ] All sensitive data removed (no real API keys)
- [ ] `.gitignore` covers necessary files
- [ ] `workspace/` is gitignored
- [ ] README has clear project description
- [ ] Code is clean and commented where needed

### Test 26: Diversity of Examples
You should have at least 3 projects in different domains:
- [ ] Fintech example
- [ ] SaaS/B2B example
- [ ] AI/ML example
- [ ] Social/consumer example (optional)
- [ ] Each shows different constraints/requirements

### Test 27: Interview Story Preparation
- [ ] Can explain WHY you built this (<1 min)
- [ ] Can explain HOW it works (<2 min)
- [ ] Can do live demo (<3 min)
- [ ] Can discuss trade-offs (<3 min)
- [ ] Can articulate next steps (Phase 2-4)

## ✅ Final Checklist

### Before Demo/Interview
- [ ] Tested all basic commands
- [ ] Have 3+ example outputs ready
- [ ] API key is loaded and working
- [ ] Internet connection is stable
- [ ] Terminal is configured nicely (colors work)
- [ ] Screen recording software ready (if needed)
- [ ] Practiced demo script 2-3 times

### Before Pushing to GitHub
- [ ] No API keys in code
- [ ] No personal data in examples
- [ ] All documentation is up-to-date
- [ ] README describes the project clearly
- [ ] License file added (MIT recommended)

### Before LinkedIn Post
- [ ] Have impressive example outputs
- [ ] Have demo video or screenshots
- [ ] Have clear value proposition
- [ ] Have "What I learned" narrative prepared

## 📊 Success Criteria Summary

**All Tests Pass = Ready for Production** ✅

Count your passed tests:
- Basic Functionality (6 tests): ___/6
- Output Quality (4 areas): ___/4
- Edge Cases (6 tests): ___/6
- Performance (3 tests): ___/3
- Documentation (3 tests): ___/3
- Code Quality (2 tests): ___/2
- Demo Readiness (4 tests): ___/4
- Portfolio Readiness (3 tests): ___/3

**Total: ___/31**

**Target: 28+/31** (90%+)

---

## 🐛 If Tests Fail

### Common Issues & Fixes

**Issue: "Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Issue: "ANTHROPIC_API_KEY is required"**
```bash
echo "ANTHROPIC_API_KEY=your-real-key" > .env
cat .env  # verify
```

**Issue: "Permission denied" on setup.sh**
```bash
chmod +x setup.sh
./setup.sh
```

**Issue: Poor output quality**
- Check you're using Claude Sonnet (not Haiku)
- Provide more detailed initial ideas
- Answer clarifying questions thoughtfully
- Try rephrasing the idea

**Issue: Timeout/slow generation**
- Check internet connection
- Verify API key is valid
- Check Anthropic status page
- Reduce idea complexity

---

## 📝 Testing Log Template

```
Date: _______________
Tester: _______________

Basic Tests: ☐ Pass ☐ Fail
Notes: _______________________

Quality Tests: ☐ Pass ☐ Fail
Notes: _______________________

Edge Cases: ☐ Pass ☐ Fail
Notes: _______________________

Demo Ready: ☐ Yes ☐ No
Notes: _______________________

Issues Found:
1. _______________________
2. _______________________

Overall Status: ☐ Ready ☐ Needs Work
```

---

**Good luck with testing!** 🚀
