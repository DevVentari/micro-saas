import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@repo/auth";
import { NavigationWrapper } from "@/components/navigation-wrapper";
import { Footer, AdSenseScript } from "@repo/ui";

const inter = Inter({ subsets: ["latin"] });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PalettAI – AI Color Palette Generator | Instant Beautiful Color Schemes",
  description:
    "Generate stunning color palettes instantly with AI. Describe your brand, mood, or style and get a perfect 5-color scheme with CSS, Tailwind, and Figma exports. Free — no signup required.",
  keywords:
    "AI color palette generator, color scheme generator, color palette AI, color picker, brand colors, CSS color variables, Tailwind color palette, design colors",
  openGraph: {
    title: "PalettAI – AI Color Palette Generator",
    description:
      "Generate beautiful color palettes with AI in seconds. Free, no signup required. Export to CSS, Tailwind, Figma, and more.",
    type: "website",
    siteName: "PalettAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "PalettAI – AI Color Palette Generator",
    description:
      "Generate beautiful color palettes with AI. Describe your brand and get an instant palette.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body className={inter.className}>
        <AdSenseScript />
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <NavigationWrapper />
            <main className="flex-1">{children}</main>
            <Footer appName="PalettAI" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
