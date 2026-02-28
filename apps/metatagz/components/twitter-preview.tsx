"use client";

import * as React from "react";
import { cn } from "@repo/ui";
import type { MetaResult } from "@/lib/og-parser";
import { ImageIcon } from "lucide-react";

interface TwitterPreviewProps {
  meta: MetaResult;
  className?: string;
}

function ImagePlaceholder() {
  return (
    <div className="w-full h-48 bg-gray-100 flex flex-col items-center justify-center gap-2">
      <ImageIcon className="w-10 h-10 text-gray-300" />
      <span className="text-xs text-gray-400">No og:image found</span>
    </div>
  );
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
        <ImageIcon className="w-8 h-8 text-gray-300" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export function TwitterPreview({ meta, className }: TwitterPreviewProps) {
  const title = meta.twitter.title || meta.og.title || meta.title;
  const description = meta.twitter.description || meta.og.description || meta.description;
  const image = meta.twitter.image || meta.og.image;
  const creator = meta.twitter.creator;
  const cardType = meta.twitter.card || "summary_large_image";

  let domain = "";
  try {
    domain = new URL(meta.url).hostname.replace("www.", "");
  } catch {
    domain = meta.url;
  }

  const isLargeCard = cardType === "summary_large_image";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Twitter Preview Card */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Twitter / X Preview
          </span>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {cardType}
          </span>
        </div>

        {/* Simulated Tweet with card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Tweet header */}
          <div className="flex items-start gap-3 p-3 pb-0">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-gray-900">User Name</span>
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1.01-2.52-1.27-3.91-.81-.67-1.31-1.9-2.19-3.34-2.19-1.43 0-2.67.88-3.33 2.19-1.4-.46-2.91-.2-3.92.81-1.01 1.01-1.26 2.52-.8 3.91C2.88 9.33 2 10.57 2 12c0 1.43.88 2.67 2.19 3.34-.46 1.39-.2 2.9.81 3.91 1.01 1.01 2.52 1.26 3.91.81.67 1.31 1.9 2.19 3.33 2.19 1.43 0 2.67-.88 3.33-2.19 1.4.45 2.91.2 3.92-.81 1.01-1.01 1.26-2.52.8-3.91C21.12 14.67 22.25 13.43 22.25 12z" />
                </svg>
                <span className="text-sm text-gray-500">@username</span>
              </div>
            </div>
          </div>
          <div className="px-3 py-2 text-sm text-gray-900">
            Check out this link:
          </div>

          {/* Card preview */}
          <div className="mx-3 mb-3 border border-gray-200 rounded-2xl overflow-hidden">
            {isLargeCard ? (
              <>
                {image ? (
                  <ImageWithFallback
                    src={image}
                    alt={title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <ImagePlaceholder />
                )}
                <div className="p-3 bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase">{domain}</p>
                  <p className="text-sm font-bold text-gray-900 line-clamp-1 mt-0.5">
                    {title || "(No title)"}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                    {description || "(No description)"}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex gap-0">
                <div className="w-20 shrink-0">
                  {image ? (
                    <ImageWithFallback
                      src={image}
                      alt={title}
                      className="w-20 h-full min-h-[80px] object-cover"
                    />
                  ) : (
                    <div className="w-20 min-h-[80px] bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1">
                  <p className="text-xs text-gray-500">{domain}</p>
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">
                    {title || "(No title)"}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tweet actions */}
          <div className="flex items-center gap-6 px-5 py-3 border-t border-gray-100">
            {["💬 24", "🔁 12", "❤️ 148", "📊 1.2K"].map((action) => (
              <span key={action} className="text-xs text-gray-500">
                {action}
              </span>
            ))}
          </div>
        </div>

        {creator && (
          <p className="text-xs text-muted-foreground mt-2">
            Creator: <span className="font-mono">{creator}</span>
          </p>
        )}
      </div>
    </div>
  );
}
