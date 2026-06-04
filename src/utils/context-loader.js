import fs from 'fs';
import path from 'path';

export function loadProjectContext(projectPath) {
  const contextDir = path.join(projectPath, 'context');

  if (!fs.existsSync(contextDir)) return "";

  const files = fs.readdirSync(contextDir);

  let combinedContext = "";

  for (const file of files) {
    const filePath = path.join(contextDir, file);

    if (fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, 'utf-8');

      combinedContext += `\n\n--- FILE: ${file} ---\n${content.substring(0, 3000)}\n`;
    }
  }

  return combinedContext;
}