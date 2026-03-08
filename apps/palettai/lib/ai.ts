export interface GeneratedPalette {
  paletteName: string;
  colors: Array<{
    hex: string;
    name: string;
    role: "primary" | "secondary" | "accent" | "neutral" | "background";
  }>;
  description: string;
}

const SYSTEM_PROMPT = `You are a color palette designer. You ONLY output valid JSON. No explanation, no markdown, no text outside JSON.

Output this exact structure:
{
  "paletteName": "string",
  "colors": [
    { "hex": "#RRGGBB", "name": "string", "role": "primary" },
    { "hex": "#RRGGBB", "name": "string", "role": "secondary" },
    { "hex": "#RRGGBB", "name": "string", "role": "accent" },
    { "hex": "#RRGGBB", "name": "string", "role": "neutral" },
    { "hex": "#RRGGBB", "name": "string", "role": "background" }
  ],
  "description": "2-3 sentences on why these colors work together"
}`;

export async function generatePalette(
  prompt: string,
  mood: string
): Promise<GeneratedPalette> {
  const res = await fetch(
    `${process.env.OLLAMA_BASE_URL}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen2.5:3b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate a color palette for: ${prompt}. Mood: ${mood}.`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 512,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from Ollama");

  const parsed = JSON.parse(content) as GeneratedPalette;

  if (
    !parsed.paletteName ||
    !Array.isArray(parsed.colors) ||
    parsed.colors.length !== 5 ||
    !parsed.description
  ) {
    throw new Error("Invalid palette structure returned from AI");
  }

  return parsed;
}
