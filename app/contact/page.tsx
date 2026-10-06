"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessage("Your message has been sent successfully.");
      form.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send your message."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 sm:py-24">
        <Link
          href="/"
          className="font-bold text-[#C9A227] transition hover:opacity-70"
        >
          ? Back to Home
        </Link>

        <div className="mt-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A227]">
            Contact
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Get in touch
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-[#666666]">
            Have a question, suggestion, or problem with MHBlogAI? Send us a
            message and we will get back to you.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-12 space-y-6 rounded-2xl border border-black/10 p-6 sm:p-8"
        >
          <div>
            <label className="mb-2 block text-sm font-bold">Name</label>
            <input
              name="name"
              type="text"
              required
              className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none transition focus:border-[#C9A227]"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none transition focus:border-[#C9A227]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Subject</label>
            <input
              name="subject"
              type="text"
              required
              className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none transition focus:border-[#C9A227]"
              placeholder="How can we help?"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Message</label>
            <textarea
              name="message"
              required
              rows={7}
              className="w-full resize-y rounded-xl border border-black/15 px-4 py-3 outline-none transition focus:border-[#C9A227]"
              placeholder="Write your message..."
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-black px-7 py-3 font-bold text-white transition hover:bg-[#C9A227] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>

          {message && (
            <p className="text-sm font-semibold text-[#444444]">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
