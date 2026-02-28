"use client";

import * as React from "react";
import { cn } from "@repo/ui";
import type { MetaResult } from "@/lib/og-parser";
import { ImageIcon, Lock } from "lucide-react";
import Link from "next/link";

interface FacebookPreviewProps {
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
        <ImageIcon className="w-10 h-10 text-gray-300" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export function FacebookPreview({ meta, isPro, className }: FacebookPreviewProps) {
  const title = meta.og.title || meta.title;
  const description = meta.og.description || meta.description;
  const image = meta.og.image;

  let domain = "";
  try {
    domain = new URL(meta.url).hostname.replace("www.", "").toUpperCase();
  } catch {
    domain = meta.url.toUpperCase();
  }

  if (!isPro) {
    return (
      <div
        className={cn(
          "rounded-xl border bg-card p-5 flex flex-col items-center justify-center gap-3 min-h-[200px]",
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-[#1877F2]" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-sm">Facebook Preview</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Upgrade to Pro to see Facebook Open Graph preview
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
            Facebook Preview
          </span>
        </div>

        {/* Facebook-style card */}
        <div className="bg-[#f0f2f5] rounded-lg overflow-hidden border border-[#dddfe2]">
          {/* Image */}
          {image ? (
            <ImageWithFallback
              src={image}
              alt={title}
              className="w-full h-52 object-cover"
            />
          ) : (
            <div className="w-full h-52 bg-[#e4e6ea] flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-10 h-10 text-[#bcc0c4]" />
              <span className="text-xs text-[#8a8d91]">No image found</span>
            </div>
          )}

          {/* Text section */}
          <div className="bg-[#e4e6eb] border-t border-[#dddfe2] p-3">
            <p className="text-[11px] text-[#606770] uppercase font-medium tracking-wide">
              {domain}
            </p>
            <p className="text-sm font-semibold text-[#1c1e21] leading-snug mt-0.5 line-clamp-2">
              {title || "(No title)"}
            </p>
            {description && (
              <p className="text-xs text-[#606770] mt-0.5 line-clamp-1">
                {description}
              </p>
            )}
          </div>

          {/* Action bar */}
          <div className="bg-white border-t border-[#dddfe2] flex items-center">
            <button className="flex-1 py-2 text-xs font-semibold text-[#606770] hover:bg-gray-50 flex items-center justify-center gap-1.5">
              <span>👍</span> Like
            </button>
            <button className="flex-1 py-2 text-xs font-semibold text-[#606770] hover:bg-gray-50 border-x border-[#dddfe2] flex items-center justify-center gap-1.5">
              <span>💬</span> Comment
            </button>
            <button className="flex-1 py-2 text-xs font-semibold text-[#606770] hover:bg-gray-50 flex items-center justify-center gap-1.5">
              <span>↗</span> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
