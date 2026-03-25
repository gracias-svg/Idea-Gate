export class BaseAgent {
  constructor({ name, role }) {
    this.name = name;
    this.role = role;
  }

  buildPrompt(context) {
    return `
You are ${this.role}.

Your job is to produce HIGH-QUALITY, HUMAN-READABLE, PROFESSIONAL PRODUCT DOCUMENTS.

CRITICAL RULES:
- Write in clear, natural, professional English
- Avoid robotic or AI-like phrasing
- Do NOT dump JSON inside output
- Use proper headings, sections, and formatting
- Make it portfolio-quality (like a real PM/Architect document)
- Be structured but readable

OUTPUT FORMAT (STRICT):
Return ONLY valid JSON like this:

{
  "summary": "short 1-2 line summary",
  "output": "<WELL FORMATTED MARKDOWN DOCUMENT>",
  "confidence": "high/medium/low"
}

MARKDOWN RULES:
- Use # for title
- Use ## for sections
- Use bullet points where needed
- Keep spacing clean
- No JSON inside markdown

Context:
${this.formatContext(context)}
`;
  }

  formatContext(context) {
    try {
      return JSON.stringify(context, null, 2).substring(0, 8000);
    } catch {
      return String(context).substring(0, 8000);
    }
  }
}