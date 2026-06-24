import fetch from "node-fetch";
import { config } from "../config.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * UNIFIED LLM ENGINE
 * → OpenRouter (PRIMARY)
 * → Ollama (FALLBACK)
 *
 * Designed for:
 * - multi-agent orchestration
 * - long context prompts
 * - structured product outputs
 */
class LLM {
  async generate({ prompt, taskType = "medium" }) {
    try {
      const useOpenRouter = !!process.env.OPENROUTER_API_KEY;

      console.log(
        `[LLM] Provider: ${useOpenRouter ? "OpenRouter" : "Ollama"}`
      );

      // 🔥 QUALITY ENFORCEMENT (same as earlier system)
      prompt += `

IMPORTANT:
- Generate detailed, structured output
- Do NOT summarize
- Expand each section fully
- Maintain professional product documentation quality
`;

      // ✅ PRIMARY → OPENROUTER
      if (useOpenRouter) {
        return await this.callOpenRouter(prompt);
      }

      // 🔁 FALLBACK → OLLAMA
      return await this.callOllama(prompt);

    } catch (err) {
      console.error("[LLM] Error:", err.message);
      throw err;
    }
  }

  /**
   * OPENROUTER (PRIMARY)
   */
  async callOpenRouter(prompt) {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // ── FIX: identify IdeaGate in OpenRouter logs ──────────────────
        // Without these, OpenRouter Activity shows this as "Unknown" app,
        // making it impossible to distinguish IdeaGate calls from
        // Hermes Agent calls and any other tool sharing the same key.
        // With these, the Activity page shows "IdeaGate PMOS" for all
        // lifecycle generation calls — easy to trace and cost-track.
        "HTTP-Referer": "https://ideagate.site",
        "X-Title": "IdeaGate PMOS"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "x-ai/grok-4-fast",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 3000
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${text}`);
    }

    const data = await response.json();

    if (!data?.choices?.length) {
      throw new Error("Invalid OpenRouter response");
    }

    return data.choices[0].message.content;
  }

  /**
   * OLLAMA (FALLBACK)
   */
  async callOllama(prompt) {
    console.log("[LLM] Using Ollama fallback");

    const response = await fetch(
      `${process.env.OLLAMA_URL || "http://127.0.0.1:11434"}/api/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "qwen3:8b",
          prompt,
          stream: false
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    const data = await response.json();

    return data.response;
  }
}

// ✅ REQUIRED EXPORT (DO NOT CHANGE)
export const llm = new LLM();