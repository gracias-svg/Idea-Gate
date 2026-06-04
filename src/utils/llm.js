<<<<<<< HEAD
import fetch from "node-fetch";
import { config } from "../config.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "URL";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
=======
import fetch from 'node-fetch';
import { config } from '../config.js';
>>>>>>> 367d754 (IdeaGate V2 - PM lifecycle multi-agent system (clean, no secrets))

/**
 * UNIFIED LLM INTERFACE
 * → Supports OpenRouter (primary)
 * → Falls back to Ollama
 */
class LLM {
  async generate({ prompt, taskType = "medium" }) {
    try {
      // 🔥 USE OPENROUTER FIRST
      if (process.env.OPENROUTER_API_KEY) {
        return await this.callOpenRouter(prompt);
      }

      // 🔁 FALLBACK → OLLAMA
      return await this.callOllama(prompt);
    } catch (err) {
      console.error("LLM Error:", err.message);
      throw err;
    }
  }

  /**
   * OPENROUTER (PRIMARY)
   */
  async callOpenRouter(prompt) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "x-ai/grok-4-fast",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices.length) {
      throw new Error("Invalid OpenRouter response");
    }

    return data.choices[0].message.content;
  }

  /**
   * OLLAMA (FALLBACK)
   */
  async callOllama(prompt) {
    const response = await fetch(`${process.env.OLLAMA_URL || "http://127.0.0.1:11434"}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "qwen3:8b",
        prompt,
        stream: false
      })
    });

    const data = await response.json();

    return data.response;
  }
}

<<<<<<< HEAD
/**
 * OPENROUTER FALLBACK (CLOUD)
 */
async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter key missing");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openrouter/auto", // 🔥 auto-select best cheap model
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

  return (
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    ""
  );
}

/**
 * MAIN LLM FUNCTION
 */
export async function llm(input) {
  let prompt = normalizeInput(input);

  // 🔥 DO NOT OVER-TRIM — preserve quality
  prompt = trimPrompt(prompt);

  // 🔥 STRICT QUALITY INSTRUCTION
  prompt += `

IMPORTANT:
- Generate detailed, structured output
- Do NOT summarize
- Expand each section fully
- Maintain professional product documentation quality
`;

  // 🔥 TRY OLLAMA FIRST
  try {
    return await callOllama(prompt);
  } catch (ollamaError) {
    console.log("[LLM] Ollama failed:", ollamaError.message);
    console.log("[LLM] Falling back to OpenRouter...");

    try {
      return await callOpenRouter(prompt);
    } catch (openrouterError) {
      console.log("[LLM] OpenRouter also failed:", openrouterError.message);

      throw new Error(
        `LLM failed completely:\nOllama: ${ollamaError.message}\nOpenRouter: ${openrouterError.message}`
      );
    }
  }
}
=======
// ✅ EXPORT INSTANCE (IMPORTANT)
export const llm = new LLM();
>>>>>>> 367d754 (IdeaGate V2 - PM lifecycle multi-agent system (clean, no secrets))
