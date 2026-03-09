"use client";

import * as React from "react";
import type { GeneratedPalette } from "@/lib/ai";

interface MoodImage {
  url: string;
  source: "unsplash" | "dalle";
  alt: string;
  photographer?: string;
  photographerUrl?: string;
}

interface MoodboardSectionProps {
  palette: GeneratedPalette;
  mood: string;
}

export function MoodboardSection({ palette, mood }: MoodboardSectionProps) {
  const [images, setImages] = React.useState<MoodImage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    const primaryHex = palette.colors.find((c) => c.role === "primary")?.hex ?? palette.colors[0].hex;
    fetch("/api/studio/moodboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paletteName: palette.paletteName, mood, primaryHex }),
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<{ images?: MoodImage[]; error?: string }>)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setImages(data.images ?? []);
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load moodboard");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [palette, mood]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Moodboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated imagery and curated photos matching your palette mood.
        </p>
      </div>

      {loading && <MoodboardSkeleton />}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && images.length > 0 && (
        <div
          className="columns-2 sm:columns-3 gap-3 space-y-3"
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-xl overflow-hidden border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt}
                className="w-full object-cover"
                loading="lazy"
              />
              {img.source === "dalle" && (
                <div className="px-3 py-1.5 bg-primary/10 text-[10px] text-primary font-medium">
                  AI Generated
                </div>
              )}
              {img.source === "unsplash" && img.photographer && (
                <div className="px-3 py-1.5 bg-black/60 text-[10px] text-white/80">
                  Photo by{" "}
                  <a
                    href={img.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white"
                  >
                    {img.photographer}
                  </a>{" "}
                  on{" "}
                  <a
                    href="https://unsplash.com?utm_source=palettai&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white"
                  >
                    Unsplash
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MoodboardSkeleton() {
  return (
    <div className="columns-2 sm:columns-3 gap-3 space-y-3 animate-pulse">
      {[180, 240, 160, 200, 220, 180, 160, 240].map((h, i) => (
        <div
          key={i}
          className="break-inside-avoid rounded-xl bg-muted"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}
