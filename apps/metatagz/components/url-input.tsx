"use client";

import * as React from "react";
import { Button, Input } from "@repo/ui";
import { Search, Loader2, AlertCircle } from "lucide-react";
import type { MetaResult } from "@/lib/og-parser";

interface UrlInputProps {
  onResults: (result: MetaResult) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function UrlInput({ onResults, onError, className }: UrlInputProps) {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isValidUrl = (value: string): boolean => {
    try {
      const normalized = value.startsWith("http") ? value : `https://${value}`;
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  };

  const handleAnalyze = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter a URL");
      return;
    }
    if (!isValidUrl(trimmedUrl)) {
      setError("Please enter a valid URL (e.g. example.com or https://example.com)");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/fetch-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Failed to analyze URL";
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      onResults(data as MetaResult);
    } catch {
      const errorMsg = "Network error. Please check your connection and try again.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleAnalyze();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError(null);
  };

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="url"
            placeholder="Enter URL (e.g. https://example.com)"
            value={url}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="pl-9 h-12 text-base"
            disabled={loading}
            aria-label="URL to analyze"
          />
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={loading || !url.trim()}
          className="h-12 px-8 text-base font-semibold shrink-0"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
