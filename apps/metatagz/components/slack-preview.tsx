"use client";

import * as React from "react";
import { cn } from "@repo/ui";
import type { MetaResult } from "@/lib/og-parser";
import { ImageIcon, Lock } from "lucide-react";
import Link from "next/link";

interface SlackPreviewProps {
  meta: MetaResult;
  isPro: boolean;
  className?: string;
}

function ImageWithFallback({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <div className={cn("bg-gray-100 flex items-center justify-center", className)}>
        <ImageIcon className="w-6 h-6 text-gray-300" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export function SlackPreview({ meta, isPro, className }: SlackPreviewProps) {
  const title = meta.og.title || meta.title;
  const description = meta.og.description || meta.description;
  const siteName = meta.og.siteName;
  const image = meta.og.image;

  let domain = "";
  try {
    domain = new URL(meta.url).hostname.replace("www.", "");
  } catch {
    domain = meta.url;
  }

  const displaySiteName = siteName || domain;

  if (!isPro) {
    return (
      <div
        className={cn(
          "rounded-xl border bg-card p-5 flex flex-col items-center justify-center gap-3 min-h-[200px]",
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-[#4A154B]/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-[#4A154B]" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-sm">Slack Preview</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Upgrade to Pro to see Slack unfurl preview
          </p>
        </div>
        <Link
          href="/pricing"
          className="text-xs font-medium text-primary hover:underline"
        >
          Upgrade to Pro &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Slack Preview
          </span>
        </div>

        {/* Slack app shell */}
        <div className="bg-[#1a1d21] rounded-lg p-4 font-[system-ui]">
          {/* Message */}
          <div className="flex gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-[#4A154B] flex items-center justify-center text-white text-xs font-bold shrink-0">
              U
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-[#d1d2d3]">User</span>
                <span className="text-xs text-[#9e9fa1]">2:34 PM</span>
              </div>
              <p className="text-sm text-[#d1d2d3] mt-0.5">
                Check out this link:{" "}
                <span className="text-[#1d9bd1] hover:underline cursor-pointer">
                  {meta.url.length > 40 ? meta.url.slice(0, 40) + "..." : meta.url}
                </span>
              </p>
            </div>
          </div>

          {/* Slack unfurl card */}
          <div className="ml-10 flex gap-0 rounded overflow-hidden border border-[#2c2d30]">
            {/* Left color bar (green — representing og:site color / brand) */}
            <div className="w-1 bg-primary shrink-0" />

            {/* Content */}
            <div className="bg-[#222529] flex-1 p-3">
              {/* Site name */}
              <p className="text-xs font-bold text-[#d1d2d3] mb-1">{displaySiteName}</p>

              {/* Title */}
              <a
                href={meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-[#1d9bd1] hover:underline line-clamp-1 block"
              >
                {title || "(No title)"}
              </a>

              {/* Description */}
              {description && (
                <p className="text-xs text-[#9e9fa1] mt-1 line-clamp-3 leading-relaxed">
                  {description}
                </p>
              )}

              {/* Image thumbnail */}
              {image && (
                <div className="mt-2 rounded overflow-hidden max-w-[360px]">
                  <ImageWithFallback
                    src={image}
                    alt={title}
                    className="w-full h-36 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
