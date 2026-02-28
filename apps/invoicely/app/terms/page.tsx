import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – Invoicely",
  description: "Terms and conditions for using Invoicely.",
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: February 2026</p>

      <div className="space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using Invoicely ("the Service"), you agree to be bound by these Terms of
            Service. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            Invoicely is a free online invoice generator. Free users can create and download
            watermarked PDF invoices without an account. Pro subscribers receive watermark-free PDFs,
            saved invoices, client address book, and additional features as described on the{" "}
            <a href="/pricing" className="text-primary underline hover:no-underline">pricing page</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. You
            agree to notify us immediately of any unauthorized use of your account. We reserve the
            right to terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Subscriptions and Billing</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pro subscriptions are billed monthly via Stripe. You may cancel at any time through the
            customer portal; your subscription remains active until the end of the current billing
            period. We do not offer refunds for partial months.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Invoice Content</h2>
          <p className="text-muted-foreground leading-relaxed">
            You are solely responsible for the accuracy and legality of invoice content you create
            using the Service. Invoicely is not responsible for errors in invoices or any disputes
            arising between you and your clients.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Use the Service to create fraudulent or illegal invoices</li>
            <li>Attempt to circumvent watermark protection or access controls</li>
            <li>Resell or sublicense access to the Service</li>
            <li>Reverse engineer or scrape the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service is provided "as is" without warranty of any kind. Invoicely is not a
            licensed accounting or legal service. Consult a professional for tax or legal advice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, Invoicely shall not be liable for any indirect,
            incidental, or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these terms from time to time. Continued use of the Service after changes
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these terms, contact us at{" "}
            <a href="mailto:legal@invoicely.app" className="text-primary underline hover:no-underline">
              legal@invoicely.app
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
