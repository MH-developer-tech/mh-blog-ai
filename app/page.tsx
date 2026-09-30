"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type { ReactElement, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type SavedBlog = {
  id: string;
  title: string;
  topic: string;
  content: string;
  created_at?: string;
};

type SpeechRecognitionEventLike = {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onend: () => void;
  onerror: () => void;
};

type SpeechRecognitionConstructor =
  new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const TONE_OPTIONS = [
  "Professional",
  "Casual",
  "Persuasive",
  "Storytelling",
  "Witty",
];

const LENGTH_OPTIONS = [
  {
    label: "Short (~300 words)",
    value: "Short",
  },
  {
    label: "Medium (~600 words)",
    value: "Medium",
  },
  {
    label: "Long (~1000+ words)",
    value: "Long",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Share your idea",
    text: "Type a topic or use voice input to describe what you want to write about.",
  },
  {
    step: "02",
    title: "AI writes the draft",
    text: "Choose a tone, length and optional SEO keywords — AI generates a structured blog in seconds.",
  },
  {
    step: "03",
    title: "Refine & export",
    text: "Enhance the style, listen to it, then save, copy or download it as a file.",
  },
];

const FEATURES = [
  {
    icon: "✦",
    title: "AI Writing",
    text: "Generate structured and professional content from simple ideas.",
  },
  {
    icon: "◈",
    title: "Voice Input",
    text: "Speak your idea and turn it into a writing prompt instantly.",
  },
  {
    icon: "↗",
    title: "Personal Workspace",
    text: "Save, edit and manage your generated content in one place.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Do I need an account to generate a blog?",
    a: "You can explore the workspace freely, but you'll need to sign in to generate, save and manage your own blogs.",
  },
  {
    q: "Can I edit the tone or length after generating?",
    a: 'Yes — change the tone, length or keywords and generate again, or use "Enhance Style" to refine the existing draft.',
  },
  {
    q: "Where are my saved blogs stored?",
    a: "Every blog you save is tied to your account and appears in your personal dashboard, ready to open, edit or download anytime.",
  },
  {
    q: "Does voice input work on every browser?",
    a: "Voice input relies on your browser's built-in speech recognition, so support is best on Chrome-based browsers.",
  },
];

function formatInline(text: string): ReactElement[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (
      part.startsWith("**") &&
      part.endsWith("**") &&
      part.length > 4
    ) {
      return (
        <strong
          key={index}
          className="font-black text-[#111111]"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function renderBlogContent(content: string): ReactElement[] {
  const lines = content.split("\n");
  const elements: ReactElement[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(
        <div
          key={`space-${index}`}
          className="h-3"
        />
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={index}
          className="mt-5 text-lg font-black text-[#111111]"
        >
          {formatInline(trimmed.replace(/^### /, ""))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={index}
          className="mt-6 text-xl font-black text-[#111111]"
        >
          {formatInline(trimmed.replace(/^## /, ""))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2
          key={index}
          className="mt-7 text-2xl font-black text-[#111111]"
        >
          {formatInline(trimmed.replace(/^# /, ""))}
        </h2>
      );
      return;
    }

    if (
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ")
    ) {
      elements.push(
        <li
          key={index}
          className="ml-5 list-disc pl-2 text-[15px] leading-7 text-[#4b4b4b]"
        >
          {formatInline(trimmed.slice(2))}
        </li>
      );
      return;
    }

    elements.push(
      <p
        key={index}
        className="text-[15px] leading-8 text-[#4b4b4b]"
      >
        {formatInline(trimmed)}
      </p>
    );
  });

  return elements;
}

type RevealVariant =
  | "up"
  | "down"
  | "left"
  | "right"
  | "scale";

const REVEAL_HIDDEN: Record<
  RevealVariant,
  string
> = {
  up: "opacity-0 translate-y-8",
  down: "opacity-0 -translate-y-8",
  left: "opacity-0 translate-x-8",
  right: "opacity-0 -translate-x-8",
  scale: "opacity-0 scale-[0.96]",
};

const REVEAL_VISIBLE =
  "opacity-100 translate-x-0 translate-y-0 scale-100";

function RevealOnScroll({
  children,
  variant = "up",
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transform-gpu transition-all duration-700 ease-out ${
        visible
          ? REVEAL_VISIBLE
          : REVEAL_HIDDEN[variant]
      } ${className}`}
    >
      {children}
    </div>
  );
}

function FaqAccordionItem({
  item,
  index,
  openFaqIndex,
  setOpenFaqIndex,
}: {
  item: {
    q: string;
    a: string;
  };
  index: number;
  openFaqIndex: number | null;
  setOpenFaqIndex: (
    value: number | null
  ) => void;
}) {
  const isOpen = openFaqIndex === index;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <button
        type="button"
        onClick={() =>
          setOpenFaqIndex(
            isOpen ? null : index
          )
        }
        className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left transition hover:bg-[#fafafa] sm:px-6"
      >
        <span className="text-sm font-bold text-[#111111] sm:text-base">
          {item.q}
        </span>

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 text-lg transition-transform duration-300 ${
            isOpen ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          isOpen
            ? "grid-rows-[1fr]"
            : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-7 text-[#666666] sm:px-6">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [topic, setTopic] = useState("");
  const [tone, setTone] =
    useState("Professional");
  const [length, setLength] =
    useState("Medium");
  const [keywords, setKeywords] =
    useState("");

  const [blog, setBlog] = useState("");
  const [loading, setLoading] =
    useState(false);
  const [enhancing, setEnhancing] =
    useState(false);
  const [savingBlog, setSavingBlog] =
    useState(false);

  const [error, setError] =
    useState("");

  const [savedBlogs, setSavedBlogs] =
    useState<SavedBlog[]>([]);

  const [savedMessage, setSavedMessage] =
    useState("");

  const [isListening, setIsListening] =
    useState(false);

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  const [openFaqIndex, setOpenFaqIndex] =
    useState<number | null>(0);

  // ---------- Edit-in-place state for saved blogs ----------
  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [editTitle, setEditTitle] =
    useState("");
  const [editContent, setEditContent] =
    useState("");
  const [savingEditId, setSavingEditId] =
    useState<string | null>(null);

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(
      null
    );

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!mounted) {
          return;
        }

        setUser(currentUser);
        setCheckingAuth(false);

        if (currentUser) {
          await loadSavedBlogs(
            currentUser.id
          );
        }
      } catch (err) {
        console.error(
          "Auth initialization error:",
          err
        );

        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mounted) {
            return;
          }

          const currentUser =
            session?.user ?? null;

          setUser(currentUser);
          setCheckingAuth(false);

          if (currentUser) {
            await loadSavedBlogs(
              currentUser.id
            );
          } else {
            setSavedBlogs([]);
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();

      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup errors.
        }
      }
    };
  }, []);

  const loadSavedBlogs = async (
    userId: string
  ) => {
    const { data, error: fetchError } =
      await supabase
        .from("blogs")
        .select(
          "id,title,topic,content,created_at"
        )
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

    if (fetchError) {
      console.error(
        "Failed to load blogs:",
        fetchError
      );
      return;
    }

    setSavedBlogs(
      (data as SavedBlog[]) || []
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSavedBlogs([]);
    setBlog("");
    setTopic("");
    router.refresh();
  };

  const generateBlog = async () => {
    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setError(
        "Please enter a topic first."
      );
      return;
    }

    // Guarded at the call site (button), but kept here too as a safety net —
    // this should never actually fire from the UI anymore.
    if (!user) {
      return;
    }

    setLoading(true);
    setError("");
    setSavedMessage("");

    try {
      const response = await fetch(
        "/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "generate",
            topic: cleanTopic,
            tone,
            length,
            keywords:
              keywords.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to generate blog."
        );
      }

      if (!data?.content) {
        throw new Error(
          "The AI did not return any blog content."
        );
      }

      setBlog(data.content);

      window.setTimeout(() => {
        document
          .getElementById("generated-blog")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (err) {
      console.error(
        "Generate blog error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the blog."
      );
    } finally {
      setLoading(false);
    }
  };

  const enhanceBlog = async () => {
    if (!blog.trim()) {
      setError(
        "Generate a blog first before enhancing it."
      );
      return;
    }

    if (!user) {
      return;
    }

    setEnhancing(true);
    setError("");
    setSavedMessage("");

    try {
      const response = await fetch(
        "/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "enhance",
            topic: topic.trim(),
            content: blog,
            tone,
            length,
            keywords:
              keywords.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to enhance blog."
        );
      }

      if (!data?.content) {
        throw new Error(
          "The AI did not return enhanced content."
        );
      }

      setBlog(data.content);
      setSavedMessage(
        "Blog style & structure improved."
      );
    } catch (err) {
      console.error(
        "Enhance blog error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while enhancing the blog."
      );
    } finally {
      setEnhancing(false);
    }
  };

  const saveBlog = async () => {
    if (!user) {
      return;
    }

    if (!blog.trim()) {
      setError(
        "There is no generated blog to save."
      );
      return;
    }

    setSavingBlog(true);
    setError("");
    setSavedMessage("");

    try {
      const title =
        topic.trim() ||
        "Untitled Blog";

      const { error: insertError } =
        await supabase.from("blogs").insert({
          title,
          topic:
            topic.trim() || title,
          content: blog,
          user_id: user.id,
        });

      if (insertError) {
        throw insertError;
      }

      await loadSavedBlogs(user.id);

      setSavedMessage(
        "Blog saved successfully."
      );
    } catch (err) {
      console.error(
        "Save blog error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save this blog."
      );
    } finally {
      setSavingBlog(false);
    }
  };

  const deleteBlog = async (
    id: string
  ) => {
    if (!user) {
      return;
    }

    const { error: deleteError } =
      await supabase
        .from("blogs")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (deleteError) {
      console.error(
        "Delete blog error:",
        deleteError
      );

      setError(
        "Unable to delete this blog."
      );

      return;
    }

    setSavedBlogs((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );

    setSavedMessage(
      "Blog deleted successfully."
    );
  };

  // ---------- Edit-in-place handlers (Supabase-backed) ----------
  const startEditBlog = (item: SavedBlog) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
    setError("");
    setSavedMessage("");
  };

  const cancelEditBlog = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEditBlog = async (id: string) => {
    if (!user) {
      return;
    }

    if (!editTitle.trim() || !editContent.trim()) {
      setError("Title and content can't be empty.");
      return;
    }

    setSavingEditId(id);
    setError("");

    const { data, error: updateError } = await supabase
      .from("blogs")
      .update({
        title: editTitle.trim(),
        content: editContent,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Edit blog error:", updateError);
      setError("Unable to update this blog.");
      setSavingEditId(null);
      return;
    }

    setSavedBlogs((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              title: data?.title ?? editTitle.trim(),
              content: data?.content ?? editContent,
            }
          : item
      )
    );

    setSavedMessage("Blog updated successfully.");
    setSavingEditId(null);
    setEditingId(null);
  };

  const openSavedBlog = (
    item: SavedBlog
  ) => {
    setTopic(item.topic);
    setBlog(item.content);
    setError("");
    setSavedMessage(
      "Saved blog opened."
    );

    window.setTimeout(() => {
      document
        .getElementById("generated-blog")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const copyBlog = async () => {
    if (!blog.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        blog
      );

      setSavedMessage(
        "Blog copied to clipboard."
      );
    } catch (err) {
      console.error(
        "Copy error:",
        err
      );

      setError(
        "Could not copy the blog."
      );
    }
  };

  const downloadBlog = () => {
    if (!blog.trim()) {
      return;
    }

    const blob = new Blob(
      [blog],
      {
        type: "text/plain;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      `${
        topic.trim() || "mhblogai-blog"
      }`.replace(
        /[^a-z0-9-_]+/gi,
        "-"
      ) + ".txt";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    setSavedMessage(
      "Blog downloaded successfully."
    );
  };

  const startVoiceInput = () => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser. Try Chrome."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (
      event
    ) => {
      let transcript = "";

      for (
        let i = 0;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0]
            .transcript + " ";
      }

      setTopic((current) => {
        const trimmedCurrent =
          current.trim();

        const cleanTranscript =
          transcript.trim();

        if (!cleanTranscript) {
          return current;
        }

        if (!trimmedCurrent) {
          return cleanTranscript;
        }

        return `${trimmedCurrent} ${cleanTranscript}`;
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setError(
        "Voice input stopped. Please try again."
      );
    };

    recognitionRef.current =
      recognition;

    try {
      recognition.start();
      setIsListening(true);
      setError("");
    } catch (err) {
      console.error(
        "Voice start error:",
        err
      );

      setIsListening(false);
      setError(
        "Could not start voice input."
      );
    }
  };

  const speakBlog = () => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setError(
        "Text-to-speech is not supported in this browser."
      );
      return;
    }

    if (!blog.trim()) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance =
      new SpeechSynthesisUtterance(
        blog
      );

    utterance.lang = "en-US";
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(
      utterance
    );

    setIsSpeaking(true);
  };

  const wordCount = blog
    .trim()
    ? blog
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  const readingTime =
    wordCount > 0
      ? Math.max(
          1,
          Math.ceil(wordCount / 200)
        )
      : 0;

  if (checkingAuth) {
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
            Loading MHBlogAI...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#111111]">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[5%] h-[420px] w-[420px] rounded-full bg-[#C9A227]/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[25%] h-[500px] w-[500px] rounded-full bg-[#111111]/[0.04] blur-[130px]" />
        <div className="absolute bottom-[5%] left-[30%] h-[380px] w-[380px] rounded-full bg-[#C9A227]/[0.07] blur-[120px]" />

        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(#111_1px,transparent_1px),linear-gradient(90deg,#111_1px,transparent_1px)] [background-size:55px_55px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="group flex items-center gap-3"
          >
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#111111] text-sm font-black text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
              MH
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#C9A227]" />
            </span>

            <span className="text-lg font-black tracking-[-0.03em]">
              MH<span className="text-[#C9A227]">Blog</span>AI
            </span>
          </button>

          <div className="hidden items-center gap-7 md:flex">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="text-sm font-semibold text-[#666666] transition hover:text-[#111111]"
            >
              How it works
            </button>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="text-sm font-semibold text-[#666666] transition hover:text-[#111111]"
            >
              Features
            </button>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("faq")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="text-sm font-semibold text-[#666666] transition hover:text-[#111111]"
            >
              FAQ
            </button>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/dashboard"
                    )
                  }
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-[#111111] shadow-sm transition hover:-translate-y-0.5 hover:border-[#C9A227]/50 hover:shadow-md"
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#222222] sm:block"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  router.push("/login")
                }
                className="rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#222222]"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      <section className="relative z-10 px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:pb-24 lg:pt-28">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll variant="up">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/30 bg-[#C9A227]/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8f7212]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#C9A227]" />
                Your AI Writing Partner
              </div>

              <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Turn your ideas into
                <span className="relative mx-2 inline-block">
                  <span className="relative z-10 text-[#C9A227]">
                    ready-to-publish
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 -z-0 h-3 origin-left scale-x-0 rounded-full bg-[#C9A227]/15 [animation:growLine_1s_.6s_ease-out_forwards]" />
                </span>
                blogs.
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[#666666] sm:text-lg">
                MHBlogAI helps you turn rough ideas,
                notes and outlines into polished,
                structured content — with the tone,
                length and style you choose.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("generator")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                  }
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#111111] px-7 py-4 text-sm font-black text-white shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:w-auto"
                >
                  Start Creating
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-7 py-4 text-sm font-black text-[#111111] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-lg sm:w-auto"
                >
                  See How It Works
                </button>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll
            variant="scale"
            className="mt-16"
          >
            <div className="relative overflow-hidden rounded-2xl border border-black/[0.08] bg-[#111111] py-4 text-white shadow-2xl">
              <div className="flex w-max animate-[marquee_22s_linear_infinite] items-center gap-10 whitespace-nowrap px-5">
                {[
                  "AI BLOG GENERATION",
                  "SEO-FRIENDLY CONTENT",
                  "MULTIPLE TONES",
                  "VOICE INPUT",
                  "STYLE ENHANCEMENT",
                  "SAVE & MANAGE",
                  "COPY & EXPORT",
                  "AI BLOG GENERATION",
                  "SEO-FRIENDLY CONTENT",
                  "MULTIPLE TONES",
                ].map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-center gap-10"
                  >
                    <span className="text-xs font-black tracking-[0.18em] text-white/85">
                      {item}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227]" />
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative z-10 px-5 py-20 sm:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll variant="up">
            <div className="mb-12 max-w-2xl">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A227]">
                Simple workflow
              </span>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                From blank page to
                <br />
                finished blog.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-[#666666] sm:text-base">
                No complicated writing process. Give
                MHBlogAI the idea and let the AI handle
                the first draft while you stay in control.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map(
              (item, index) => (
                <RevealOnScroll
                  key={item.step}
                  variant={
                    index === 0
                      ? "left"
                      : index === 2
                      ? "right"
                      : "up"
                  }
                  delayMs={index * 100}
                >
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-black/[0.08] bg-white p-7 shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-xl">
                    <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#C9A227]/10 blur-2xl transition group-hover:bg-[#C9A227]/20" />

                    <div className="relative">
                      <span className="text-xs font-black tracking-[0.2em] text-[#C9A227]">
                        {item.step}
                      </span>

                      <h3 className="mt-8 text-xl font-black">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[#666666]">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              )
            )}
          </div>
        </div>
      </section>

      <section
        id="generator"
        className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll variant="up">
            <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A227]">
                  AI workspace
                </span>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                  Create your next blog.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#666666] sm:text-base">
                  Tell the AI what you want to write.
                  You can control the tone, length and
                  SEO keywords before generating.
                </p>
              </div>

              {user && (
                <div className="rounded-2xl border border-[#C9A227]/25 bg-[#C9A227]/[0.07] px-4 py-3 text-sm">
                  <span className="font-bold">
                    Signed in as
                  </span>{" "}
                  <span className="text-[#666666]">
                    {user.email}
                  </span>
                </div>
              )}
            </div>
          </RevealOnScroll>

          <RevealOnScroll variant="scale">
            <div className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white shadow-2xl shadow-black/[0.06]">
              <div className="border-b border-black/[0.07] bg-[#fafafa] px-5 py-4 sm:px-7">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#111111]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#C9A227]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
                  <span className="ml-3 text-xs font-bold text-[#888888]">
                    MHBlogAI / Generator
                  </span>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                <div className="border-b border-black/[0.07] p-5 sm:p-8 lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="blog-topic"
                      className="text-sm font-black"
                    >
                      What do you want to write about?
                    </label>

                    <span className="text-[11px] font-semibold text-[#999999]">
                      AI-powered
                    </span>
                  </div>

                  <div className="relative mt-3">
                    <textarea
                      id="blog-topic"
                      value={topic}
                      onChange={(event) =>
                        setTopic(
                          event.target.value
                        )
                      }
                      placeholder="Example: How AI is changing the future of small businesses..."
                      className="min-h-[210px] w-full resize-none rounded-2xl border border-black/10 bg-[#fafafa] px-5 py-4 pr-14 text-sm leading-7 text-[#111111] outline-none transition placeholder:text-[#aaaaaa] focus:border-[#C9A227] focus:bg-white focus:ring-4 focus:ring-[#C9A227]/10"
                    />

                    <button
                      type="button"
                      onClick={
                        startVoiceInput
                      }
                      aria-label={
                        isListening
                          ? "Stop voice input"
                          : "Start voice input"
                      }
                      className={`absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                        isListening
                          ? "border-[#C9A227] bg-[#C9A227] text-white shadow-lg"
                          : "border-black/10 bg-white text-[#111111] hover:border-[#C9A227]/50 hover:text-[#C9A227]"
                      }`}
                    >
                      {isListening ? (
                        <span className="flex items-end gap-0.5">
                          <span className="h-2 w-0.5 animate-pulse rounded-full bg-current" />
                          <span className="h-4 w-0.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
                          <span className="h-3 w-0.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
                          <span className="h-5 w-0.5 animate-pulse rounded-full bg-current [animation-delay:360ms]" />
                        </span>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V7a3.5 3.5 0 1 0-7 0v4a3.5 3.5 0 0 0 3.5 3.5Z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M18 11a6 6 0 0 1-12 0M12 17v4M8.5 21h7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-[#999999]">
                    {isListening
                      ? "Listening... speak naturally and your words will appear above."
                      : "Tip: Use the microphone to describe your idea instead of typing it."}
                  </p>
                </div>

                <div className="bg-[#fafafa] p-5 sm:p-8">
                  <div className="grid gap-5">
                    <div>
                      <label
                        htmlFor="tone"
                        className="mb-2 block text-sm font-black"
                      >
                        Writing tone
                      </label>

                      <select
                        id="tone"
                        value={tone}
                        onChange={(event) =>
                          setTone(
                            event.target.value
                          )
                        }
                        className="w-full appearance-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#C9A227] focus:ring-4 focus:ring-[#C9A227]/10"
                      >
                        {TONE_OPTIONS.map(
                          (option) => (
                            <option
                              key={option}
                              value={option}
                            >
                              {option}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="length"
                        className="mb-2 block text-sm font-black"
                      >
                        Blog length
                      </label>

                      <select
                        id="length"
                        value={length}
                        onChange={(event) =>
                          setLength(
                            event.target.value
                          )
                        }
                        className="w-full appearance-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#C9A227] focus:ring-4 focus:ring-[#C9A227]/10"
                      >
                        {LENGTH_OPTIONS.map(
                          (option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="keywords"
                        className="mb-2 block text-sm font-black"
                      >
                        SEO keywords
                        <span className="ml-2 font-normal text-[#999999]">
                          optional
                        </span>
                      </label>

                      <input
                        id="keywords"
                        type="text"
                        value={keywords}
                        onChange={(event) =>
                          setKeywords(
                            event.target.value
                          )
                        }
                        placeholder="AI, productivity, business"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#aaaaaa] focus:border-[#C9A227] focus:ring-4 focus:ring-[#C9A227]/10"
                      />
                    </div>

                    {/* Generate button — gated on sign-in. If the user isn't
                        signed in, this NEVER calls generateBlog (so no error
                        is ever thrown) and instead sends them to /login. */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          router.push("/login");
                          return;
                        }
                        generateBlog();
                      }}
                      disabled={
                        loading ||
                        (!!user && !topic.trim())
                      }
                      className="group mt-1 flex w-full items-center justify-center gap-3 rounded-xl bg-[#111111] px-5 py-3.5 text-sm font-black text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#222222] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Writing your blog...
                        </>
                      ) : !user ? (
                        <>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-4 w-4"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="5" y="11" width="14" height="9" rx="2" />
                            <path d="M8 11V7a4 4 0 1 1 8 0v4" />
                          </svg>
                          Sign In to Generate
                        </>
                      ) : (
                        <>
                          Generate Blog
                          <span className="transition-transform duration-300 group-hover:translate-x-1">
                            →
                          </span>
                        </>
                      )}
                    </button>

                    {!user && (
                      <p className="rounded-xl border border-[#C9A227]/20 bg-[#C9A227]/[0.07] px-4 py-3 text-xs leading-5 text-[#79600e]">
                        Sign in to generate and save
                        your blogs with MHBlogAI.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="animate-[fieldIn_.3s_ease-out] border-t border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600 sm:px-8">
                  {error}
                </div>
              )}

              {savedMessage && (
                <div className="animate-[fieldIn_.3s_ease-out] border-t border-[#C9A227]/15 bg-[#C9A227]/[0.05] px-5 py-4 text-sm font-semibold text-[#80650d] sm:px-8">
                  {savedMessage}
                </div>
              )}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* =========================
          GENERATED BLOG
      ========================== */}

      {blog && (
        <section
          id="generated-blog"
          className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-5xl">
            <RevealOnScroll variant="scale">
              <div className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white p-6 shadow-2xl shadow-black/[0.06] sm:p-10">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A227]">
                      Generated Content
                    </span>

                    <h2 className="mt-2 text-2xl font-black text-[#111111] sm:text-3xl">
                      {topic || "Untitled Blog"}
                    </h2>

                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-black/35">
                      {wordCount} words · {readingTime} min read · {tone} tone
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={enhanceBlog}
                      disabled={enhancing}
                      className="rounded-full border border-[#C9A227]/40 bg-[#C9A227]/5 px-4 py-2.5 text-xs font-bold text-[#8d6c08] transition hover:bg-[#C9A227] hover:text-white disabled:opacity-60"
                    >
                      {enhancing ? "Enhancing..." : "✦ Enhance Style"}
                    </button>

                    <button
                      type="button"
                      onClick={copyBlog}
                      className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-bold transition hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-white"
                    >
                      Copy
                    </button>

                    <button
                      type="button"
                      onClick={downloadBlog}
                      className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-bold transition hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-white"
                    >
                      Download
                    </button>

                    <button
                      type="button"
                      onClick={speakBlog}
                      className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-bold transition hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-white"
                    >
                      {isSpeaking ? "Stop" : "Listen"}
                    </button>

                    <button
                      type="button"
                      onClick={saveBlog}
                      disabled={savingBlog || !user}
                      className="rounded-full bg-[#111111] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#C9A227] disabled:opacity-60"
                    >
                      {savingBlog ? "Saving..." : "Save Blog"}
                    </button>
                  </div>
                </div>

                <article className="mt-8 border-t border-black/[0.06] pt-8">
                  {renderBlogContent(blog)}
                </article>
              </div>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* =========================
          SAVED BLOGS
      ========================== */}

      {user && savedBlogs.length > 0 && (
        <section className="relative z-10 border-t border-black/[0.06] bg-[#fafafa] px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <RevealOnScroll variant="left">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A227]">
                    Your Content
                  </span>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                    Saved Blogs.
                  </h2>
                </div>

                <span className="rounded-full bg-[#C9A227]/10 px-4 py-2 text-xs font-black text-[#8d6c08]">
                  {savedBlogs.length} saved
                </span>
              </div>
            </RevealOnScroll>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedBlogs.map((item, index) => {
                const isEditing = editingId === item.id;

                const cardWordCount = item.content?.trim()
                  ? item.content.trim().split(/\s+/).filter(Boolean).length
                  : 0;

                const cardDate = item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : null;

                return (
                  <RevealOnScroll
                    key={item.id}
                    variant="scale"
                    delayMs={index * 70}
                  >
                    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-black/[0.08] bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#C9A227]/30 hover:shadow-xl">
                      <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-[#C9A227] via-[#e0b93a] to-[#C9A227] transition-transform duration-300 group-hover:scale-x-100" />

                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A227]/10 text-[#C9A227] transition-transform duration-300 group-hover:scale-105">
                          ✦
                        </div>

                        {cardDate && !isEditing && (
                          <span className="rounded-full bg-black/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-black/35">
                            {cardDate}
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Blog title"
                            className="mt-5 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2.5 text-sm font-black outline-none transition-colors duration-300 focus:border-[#C9A227] focus:bg-white"
                          />

                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={5}
                            placeholder="Blog content"
                            className="mt-3 w-full flex-1 resize-none rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2.5 text-sm leading-6 outline-none transition-colors duration-300 focus:border-[#C9A227] focus:bg-white"
                          />

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveEditBlog(item.id)}
                              disabled={savingEditId === item.id}
                              className="flex-1 rounded-xl bg-[#111111] px-4 py-3 text-xs font-bold text-white transition-colors duration-300 hover:bg-[#C9A227] disabled:opacity-60"
                            >
                              {savingEditId === item.id ? "Saving..." : "Save Changes"}
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditBlog}
                              className="rounded-xl border border-black/10 px-4 py-3 text-xs font-bold transition-colors duration-300 hover:border-black/30"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="mt-5 line-clamp-2 text-lg font-black leading-snug">
                            {item.title || "Untitled blog"}
                          </h3>

                          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-black/40">
                            {item.content}
                          </p>

                          <div className="mt-5 flex items-center gap-1.5 border-t border-black/[0.06] pt-4 text-[11px] font-black uppercase tracking-wide text-black/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227]" />
                            {cardWordCount.toLocaleString()} words
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openSavedBlog(item)}
                              className="flex-1 rounded-xl bg-[#111111] px-3 py-3 text-xs font-bold text-white transition-colors duration-300 hover:bg-[#C9A227]"
                            >
                              Open
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditBlog(item)}
                              className="rounded-xl border border-black/10 px-3 py-3 text-xs font-bold transition-colors duration-300 hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-white"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteBlog(item.id)}
                              className="rounded-xl border border-black/10 px-3 py-3 text-xs font-bold transition-colors duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =========================
          FEATURES
      ========================== */}

      <section
        id="features"
        className="relative z-10 px-5 py-20 sm:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll variant="right" className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A227]">
              Features
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
              Built for modern content creation.
            </h2>
          </RevealOnScroll>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <RevealOnScroll
                key={feature.title}
                variant="scale"
                delayMs={index * 120}
              >
                <div className="group h-full rounded-[2rem] border border-black/[0.08] bg-white p-8 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#C9A227]/30 hover:shadow-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9A227]/10 text-xl text-[#C9A227] transition-transform duration-300 group-hover:scale-110">
                    {feature.icon}
                  </div>

                  <h3 className="mt-7 text-xl font-black">{feature.title}</h3>

                  <p className="mt-3 leading-7 text-[#666666]">{feature.text}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          FAQ
      ========================== */}

      <section
        id="faq"
        className="relative z-10 border-t border-black/[0.06] bg-[#fafafa] px-5 py-20 sm:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <RevealOnScroll variant="down" className="text-center">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A227]">
              FAQ
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
              Common questions.
            </h2>
          </RevealOnScroll>

          <div className="mt-10 space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <RevealOnScroll key={item.q} variant="up" delayMs={index * 80}>
                <FaqAccordionItem
                  item={item}
                  index={index}
                  openFaqIndex={openFaqIndex}
                  setOpenFaqIndex={setOpenFaqIndex}
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          CTA
      ========================== */}

      <section className="relative z-10 px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll variant="scale">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#111111] px-7 py-16 text-center text-white sm:px-12 sm:py-20">
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#C9A227]/20 blur-[90px] [animation:pulseSoft_5s_ease-in-out_infinite]" />

              <div className="relative">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A227]">
                  MHBlogAI
                </span>

                <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black sm:text-5xl">
                  Your next great article starts with an idea.
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      router.push("/login");
                      return;
                    }
                    document
                      .getElementById("generator")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-8 rounded-full bg-[#C9A227] px-8 py-4 text-sm font-black text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#b38d1e] hover:shadow-xl"
                >
                  {user ? "Create with AI →" : "Sign In to Start →"}
                </button>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="relative z-10 border-t border-black/[0.06] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
            <div className="text-center sm:text-left">
              <span className="text-lg font-black tracking-[-0.03em]">
                MH<span className="text-[#C9A227]">Blog</span>AI
              </span>
              <p className="mt-2 max-w-xs text-sm leading-6 text-black/40">
                An AI writing workspace for turning ideas into polished blog content.
              </p>
            </div>

            <div className="flex gap-10 text-sm font-bold text-black/45">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
                className="transition-colors duration-300 hover:text-[#C9A227]"
              >
                How it works
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }
                className="transition-colors duration-300 hover:text-[#C9A227]"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })
                }
                className="transition-colors duration-300 hover:text-[#C9A227]"
              >
                FAQ
              </button>
            </div>
          </div>

          <div className="mt-10 border-t border-black/[0.06] pt-6 text-center text-sm text-black/40">
            © {new Date().getFullYear()} MHBlogAI. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes fieldIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulseSoft {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        @keyframes growLine {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </main>
  );
}