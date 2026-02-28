import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GeneratedPalette {
  paletteName: string;
  colors: Array<{
    hex: string;
    name: string;
    role: "primary" | "secondary" | "accent" | "neutral" | "background";
  }>;
  description: string;
}

export async function generatePalette(
  prompt: string,
  mood: string
): Promise<GeneratedPalette> {
  const systemPrompt = `You are a professional color palette designer and expert. Generate cohesive, beautiful 5-color palettes based on user descriptions. You always respond with valid JSON only — no markdown, no explanation outside JSON. The JSON must contain exactly 5 colors with roles: primary, secondary, accent, neutral, background. Hex codes must be valid 6-digit hex values starting with #.`;

  const userPrompt = `Generate a color palette for: ${prompt}. Mood: ${mood || "balanced"}.

Respond with this exact JSON structure (no markdown, just raw JSON):
{
  "paletteName": "descriptive name for the palette",
  "colors": [
    { "hex": "#HEXCODE", "name": "color name", "role": "primary" },
    { "hex": "#HEXCODE", "name": "color name", "role": "secondary" },
    { "hex": "#HEXCODE", "name": "color name", "role": "accent" },
    { "hex": "#HEXCODE", "name": "color name", "role": "neutral" },
    { "hex": "#HEXCODE", "name": "color name", "role": "background" }
  ],
  "description": "2-3 sentence explanation of the palette choices and why they work together"
}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";

  const parsed = JSON.parse(text) as GeneratedPalette;

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
