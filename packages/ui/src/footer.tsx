import * as React from "react";
import Link from "next/link";
import { cn } from "./utils";

interface FooterProps {
  appName: string;
  className?: string;
}

export function Footer({ appName, className }: FooterProps) {
  return (
    <footer className={cn("border-t bg-muted/40 py-8 mt-auto", className)}>
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-3">{appName}</h3>
            <p className="text-sm text-muted-foreground">
              Free tools for developers and creators.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-sm">Connect</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {appName}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ for creators
          </p>
        </div>
      </div>
    </footer>
  );
}
