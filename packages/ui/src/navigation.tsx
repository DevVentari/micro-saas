"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "./utils";
import { Button } from "./button";

interface NavItem {
  label: string;
  href: string;
}

interface NavigationProps {
  appName: string;
  logo?: React.ReactNode;
  navItems?: NavItem[];
  isLoggedIn?: boolean;
  isPro?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  className?: string;
}

export function Navigation({
  appName,
  logo,
  navItems = [],
  isLoggedIn = false,
  isPro = false,
  onLogin,
  onLogout,
  className,
}: NavigationProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            {logo}
            <span>{appName}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {isPro && (
            <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full font-medium">
              PRO
            </span>
          )}
          {isLoggedIn ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onLogin}>
                Sign in
              </Button>
              <Link href="/pricing">
                <Button size="sm">Upgrade to Pro</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
