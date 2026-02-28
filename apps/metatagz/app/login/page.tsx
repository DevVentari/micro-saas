"use client";

import * as React from "react";
import { Suspense } from "react";
import { useAuth } from "@repo/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui";
import { Tag, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function LoginContent() {
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const authError = searchParams.get("error");

  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    authError === "auth_callback_failed" ? "Authentication failed. Please try again." : null
  );
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && user) {
      router.push(next);
    }
  }, [user, authLoading, router, next]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message || "Invalid email or password");
        } else {
          router.push(next);
        }
      } else {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) {
          setError(signUpError.message || "Failed to create account");
        } else {
          setSuccessMsg(
            "Account created! Check your email to confirm, then sign in."
          );
          setMode("signin");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xl mb-2">
            <Tag className="w-6 h-6" />
            MetaTagz
          </div>
          <p className="text-muted-foreground text-sm">
            {mode === "signin" ? "Sign in to your account" : "Create a free account"}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "Enter your email and password to continue."
                : "Create an account to save your URL history."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Alerts */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            {successMsg && (
              <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {successMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label htmlFor="email" className="text-sm font-medium mb-1 block">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium mb-1 block">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                      setSuccessMsg(null);
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
              <Link href="/terms" className="underline hover:text-foreground">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              .
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
