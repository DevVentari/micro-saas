import { InvoicelyAdBanner } from "@/components/invoicely-ad-banner";
import { InvoiceCreator } from "@/components/invoice-creator";
import { FileText, Download, Shield, Zap, Users, Star } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white border-b">
        <div className="container py-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
              <Star className="h-3 w-3 fill-blue-700" />
              Used by 10,000+ freelancers
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Create Professional Invoices
            <br />
            <span className="text-primary">in Seconds</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Free forever. No signup required. Download as PDF instantly.
            <br />
            <span className="text-sm">
              Upgrade to Pro for watermark-free invoices and unlimited saves.
            </span>
          </p>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Instant PDF download</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-500" />
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Professional templates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="h-4 w-4 text-purple-500" />
              <span>Free forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* Invoice Creator */}
      <section className="container py-8">
        <InvoiceCreator />
      </section>

      {/* Ad Banner (free tier) */}
      <section className="container pb-6">
        <InvoicelyAdBanner />
      </section>

      {/* Pro Upgrade CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Remove the Watermark & Unlock Pro Features
          </h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Upgrade to Pro for just $5/month. Get watermark-free PDFs, save
            unlimited invoices, custom logo, multi-currency support, and no ads.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Star className="h-4 w-4 fill-blue-600" />
              Upgrade to Pro – $5/mo
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-white/40 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              Sign in to save invoices
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <h2 className="text-2xl font-bold text-center mb-10">
          Everything you need to invoice clients
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Professional Design</h3>
            <p className="text-sm text-muted-foreground">
              Clean, modern invoice template that looks great in print and digital.
            </p>
          </div>
          <div className="text-center p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Instant PDF Download</h3>
            <p className="text-sm text-muted-foreground">
              Generate and download your invoice as a PDF in one click. No waiting.
            </p>
          </div>
          <div className="text-center p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Trusted by Freelancers</h3>
            <p className="text-sm text-muted-foreground">
              Over 10,000 freelancers, consultants, and small businesses use Invoicely.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
