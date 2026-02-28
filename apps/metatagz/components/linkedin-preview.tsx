"use client";

import * as React from "react";
import { cn } from "@repo/ui";
import type { MetaResult } from "@/lib/og-parser";
import { ImageIcon, Lock } from "lucide-react";
import Link from "next/link";

interface LinkedInPreviewProps {
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
        <ImageIcon className="w-8 h-8 text-gray-300" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export function LinkedInPreview({ meta, isPro, className }: LinkedInPreviewProps) {
  const title = meta.og.title || meta.title;
  const description = meta.og.description || meta.description;
  const image = meta.og.image;

  let domain = "";
  try {
    domain = new URL(meta.url).hostname.replace("www.", "");
  } catch {
    domain = meta.url;
  }

  if (!isPro) {
    return (
      <div
        className={cn(
          "rounded-xl border bg-card p-5 flex flex-col items-center justify-center gap-3 min-h-[200px]",
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-[#0A66C2]/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-[#0A66C2]" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-sm">LinkedIn Preview</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Upgrade to Pro to see LinkedIn Open Graph preview
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
            LinkedIn Preview
          </span>
        </div>

        {/* LinkedIn Post shell */}
        <div className="bg-white rounded-lg border border-[#e0e0e0] overflow-hidden">
          {/* Post header */}
          <div className="p-3 flex items-start gap-2">
            <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-bold text-sm shrink-0">
              U
            </div>
            <div>
              <p className="text-sm font-semibold text-[#000000e0]">User Name</p>
              <p className="text-xs text-[#00000099]">Professional Title • 1st</p>
              <p className="text-xs text-[#00000099]">Just now</p>
            </div>
          </div>

          <div className="px-3 pb-2 text-sm text-[#000000e0]">
            Sharing an interesting article:
          </div>

          {/* Link attachment - LinkedIn style: image on top, text below */}
          <div className="border-t border-[#e0e0e0]">
            {image ? (
              <ImageWithFallback
                src={image}
                alt={title}
                className="w-full h-44 object-cover"
              />
            ) : (
              <div className="w-full h-44 bg-[#f5f5f5] flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-8 h-8 text-[#b0b0b0]" />
                <span className="text-xs text-[#b0b0b0]">No image</span>
              </div>
            )}
            <div className="bg-[#f5f5f5] p-3 border-t border-[#e0e0e0]">
              <p className="text-sm font-semibold text-[#000000e0] line-clamp-2 leading-snug">
                {title || "(No title)"}
              </p>
              {description && (
                <p className="text-xs text-[#00000099] mt-0.5 line-clamp-1">
                  {description}
                </p>
              )}
              <p className="text-xs text-[#00000066] mt-1">{domain}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center border-t border-[#e0e0e0]">
            {[
              { icon: "👍", label: "Like" },
              { icon: "💬", label: "Comment" },
              { icon: "🔁", label: "Repost" },
              { icon: "✉️", label: "Send" },
            ].map((action) => (
              <button
                key={action.label}
                className="flex-1 py-2 text-xs font-semibold text-[#00000099] hover:bg-gray-50 flex flex-col items-center gap-0.5"
              >
                <span>{action.icon}</span>
                <span className="hidden sm:block">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
