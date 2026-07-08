'use client';

// src/components/office/ExecutionSummary.tsx
// Mission 14 Phase 3 — Office Analytics (Stage A, standalone).
// Pure derived-stats panel over journey-state's `stages` record — no new
// data source, matches the "pure prop consumer" convention established by
// LifecycleNodeChain / RunInsightPanel in Phase 2.
//
// No Tailwind in this project — inline style objects + CSS custom
// properties, matching TopBar.tsx / desk component convention.

export interface StageData {
  summary?:     string;
  decision?:    string;
  reasoning?:   string;
  confidence?:  string;
  conflicts?:   string;
  startedAt?:   string;
  completedAt?: string;
  durationMs?:  number;
  outputFile?:  string;
  artifacts?:   string[];
}

export interface ExecutionSummaryProps {
  stages:       Record<string, StageData>;
  currentStage: number | null;
  /** Optional — shows skeleton cards instead of real data while a fetch is in flight. */
  isLoading?:   boolean;
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function StatCard({ label, value, color }: { label:string; value:string; color?:string }) {
  return (
    <div style={{
      padding:'10px 12px', borderRadius:'var(--radius-md)',
      border:'1px solid var(--border-subtle)', background:'var(--surface-raised)',
    }}>
      <div style={{
        fontSize:'var(--text-h2)', fontWeight:700, color: color ?? 'var(--text-primary)',
        fontFamily:"'JetBrains Mono','Fira Code',monospace", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      }}>
        {value}
      </div>
      <div style={{ fontSize:'var(--text-caption)', color:'var(--text-secondary)', marginTop:'2px' }}>
        {label}
      </div>
    </div>
  );
}

const GRID_STYLE: React.CSSProperties = {
  display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px',
  fontFamily:"'JetBrains Mono','Fira Code',monospace",
};

export default function ExecutionSummary({ stages, currentStage, isLoading = false }: ExecutionSummaryProps) {
  if (isLoading) {
    return (
      <div style={GRID_STYLE}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{
            height:'52px', borderRadius:'var(--radius-md)',
            border:'1px solid var(--border-subtle)', background:'var(--surface-raised)', opacity:0.5,
          }} />
        ))}
      </div>
    );
  }

  const entries = Object.entries(stages);
  const isEmpty = entries.length === 0;

  if (isEmpty) {
    return (
      <div style={GRID_STYLE}>
        <StatCard label="Stages complete" value="--" />
        <StatCard label="Total duration"  value="--" />
        <StatCard label="High confidence" value="--" />
        <StatCard label="Slowest stage"   value="--" />
        <StatCard label="Decisions"       value="--" />
        <StatCard label="Validation (stage 5)" value="--" />
        <div style={{ gridColumn:'1 / -1', textAlign:'center', fontSize:'var(--text-caption)', color:'var(--text-secondary)', marginTop:'4px' }}>
          No run data yet
        </div>
      </div>
    );
  }

  const completed = entries.filter(([,d]) => d.completedAt);
  const totalDurationMs = entries.reduce((sum, [,d]) => sum + (d.durationMs ?? 0), 0);

  const confidenceCounts: Record<'high'|'medium'|'low', number> = { high:0, medium:0, low:0 };
  const decisionCounts: Record<string, number> = {};
  let slowest: { id:string; ms:number } | null = null;

  for (const [id, d] of entries) {
    if (d.confidence === 'high' || d.confidence === 'medium' || d.confidence === 'low') {
      confidenceCounts[d.confidence]++;
    }
    if (d.decision) decisionCounts[d.decision] = (decisionCounts[d.decision] ?? 0) + 1;
    if (d.durationMs != null && (!slowest || d.durationMs > slowest.ms)) slowest = { id, ms: d.durationMs };
  }

  const decisionSummary = Object.entries(decisionCounts).map(([k,v]) => `${v} ${k}`).join(' · ') || '--';
  const validationConfidence = stages['5']?.confidence;

  return (
    <div style={GRID_STYLE}>
      <StatCard label="Stages complete" value={`${completed.length}/${entries.length}`} color="var(--accent-primary)" />
      <StatCard label="Total duration"  value={totalDurationMs > 0 ? formatDuration(totalDurationMs) : '--'} />
      <StatCard label="High confidence" value={`${confidenceCounts.high}/${entries.length}`} color="var(--accent-primary)" />
      <StatCard label="Slowest stage"   value={slowest ? `Stage ${slowest.id} · ${formatDuration(slowest.ms)}` : '--'} />
      <StatCard label="Decisions"       value={decisionSummary} />
      <StatCard
        label="Validation (stage 5)"
        value={validationConfidence ?? 'not run'}
        color={validationConfidence === 'low' ? 'var(--status-error)' : validationConfidence === 'high' ? 'var(--accent-primary)' : 'var(--text-secondary)'}
      />
    </div>
  );
}
