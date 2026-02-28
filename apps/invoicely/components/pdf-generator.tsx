"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@repo/ui";
import { cn } from "@repo/ui";
import type { InvoiceData } from "./invoice-creator";

interface PdfDownloadButtonProps {
  data: InvoiceData;
  isPro: boolean;
  className?: string;
}

export function PdfDownloadButton({
  data,
  isPro,
  className,
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!data.businessName && !data.clientName) {
      setError("Please fill in at least your business name or client name.");
      setTimeout(() => setError(null), 4000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Dynamically import to avoid SSR issues
      const { pdf } = await import("@react-pdf/renderer");
      const React = (await import("react")).default;
      const { InvoicePDFComponent } = await import("@/lib/pdf");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const element = React.createElement(InvoicePDFComponent, { data, isPro }) as any;
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${data.invoiceNumber || "draft"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Failed to generate PDF. Please try again.");
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 w-full"
      >
        <Download className="h-4 w-4" />
        {loading ? "Generating PDF..." : "Download PDF"}
      </Button>
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
      {!isPro && !error && (
        <p className="text-xs text-muted-foreground text-center">
          Free PDF includes watermark
        </p>
      )}
    </div>
  );
}
