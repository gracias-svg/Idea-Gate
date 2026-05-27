// src/app/office/types.ts
// Shared types for the Office view.
// Centralising here breaks the circular: page.tsx ↔ PhaserGame.tsx

export interface LiveAgent {
  name:    string;
  role:    string;
  stage:   number;
  status:  'idle' | 'working' | 'reviewing' | 'done' | 'blocked';
  message: string;
}

export interface LogEntry {
  time:  string;
  agent: string;
  msg:   string;
  color: string;
}

export type DashTab = 'status' | 'agents' | 'feed' | 'controls';
