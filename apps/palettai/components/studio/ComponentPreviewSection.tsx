"use client";

import * as React from "react";
import type { GeneratedPalette } from "@/lib/ai";
import { getContrastColor } from "@/lib/color-utils";

interface ComponentPreviewSectionProps {
  palette: GeneratedPalette;
}

export function ComponentPreviewSection({ palette }: ComponentPreviewSectionProps) {
  const primary = palette.colors.find((c) => c.role === "primary")?.hex ?? "#6d28d9";
  const secondary = palette.colors.find((c) => c.role === "secondary")?.hex ?? "#7c3aed";
  const accent = palette.colors.find((c) => c.role === "accent")?.hex ?? "#a78bfa";
  const neutral = palette.colors.find((c) => c.role === "neutral")?.hex ?? "#e5e7eb";
  const background = palette.colors.find((c) => c.role === "background")?.hex ?? "#fff";

  const primaryText = getContrastColor(primary) === "black" ? "#111" : "#fff";
  const bgText = getContrastColor(background) === "black" ? "#111" : "#fff";

  const cssVars: React.CSSProperties = {
    "--preview-primary": primary,
    "--preview-secondary": secondary,
    "--preview-accent": accent,
    "--preview-neutral": neutral,
    "--preview-background": background,
    "--preview-primary-text": primaryText,
    "--preview-bg-text": bgText,
  } as React.CSSProperties;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Component Preview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Common UI components rendered in your palette.
        </p>
      </div>

      <div style={cssVars} className="space-y-6">
        {/* Buttons */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Buttons</h3>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: primary, color: primaryText }}
            >
              Primary Action
            </button>
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium border-2 transition-opacity hover:opacity-80"
              style={{ borderColor: primary, color: primary, backgroundColor: "transparent" }}
            >
              Ghost Button
            </button>
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: secondary, color: getContrastColor(secondary) === "black" ? "#111" : "#fff" }}
            >
              Secondary
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {palette.colors.map((c) => (
              <span
                key={c.role}
                className="rounded-full px-3 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: c.hex,
                  color: getContrastColor(c.hex) === "black" ? "#111" : "#fff",
                }}
              >
                {c.role}
              </span>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Input Field</h3>
          <div className="max-w-sm space-y-1.5">
            <label className="text-sm font-medium" style={{ color: bgText }}>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              readOnly
              className="w-full rounded-lg px-3 py-2 text-sm border-2 outline-none"
              style={{
                borderColor: primary,
                backgroundColor: background,
                color: bgText,
              }}
            />
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Alerts</h3>
          <div
            className="rounded-lg px-4 py-3 text-sm border-l-4"
            style={{ borderColor: accent, backgroundColor: `${accent}22`, color: bgText }}
          >
            <strong>Success:</strong> Your palette has been saved successfully.
          </div>
          <div
            className="rounded-lg px-4 py-3 text-sm border-l-4"
            style={{ borderColor: "#ef4444", backgroundColor: "#fee2e2", color: "#991b1b" }}
          >
            <strong>Error:</strong> Something went wrong. Please try again.
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Card</h3>
          <div
            className="rounded-xl border overflow-hidden max-w-sm shadow-sm"
            style={{ borderColor: neutral, backgroundColor: background }}
          >
            <div className="h-24" style={{ backgroundColor: primary }} />
            <div className="p-4 space-y-2">
              <h4 className="font-semibold" style={{ color: bgText }}>
                {palette.paletteName}
              </h4>
              <p className="text-sm" style={{ color: getContrastColor(background) === "black" ? "#666" : "#aaa" }}>
                {palette.description.slice(0, 80)}…
              </p>
              <button
                className="mt-2 rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{ backgroundColor: primary, color: primaryText }}
              >
                View Palette
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
