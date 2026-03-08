"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@repo/ui";
import type { GeneratedPalette } from "@/lib/ai";
import { getContrastColor } from "@/lib/color-utils";

interface StyleCardData {
  headingFont: string;
  bodyFont: string;
  toneWords: string[];
  usageRules: string[];
}

interface StyleCardSectionProps {
  palette: GeneratedPalette;
  mood: string;
}

function loadGoogleFont(fontName: string) {
  const id = `gfont-${fontName.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

export function StyleCardSection({ palette, mood }: StyleCardSectionProps) {
  const [data, setData] = React.useState<StyleCardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch("/api/studio/stylecard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ palette, mood }),
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<{ styleCard?: StyleCardData; error?: string }>)
      .then((d) => {
        if (d.error) throw new Error(d.error);
        if (d.styleCard) {
          setData(d.styleCard);
          loadGoogleFont(d.styleCard.headingFont);
          loadGoogleFont(d.styleCard.bodyFont);
        }
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load style card");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [palette, mood]);

  async function handleExport() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${palette.paletteName.replace(/\s/g, "-")}-style-card.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  const primary = palette.colors.find((c) => c.role === "primary")?.hex ?? "#000";
  const background = palette.colors.find((c) => c.role === "background")?.hex ?? "#fff";
  const neutral = palette.colors.find((c) => c.role === "neutral")?.hex ?? "#e5e7eb";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Style Card</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand brief with typography pairing and usage guidelines.
          </p>
        </div>
        {data && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="gap-2"
          >
            <Download className="size-4" />
            {exporting ? "Exporting..." : "Download PNG"}
          </Button>
        )}
      </div>

      {loading && <StyleCardSkeleton />}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden border border-border shadow-sm"
          style={{ backgroundColor: background, fontFamily: data.bodyFont }}
        >
          {/* Color strip */}
          <div className="flex h-16">
            {palette.colors.map((c) => (
              <div key={c.role} className="flex-1" style={{ backgroundColor: c.hex }} />
            ))}
          </div>

          {/* Card body */}
          <div className="p-8 space-y-8">
            {/* Palette name + description */}
            <div>
              <h2
                className="text-3xl font-bold"
                style={{
                  fontFamily: data.headingFont,
                  color: getContrastColor(background) === "black" ? "#111" : "#f9f9f9",
                }}
              >
                {palette.paletteName}
              </h2>
              <p
                className="mt-2 text-sm leading-relaxed max-w-lg"
                style={{ color: getContrastColor(background) === "black" ? "#555" : "#aaa" }}
              >
                {palette.description}
              </p>
            </div>

            {/* Typography preview */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: primary }}>
                  Heading Font
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ fontFamily: data.headingFont, color: getContrastColor(background) === "black" ? "#111" : "#f9f9f9" }}
                >
                  {data.headingFont}
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ fontFamily: data.headingFont, color: getContrastColor(background) === "black" ? "#555" : "#aaa" }}
                >
                  The quick brown fox
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: primary }}>
                  Body Font
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ fontFamily: data.bodyFont, color: getContrastColor(background) === "black" ? "#111" : "#f9f9f9" }}
                >
                  {data.bodyFont}
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ fontFamily: data.bodyFont, color: getContrastColor(background) === "black" ? "#555" : "#aaa" }}
                >
                  The quick brown fox
                </p>
              </div>
            </div>

            {/* Tone words */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: primary }}>
                Tone
              </p>
              <div className="flex flex-wrap gap-2">
                {data.toneWords.map((word) => (
                  <span
                    key={word}
                    className="rounded-full px-3 py-1 text-sm font-medium"
                    style={{
                      backgroundColor: neutral,
                      color: getContrastColor(neutral) === "black" ? "#111" : "#f9f9f9",
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Usage rules */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: primary }}>
                Usage Guidelines
              </p>
              <ul className="space-y-2">
                {data.usageRules.map((rule, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: getContrastColor(background) === "black" ? "#555" : "#aaa" }}
                  >
                    <span
                      className="mt-0.5 size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: primary }}
                    />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Colour swatches row */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: primary }}>
                Colours
              </p>
              <div className="flex gap-3 flex-wrap">
                {palette.colors.map((c) => (
                  <div key={c.role} className="flex items-center gap-2">
                    <span
                      className="inline-block size-5 rounded-full border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div>
                      <p
                        className="text-xs font-mono"
                        style={{ color: getContrastColor(background) === "black" ? "#111" : "#f9f9f9" }}
                      >
                        {c.hex}
                      </p>
                      <p
                        className="text-[10px] capitalize"
                        style={{ color: getContrastColor(background) === "black" ? "#999" : "#666" }}
                      >
                        {c.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StyleCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className="h-16 bg-muted" />
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-full rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-20 rounded-lg bg-muted" />
          <div className="h-20 rounded-lg bg-muted" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
