"use client";

import * as React from "react";
import { cn } from "@repo/ui";
import type { MetaResult } from "@/lib/og-parser";

interface GooglePreviewProps {
  meta: MetaResult;
  className?: string;
}

const TITLE_MAX = 60;
const DESC_MAX = 160;

function CharCounter({
  count,
  max,
  label,
}: {
  count: number;
  max: number;
  label: string;
}) {
  const isOver = count > max;
  const isWarning = count > max * 0.9 && !isOver;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono font-medium",
          isOver && "text-destructive",
          isWarning && "text-amber-600",
          !isOver && !isWarning && "text-muted-foreground"
        )}
      >
        {count}/{max}
        {isOver && (
          <span className="ml-1 text-destructive">
            ({count - max} over)
          </span>
        )}
      </span>
    </div>
  );
}

export function GooglePreview({ meta, className }: GooglePreviewProps) {
  const effectiveTitle = meta.og.title || meta.title;
  const effectiveDesc = meta.og.description || meta.description;

  const displayTitle =
    effectiveTitle.length > TITLE_MAX
      ? effectiveTitle.slice(0, TITLE_MAX) + "..."
      : effectiveTitle;

  const displayDesc =
    effectiveDesc.length > DESC_MAX
      ? effectiveDesc.slice(0, DESC_MAX) + "..."
      : effectiveDesc;

  let domain = "";
  let breadcrumb = "";
  try {
    const urlObj = new URL(meta.url);
    domain = urlObj.hostname;
    breadcrumb = urlObj.href.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (breadcrumb.length > 50) breadcrumb = breadcrumb.slice(0, 50) + "...";
  } catch {
    domain = meta.url;
    breadcrumb = meta.url;
  }

  const issues: string[] = [];
  if (!meta.og.image) issues.push("Missing og:image");
  if (!effectiveTitle) issues.push("Missing title");
  if (!effectiveDesc) issues.push("Missing description");
  if (effectiveTitle.length > TITLE_MAX) issues.push("Title too long");
  if (effectiveDesc.length > DESC_MAX) issues.push("Description too long");
  if (!meta.canonical) issues.push("Missing canonical URL");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Google Search Preview Card */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          {/* Google Logo indicator */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Google Preview
            </span>
          </div>
        </div>

        {/* Simulated Google Result */}
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          {/* Site info row */}
          <div className="flex items-center gap-2 mb-1">
            {meta.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={meta.favicon}
                alt=""
                width={16}
                height={16}
                className="rounded-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-4 h-4 bg-muted rounded-sm" />
            )}
            <span className="text-sm text-gray-700">{domain}</span>
            <svg
              className="w-3 h-3 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>

          {/* Breadcrumb */}
          <div className="text-xs text-[#006621] mb-1 font-normal">{breadcrumb}</div>

          {/* Title */}
          {effectiveTitle ? (
            <h3 className="text-[#1a0dab] text-lg font-normal leading-snug hover:underline cursor-pointer">
              {displayTitle}
            </h3>
          ) : (
            <h3 className="text-[#1a0dab] text-lg font-normal leading-snug italic text-opacity-50">
              (No title found)
            </h3>
          )}

          {/* Description */}
          {effectiveDesc ? (
            <p className="text-sm text-[#4d5156] mt-1 leading-snug">{displayDesc}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1 italic">
              (No description found)
            </p>
          )}
        </div>
      </div>

      {/* Character Counters */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          SEO Character Counts
        </h4>
        <CharCounter
          count={effectiveTitle.length}
          max={TITLE_MAX}
          label="Title tag"
        />
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              effectiveTitle.length > TITLE_MAX
                ? "bg-destructive"
                : effectiveTitle.length > TITLE_MAX * 0.9
                ? "bg-amber-500"
                : "bg-primary"
            )}
            style={{
              width: `${Math.min(100, (effectiveTitle.length / TITLE_MAX) * 100)}%`,
            }}
          />
        </div>
        <CharCounter
          count={effectiveDesc.length}
          max={DESC_MAX}
          label="Meta description"
        />
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              effectiveDesc.length > DESC_MAX
                ? "bg-destructive"
                : effectiveDesc.length > DESC_MAX * 0.9
                ? "bg-amber-500"
                : "bg-primary"
            )}
            style={{
              width: `${Math.min(100, (effectiveDesc.length / DESC_MAX) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Issues / Score */}
      {issues.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">
            Issues Found ({issues.length})
          </h4>
          <ul className="space-y-1">
            {issues.map((issue) => (
              <li key={issue} className="flex items-center gap-2 text-sm text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-sm font-medium text-green-800">All Google SEO checks passed!</span>
          </div>
        </div>
      )}
    </div>
  );
}
