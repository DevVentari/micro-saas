"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@repo/ui";
import { hexToRgb, hexToHsl, getContrastColor } from "@/lib/color-utils";

interface ColorCardProps {
  hex: string;
  name: string;
  role: "primary" | "secondary" | "accent" | "neutral" | "background";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const roleLabels: Record<string, string> = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  neutral: "Neutral",
  background: "Background",
};

const roleBadgeColors: Record<string, string> = {
  primary: "bg-violet-600 text-white",
  secondary: "bg-indigo-500 text-white",
  accent: "bg-pink-500 text-white",
  neutral: "bg-slate-500 text-white",
  background: "bg-gray-400 text-white",
};

export function ColorCard({ hex, name, role, className, size = "md" }: ColorCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const textColor = getContrastColor(hex);
  const rgb = hexToRgb(hex);
  const hsl = hexToHsl(hex);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = hex;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const swatchHeight = size === "lg" ? "h-48" : size === "sm" ? "h-24" : "h-36";

  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer",
        className
      )}
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Click to copy ${hex}`}
    >
      {/* Color Swatch */}
      <div
        className={cn("w-full relative transition-all duration-300", swatchHeight)}
        style={{ backgroundColor: hex }}
      >
        {/* Copy overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
            hovered ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundColor: textColor === "white" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }}
        >
          {copied ? (
            <Check
              className="w-8 h-8 drop-shadow-md"
              style={{ color: textColor === "white" ? "#fff" : "#000" }}
            />
          ) : (
            <Copy
              className="w-6 h-6 drop-shadow-md"
              style={{ color: textColor === "white" ? "#fff" : "#000" }}
            />
          )}
        </div>

        {/* Hex label on swatch */}
        <div
          className="absolute bottom-2 left-0 right-0 flex items-center justify-center"
        >
          <span
            className={cn(
              "text-xs font-mono font-semibold px-2 py-0.5 rounded-full transition-all duration-200",
              hovered ? "opacity-0" : "opacity-80"
            )}
            style={{
              color: textColor === "white" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)",
            }}
          >
            {hex.toUpperCase()}
          </span>
        </div>

        {/* HSL/RGB on hover */}
        {hovered && (
          <div
            className="absolute top-2 left-2 right-2 text-center"
          >
            <p
              className="text-xs font-mono opacity-90"
              style={{ color: textColor === "white" ? "#fff" : "#000" }}
            >
              rgb({rgb.r}, {rgb.g}, {rgb.b})
            </p>
            <p
              className="text-xs font-mono opacity-90"
              style={{ color: textColor === "white" ? "#fff" : "#000" }}
            >
              hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
            </p>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="bg-white dark:bg-gray-900 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground font-mono">{hex.toUpperCase()}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                roleBadgeColors[role]
              )}
            >
              {roleLabels[role]}
            </span>
          </div>
        </div>

        {/* Copy feedback */}
        {copied && (
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600 font-medium">
            <Check className="w-3 h-3" />
            Copied!
          </div>
        )}
      </div>
    </div>
  );
}
