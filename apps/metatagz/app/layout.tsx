import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@repo/auth";
import { NavigationWrapper } from "@/components/navigation-wrapper";
import { Footer } from "@repo/ui";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MetaTagz – Free Meta Tag Checker & Social Media Preview Tool",
  description:
    "Instantly preview how your page looks on Google, Twitter, Facebook, LinkedIn and Slack. Check og:tags, meta descriptions, Twitter Cards, and SEO issues for free.",
  keywords:
    "meta tag checker, og tag preview, open graph tester, social media preview, twitter card validator, facebook og preview, seo meta tags, og:image checker",
  openGraph: {
    title: "MetaTagz – Meta Tag Checker & Social Media Preview",
    description:
      "See exactly how your page looks when shared on social media. Check Open Graph tags, Twitter Cards, and SEO meta tags instantly.",
    type: "website",
    siteName: "MetaTagz",
  },
  twitter: {
    card: "summary_large_image",
    title: "MetaTagz – Meta Tag Checker & OG Preview Tool",
    description:
      "Preview how any URL appears on Google, Twitter, Facebook, LinkedIn & Slack. Free meta tag analyzer.",
  },
  robots: {
    index: true,
    follow: true,
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
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <NavigationWrapper />
            <main className="flex-1">{children}</main>
            <Footer appName="MetaTagz" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
