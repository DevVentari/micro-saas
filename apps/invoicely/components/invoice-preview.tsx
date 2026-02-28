"use client";

import { cn } from "@repo/ui";
import type { InvoiceData } from "./invoice-creator";

interface InvoicePreviewProps {
  data: InvoiceData;
  isPro: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
  INR: "₹",
  CHF: "CHF",
  MXN: "MX$",
  BRL: "R$",
};

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${amount.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function InvoicePreview({ data, isPro }: InvoicePreviewProps) {
  const subtotal = data.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = (subtotal * data.taxRate) / 100;
  const total = subtotal + taxAmount - data.discount;

  return (
    <div className="sticky top-20">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 text-center">
        Live Preview
      </p>
      <div
        className={cn(
          "bg-white border rounded-xl shadow-lg overflow-hidden relative",
          "text-gray-900 font-sans"
        )}
        style={{ minHeight: "600px" }}
      >
        {/* Watermark for free tier */}
        {!isPro && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            style={{ transform: "rotate(-30deg)" }}
          >
            <span
              className="text-gray-200 font-bold text-2xl whitespace-nowrap select-none"
              style={{ fontSize: "clamp(14px, 3vw, 24px)" }}
            >
              Created with Invoicely.app
            </span>
          </div>
        )}

        <div className="p-8 relative z-20">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {data.businessLogo ? (
                <img
                  src={data.businessLogo}
                  alt="Logo"
                  className="h-14 w-auto object-contain mb-2"
                />
              ) : (
                data.businessName && (
                  <h2 className="text-xl font-bold text-gray-900">
                    {data.businessName}
                  </h2>
                )
              )}
              {data.businessLogo && data.businessName && (
                <p className="text-sm font-semibold text-gray-700">
                  {data.businessName}
                </p>
              )}
              {data.businessEmail && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {data.businessEmail}
                </p>
              )}
              {data.businessAddress && (
                <p className="text-xs text-gray-500 whitespace-pre-line mt-0.5">
                  {data.businessAddress}
                </p>
              )}
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-primary tracking-tight">
                INVOICE
              </h1>
              {data.invoiceNumber && (
                <p className="text-sm text-gray-500 mt-1">
                  #{data.invoiceNumber}
                </p>
              )}
              {data.issueDate && (
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">Issued:</span>{" "}
                  {formatDate(data.issueDate)}
                </p>
              )}
              {data.dueDate && (
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Due:</span>{" "}
                  {formatDate(data.dueDate)}
                </p>
              )}
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                From
              </p>
              {data.businessName ? (
                <>
                  <p className="text-sm font-semibold text-gray-800">
                    {data.businessName}
                  </p>
                  {data.businessEmail && (
                    <p className="text-xs text-gray-500">{data.businessEmail}</p>
                  )}
                  {data.businessAddress && (
                    <p className="text-xs text-gray-500 whitespace-pre-line">
                      {data.businessAddress}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-300 italic">
                  Your business details
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                Bill To
              </p>
              {data.clientName ? (
                <>
                  <p className="text-sm font-semibold text-gray-800">
                    {data.clientName}
                  </p>
                  {data.clientEmail && (
                    <p className="text-xs text-gray-500">{data.clientEmail}</p>
                  )}
                  {data.clientAddress && (
                    <p className="text-xs text-gray-500 whitespace-pre-line">
                      {data.clientAddress}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-300 italic">Client details</p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Description
                    </th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">
                      Qty
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">
                      Unit Price
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.lineItems.length === 0 ||
                  (data.lineItems.length === 1 &&
                    !data.lineItems[0].description &&
                    data.lineItems[0].unitPrice === 0) ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 px-3 text-center text-xs text-gray-300 italic"
                      >
                        Add line items above
                      </td>
                    </tr>
                  ) : (
                    data.lineItems.map((item, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-2.5 px-3 text-gray-700">
                          {item.description || (
                            <span className="text-gray-300 italic">
                              Item description
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-600">
                          {formatCurrency(item.unitPrice, data.currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-800 font-medium">
                          {formatCurrency(
                            item.quantity * item.unitPrice,
                            data.currency
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-56 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, data.currency)}</span>
              </div>
              {data.taxRate > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax ({data.taxRate}%)</span>
                  <span>{formatCurrency(taxAmount, data.currency)}</span>
                </div>
              )}
              {data.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(data.discount, data.currency)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-base text-gray-900">
                <span>Total</span>
                <span className="text-primary">
                  {formatCurrency(total, data.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                Notes
              </p>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {data.notes}
              </p>
            </div>
          )}

          {/* Free tier watermark footer */}
          {!isPro && (
            <div className="border-t border-gray-100 mt-6 pt-3 text-center">
              <p className="text-xs text-gray-300">
                Created with Invoicely.app
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
