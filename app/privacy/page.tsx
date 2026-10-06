import Link from "next/link";

export default function PrivacyPage() {
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
            Legal
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mt-5 text-sm text-[#666666]">
            Last updated: October 5, 2026
          </p>
        </div>

        <div className="mt-12 space-y-10 text-[15px] leading-8 text-[#4b4b4b]">
          <section>
            <h2 className="text-2xl font-black text-[#111111]">
              1. Introduction
            </h2>
            <p className="mt-4">
              Welcome to MHBlogAI. We respect your privacy and are committed
              to protecting the information you provide while using our
              website and AI writing services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#111111]">
              2. Information We Collect
            </h2>
            <p className="mt-4">
              When you create an account or use MHBlogAI, we may collect
              information such as your email address, account information,
              generated content, and information you voluntarily provide to
              use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#111111]">
              3. How We Use Information
            </h2>
            <p className="mt-4">
              We use collected information to provide, maintain, secure, and
              improve MHBlogAI, including account authentication, saving your
              content, providing AI writing features, and responding to
              support requests.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#111111]">
              4. Your Generated Content
            </h2>
            <p className="mt-4">
              Content you generate or save through your account may be stored
              so that you can access and manage it through your personal
              workspace. You should avoid submitting confidential or highly
              sensitive information to AI tools.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#111111]">
              5. Cookies and Similar Technologies
            </h2>
            <p className="mt-4">
              MHBlogAI may use cookies, local storage, authentication
              technologies, or similar technologies where necessary to
              operate the website, maintain sessions, and improve the user
              experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#111111]">
              6. Third-Party Services
            </h2>
            <p className="mt-4">
              MHBlogAI may rely on third-party services for authentication,
              database functionality, hosting, analytics, or AI processing.
              These services may process information according to their own
              privacy policies and terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#111111]">
              7. Data Security
            </h2>
            <p className="mt-4">
              We take reasonable measures to protect information handled by
              the service. However, no internet-based service can guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#111111]">
              8. Your Choices
            </h2>
            <p className="mt-4">
              You may choose not to provide certain information, although
              some features may require an account. You should also keep your
              account credentials secure and notify us if you believe your
              account has been accessed without authorization.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#111111]">
              9. Children&apos;s Privacy
            </h2>
            <p className="mt-4">
              MHBlogAI is not intended to knowingly collect personal
              information from children where such collection is prohibited
              by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#111111]">
              10. Changes to This Policy
            </h2>
            <p className="mt-4">
              We may update this Privacy Policy from time to time. Any
              changes will be reflected on this page with an updated
              revision date.
            </p>
          </section>

          <section className="border-t border-black/10 pt-10">
            <h2 className="text-2xl font-black text-[#111111]">
              11. Contact
            </h2>
            <p className="mt-4">
              If you have questions about this Privacy Policy or how
              MHBlogAI handles information, please use the contact method
              provided by the website.
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-6 border-t border-black/10 pt-8 text-sm font-bold">
          <Link href="/" className="hover:text-[#C9A227]">
            Home
          </Link>

          <Link href="/about" className="hover:text-[#C9A227]">
            About
          </Link>

          <Link href="/terms" className="hover:text-[#C9A227]">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </main>
  );
}
