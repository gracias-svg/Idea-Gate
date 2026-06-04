import fs from 'fs';
import path from 'path';

export function saveOutputs(projectDir, results) {
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  writeMarkdown(projectDir, '01-strategy.md', results.strategy);
  writeMarkdown(projectDir, '02-research.md', results.research);
  writeMarkdown(projectDir, '03-ux.md', results.ux);
  writeMarkdown(projectDir, '04-architecture.md', results.architecture);
  writeMarkdown(projectDir, '05-prototype.md', results.prototype);
  writeMarkdown(projectDir, '06-qa-review.md', results.qa);

  // Code folder
  const codeDir = path.join(projectDir, 'code');
  if (!fs.existsSync(codeDir)) {
    fs.mkdirSync(codeDir, { recursive: true });
  }

  if (results.code?.output?.coreImplementation?.["server.js"]) {
    fs.writeFileSync(
      path.join(codeDir, 'backend.js'),
      results.code.output.coreImplementation["server.js"]
    );
  }
}

function writeMarkdown(baseDir, fileName, agentResult) {
  if (!agentResult) return;

  const content = `
# ${fileName.replace('.md', '').replace(/^\d+-/, '').toUpperCase()}

## Summary
${agentResult.summary}

---

${agentResult.output}

---

## Confidence
${agentResult.confidence}
`;

  fs.writeFileSync(path.join(baseDir, fileName), content);
}