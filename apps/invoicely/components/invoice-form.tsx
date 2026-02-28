"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { LineItems } from "./line-items";
import { PdfDownloadButton } from "./pdf-generator";
import type { InvoiceData } from "./invoice-creator";
import {
  Building2,
  User,
  FileText,
  DollarSign,
  StickyNote,
  Save,
  Upload,
  X,
} from "lucide-react";

const CURRENCIES = [
  { code: "USD", label: "USD – US Dollar" },
  { code: "EUR", label: "EUR – Euro" },
  { code: "GBP", label: "GBP – British Pound" },
  { code: "CAD", label: "CAD – Canadian Dollar" },
  { code: "AUD", label: "AUD – Australian Dollar" },
  { code: "JPY", label: "JPY – Japanese Yen" },
  { code: "INR", label: "INR – Indian Rupee" },
  { code: "CHF", label: "CHF – Swiss Franc" },
  { code: "MXN", label: "MXN – Mexican Peso" },
  { code: "BRL", label: "BRL – Brazilian Real" },
];

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  isPro: boolean;
  isLoggedIn: boolean;
}

export function InvoiceForm({ data, onChange, isPro, isLoggedIn }: InvoiceFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof InvoiceData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      update("businessLogo", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    update("businessLogo", undefined);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!isLoggedIn) {
      router.push("/login?redirect=/");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const subtotal = data.lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const tax = (subtotal * data.taxRate) / 100;
      const total = subtotal + tax - data.discount;

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_number: data.invoiceNumber,
          client_name: data.clientName,
          issue_date: data.issueDate,
          due_date: data.dueDate,
          amount: total,
          currency: data.currency,
          status: "draft",
          data,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save invoice");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Business Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Your Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Logo Upload */}
          <div>
            {data.businessLogo ? (
              <div className="flex items-center gap-3">
                <img
                  src={data.businessLogo}
                  alt="Business logo"
                  className="h-12 w-auto object-contain rounded border bg-white p-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeLogo}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove logo
                </Button>
              </div>
            ) : (
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <div className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Upload logo (optional)
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          <Input
            placeholder="Business name *"
            value={data.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Business email"
            value={data.businessEmail}
            onChange={(e) => update("businessEmail", e.target.value)}
          />
          <textarea
            placeholder="Business address"
            value={data.businessAddress}
            onChange={(e) => update("businessAddress", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </CardContent>
      </Card>

      {/* Client Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Bill To (Client)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Client name *"
            value={data.clientName}
            onChange={(e) => update("clientName", e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Client email"
            value={data.clientEmail}
            onChange={(e) => update("clientEmail", e.target.value)}
          />
          <textarea
            placeholder="Client address"
            value={data.clientAddress}
            onChange={(e) => update("clientAddress", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Invoice #
              </label>
              <Input
                placeholder="INV-001"
                value={data.invoiceNumber}
                onChange={(e) => update("invoiceNumber", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Currency
              </label>
              <select
                value={data.currency}
                onChange={(e) => update("currency", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Issue Date
              </label>
              <Input
                type="date"
                value={data.issueDate}
                onChange={(e) => update("issueDate", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Due Date
              </label>
              <Input
                type="date"
                value={data.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Items & Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineItems
            items={data.lineItems}
            currency={data.currency}
            onChange={(items) => update("lineItems", items)}
          />
        </CardContent>
      </Card>

      {/* Tax, Discount, Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            Totals & Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Tax Rate (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0"
                value={data.taxRate === 0 ? "" : data.taxRate}
                onChange={(e) =>
                  update("taxRate", parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Discount ($)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={data.discount === 0 ? "" : data.discount}
                onChange={(e) =>
                  update("discount", parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Notes / Payment Terms
            </label>
            <textarea
              placeholder="e.g. Payment due within 30 days. Thank you for your business!"
              value={data.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <PdfDownloadButton data={data} isPro={isPro} className="flex-1" />
        <Button
          type="button"
          variant="outline"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : isLoggedIn ? "Save" : "Sign in to save"}
        </Button>
      </div>

      {saveError && (
        <p className="text-sm text-destructive text-center">{saveError}</p>
      )}
      {saveSuccess && (
        <p className="text-sm text-green-600 text-center font-medium">
          Invoice saved successfully!
        </p>
      )}

      {!isPro && (
        <p className="text-xs text-muted-foreground text-center">
          Free plan: PDF includes a watermark.{" "}
          <a href="/pricing" className="text-primary hover:underline font-medium">
            Upgrade to Pro
          </a>{" "}
          to remove it.
        </p>
      )}
    </div>
  );
}
