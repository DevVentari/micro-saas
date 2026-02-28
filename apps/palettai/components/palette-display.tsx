"use client";

import * as React from "react";
import { RefreshCw, Save, Sparkles, Lock } from "lucide-react";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui";
import { ColorCard } from "./color-card";
import { ExportMenu } from "./export-menu";
import type { GeneratedPalette } from "@/lib/ai";
import type { ColorEntry } from "@/lib/export";

interface PaletteDisplayProps {
  palette: GeneratedPalette;
  onRegenerate?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isPro?: boolean;
  isLoggedIn?: boolean;
  className?: string;
}

export function PaletteDisplay({
  palette,
  onRegenerate,
  onSave,
  isSaving = false,
  isPro = false,
  isLoggedIn = false,
  className,
}: PaletteDisplayProps) {
  const [colors, setColors] = React.useState(palette.colors);

  // Reset when a new palette is generated
  React.useEffect(() => {
    setColors(palette.colors);
  }, [palette]);

  function handleColorChange(index: number, newHex: string) {
    setColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, hex: newHex } : c))
    );
  }

  const colorEntries: ColorEntry[] = colors.map((c) => ({
    hex: c.hex,
    name: c.name,
    role: c.role,
  }));

  const canSave = isLoggedIn && isPro;

  return (
    <div
      className={cn(
        "animate-slide-up rounded-2xl border border-border bg-white dark:bg-gray-900 shadow-xl overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{palette.paletteName}</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            {palette.description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ExportMenu colors={colorEntries} />

          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          )}

          {onSave && (
            <div className="relative group">
              <Button
                size="sm"
                onClick={canSave ? onSave : undefined}
                disabled={isSaving || (!canSave)}
                className={cn(
                  "flex items-center gap-2",
                  !canSave && "opacity-60 cursor-not-allowed"
                )}
              >
                {!canSave && <Lock className="w-3 h-3" />}
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isSaving ? "Saving..." : "Save"}
                </span>
              </Button>
              {!canSave && (
                <div className="absolute bottom-full right-0 mb-2 w-52 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {!isLoggedIn
                    ? "Sign in and upgrade to Pro to save palettes"
                    : "Upgrade to Pro to save palettes"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Color Swatches */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {colors.map((color, i) => (
            <ColorCard
              key={color.role}
              hex={color.hex}
              name={color.name}
              role={color.role}
              size="lg"
              onChange={(newHex) => handleColorChange(i, newHex)}
            />
          ))}
        </div>
      </div>

      {/* Wide strip preview */}
      <div className="h-3 flex overflow-hidden">
        {colors.map((color) => (
          <div
            key={color.role}
            className="flex-1 transition-transform duration-300 hover:scale-y-125 origin-bottom"
            style={{ backgroundColor: color.hex }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}
