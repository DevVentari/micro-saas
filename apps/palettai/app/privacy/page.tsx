import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – PalettAI",
  description: "How PalettAI collects and uses your data.",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: February 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you use PalettAI, we may collect the following information:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Email address and name (when you create an account via Supabase Auth)</li>
            <li>Prompts you submit for palette generation</li>
            <li>Saved palettes (Pro users only)</li>
            <li>Your IP address for rate limiting (free tier)</li>
            <li>Usage analytics (page views, feature usage) via Vercel Analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">We use the information we collect to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Provide and improve the PalettAI service</li>
            <li>Enforce free-tier rate limits</li>
            <li>Process subscription payments via Stripe</li>
            <li>Send transactional emails (receipts, password resets)</li>
            <li>Detect and prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            PalettAI uses the following third-party services, each governed by their own privacy policies:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li><strong>Supabase</strong> — authentication and database storage</li>
            <li><strong>Stripe</strong> — payment processing (we never store card details)</li>
            <li><strong>Google Gemini</strong> — AI palette generation (prompts are sent to Google's Gemini API)</li>
            <li><strong>Vercel</strong> — hosting and analytics</li>
            <li><strong>Google AdSense</strong> — advertising on the free tier</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            Account data is retained until you delete your account. Saved palettes are deleted when
            your account is deleted. IP-based rate limit data resets daily and is not persisted to disk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You may request deletion of your account and associated data at any time by contacting us.
            EU/UK residents have additional rights under GDPR/UK GDPR including access, rectification,
            and portability of your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use cookies to maintain your login session (via Supabase Auth) and to serve relevant
            ads on the free tier (via Google AdSense). No tracking cookies are set beyond what is
            required for these functions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related questions, contact us at{" "}
            <a href="mailto:privacy@palettai.com" className="text-primary underline hover:no-underline">
              privacy@palettai.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
