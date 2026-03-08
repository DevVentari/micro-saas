"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@repo/ui";
import { generateShades, getContrastColor } from "@/lib/color-utils";
import type { GeneratedPalette } from "@/lib/ai";

const SHADE_LABELS = ["50", "100", "200", "300", "400", "500", "600", "700", "800"];

interface ShadesSectionProps {
  palette: GeneratedPalette;
}

export function ShadesSection({ palette }: ShadesSectionProps) {
  const [copiedHex, setCopiedHex] = React.useState<string | null>(null);
  const [copiedCss, setCopiedCss] = React.useState(false);

  function handleCopy(hex: string) {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1500);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Shade Scales</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Full 9-step scale for each palette role. Click any swatch to copy its hex.
        </p>
      </div>

      <div className="space-y-4">
        {palette.colors.map((color) => {
          const shades = generateShades(color.hex);
          return (
            <div key={color.role}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="inline-block size-3 rounded-full border border-border/50"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-sm font-medium capitalize text-foreground">
                  {color.role}
                </span>
                <span className="text-xs text-muted-foreground">— {color.name}</span>
              </div>
              <div className="flex rounded-xl overflow-hidden border border-border">
                {shades.map((shade, i) => {
                  const label = SHADE_LABELS[i];
                  const textColor = getContrastColor(shade);
                  const isCopied = copiedHex === shade;
                  return (
                    <button
                      key={label}
                      className={cn(
                        "group flex-1 flex flex-col items-center justify-end py-3 px-1 transition-all",
                        "hover:flex-[1.4] focus-visible:ring-2 focus-visible:ring-white/70"
                      )}
                      style={{ backgroundColor: shade }}
                      onClick={() => handleCopy(shade)}
                      title={`${color.role}-${label}: ${shade}`}
                      aria-label={`${color.role}-${label}: ${shade}`}
                    >
                      <span
                        className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: textColor === "black" ? "#000" : "#fff" }}
                      >
                        {isCopied ? (
                          <Check className="size-3" />
                        ) : (
                          shade
                        )}
                      </span>
                      <span
                        className="mt-1 text-[10px] font-medium"
                        style={{ color: textColor === "black" ? "#000" : "#fff", opacity: 0.7 }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">CSS Custom Properties</span>
          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              const vars = palette.colors
                .flatMap((c) => {
                  const shades = generateShades(c.hex);
                  return shades.map((shade, i) => `  --${c.role}-${SHADE_LABELS[i]}: ${shade};`);
                })
                .join("\n");
              navigator.clipboard.writeText(`:root {\n${vars}\n}`);
              setCopiedCss(true);
              setTimeout(() => setCopiedCss(false), 1500);
            }}
          >
            {copiedCss ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copiedCss ? "Copied!" : "Copy all"}
          </button>
        </div>
        <pre className="text-xs text-muted-foreground overflow-x-auto max-h-32">
          {palette.colors
            .slice(0, 1)
            .flatMap((c) => {
              const shades = generateShades(c.hex);
              return shades.map((shade, i) => `--${c.role}-${SHADE_LABELS[i]}: ${shade};`);
            })
            .join("\n")}
          {"\n/* + " + (palette.colors.length - 1) * 9 + " more... */"}
        </pre>
      </div>
    </div>
  );
}
