// src/lib/parseContent.ts
//
// Parses V2 artifact files to extract the actual PM document content.
//
// V2 coordinator writes artifacts in this format:
//
//   # Stage Name
//   ## Summary
//   {merged.summary}           ← short (3-10 lines)
//   ---
//   {merged.output}            ← the real content (100-500+ lines of PM docs)
//   ---
//   ## Decision
//   ## Reasoning
//   ## Confidence
//
// merged.output can be:
//   A) Clean markdown           — LLM responded with prose directly
//   B) JSON string              — LLM responded with structured JSON, output extracted
//   C) JSON blob of agent data  — fallback when all LLM calls failed
//
// PREVIOUS BUG: When case A occurred, Strategy 3 returned the content BEFORE
// the first separator (only the Summary header), discarding all real content.
//
// FIX: Correctly extracts the content BETWEEN first --- and second ---,
// regardless of whether that content is JSON or clean markdown.

export interface ParseResult {
  content:      string;
  method:       'json_output' | 'between_separators' | 'raw_fallback';
  hadSeparator: boolean;
  warning?:     string;
}

const SEP = '\n---\n';

// ── Main export ───────────────────────────────────────────────────────────────
export function parseContent(raw: string): string {
  return parseContentDetailed(raw).content;
}

// ── Detailed parse ─────────────────────────────────────────────────────────────
export function parseContentDetailed(raw: string): ParseResult {
  if (!raw || raw.trim().length === 0) {
    return { content: '', method: 'raw_fallback', hadSeparator: false };
  }

  const sep1 = raw.indexOf(SEP);
  const hadSep = sep1 !== -1;

  // ── No separator: return full file ────────────────────────────────────────
  if (!hadSep) {
    // File might be a plain JSON blob from fallback — try extracting output field
    const trimmed = raw.trim();
    if (trimmed.startsWith('{')) {
      const extracted = extractJsonOutput(trimmed);
      if (extracted && extracted.length > 20) {
        return { content: extracted, method: 'json_output', hadSeparator: false };
      }
    }
    return { content: raw.trim(), method: 'raw_fallback', hadSeparator: false };
  }

  // ── Found at least one separator ──────────────────────────────────────────
  // Extract the section BETWEEN first --- and LAST ---
  // indexOf found the first --- inside the content (markdown horizontal rules),
  // cutting off everything after the first internal divider. lastIndexOf correctly
  // finds the coordinator's closing separator which is always the final --- in the file.
  const afterFirst = raw.slice(sep1 + SEP.length);
  const sep2       = afterFirst.lastIndexOf(SEP);
  const outputZone = (sep2 !== -1 ? afterFirst.slice(0, sep2) : afterFirst).trim();

  // Case A: output zone is a JSON blob (fallback agent dumps, or old format)
  if (outputZone.startsWith('{') || outputZone.startsWith('[')) {
    const extracted = extractJsonOutput(outputZone);
    if (extracted && extracted.length > 20) {
      return { content: extracted, method: 'json_output', hadSeparator: true };
    }
    // JSON but no 'output' key (e.g. raw agent data dump from fallback)
    // Better to show the raw agent JSON than the Summary header
    return {
      content: outputZone,
      method:  'raw_fallback',
      hadSeparator: true,
      warning: 'Fallback output: LLM did not generate structured content for this stage',
    };
  }

  // Case B: output zone is clean markdown — return it directly
  if (outputZone.length > 20) {
    return { content: outputZone, method: 'between_separators', hadSeparator: true };
  }

  // Empty output zone — return the full file as last resort
  return { content: raw.trim(), method: 'raw_fallback', hadSeparator: true,
           warning: 'Output section was empty' };
}

// ── JSON output field extractor ───────────────────────────────────────────────
// Tries JSON.parse first, then character-by-character extraction for
// JSON with unescaped control characters (a common LLM output issue).
function extractJsonOutput(json: string): string | null {
  // 1. Standard parse
  try {
    const obj = JSON.parse(json);
    const val = obj?.output ?? obj?.content;
    if (typeof val === 'string' && val.length > 10) return val.trim();
  } catch { /* try char extraction */ }

  // 2. Character-by-character (handles unescaped newlines inside JSON values)
  return extractFieldByChar(json, 'output') || extractFieldByChar(json, 'content');
}

// ── Character-by-character JSON string value extractor ───────────────────────
function extractFieldByChar(json: string, fieldName: string): string | null {
  const key    = `"${fieldName}"`;
  const keyIdx = json.indexOf(key);
  if (keyIdx === -1) return null;

  let i = keyIdx + key.length;
  // Skip to colon
  while (i < json.length && /[\s]/.test(json[i])) i++;
  if (i >= json.length || json[i] !== ':') return null;
  i++;
  // Skip to opening quote
  while (i < json.length && /[\s]/.test(json[i])) i++;
  if (i >= json.length || json[i] !== '"') return null;
  i++;

  let result = '';
  let escaped = false;

  while (i < json.length) {
    const ch = json[i];
    if (escaped) {
      switch (ch) {
        case 'n':  result += '\n'; break;
        case 'r':  result += '\r'; break;
        case 't':  result += '\t'; break;
        case '"':  result += '"';  break;
        case '\\': result += '\\'; break;
        case '/':  result += '/';  break;
        case 'u': {
          const hex = json.slice(i + 1, i + 5);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            result += String.fromCharCode(parseInt(hex, 16));
            i += 4;
          } else { result += '\\u'; }
          break;
        }
        default: result += ch;
      }
      escaped = false;
    } else if (ch === '\\') {
      escaped = true;
    } else if (ch === '"') {
      return result.trim() || null;
    } else {
      result += ch;
    }
    i++;
  }

  return result.trim().length > 20 ? result.trim() : null;
}

// ── Debug helper (browser console) ────────────────────────────────────────────
export function testParse(raw: string): void {
  const result = parseContentDetailed(raw);
  console.group('[parseContent]');
  console.log('Method:       ', result.method);
  console.log('Had separator:', result.hadSeparator);
  console.log('Content length:', result.content.length, 'chars');
  if (result.warning) console.warn('Warning:', result.warning);
  console.log('Preview (first 300 chars):', result.content.slice(0, 300));
  console.groupEnd();
}
