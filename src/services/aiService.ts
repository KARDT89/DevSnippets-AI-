import { getApiKey } from "../storage/secrets";

export interface AIResult {
  explanation: string;
  summary: string;
  suggestions: string;
}

export const explainSnippet = async (code: string, language: string): Promise<AIResult> => {
  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  const prompt = `You are a code assistant. Analyze this ${language} code snippet and respond in exactly this JSON format, no markdown, no extra text:

{
  "explanation": "A clear paragraph explaining what this code does line by line",
  "summary": "One sentence summary",
  "suggestions": "2-3 concrete improvement suggestions as a single paragraph"
}

Code:
\`\`\`${language}
${code}
\`\`\``;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message ?? "API request failed");
  }

  const data = await response.json();
  const text = data.choices[0].message.content;

  try {
    return JSON.parse(text) as AIResult;
  } catch {
    // If JSON parse fails, return raw text in explanation field
    return {
      explanation: text,
      summary: "",
      suggestions: "",
    };
  }
};