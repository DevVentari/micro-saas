export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import type { GeneratedPalette } from "@/lib/ai";

interface StyleCardData {
  headingFont: string;
  bodyFont: string;
  toneWords: string[];
  usageRules: string[];
}

const SYSTEM_PROMPT = `You are a brand designer. Output JSON only.

Required structure:
{
  "headingFont": "string (Google Fonts name, e.g. Fraunces)",
  "bodyFont": "string (Google Fonts name, e.g. Inter)",
  "toneWords": ["word1", "word2", "word3", "word4", "word5"],
  "usageRules": ["rule1", "rule2", "rule3"]
}

Font choices must be available on Google Fonts.
Tone words should be single adjectives that describe the brand personality.
Usage rules should be short actionable guidelines for using the palette (e.g. "Use primary for CTAs only").`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { palette: GeneratedPalette; mood: string };
    const { palette, mood } = body;

    if (!palette?.paletteName) {
      return NextResponse.json({ error: "palette is required" }, { status: 400 });
    }

    const colorSummary = palette.colors
      .map((c) => `${c.role}: ${c.hex} (${c.name})`)
      .join(", ");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Palette: "${palette.paletteName}". Mood: ${mood}. Colors: ${colorSummary}. Description: ${palette.description}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 256,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(content) as StyleCardData;

    if (
      !parsed.headingFont ||
      !parsed.bodyFont ||
      !Array.isArray(parsed.toneWords) ||
      !Array.isArray(parsed.usageRules)
    ) {
      throw new Error("Invalid style card structure from AI");
    }

    return NextResponse.json({ styleCard: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
