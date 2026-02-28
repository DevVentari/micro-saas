import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { InvoiceData } from "@/components/invoice-creator";

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

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  businessBlock: {
    flexDirection: "column",
    maxWidth: 220,
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: "contain",
    marginBottom: 6,
  },
  businessName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
    marginBottom: 2,
  },
  businessContact: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 1,
  },
  invoiceBlock: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#3b82f6",
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  invoiceMeta: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  fromToSection: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 28,
  },
  fromToBlock: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 1,
  },
  tableContainer: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colDescription: {
    flex: 3,
  },
  colQty: {
    width: 40,
    textAlign: "center",
  },
  colPrice: {
    width: 70,
    textAlign: "right",
  },
  colAmount: {
    width: 70,
    textAlign: "right",
  },
  cellText: {
    fontSize: 10,
    color: "#374151",
  },
  cellAmount: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
  },
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  totalsContainer: {
    width: 200,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  totalsValue: {
    fontSize: 10,
    color: "#374151",
  },
  discountValue: {
    fontSize: 10,
    color: "#059669",
  },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
  },
  totalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#3b82f6",
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  watermarkContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  watermarkText: {
    fontSize: 30,
    color: "#e5e7eb",
    fontFamily: "Helvetica-Bold",
    transform: "rotate(-30deg)",
    opacity: 0.4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#d1d5db",
    textAlign: "center",
  },
});

interface InvoicePDFProps {
  data: InvoiceData;
  isPro: boolean;
}

export function InvoicePDFComponent({ data, isPro }: InvoicePDFProps) {
  const subtotal = data.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = (subtotal * data.taxRate) / 100;
  const total = subtotal + taxAmount - data.discount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {!isPro && (
          <View style={styles.watermarkContainer} fixed>
            <Text style={styles.watermarkText}>
              Free version - Invoicely.app
            </Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.businessBlock}>
            {data.businessLogo ? (
              <Image style={styles.logo} src={data.businessLogo} />
            ) : null}
            {data.businessName ? (
              <Text style={styles.businessName}>{data.businessName}</Text>
            ) : null}
            {data.businessEmail ? (
              <Text style={styles.businessContact}>{data.businessEmail}</Text>
            ) : null}
            {data.businessAddress ? (
              <Text style={styles.businessContact}>{data.businessAddress}</Text>
            ) : null}
          </View>
          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            {data.invoiceNumber ? (
              <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
            ) : null}
            {data.issueDate ? (
              <Text style={styles.invoiceMeta}>
                Issued: {formatDate(data.issueDate)}
              </Text>
            ) : null}
            {data.dueDate ? (
              <Text style={styles.invoiceMeta}>
                Due: {formatDate(data.dueDate)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* From / To */}
        <View style={styles.fromToSection}>
          <View style={styles.fromToBlock}>
            <Text style={styles.sectionLabel}>From</Text>
            <Text style={styles.partyName}>{data.businessName || "—"}</Text>
            {data.businessEmail ? (
              <Text style={styles.partyDetail}>{data.businessEmail}</Text>
            ) : null}
            {data.businessAddress ? (
              <Text style={styles.partyDetail}>{data.businessAddress}</Text>
            ) : null}
          </View>
          <View style={styles.fromToBlock}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.partyName}>{data.clientName || "—"}</Text>
            {data.clientEmail ? (
              <Text style={styles.partyDetail}>{data.clientEmail}</Text>
            ) : null}
            {data.clientAddress ? (
              <Text style={styles.partyDetail}>{data.clientAddress}</Text>
            ) : null}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>
              Unit Price
            </Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>
              Amount
            </Text>
          </View>
          {data.lineItems.map((item, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.cellText, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.cellText, styles.colQty]}>
                {String(item.quantity)}
              </Text>
              <Text style={[styles.cellText, styles.colPrice]}>
                {formatCurrency(item.unitPrice, data.currency)}
              </Text>
              <Text style={[styles.cellAmount, styles.colAmount]}>
                {formatCurrency(item.quantity * item.unitPrice, data.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsContainer}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(subtotal, data.currency)}
              </Text>
            </View>
            {data.taxRate > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({data.taxRate}%)</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency(taxAmount, data.currency)}
                </Text>
              </View>
            )}
            {data.discount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Discount</Text>
                <Text style={styles.discountValue}>
                  -{formatCurrency(data.discount, data.currency)}
                </Text>
              </View>
            )}
            <View style={styles.totalsDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(total, data.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {data.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        {/* Free tier footer */}
        {!isPro && (
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>
              Created with Invoicely.app – Free Invoice Generator
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function generatePDF(
  data: InvoiceData,
  isPro: boolean
): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(InvoicePDFComponent, { data, isPro }) as any;
  return pdf(element).toBlob();
}
