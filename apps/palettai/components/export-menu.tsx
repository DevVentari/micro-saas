"use client";

import * as React from "react";
import { Download, Check, ChevronDown } from "lucide-react";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui";
import {
  toCssVariables,
  toTailwindConfig,
  toFigmaJson,
  toSvg,
  toJsonArray,
  type ColorEntry,
} from "@/lib/export";

interface ExportMenuProps {
  colors: ColorEntry[];
  className?: string;
}

type ExportFormat = "css" | "tailwind" | "figma" | "svg" | "json";

const formatLabels: Record<ExportFormat, string> = {
  css: "CSS Variables",
  tailwind: "Tailwind Config",
  figma: "Figma JSON",
  svg: "SVG Palette",
  json: "JSON Array",
};

const formatIcons: Record<ExportFormat, string> = {
  css: "{ }",
  tailwind: "TW",
  figma: "Fig",
  svg: "SVG",
  json: "[ ]",
};

export function ExportMenu({ colors, className }: ExportMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [copiedFormat, setCopiedFormat] = React.useState<ExportFormat | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleExport(format: ExportFormat) {
    let content = "";

    switch (format) {
      case "css":
        content = toCssVariables(colors);
        break;
      case "tailwind":
        content = toTailwindConfig(colors);
        break;
      case "figma":
        content = toFigmaJson(colors);
        break;
      case "svg":
        content = toSvg(colors);
        break;
      case "json":
        content = toJsonArray(colors);
        break;
    }

    try {
      await navigator.clipboard.writeText(content);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2500);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2500);
    }

    setOpen(false);
  }

  const formats: ExportFormat[] = ["css", "tailwind", "figma", "svg", "json"];

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl border border-border shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Export Format
            </p>
          </div>
          {formats.map((format) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                copiedFormat === format && "text-green-600"
              )}
            >
              <span className="w-8 h-6 flex items-center justify-center bg-muted rounded text-xs font-mono font-bold text-muted-foreground shrink-0">
                {formatIcons[format]}
              </span>
              <span className="flex-1">{formatLabels[format]}</span>
              {copiedFormat === format && (
                <Check className="w-4 h-4 text-green-600 shrink-0" />
              )}
            </button>
          ))}

          {copiedFormat && (
            <div className="px-4 py-2 border-t border-border bg-green-50 dark:bg-green-950">
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                Copied {formatLabels[copiedFormat]} to clipboard!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
