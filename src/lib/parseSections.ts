// src/lib/parseSections.ts
// Sprint 07 (W2) — H2-heading outline extractor for the Workspace artifact tree.
// New sibling file; parseContent.ts (protected) is imported, never edited.
// Callers pass content already through parseContentDetailed() so headings match
// what the reading pane actually renders (not raw JSON-fallback zones etc).

export interface Section {
  label:    string;
  anchorId: string;
}

// Matches the MD renderer's heading detection (page.tsx `MD()`): a trimmed line
// starting with '## ' that is not '### ' or deeper.
const H2_PATTERN = /^##\s+(.+)$/;

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '') || 'section';
}

// Parses fresh from whatever content is passed in — never cached across calls,
// so an artifact re-fetched after an Improve/Accept always reflects its current
// headings (W2: "parsed fresh from current content").
export function parseSections(content: string): Section[] {
  const sections: Section[] = [];
  const seen: Record<string, number> = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    const m = line.match(H2_PATTERN);
    if (!m) continue;
    const label = m[1].trim();
    const base = slugify(label);
    const count = seen[base] ?? 0;
    seen[base] = count + 1;
    const anchorId = count === 0 ? base : `${base}-${count + 1}`;
    sections.push({ label, anchorId });
  }

  return sections;
}
