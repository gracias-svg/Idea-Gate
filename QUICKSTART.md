# Quick Start Guide (5 Minutes)

## Step 1: Setup (2 minutes)

```bash
cd product-builder-coworker
./setup.sh
```

This will:
- Check Node.js version
- Install dependencies
- Create .env file
- Set up workspace directory

## Step 2: Add API Key (1 minute)

1. Get your Anthropic API key from: https://console.anthropic.com/
2. Edit `.env` file:

```bash
# Open in your editor
nano .env

# Or use echo
echo "ANTHROPIC_API_KEY=sk-ant-your-actual-key-here" > .env
```

## Step 3: Run First Build (2 minutes)

```bash
node src/cli.js build "UPI escrow app for rental deposits, mobile-first, Indian users"
```

**What to expect:**
1. Tool asks 3-5 questions (press Enter to use suggestions)
2. Generates brief and PRD (takes ~30 seconds)
3. Saves to `workspace/upi-escrow-app/`

## Step 4: Review Output

```bash
# View the brief
cat workspace/upi-escrow-app/product/brief.md

# View the full PRD
cat workspace/upi-escrow-app/product/prd.md

# View project structure
ls -R workspace/upi-escrow-app/
```

## That's It! 🎉

You now have:
- ✅ Product brief (1-page overview)
- ✅ Full PRD (comprehensive requirements)
- ✅ Project structure (ready for Phase 2)

## Try More Examples

```bash
# Fintech
node src/cli.js build "P2P lending for students" --name lending-app

# Social
node src/cli.js build "Anonymous workplace feedback tool" --name feedback-tool

# AI
node src/cli.js build "AI resume analyzer" --name resume-ai

# Skip questions for faster generation
node src/cli.js build "Event RSVP manager" --skip-questions
```

## Cost

**Phase 1 cost per project:** ~$0.04-0.10 (4-10 cents)

## What's Next?

- **Phase 2** (Coming): Task breakdown + Architecture diagrams
- **Phase 3** (Coming): Code generation
- **Phase 4** (Coming): GitHub + Deployment

## Need Help?

- Full documentation: `README.md`
- Detailed usage: `USAGE.md`
- Check if API key is set: `cat .env`

---

**🚀 Start building your product portfolio now!**
