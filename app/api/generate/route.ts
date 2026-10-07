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

    console.log("Gemini request: gemini-3.5-flash-lite");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    const blog = response.text?.trim();

    if (!blog) {
      return NextResponse.json(
        { error: "Gemini returned empty content." },
        { status: 503 }
      );
    }

    console.log("Gemini generation successful");

    return NextResponse.json(
      {
        content: blog,
      },
      { status: 200 }
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