import Link from "next/link";

export default function AboutPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        color: "#000000",
        padding: "80px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          color: "#000000",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#C9A227",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ← Back to Home
        </Link>

        <p
          style={{
            marginTop: "48px",
            color: "#C9A227",
            fontSize: "13px",
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          About MHBlogAI
        </p>

        <h1
          style={{
            marginTop: "16px",
            color: "#000000",
            fontSize: "48px",
            lineHeight: 1.1,
            fontWeight: 900,
          }}
        >
          Turn your ideas into ready-to-publish blogs.
        </h1>

        <p
          style={{
            marginTop: "24px",
            maxWidth: "700px",
            color: "#000000",
            fontSize: "18px",
            lineHeight: 1.8,
          }}
        >
          MHBlogAI is an AI-powered writing workspace designed to help
          creators turn ideas into useful, readable and engaging blog
          content more efficiently.
        </p>

        <section style={{ marginTop: "56px" }}>
          <h2 style={{ color: "#000000", fontSize: "26px", fontWeight: 900 }}>
            What is MHBlogAI?
          </h2>

          <p style={{ marginTop: "16px", color: "#000000", lineHeight: 1.8 }}>
            MHBlogAI is a web-based AI writing platform that helps users
            create blog articles from a topic or idea. The platform brings
            content generation and writing tools together in one simple
            workspace.
          </p>
        </section>

        <section style={{ marginTop: "48px" }}>
          <h2 style={{ color: "#000000", fontSize: "26px", fontWeight: 900 }}>
            What can you do with MHBlogAI?
          </h2>

          <p style={{ marginTop: "16px", color: "#000000", lineHeight: 1.8 }}>
            You can use MHBlogAI to generate blog content, improve existing
            writing, explore different writing styles and manage your saved
            content from your personal workspace.
          </p>
        </section>

        <section style={{ marginTop: "48px" }}>
          <h2 style={{ color: "#000000", fontSize: "26px", fontWeight: 900 }}>
            Our Purpose
          </h2>

          <p style={{ marginTop: "16px", color: "#000000", lineHeight: 1.8 }}>
            Our goal is to make AI-assisted content creation simple,
            accessible and easy to use for people who want to turn their
            ideas into polished written content.
          </p>
        </section>

        <section style={{ marginTop: "48px" }}>
          <h2 style={{ color: "#000000", fontSize: "26px", fontWeight: 900 }}>
            Our Vision
          </h2>

          <p style={{ marginTop: "16px", color: "#000000", lineHeight: 1.8 }}>
            We aim to continuously improve MHBlogAI with useful writing
            features and a better user experience while keeping the
            platform straightforward and practical.
          </p>
        </section>

        <section
          style={{
            marginTop: "64px",
            paddingTop: "32px",
            borderTop: "1px solid #000000",
          }}
        >
          <h2 style={{ color: "#000000", fontSize: "20px", fontWeight: 900 }}>
            Legal & Privacy
          </h2>

          <div style={{ marginTop: "16px", display: "flex", gap: "24px" }}>
            <Link
              href="/privacy"
              style={{ color: "#000000", fontWeight: 700 }}
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              style={{ color: "#000000", fontWeight: 700 }}
            >
              Terms & Conditions
            </Link>
          </div>
        </section>

        <p
          style={{
            marginTop: "48px",
            color: "#000000",
            fontSize: "14px",
          }}
        >
          © {new Date().getFullYear()} MHBlogAI. All rights reserved.
        </p>
      </div>
    </main>
  );
}
