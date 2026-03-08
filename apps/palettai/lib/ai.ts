export interface GeneratedPalette {
  paletteName: string;
  colors: Array<{
    hex: string;
    name: string;
    role: "primary" | "secondary" | "accent" | "neutral" | "background";
  }>;
  description: string;
}

const SYSTEM_PROMPT = `You are a color palette designer. Output JSON only.

Required structure:
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ text: `Generate a color palette for: ${prompt}. Mood: ${mood}.` }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 512,
          temperature: 0.7,
        },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini error: ${res.status}`);
  }

  const data = await res.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  const content = data.candidates[0]?.content?.parts[0]?.text;
  if (!content) throw new Error("Empty response from Gemini");

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
