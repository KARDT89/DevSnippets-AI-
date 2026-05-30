// src/services/aiService.ts

import { getApiKey } from "../storage/secrets";
import { getAIProvider } from "../storage/preferences";

// ─── EXPLAIN ────────────────────────────────────────────────────────────────

export const explainSnippet = async (
  code: string,
  language: string,
  title: string
): Promise<string> => {
  const provider = (await getAIProvider()) ?? "openai";
  const apiKey = await getApiKey(provider);

  if (!apiKey) {
    return "No API key found. Go to Settings and add your key.";
  }

  const prompt = `Explain this ${language} snippet titled "${title}":\n\n${code}`;
  const system = `You are a senior developer explaining code clearly and concisely.
Structure your response as:

**What it does:** (1-2 sentences)

**How it works:** (step-by-step in plain language)

**Key concepts:** (bullet points of notable patterns)

**Improvements:** (1-2 suggestions if applicable)`;

  if (provider === "gemini") {
    return callGemini(apiKey, system + "\n\n" + prompt);
  }
  return callOpenAI(apiKey, system, prompt);
};

// ─── GENERATE ───────────────────────────────────────────────────────────────

export const generateSnippet = async (
  description: string
): Promise<{
  title: string;
  language: string;
  code: string;
  tags: string;
}> => {
  const provider = (await getAIProvider()) ?? "openai";
  const apiKey = await getApiKey(provider);

  if (!apiKey) throw new Error("No API key found. Go to Settings and add your key.");

  const system = `You are a code snippet generator.
Given a description, respond ONLY with valid JSON in this exact format:
{
  "title": "short descriptive title",
  "language": "one of: javascript, typescript, python, java, cpp, html, css, json, bash, other",
  "code": "the actual code snippet",
  "tags": "comma,separated,tags"
}
No markdown, no backticks, no explanation. Just the raw JSON object.`;

  const prompt = description;
  let raw = "";

  if (provider === "gemini") {
    raw = await callGemini(apiKey, system + "\n\n" + prompt);
  } else {
    raw = await callOpenAI(apiKey, system, prompt);
  }

  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

// ─── OPENAI CALLER ──────────────────────────────────────────────────────────

const callOpenAI = async (
  apiKey: string,
  system: string,
  userMessage: string
): Promise<string> => {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `OpenAI error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
};

// ─── GEMINI CALLER ──────────────────────────────────────────────────────────

const callGemini = async (
  apiKey: string,
  fullPrompt: string
): Promise<string> => {
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
};