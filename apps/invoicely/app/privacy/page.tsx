import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Invoicely",
  description: "How Invoicely collects and uses your data.",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: February 2026</p>

      <div className="space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you use Invoicely, we may collect the following information:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Email address and name (when you create an account via Supabase Auth)</li>
            <li>Invoice data you enter (business name, client details, line items)</li>
            <li>Saved invoices and client records (Pro users only)</li>
            <li>Usage analytics (page views, feature usage) via Vercel Analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">We use the information we collect to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Provide and improve the Invoicely service</li>
            <li>Process subscription payments via Stripe</li>
            <li>Send transactional emails (receipts, password resets)</li>
            <li>Detect and prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            Invoicely uses the following third-party services, each governed by their own privacy policies:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li><strong>Supabase</strong> — authentication and database storage</li>
            <li><strong>Stripe</strong> — payment processing (we never store card details)</li>
            <li><strong>Vercel</strong> — hosting and analytics</li>
            <li><strong>Google AdSense</strong> — advertising on the free tier</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Invoice Data</h2>
          <p className="text-muted-foreground leading-relaxed">
            Invoice data entered by free users is processed client-side only and is never stored on
            our servers. Pro users who choose to save invoices have their data stored securely in
            Supabase and can delete it at any time from their dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            Account data is retained until you delete your account. Saved invoices and client records
            are deleted when your account is deleted.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You may request deletion of your account and associated data at any time by contacting us.
            EU/UK residents have additional rights under GDPR/UK GDPR including access, rectification,
            and portability of your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related questions, contact us at{" "}
            <a href="mailto:privacy@invoicely.app" className="text-primary underline hover:no-underline">
              privacy@invoicely.app
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
