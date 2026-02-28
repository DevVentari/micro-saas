import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  let text = content.text.trim();
  // Strip any accidental markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  const parsed = JSON.parse(text) as GeneratedPalette;

  // Validate structure
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
