export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createApi } from "unsplash-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { paletteName: string; mood: string; primaryHex: string };
    const { paletteName, mood, primaryHex } = body;

    if (!paletteName || !mood) {
      return NextResponse.json({ error: "paletteName and mood are required" }, { status: 400 });
    }

    const unsplash = createApi({
      accessKey: process.env.UNSPLASH_ACCESS_KEY!,
      fetch: fetch,
    });

    const query = `${mood} ${paletteName} aesthetic`;

    const [unsplashResult, dalleResult] = await Promise.allSettled([
      // Unsplash: 7 mood-matched photos
      unsplash.search.getPhotos({
        query,
        perPage: 7,
        orientation: "landscape",
      }),
      // DALL-E: 1 abstract hero image
      fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Abstract ${mood} color field with ${primaryHex} as the dominant color, editorial photography style, minimalist, no text, no people`,
          n: 1,
          size: "1024x1024",
        }),
        signal: AbortSignal.timeout(25000),
      }).then((r) => r.json() as Promise<{ data: Array<{ url: string }> }>),
    ]);

    const images: Array<{ url: string; source: "unsplash" | "dalle"; alt: string }> = [];

    // Add DALL-E image first (hero position)
    if (dalleResult.status === "fulfilled" && dalleResult.value?.data?.[0]?.url) {
      images.push({
        url: dalleResult.value.data[0].url,
        source: "dalle",
        alt: `AI-generated ${mood} abstract`,
      });
    }

    // Add Unsplash photos
    if (
      unsplashResult.status === "fulfilled" &&
      unsplashResult.value.type === "success"
    ) {
      for (const photo of unsplashResult.value.response.results) {
        images.push({
          url: photo.urls.regular,
          source: "unsplash",
          alt: photo.alt_description ?? query,
        });
      }
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "No images could be generated" }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
