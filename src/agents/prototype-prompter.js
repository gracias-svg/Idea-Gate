export class PrototypePrompterAgent {

  generatePrototypePrompt(brief, prd, apiSpec) {
    const productName = this.extractProductName(brief);
    const problemStatement = this.extractProblemStatement(brief);
    const coreFeatures = this.extractCoreFeatures(prd);
    const pages = this.extractPages(prd);
    const userFlows = this.extractUserFlows(prd);
    const uiStyle = this.determineUIStyle(brief, prd);
    const techStack = this.extractTechStack(prd);

    return this.buildPrototypePrompt({
      productName,
      problemStatement,
      coreFeatures,
      pages,
      userFlows,
      uiStyle,
      techStack
    });
  }

  extractProductName(brief) {
    const match = brief.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : 'Product';
  }

  extractProblemStatement(brief) {
    const match = brief.match(/##\s+Problem Statement([\s\S]*?)(?=##|$)/i);
    if (match) {
      return match[1].trim().split('\n').filter(l => l.trim())[0];
    }
    return 'Solve a user problem with an intuitive app.';
  }

  extractCoreFeatures(prd) {
    const features = [];

    const funcReqMatch = prd.match(/##\s+.*?Functional Requirements[\s\S]*?(?=##|$)/i);

    if (funcReqMatch) {
      const featureMatches = funcReqMatch[0].matchAll(/\*\*Feature.*?:\s*(.+?)\*\*/gi);
      for (const match of featureMatches) {
        features.push(match[1].trim());
      }
    }

    if (features.length === 0) {
      const storyMatches = prd.matchAll(/As a .+?, I want to (.+?)(?:so that|,|\.|$)/gi);
      for (const match of storyMatches) {
        features.push(match[1].trim());
      }
    }

    return features.slice(0, 8);
  }

  extractPages(prd) {

    const pages = ['Landing Page', 'Sign Up', 'Login', 'Dashboard'];

    const uxMatch = prd.match(/Key Screens[\s\S]*?(?=##|$)/i);

    if (uxMatch) {
      const screenMatches = uxMatch[0].matchAll(/\d+\.\s+\*\*(.+?)\*\*/g);

      for (const match of screenMatches) {
        const screenName = match[1].replace('Screen', '').replace('Page', '').trim();

        if (!pages.includes(screenName)) {
          pages.push(screenName);
        }
      }
    }

    return pages.slice(0, 10);
  }

  extractUserFlows(prd) {

    const flows = [];

    const storiesMatch = prd.match(/##\s+.*?User Stories[\s\S]*?(?=##|$)/i);

    if (storiesMatch) {

      const storyMatches = storiesMatch[0].matchAll(/\d+\.\s*As a (.+?), I want to (.+?)(?:so that (.+?))?(?:\n|$)/gi);

      for (const match of storyMatches) {

        flows.push({
          persona: match[1].trim(),
          action: match[2].trim(),
          benefit: match[3] ? match[3].trim() : ''
        });

      }
    }

    return flows.slice(0, 6);
  }

  determineUIStyle(brief, prd) {

    const text = (brief + prd).toLowerCase();

    let style = 'Modern and clean';

    if (text.includes('professional') || text.includes('enterprise')) {
      style = 'Professional and minimalist';
    } else if (text.includes('playful') || text.includes('fun')) {
      style = 'Playful and colorful';
    } else if (text.includes('elegant') || text.includes('premium')) {
      style = 'Elegant and premium';
    } else if (text.includes('bold') || text.includes('vibrant')) {
      style = 'Bold and vibrant';
    }

    if (text.includes('mobile')) {
      style += ', mobile-first';
    }

    return style;
  }

  extractTechStack(prd) {

    const text = prd.toLowerCase();

    const stack = {
      frontend: 'React',
      styling: 'Tailwind CSS',
      backend: 'Node.js',
      database: 'SQLite'
    };

    if (text.includes('next.js') || text.includes('nextjs')) {
      stack.frontend = 'Next.js';
    } else if (text.includes('vue')) {
      stack.frontend = 'Vue.js';
    }

    if (text.includes('chakra')) {
      stack.styling = 'Chakra UI';
    } else if (text.includes('material')) {
      stack.styling = 'Material UI';
    }

    if (text.includes('postgres')) {
      stack.database = 'PostgreSQL';
    } else if (text.includes('mongodb')) {
      stack.database = 'MongoDB';
    }

    return stack;
  }

  buildPrototypePrompt(data) {

    const { productName, problemStatement, coreFeatures, pages, userFlows, uiStyle, techStack } = data;

    return `# ${productName} - UI Prototype Prompt

## Product Overview

**Problem:** ${problemStatement}

**Solution:** Build a ${uiStyle} web application that solves this problem through an intuitive interface.

## Core Features

${coreFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Pages/Screens

${pages.map((p, i) => `${i + 1}. **${p}**`).join('\n')}

## User Flows

${userFlows.map((flow, i) => `${i + 1}. **${flow.persona}** wants to ${flow.action}${flow.benefit ? ` so that ${flow.benefit}` : ''}`).join('\n')}

## UI Design Requirements

Style: ${uiStyle}

Tech Stack:
Frontend: ${techStack.frontend}
Styling: ${techStack.styling}
Backend: ${techStack.backend}
Database: ${techStack.database}

Use this prompt with Lovable.dev, v0.dev, Framer AI, or other UI generators.
`;
  }
}