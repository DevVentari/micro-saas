"use client";

import * as React from "react";
import { Check, Copy, GripHorizontal } from "lucide-react";
import { cn } from "@repo/ui";
import { hexToRgb, hexToHsl, hslToHex, getContrastColor } from "@/lib/color-utils";

interface ColorCardProps {
  hex: string;
  name: string;
  role: "primary" | "secondary" | "accent" | "neutral" | "background";
  className?: string;
  size?: "sm" | "md" | "lg";
  onChange?: (hex: string) => void;
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

export function ColorCard({ hex, name, role, className, size = "md", onChange }: ColorCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [currentHex, setCurrentHex] = React.useState(hex);
  const [isDragging, setIsDragging] = React.useState(false);

  // Sync with external prop changes (new palette generated)
  React.useEffect(() => {
    setCurrentHex(hex);
  }, [hex]);

  const dragRef = React.useRef<{ startX: number; startY: number; startH: number; startL: number } | null>(null);
  const wasDragRef = React.useRef(false);
  const swatchRef = React.useRef<HTMLDivElement>(null);

  const textColor = getContrastColor(currentHex);
  const rgb = hexToRgb(currentHex);
  const hsl = hexToHsl(currentHex);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { h, s, l } = hexToHsl(currentHex);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startH: h, startL: l };
    wasDragRef.current = false;
    setIsDragging(false);
    // Store saturation for the drag session
    (dragRef.current as any).startS = s;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (!wasDragRef.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    wasDragRef.current = true;
    setIsDragging(true);

    // Left/right = hue (1° per 2px), up/down = lightness (1% per 3px, inverted Y)
    const newH = ((dragRef.current.startH + Math.round(dx / 2)) % 360 + 360) % 360;
    const newL = Math.max(10, Math.min(95, dragRef.current.startL - Math.round(dy / 3)));
    const s = (dragRef.current as any).startS;

    const newHex = hslToHex(newH, s, newL);
    setCurrentHex(newHex);
    onChange?.(newHex);
  }

  function handlePointerUp() {
    dragRef.current = null;
    setIsDragging(false);
  }

  async function handleClick() {
    if (wasDragRef.current) return; // was a drag, not a click
    try {
      await navigator.clipboard.writeText(currentHex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = currentHex;
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
        "group relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
        isDragging ? "cursor-grabbing scale-[1.02]" : "cursor-grab",
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Drag left/right to change hue, up/down for lightness. Click to copy ${currentHex}`}
    >
      {/* Color Swatch */}
      <div
        ref={swatchRef}
        className={cn("w-full relative select-none", swatchHeight)}
        style={{ backgroundColor: currentHex, transition: isDragging ? "none" : "background-color 0.15s" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        {/* Drag hint */}
        <div
          className={cn(
            "absolute top-2 left-0 right-0 flex justify-center transition-opacity duration-200",
            hovered && !isDragging ? "opacity-100" : "opacity-0"
          )}
        >
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm"
            style={{
              backgroundColor: textColor === "white" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.35)",
              color: textColor === "white" ? "#fff" : "#000",
            }}
          >
            <GripHorizontal className="w-3 h-3" />
            drag to adjust
          </div>
        </div>

        {/* Copy overlay (shown on hover, not dragging) */}
        {!isDragging && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
              hovered ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundColor: textColor === "white" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }}
          >
            {copied ? (
              <Check
                className="w-8 h-8 drop-shadow-md"
                style={{ color: textColor === "white" ? "#fff" : "#000" }}
              />
            ) : (
              <Copy
                className="w-6 h-6 drop-shadow-md opacity-60"
                style={{ color: textColor === "white" ? "#fff" : "#000" }}
              />
            )}
          </div>
        )}

        {/* Hex label on swatch */}
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
          <span
            className={cn(
              "text-xs font-mono font-semibold px-2 py-0.5 rounded-full transition-all duration-200",
              hovered ? "opacity-0" : "opacity-80"
            )}
            style={{
              color: textColor === "white" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)",
            }}
          >
            {currentHex.toUpperCase()}
          </span>
        </div>

        {/* HSL/RGB on hover */}
        {hovered && !isDragging && (
          <div className="absolute top-8 left-2 right-2 text-center">
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

        {/* Live HSL values while dragging */}
        {isDragging && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <p
              className="text-sm font-mono font-bold drop-shadow"
              style={{ color: textColor === "white" ? "#fff" : "#000" }}
            >
              {currentHex.toUpperCase()}
            </p>
            <p
              className="text-xs font-mono opacity-90"
              style={{ color: textColor === "white" ? "#fff" : "#000" }}
            >
              H:{hsl.h}° S:{hsl.s}% L:{hsl.l}%
            </p>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="bg-white dark:bg-gray-900 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground font-mono">{currentHex.toUpperCase()}</p>
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
