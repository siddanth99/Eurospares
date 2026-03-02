"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-8">
          <h1 className="text-xl font-semibold text-[#0a0a0a] mb-1">
            Sign in
          </h1>
          <p className="text-sm text-[#737373] mb-6">
            Enter your email and password to continue.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#0a0a0a] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-10 px-3 text-sm rounded-lg border border-[#e5e5e5] bg-white text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-transparent transition-shadow"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#0a0a0a] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-10 px-3 text-sm rounded-lg border border-[#e5e5e5] bg-white text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-transparent transition-shadow"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-[#dc2626] bg-[#fef2f2] rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-sm font-medium text-white bg-[#0a0a0a] rounded-lg hover:bg-[#262626] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="text-sm text-[#737373] mt-6 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#0a0a0a] font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
