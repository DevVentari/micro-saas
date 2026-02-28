import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@repo/auth";
import { NavigationWrapper } from "@/components/navigation-wrapper";
import { Footer, AdSenseScript } from "@repo/ui";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invoicely – Free Invoice Generator | Create & Download PDF Invoices",
  description:
    "Create professional invoices in seconds. Free invoice generator with instant PDF download. No signup required. Used by 10,000+ freelancers and small businesses.",
  keywords:
    "free invoice generator, invoice maker, pdf invoice, create invoice online, invoice template, freelance invoice",
  openGraph: {
    title: "Invoicely – Free Invoice Generator",
    description:
      "Create professional invoices in seconds. Free forever. No signup required. Download as PDF instantly.",
    type: "website",
    siteName: "Invoicely",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoicely – Free Invoice Generator",
    description:
      "Create professional invoices in seconds. Free forever. No signup required.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdSenseScript />
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <NavigationWrapper />
            <main className="flex-1">{children}</main>
            <Footer appName="Invoicely" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
