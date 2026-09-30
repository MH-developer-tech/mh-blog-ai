"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Profile = {
  full_name: string | null;
};

type BlogSummary = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
};

type SortMode = "newest" | "oldest" | "longest";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [blogs, setBlogs] = useState<BlogSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // ---------- New: workspace controls ----------
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleBlogs = useMemo(() => {
    let list = [...blogs];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.title?.toLowerCase().includes(q));
    }

    if (sortMode === "oldest") {
      list.sort(
        (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      );
    } else if (sortMode === "longest") {
      list.sort((a, b) => (b.content?.length ?? 0) - (a.content?.length ?? 0));
    } else {
      list.sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );
    }

    return list;
  }, [blogs, search, sortMode]);


  useEffect(() => {
    let mounted = true;

    async function loadUserData(currentUser: User) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUser.id)
        .single();

      if (!mounted) return;

      setProfile(
        profileData ?? {
          full_name: currentUser.user_metadata?.full_name ?? "Creator",
        }
      );

      const { data: blogData } = await supabase
        .from("blogs")
        .select("id,title,content,created_at")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      setBlogs(blogData ?? []);
      setLoading(false);
    }

    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);
      setEmail(user.email ?? "");
      loadUserData(user);
    }

    loadDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setBlogs([]);
        setLoading(false);
        return;
      }

      setEmail(currentUser.email ?? "");
      loadUserData(currentUser);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();

    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");

    if (authMode === "signup") {
      if (!fullName.trim()) {
        setAuthError("Please enter your full name.");
        setAuthBusy(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        setAuthBusy(false);
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setAuthMessage("Account created. Please confirm your email, then log in.");
        setAuthMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        setAuthBusy(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    }

    setAuthBusy(false);
  }

  async function handleLogout() {
    setLoggingOut(true);

    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setBlogs([]);

    setLoggingOut(false);

    router.replace("/");
    router.refresh();
  }

  async function handleDeleteBlog(id: string) {
    if (!user) return;

    setDeletingId(id);

    const { error } = await supabase
      .from("blogs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    }

    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  async function handleCopyBlog(item: BlogSummary) {
    try {
      await navigator.clipboard.writeText(item.content ?? "");
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // clipboard not available — silently ignore
    }
  }

  function handleDownloadBlog(item: BlogSummary) {
    const safeTitle =
      (item.title?.trim() || "untitled-blog")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "untitled-blog";

    const fileContent = `${item.title || "Untitled blog"}\n\n${item.content ?? ""}`;

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeTitle}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-black/10 border-t-[#C9A227]" />
          <p className="mt-5 text-sm text-black/45">Loading your workspace...</p>
        </div>
      </main>
    );
  }

  /* =========================
     LOGIN / SIGNUP
  ========================== */

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-white text-[#111111]">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] animate-[authOrb_12s_ease-in-out_infinite] rounded-full bg-[#C9A227]/10 blur-[110px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] animate-[authOrb2_14s_ease-in-out_infinite] rounded-full bg-[#C9A227]/8 blur-[110px]" />
          <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(#111_1px,transparent_1px),linear-gradient(90deg,#111_1px,transparent_1px)] [background-size:55px_55px]" />
        </div>

        <header className="relative z-10 border-b border-black/5 bg-white/85 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
            <button onClick={() => router.push("/")} className="text-2xl font-black tracking-tight">
              MH<span className="text-[#C9A227]">Blog</span>AI
            </button>

            <button
              onClick={() => router.push("/")}
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold transition-all duration-300 ease-out hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-white"
            >
              Home
            </button>
          </div>
        </header>

        <section className="relative z-10 flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-16">
          <div className="w-full max-w-md animate-[authReveal_.7s_cubic-bezier(.16,1,.3,1)]">
            <div className="mb-8 text-center">
              <p className="text-xs font-black uppercase tracking-[.2em] text-[#C9A227]">AI WORKSPACE</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                {authMode === "login" ? "Welcome back." : "Create your account."}
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-black/45">
                {authMode === "login"
                  ? "Login to continue to your MHBlogAI workspace."
                  : "Create your account and start creating with AI."}
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white p-7 shadow-[0_30px_100px_rgba(0,0,0,.08)] sm:p-9">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#C9A227]/10 blur-3xl" />

              <form onSubmit={handleAuthSubmit} className="relative space-y-5">
                {authMode === "signup" && (
                  <div className="animate-[fieldIn_.35s_ease-out]">
                    <label className="mb-2 block text-sm font-black">Full Name</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition-all duration-300 focus:border-[#C9A227] focus:bg-white focus:shadow-[0_0_0_4px_rgba(201,162,39,.08)]"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-black">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition-all duration-300 focus:border-[#C9A227] focus:bg-white focus:shadow-[0_0_0_4px_rgba(201,162,39,.08)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition-all duration-300 focus:border-[#C9A227] focus:bg-white focus:shadow-[0_0_0_4px_rgba(201,162,39,.08)]"
                  />
                </div>

                {authError && (
                  <div className="animate-[fieldIn_.3s_ease-out] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {authError}
                  </div>
                )}

                {authMessage && (
                  <div className="animate-[fieldIn_.3s_ease-out] rounded-xl border border-[#C9A227]/20 bg-[#C9A227]/5 px-4 py-3 text-sm text-[#8b6c08]">
                    {authMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full rounded-xl bg-[#111111] px-5 py-4 text-sm font-black text-white transition-all duration-300 ease-out hover:bg-[#C9A227] hover:shadow-lg hover:shadow-[#C9A227]/25 disabled:opacity-60"
                >
                  {authBusy ? "Please wait..." : authMode === "login" ? "Login" : "Create Account"}
                </button>
              </form>

              <div className="my-6 h-px bg-black/5" />

              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                  setAuthMessage("");
                }}
                className="relative w-full text-center text-sm font-bold text-black/45 transition-colors duration-300 hover:text-[#C9A227]"
              >
                {authMode === "login" ? "Don't have an account? Create one" : "Already have an account? Login"}
              </button>
            </div>
          </div>
        </section>

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
            50% { transform: translate(70px, 55px); }
          }
          @keyframes authOrb2 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-55px, -45px); }
          }
        `}</style>
      </main>
    );
  }

  const userName = profile?.full_name?.trim() || user.user_metadata?.full_name || "Creator";

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("") || "U";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // ---------- Real user data ----------
  const blogCount = blogs.length;

  const wordCounts = blogs.map((item) =>
    item.content?.trim() ? item.content.trim().split(/\s+/).length : 0
  );

  const totalWords = wordCounts.reduce((sum, n) => sum + n, 0);
  const avgWords = blogCount > 0 ? Math.round(totalWords / blogCount) : 0;

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  const displayedBlogs = showAll ? visibleBlogs : visibleBlogs.slice(0, 4);

  /* =========================
     DASHBOARD
  ========================== */

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#111111]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] animate-[dashOrb_16s_ease-in-out_infinite] rounded-full bg-[#C9A227]/10 blur-[110px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] animate-[dashOrb2_18s_ease-in-out_infinite] rounded-full bg-[#C9A227]/8 blur-[110px]" />
        <div className="absolute inset-0 opacity-[0.02] [background-image:linear-gradient(#111_1px,transparent_1px),linear-gradient(90deg,#111_1px,transparent_1px)] [background-size:55px_55px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button onClick={() => router.push("/")} className="text-2xl font-black tracking-tight">
            MH<span className="text-[#C9A227]">Blog</span>AI
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="hidden rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-white sm:block"
            >
              Home
            </button>

            {/* Avatar */}
            <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#111111] text-sm font-black text-[#C9A227] sm:flex">
              {initials}
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full bg-[#111111] px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-[#C9A227] disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="animate-[dashReveal_.7s_cubic-bezier(.16,1,.3,1)]">
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#C9A227]">YOUR AI WORKSPACE</p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
            {greeting},
            <span className="relative inline-block bg-gradient-to-r from-[#C9A227] via-[#e0b93a] to-[#C9A227] bg-[length:200%_auto] bg-clip-text text-transparent [animation:gradientShift_6s_ease_infinite]">
              {" "}
              {userName}.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-black/45 sm:text-base">
            Your personal space for creating, managing and saving AI-powered content.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { label: "Blogs Saved", value: blogCount.toLocaleString(), small: "Total pieces you've written", accent: true },
            { label: "Total Words Written", value: totalWords.toLocaleString(), small: "Across all your blogs", accent: false },
            { label: "Average Length", value: `${avgWords.toLocaleString()} words`, small: "Per blog on average", accent: false },
          ].map((item, index) => (
            <div
              key={item.label}
              className="group animate-[cardReveal_.6s_ease-out_both] rounded-3xl border border-black/5 bg-white p-7 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#C9A227]/30 hover:shadow-xl"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <p className="text-sm font-semibold text-black/40">{item.label}</p>
              <p className={`mt-3 text-3xl font-black ${item.accent ? "text-[#C9A227]" : ""}`}>{item.value}</p>
              <p className="mt-2 text-xs text-black/35">{item.small}</p>
            </div>
          ))}
        </div>

        {/* Member since strip */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-[#fafafa] px-6 py-4 text-xs font-semibold text-black/40">
          <span>
            Member since <span className="text-[#111111]">{memberSince}</span>
          </span>
          <span className="text-black/30">·</span>
          <span className="break-all">
            Signed in as <span className="text-[#111111]">{email}</span>
          </span>
        </div>

        {/* Create card */}
        <div className="relative mt-7 overflow-hidden rounded-[2.5rem] bg-[#111111] p-8 text-white shadow-[0_30px_90px_rgba(0,0,0,.15)] sm:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#C9A227]/20 blur-[90px] [animation:pulseSoft_5s_ease-in-out_infinite]" />

          <div className="relative max-w-3xl animate-[fadeUp_.7s_ease-out]">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#C9A227]">AI CONTENT STUDIO</p>

            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Create your next piece
              <span className="block text-[#C9A227]">with AI.</span>
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
              Jump directly into the AI writing workspace and turn your next idea into content.
            </p>

            <button
              onClick={() => router.push("/")}
              className="mt-8 rounded-full bg-[#C9A227] px-8 py-4 text-sm font-black text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#b38d1e] hover:shadow-xl hover:shadow-[#C9A227]/20"
            >
              Create with AI →
            </button>
          </div>
        </div>

        {/* Account + Blogs */}
        <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="animate-[cardReveal_.6s_ease-out] rounded-[2rem] border border-black/5 bg-white p-7 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#C9A227]">ACCOUNT</p>
            <h3 className="mt-3 text-2xl font-black">Your information</h3>

            <div className="mt-7 space-y-4">
              <div className="rounded-2xl bg-[#fafafa] p-5 transition-colors duration-300 hover:bg-[#C9A227]/5">
                <p className="text-xs font-semibold text-black/35">Name</p>
                <p className="mt-1 font-black">{userName}</p>
              </div>

              <div className="rounded-2xl bg-[#fafafa] p-5 transition-colors duration-300 hover:bg-[#C9A227]/5">
                <p className="text-xs font-semibold text-black/35">Email</p>
                <p className="mt-1 break-all font-black">{email}</p>
              </div>

              <div className="rounded-2xl bg-[#fafafa] p-5 transition-colors duration-300 hover:bg-[#C9A227]/5">
                <p className="text-xs font-semibold text-black/35">Member Since</p>
                <p className="mt-1 font-black">{memberSince}</p>
              </div>
            </div>
          </div>

          <div className="animate-[cardReveal_.7s_ease-out] rounded-[2rem] border border-black/5 bg-white p-7 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-[#C9A227]">WORKSPACE</p>
                <h3 className="mt-3 text-2xl font-black">Your Blogs</h3>
              </div>

              {blogCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title..."
                    className="w-40 rounded-full border border-black/10 bg-[#fafafa] px-4 py-2 text-xs outline-none transition-all duration-300 focus:w-52 focus:border-[#C9A227] focus:bg-white"
                  />

                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="rounded-full border border-black/10 bg-[#fafafa] px-3 py-2 text-xs font-semibold outline-none transition-colors duration-300 focus:border-[#C9A227]"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="longest">Longest</option>
                  </select>
                </div>
              )}
            </div>

            {blogCount === 0 ? (
              <div className="mt-7 rounded-2xl border border-dashed border-black/10 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9A227]/10 text-2xl text-[#C9A227] [animation:floatIcon_4s_ease-in-out_infinite]">
                  ✦
                </div>

                <h4 className="mt-5 font-black">Ready for your next project</h4>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-black/40">
                  Your saved AI content will show up here once you create your first blog.
                </p>

                <button
                  onClick={() => router.push("/")}
                  className="mt-5 text-sm font-black text-[#A37D08] transition-colors duration-300 hover:text-[#C9A227]"
                >
                  Start creating →
                </button>
              </div>
            ) : visibleBlogs.length === 0 ? (
              <p className="mt-7 rounded-2xl bg-[#fafafa] px-5 py-8 text-center text-sm text-black/40">
                No blogs match “{search}”.
              </p>
            ) : (
              <div className="mt-7 space-y-3">
                {displayedBlogs.map((item, i) => (
                  <div
                    key={item.id}
                    className="group animate-[rowIn_.35s_ease-out_both] rounded-2xl bg-[#fafafa] p-5 transition-colors duration-300 hover:bg-[#C9A227]/5"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black">{item.title || "Untitled blog"}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-black/40">{item.content}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-black/25">
                          {item.content?.trim() ? item.content.trim().split(/\s+/).length : 0} words
                          {item.created_at
                            ? ` · ${new Date(item.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => handleCopyBlog(item)}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold transition-all duration-300 hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-white"
                        >
                          {copiedId === item.id ? "Copied ✓" : "Copy"}
                        </button>

                        <button
                          onClick={() => handleDownloadBlog(item)}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold transition-all duration-300 hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-white"
                        >
                          Download
                        </button>

                        <button
                          onClick={() => router.push("/")}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold transition-all duration-300 group-hover:border-[#C9A227] group-hover:bg-[#C9A227] group-hover:text-white"
                        >
                          Open
                        </button>

                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDeleteBlog(item.id)}
                              disabled={deletingId === item.id}
                              className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition-colors duration-300 hover:bg-red-600 disabled:opacity-60"
                            >
                              {deletingId === item.id ? "..." : "Confirm"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold transition-colors duration-300 hover:border-black/30"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold text-black/40 transition-colors duration-300 hover:border-red-300 hover:text-red-500"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {visibleBlogs.length > 4 && (
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="w-full rounded-2xl border border-dashed border-black/10 py-3 text-center text-xs font-bold text-black/40 transition-colors duration-300 hover:border-[#C9A227] hover:text-[#C9A227]"
                  >
                    {showAll ? "Show less ↑" : `View all ${visibleBlogs.length} blogs →`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes dashReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseSoft {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes dashOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(70px, 55px) scale(1.08); }
        }
        @keyframes dashOrb2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-60px, -55px); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </main>
  );
}