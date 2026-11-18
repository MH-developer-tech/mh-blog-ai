
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = body?.topic;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "Please enter a valid topic." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a professional SEO blog writer.

Write a high-quality, publication-ready blog about:

"${topic.trim()}"

Requirements:

- Write approximately 900 to 1200 words.
- Create a strong and specific title.
- Start with an engaging introduction.
- Use H2 and H3 headings.
- Use short readable paragraphs.
- Use bullet points or numbered lists when useful.
- Give practical information and useful examples.
- Naturally include relevant SEO keywords.
- Include semantic keywords naturally.
- Do not keyword stuff.
- Avoid repetition and filler.
- Make the article useful and informative.
- Use a professional, natural and human writing style.
- Vary sentence length and paragraph structure.
- Do not mention AI, Gemini, prompts, language models, or content generation.
- Do not invent statistics, studies, quotes, organizations, dates, or unsupported facts.
- If a specific fact is uncertain, use careful general wording.
- End with a useful conclusion.

Use clean Markdown formatting.

Return ONLY the finished blog article in Markdown.
`;

    console.log("Gemini request: gemini-3.5-flash-lite");

    let response;
    let lastError: unknown;

    // Retry up to 3 times for temporary server errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: prompt,
        });

        break;
      } catch (error: unknown) {
        lastError = error;

        const err = error as {
          status?: number;
          code?: number | string;
          message?: string;
        };

        const status = Number(err.status ?? err.code ?? 0);
        const message = err.message ?? String(error);

        const retryable =
          status === 429 ||
          status >= 500 ||
          /high demand|overloaded|unavailable|temporarily|503|429/i.test(message);

        console.error(`Gemini attempt ${attempt} failed:`, message);

        if (!retryable || attempt === 3) {
          break;
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, 1500 * attempt)
        );
      }
    }

    if (!response) {
      const err = lastError as {
        status?: number;
        code?: number | string;
      } | undefined;

      const status = Number(err?.status ?? err?.code ?? 0);

      if (status === 429 || status >= 500) {
        return NextResponse.json(
          {
            error:
              "AI service is temporarily busy. Please try again in a minute.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "Unable to generate your blog. Please try again." },
        { status: 500 }
      );
    }

    const blog = response.text?.trim();

    if (!blog) {
      return NextResponse.json(
        { error: "Gemini returned empty content. Please try again." },
        { status: 503 }
      );
    }

    console.log("Gemini generation successful");

    return NextResponse.json(
      { content: blog },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("Generate route error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}
