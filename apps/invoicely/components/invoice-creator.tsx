"use client";

import { useState } from "react";
import { InvoiceForm } from "./invoice-form";
import { InvoicePreview } from "./invoice-preview";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";

export interface InvoiceData {
  businessName: string;
  businessEmail: string;
  businessAddress: string;
  businessLogo?: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  taxRate: number;
  discount: number;
  notes: string;
}

const defaultInvoice: InvoiceData = {
  businessName: "",
  businessEmail: "",
  businessAddress: "",
  businessLogo: undefined,
  clientName: "",
  clientEmail: "",
  clientAddress: "",
  invoiceNumber: `INV-${new Date().getFullYear()}-001`,
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  currency: "USD",
  lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
  taxRate: 0,
  discount: 0,
  notes: "",
};

export function InvoiceCreator() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(defaultInvoice);
  const { user } = useAuth();
  const { isPro } = useSubscription("invoicely", user?.id);

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <div>
        <InvoiceForm
          data={invoiceData}
          onChange={setInvoiceData}
          isPro={isPro}
          isLoggedIn={!!user}
        />
      </div>
      <div className="lg:sticky lg:top-20">
        <InvoicePreview data={invoiceData} isPro={isPro} />
      </div>
    </div>
  );
}
