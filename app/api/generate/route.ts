
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

    const ai = new GoogleGenAI({
      apiKey,
    });

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

    const models = [
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
    ];

    let lastError: unknown = null;

    for (const model of models) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(
            `Gemini request: ${model}, attempt ${attempt}`
          );

          const response = await ai.models.generateContent({
            model,
            contents: prompt,
          });

          const blog = response.text?.trim();

          if (blog) {
            console.log(
              `Gemini generation successful using ${model}`
            );

            return NextResponse.json(
              {
                content: blog,
              },
              { status: 200 }
            );
          }

          lastError = new Error(
            "Gemini returned empty content."
          );
        } catch (error: unknown) {
          lastError = error;

          console.error(
            `Gemini error: ${model}, attempt ${attempt}`,
            error
          );

          const errorText =
            error instanceof Error
              ? error.message
              : JSON.stringify(error);

          const isTemporaryError =
            errorText.includes("503") ||
            errorText.includes("UNAVAILABLE") ||
            errorText.includes("high demand") ||
            errorText.includes("429") ||
            errorText.includes("RESOURCE_EXHAUSTED");

          if (!isTemporaryError) {
            break;
          }

          if (attempt < 3) {
            await sleep(1500 * attempt);
          }
        }
      }
    }

    const message =
      lastError instanceof Error
        ? lastError.message
        : "Gemini API is temporarily unavailable.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 503 }
    );
  } catch (error: unknown) {
    console.error("Generate route error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate the blog.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}