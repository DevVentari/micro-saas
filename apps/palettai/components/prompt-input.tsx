"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui";
import type { GeneratedPalette } from "@/lib/ai";

interface PromptInputProps {
  onGenerated: (palette: GeneratedPalette, remaining: number) => void;
  onError?: (error: string) => void;
  initialRemaining?: number;
  className?: string;
}

const MOODS = [
  "Professional",
  "Playful",
  "Elegant",
  "Nature",
  "Tech",
  "Warm",
  "Cool",
  "Bold",
] as const;

const EXAMPLE_PROMPTS = [
  "Sunset beach vibes",
  "Corporate finance app",
  "Children's toy brand",
  "Dark mode developer tool",
  "Luxury fashion brand",
  "Organic food startup",
];

export function PromptInput({
  onGenerated,
  onError,
  initialRemaining = 5,
  className,
}: PromptInputProps) {
  const [prompt, setPrompt] = React.useState("");
  const [mood, setMood] = React.useState<string>("Professional");
  const [loading, setLoading] = React.useState(false);
  const [remaining, setRemaining] = React.useState(initialRemaining);

  const MAX_CHARS = 500;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), mood }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError?.(data.error || "Failed to generate palette. Please try again.");
        return;
      }

      setRemaining(data.remaining ?? 0);
      onGenerated(data.palette, data.remaining ?? 0);
    } catch {
      onError?.("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleExampleClick(example: string) {
    setPrompt(example);
  }

  const charCount = prompt.length;
  const isNearLimit = charCount > MAX_CHARS * 0.8;

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleGenerate} className="space-y-4">
        {/* Textarea */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Describe your color palette... e.g. 'A calming spa brand with ocean and sage tones' or 'Bold startup with energetic, modern vibes'"
            rows={3}
            className={cn(
              "w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "placeholder:text-muted-foreground",
              "pr-16"
            )}
            disabled={loading}
          />
          <div
            className={cn(
              "absolute bottom-2 right-3 text-xs tabular-nums",
              isNearLimit ? "text-orange-500" : "text-muted-foreground"
            )}
          >
            {charCount}/{MAX_CHARS}
          </div>
        </div>

        {/* Example prompts */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground",
                "hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors",
                prompt === example && "bg-primary/10 text-primary border-primary/30"
              )}
              disabled={loading}
            >
              {example}
            </button>
          ))}
        </div>

        {/* Mood selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
            Mood / Style
          </label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={cn(
                  "text-sm px-4 py-1.5 rounded-full border font-medium transition-all duration-150",
                  mood === m
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                )}
                disabled={loading}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button + rate limit info */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            <span
              className={cn(
                "font-semibold",
                remaining <= 1 ? "text-orange-500" : "text-primary"
              )}
            >
              {remaining}
            </span>{" "}
            / 5 free generations today
          </div>

          <Button
            type="submit"
            disabled={!prompt.trim() || loading || remaining <= 0}
            className="flex items-center gap-2 min-w-[160px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Palette
              </>
            )}
          </Button>
        </div>

        {remaining <= 0 && (
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 px-4 py-3 text-sm text-orange-700 dark:text-orange-300">
            You have reached your daily limit of 5 free generations.{" "}
            <a href="/pricing" className="font-semibold underline hover:no-underline">
              Upgrade to Pro
            </a>{" "}
            for unlimited generations.
          </div>
        )}
      </form>
    </div>
  );
}
