// src/app/api/improve/extract/route.ts
//
// Extracts text from uploaded files for use as reference context in improvement prompts.
// Returns plain text — no filesystem writes, no embeddings, no RAG.
//
// Supported:
//   TXT, MD, CSV    — no packages needed, works immediately
//   PDF             — requires: npm install pdf-parse
//   DOCX            — requires: npm install mammoth
//
// To install optional packages:
//   cd /Users/apple/agent-zero-data/workdir/ui-layer
//   npm install pdf-parse mammoth
//
// If packages are missing, the route returns a clear error message rather than crashing.

import { NextRequest, NextResponse } from 'next/server';

const MAX_CHARS = 12_000; // ~3000 tokens — keeps prompt manageable

// ── Lazy-load optional packages ───────────────────────────────────────────────
// Using dynamic require at call-time avoids build-time failures when packages
// are not installed. The try/catch returns a clear error rather than a 500.

async function extractPdf(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const result   = await pdfParse(buffer);
    return result.text ?? '';
  } catch (err: any) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error('pdf-parse package not installed. Run: npm install pdf-parse');
    }
    throw new Error(`PDF extraction failed: ${err.message}`);
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mammoth = require('mammoth');
    const result  = await mammoth.extractRawText({ buffer });
    return result.value ?? '';
  } catch (err: any) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error('mammoth package not installed. Run: npm install mammoth');
    }
    throw new Error(`DOCX extraction failed: ${err.message}`);
  }
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: 'Could not parse form data. Make sure the request uses multipart/form-data.' },
        { status: 400 }
      );
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    const fileObj    = file as File;
    const fileName   = fileObj.name;
    const ext        = fileName.split('.').pop()?.toLowerCase() ?? '';
    const fileSizeKB = Math.round(fileObj.size / 1024);
    const buffer     = Buffer.from(await fileObj.arrayBuffer());

    console.log(`[extract] ${fileName} | ${fileSizeKB}KB | .${ext}`);

    let rawText = '';
    let method  = '';

    // ── Dispatch by file type ─────────────────────────────────────────────────
    if (ext === 'pdf') {
      rawText = await extractPdf(buffer);
      method  = 'pdf-parse';

    } else if (ext === 'docx') {
      rawText = await extractDocx(buffer);
      method  = 'mammoth';

    } else if (['txt', 'md', 'mdx', 'markdown', 'csv'].includes(ext)) {
      rawText = buffer.toString('utf-8');
      method  = 'utf-8';

    } else {
      return NextResponse.json({
        error: `File type .${ext} is not supported. Supported: PDF, DOCX, TXT, MD, CSV`,
        supported: ['pdf', 'docx', 'txt', 'md', 'csv'],
      }, { status: 400 });
    }

    // ── Clean and truncate ────────────────────────────────────────────────────
    const cleaned = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();

    const wasTruncated = cleaned.length > MAX_CHARS;
    const finalText    = wasTruncated
      ? `${cleaned.slice(0, MAX_CHARS)}\n\n[Document truncated at ${MAX_CHARS.toLocaleString()} characters]`
      : cleaned;

    console.log(`[extract] done: ${cleaned.length} chars → ${wasTruncated ? 'truncated' : 'full'} | method: ${method}`);

    return NextResponse.json({
      success:      true,
      fileName,
      ext,
      method,
      fileSizeKB,
      charCount:    cleaned.length,
      wasTruncated,
      text:         finalText,
    });

  } catch (err: any) {
    console.error('[extract] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
