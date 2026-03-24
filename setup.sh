#!/bin/bash

echo "🚀 Product Builder Coworker - Setup"
echo "===================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

echo "✓ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your ANTHROPIC_API_KEY"
    echo "   Get your API key from: https://console.anthropic.com/"
    echo ""
    echo "   Example:"
    echo "   ANTHROPIC_API_KEY=sk-ant-xxxxx"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Create workspace directory
mkdir -p workspace
echo "✓ Workspace directory created"
echo ""

# Make CLI executable
chmod +x src/cli.js

echo "===================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add your ANTHROPIC_API_KEY"
echo "     Get your key from: https://console.anthropic.com/"
echo "  2. Run: node src/cli.js build \"your product idea\""
echo ""
echo "Examples:"
echo "  node src/cli.js build \"UPI escrow app for rentals\""
echo "  node src/cli.js build \"Event RSVP tool for clubs\" --skip-questions"
echo ""
echo "For more help, see: README.md and USAGE.md"
echo ""
