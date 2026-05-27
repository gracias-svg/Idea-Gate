import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BASE_PATH =
  process.env.PROJECT_PATH ||
  '/Users/apple/idea-gate-ui-safe/workspace';

type AgentStatus = 'idle' | 'working' | 'reviewing' | 'done';

interface AgentState {
  name: string;
  role: string;
  stage: number;
  status: AgentStatus;
  message: string;
}

const AGENT_MAP: Omit<AgentState, 'status' | 'message'>[] = [
  { name: 'CO', role: 'Coordinator',        stage: 0  },
  { name: 'PS', role: 'Product Strategist', stage: 1  },
  { name: 'RE', role: 'Researcher',         stage: 2  },
  { name: 'UX', role: 'UX Designer',        stage: 7  },
  { name: 'AR', role: 'Architect',          stage: 10 },
  { name: 'QA', role: 'QA',                 stage: 13 },
];

const MESSAGES: Record<AgentStatus, string> = {
  idle:      'waiting',
  working:   'executing…',
  reviewing: 'reviewing…',
  done:      'completed',
};

function getProjectPath(): string | null {
  try {
    const entries = fs.readdirSync(BASE_PATH);
    const projects = entries
      .filter(name => {
        if (name.startsWith('.')) return false;
        try { return fs.statSync(path.join(BASE_PATH, name)).isDirectory(); }
        catch { return false; }
      })
      .sort((a, b) => {
        const tA = parseInt(a.split('-').pop() || '0');
        const tB = parseInt(b.split('-').pop() || '0');
        return tB - tA;
      });
    return projects.length ? path.join(BASE_PATH, projects[0]) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const projectPath = getProjectPath();

    if (!projectPath) {
      return NextResponse.json({
        agents: AGENT_MAP.map(a => ({ ...a, status: 'idle', message: MESSAGES.idle })),
        currentStage: 0,
        isRunning: false,
      });
    }

    const journeyPath = path.join(projectPath, 'journey.json');
    let currentStage = 0;

    if (fs.existsSync(journeyPath)) {
      try {
        const journey = JSON.parse(fs.readFileSync(journeyPath, 'utf-8'));
        currentStage = parseInt(journey.currentStage ?? journey.current_stage ?? '0');
      } catch {
        currentStage = 0;
      }
    }

    const agents: AgentState[] = AGENT_MAP.map(agent => {
      let status: AgentStatus;
      if (currentStage > agent.stage)       status = 'done';
      else if (currentStage === agent.stage) status = 'reviewing';
      else                                   status = 'idle';
      return { ...agent, status, message: MESSAGES[status] };
    });

    return NextResponse.json({ agents, currentStage, isRunning: false });
  } catch (err) {
    console.error('[AGENTS API]', err);
    return NextResponse.json({ agents: [], currentStage: 0, isRunning: false });
  }
}