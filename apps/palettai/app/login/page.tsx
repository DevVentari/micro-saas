"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Palette, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui";
import { useAuth } from "@repo/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const { user, signIn, signUp, loading: authLoading } = useAuth();

  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && user) {
      router.push(next);
    }
  }, [authLoading, user, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message || "Invalid email or password");
        } else {
          router.push(next);
          router.refresh();
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message || "Failed to create account");
        } else {
          setSuccess(
            "Account created! Check your email to confirm your account, then sign in."
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50/50 to-background py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg mb-4">
            <Palette className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">PalettAI</h1>
          <p className="text-muted-foreground text-sm mt-1">AI color palette generator</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">
              {mode === "signin" ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === "signin"
                ? "Sign in to access your saved palettes"
                : "Get started with PalettAI for free"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error/Success messages */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === "signup" ? 8 : 1}
                    disabled={loading}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {mode === "signin" ? "Signing in..." : "Creating account..."}
                  </>
                ) : mode === "signin" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>

            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:no-underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:no-underline">
                Privacy Policy
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

