"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import {
  Plus,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";

interface SavedInvoice {
  id: string;
  invoice_number: string;
  client_name: string;
  issue_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: "draft" | "unpaid" | "paid";
  created_at: string;
  data: object;
}

const STATUS_CONFIG = {
  paid: {
    label: "Paid",
    color: "text-green-600 bg-green-50 border-green-200",
    icon: CheckCircle2,
  },
  unpaid: {
    label: "Unpaid",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    icon: Clock,
  },
  draft: {
    label: "Draft",
    color: "text-gray-500 bg-gray-50 border-gray-200",
    icon: FileText,
  },
};

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

function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${amount.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: subLoading } = useSubscription(
    "invoicely",
    user?.id
  );

  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [authLoading, user, router]);

  // Fetch invoices
  useEffect(() => {
    if (!user) return;

    const fetchInvoices = async () => {
      try {
        const res = await fetch("/api/invoices");
        if (!res.ok) throw new Error("Failed to fetch invoices");
        const data = await res.json();
        setInvoices(data.invoices ?? []);
      } catch (err) {
        setInvoicesError(
          err instanceof Error ? err.message : "Failed to load invoices"
        );
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  const handleStatusChange = async (
    invoiceId: string,
    newStatus: "draft" | "unpaid" | "paid"
  ) => {
    setUpdatingStatus(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: newStatus } : inv
          )
        );
      }
    } catch {
      // silently fail status update
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDownload = async (invoice: SavedInvoice) => {
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const React = (await import("react")).default;
      const { InvoicePDFComponent } = await import("@/lib/pdf");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const element = React.createElement(InvoicePDFComponent, {
        data: invoice.data as Parameters<typeof InvoicePDFComponent>[0]["data"],
        isPro,
      }) as any;
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  if (authLoading || subLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user.email} •{" "}
            <span className={isPro ? "text-primary font-semibold" : ""}>
              {isPro ? "Pro Plan" : "Free Plan"}
            </span>
          </p>
        </div>
        <Link href="/">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Pro upgrade prompt for free users */}
      {!isPro && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">Upgrade to Pro</p>
              <p className="text-xs text-muted-foreground">
                Remove watermarks, no ads, unlimited saved invoices, and more.
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button size="sm" className="shrink-0">
              Upgrade – $5/mo
            </Button>
          </Link>
        </div>
      )}

      {/* Invoices List */}
      {invoicesLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : invoicesError ? (
        <div className="text-center py-16">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{invoicesError}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No invoices yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first invoice and save it to see it here.
          </p>
          <Link href="/">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Invoice #</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>

          {invoices.map((invoice) => {
            const statusConfig =
              STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft;
            const StatusIcon = statusConfig.icon;
            const isUpdating = updatingStatus === invoice.id;

            return (
              <Card key={invoice.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 items-center">
                    {/* Client */}
                    <div className="col-span-2 md:col-span-3">
                      <p className="font-medium text-sm">
                        {invoice.client_name || "Unnamed client"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDate(invoice.due_date)}
                      </p>
                    </div>

                    {/* Invoice # */}
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-sm font-mono">
                        #{invoice.invoice_number}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="col-span-1 md:col-span-2 hidden md:block">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(invoice.issue_date)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-sm font-semibold">
                        {formatAmount(invoice.amount, invoice.currency)}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 md:col-span-2">
                      <select
                        value={invoice.status}
                        onChange={(e) =>
                          handleStatusChange(
                            invoice.id,
                            e.target.value as "draft" | "unpaid" | "paid"
                          )
                        }
                        disabled={isUpdating}
                        className={`text-xs px-2 py-1 rounded-full border font-medium cursor-pointer ${statusConfig.color} bg-transparent focus:outline-none`}
                      >
                        <option value="draft">Draft</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(invoice)}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
