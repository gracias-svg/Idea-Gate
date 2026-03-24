import fetch from "node-fetch";
import { config } from "../config.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "URL";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Normalize input into string prompt
 */
function normalizeInput(input) {
  if (typeof input === "string") return input;

  if (typeof input === "object") {
    return input.prompt || JSON.stringify(input, null, 2);
  }

  return String(input);
}

/**
 * SAFE trimming — only trims if absolutely needed
 */
function trimPrompt(prompt, maxChars = 20000) {
  if (!prompt) return "";

  if (prompt.length <= maxChars) return prompt;

  return prompt.slice(0, maxChars) + "\n\n[TRUNCATED FOR SAFETY]";
}

/**
 * OLLAMA CALL (LOCAL FIRST)
 */
async function callOllama(prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 3 min

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || config.model,
        prompt,
        stream: false,
        options: {
          temperature: config.temperature || 0.7,
          num_predict: config.maxTokens || 3000
        }
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (!data.response) {
      throw new Error("Empty response from Ollama");
    }

    return data.response;
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      throw new Error("Ollama timeout (model too slow)");
    }

    throw err;
  }
}

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
