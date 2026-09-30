"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/dashboard");
        return;
      }

      setChecking(false);
    }

    checkUser();
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (error) {
          throw new Error(
            error.message === "Invalid login credentials"
              ? "Email or password is incorrect."
              : error.message
          );
        }

        if (!data.user) {
          throw new Error("Login failed. Please try again.");
        }

        router.replace("/dashboard");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists")
        ) {
          throw new Error(
            "This email is already registered. Please login instead."
          );
        }

        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("Account could not be created.");
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setMessage(
        "Account created. Please confirm your email, then login."
      );

      setMode("login");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-[#111111]">
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-2xl bg-[#C9A227]/20" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111111] text-sm font-black text-white shadow-xl">
              MH
            </div>
          </div>

          <p className="text-sm font-semibold text-[#666666]">
            Checking account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-[#111111]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-15%] top-[-10%] h-[420px] w-[420px] animate-[authOrb_16s_ease-in-out_infinite] rounded-full bg-[#C9A227]/[0.09] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[460px] w-[460px] animate-[authOrb2_18s_ease-in-out_infinite] rounded-full bg-[#C9A227]/[0.07] blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(#111_1px,transparent_1px),linear-gradient(90deg,#111_1px,transparent_1px)] [background-size:55px_55px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-md animate-[authReveal_.7s_cubic-bezier(.16,1,.3,1)]">
          {/* Brand */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#111111] text-sm font-black text-white shadow-lg">
              MH
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#C9A227]" />
            </div>

            <div>
              <h1 className="text-lg font-black tracking-[-0.03em]">
                MH<span className="text-[#C9A227]">Blog</span>AI
              </h1>
              <p className="text-xs font-semibold text-[#999999]">
                AI-powered blogging workspace
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white p-7 shadow-[0_30px_100px_rgba(0,0,0,.08)] sm:p-9">
            <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#C9A227]/10 blur-3xl" />

            <div className="relative mb-7 text-center">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A227]">
                {mode === "login" ? "Welcome back" : "Get started"}
              </span>

              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                {mode === "login"
                  ? "Login to your account"
                  : "Create your account"}
              </h2>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#666666]">
                {mode === "login"
                  ? "Continue creating powerful AI blogs."
                  : "Start creating AI-powered content today."}
              </p>
            </div>

            {/* Tabs */}
            <div className="relative mb-6 grid grid-cols-2 gap-1 rounded-xl bg-[#fafafa] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
                className={`rounded-lg py-2.5 text-sm font-bold transition-all duration-300 ${
                  mode === "login"
                    ? "bg-[#111111] text-white shadow-md"
                    : "text-[#666666] hover:text-[#111111]"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setMessage("");
                }}
                className={`rounded-lg py-2.5 text-sm font-bold transition-all duration-300 ${
                  mode === "signup"
                    ? "bg-[#111111] text-white shadow-md"
                    : "text-[#666666] hover:text-[#111111]"
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="relative mb-5 animate-[fieldIn_.3s_ease-out] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            {message && (
              <div className="relative mb-5 animate-[fieldIn_.3s_ease-out] rounded-xl border border-[#C9A227]/20 bg-[#C9A227]/5 px-4 py-3 text-sm font-semibold text-[#8b6c08]">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative space-y-5">
              {mode === "signup" && (
                <div className="animate-[fieldIn_.35s_ease-out]">
                  <label className="mb-2 block text-sm font-black">
                    Full Name
                  </label>

                  <input
                    type="text"
                    placeholder="Muhammad Hussnain"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition-all duration-300 focus:border-[#C9A227] focus:bg-white focus:shadow-[0_0_0_4px_rgba(201,162,39,.08)]"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-black">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition-all duration-300 focus:border-[#C9A227] focus:bg-white focus:shadow-[0_0_0_4px_rgba(201,162,39,.08)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition-all duration-300 focus:border-[#C9A227] focus:bg-white focus:shadow-[0_0_0_4px_rgba(201,162,39,.08)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#111111] px-5 py-4 text-sm font-black text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#C9A227] hover:shadow-xl hover:shadow-[#C9A227]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Login to MHBlogAI"
                  : "Create Account"}
              </button>
            </form>

            <div className="relative mt-6 text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-sm font-bold text-black/45 transition-colors duration-300 hover:text-[#C9A227]"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes authReveal {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fieldIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes authOrb {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(60px, 45px); }
        }

        @keyframes authOrb2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-55px, -45px); }
        }
      `}</style>
    </main>
  );
}