import fs from 'fs';
import path from 'path';

const basePath = process.env.PROJECT_PATH || '/a0/usr/workdir';

const adapterPath = (subPath: string) => path.join(basePath, subPath);

export interface JourneyData {
  currentStage: number;
}

export function getJourney(): JourneyData {
  try {
    const data = fs.readFileSync(adapterPath('journey.json'), 'utf8');
    const parsed = JSON.parse(data);
    return {
      currentStage: parsed.currentStage || 0,
    };
  } catch (error) {
    console.warn('Failed to read journey.json:', error);
    return { currentStage: 0 }; // Safe mock fallback
  }
}

export function getArtifactsList(): string[] {
  try {
    if (!fs.existsSync(adapterPath('artifacts'))) {
      return [];
    }
    const files = fs.readdirSync(adapterPath('artifacts'));
    return files.filter(f => !f.startsWith('.')); // Only files, no hidden
  } catch (error) {
    console.warn('Failed to read artifacts:', error);
    return []; // Safe mock fallback
  }
}

export function getArtifactContent(fileName: string): string {
  try {
    const fullPath = path.join(adapterPath('artifacts'), fileName);
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    return content;
  } catch (error) {
    console.warn(`Failed to read artifact ${fileName}:`, error);
    return 'File content not available (mock fallback: No data loaded).'; // Safe mock
  }
}