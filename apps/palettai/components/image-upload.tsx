"use client";

import * as React from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@repo/ui";
import { rgbToHex } from "@/lib/color-utils";

interface ExtractedColor {
  hex: string;
  count: number;
}

interface ImageUploadProps {
  onColorsExtracted?: (colors: string[]) => void;
  className?: string;
}

export function ImageUpload({ onColorsExtracted, className }: ImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [extractedColors, setExtractedColors] = React.useState<ExtractedColor[]>([]);
  const [extracting, setExtracting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  function extractColors(imageUrl: string) {
    setExtracting(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      // Scale for performance
      const maxDim = 150;
      const scale = Math.min(maxDim / img.width, maxDim / img.height);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const colorMap = new Map<string, number>();

      // Sample every 5th pixel
      for (let i = 0; i < data.length; i += 20) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 128) continue; // skip transparent

        // Quantize to reduce colors
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const hex = rgbToHex(qr, qg, qb);
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }

      // Sort by frequency and pick top 5
      const sorted = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([hex, count]) => ({ hex, count }));

      setExtractedColors(sorted);
      setExtracting(false);
      onColorsExtracted?.(sorted.map((c) => c.hex));
    };
    img.onerror = () => {
      setExtracting(false);
    };
    img.src = imageUrl;
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setExtractedColors([]);
    extractColors(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleClear() {
    setPreview(null);
    setExtractedColors([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("w-full", className)}>
      <canvas ref={canvasRef} className="hidden" />

      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Extract colors from an image
          </p>
          <p className="text-xs text-muted-foreground">
            Drag & drop or click to upload (JPG, PNG, WebP)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Uploaded image"
              className="w-full h-40 object-cover"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {extracting ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Upload className="w-4 h-4 animate-bounce" />
              Extracting colors...
            </div>
          ) : extractedColors.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Extracted Colors
              </p>
              <div className="flex gap-2">
                {extractedColors.map((color) => (
                  <div key={color.hex} className="flex flex-col items-center gap-1">
                    <div
                      className="w-10 h-10 rounded-lg shadow-sm border border-border/50 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(color.hex);
                        } catch {
                          /* ignore */
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground font-mono">
                      {color.hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
