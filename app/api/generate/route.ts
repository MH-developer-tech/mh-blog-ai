import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = body?.topic;

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        {
          error: "Please enter a valid topic.",
        },
        { status: 400 }
      );
    }

    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      return NextResponse.json(
        {
          error: "Please enter a topic.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");

      return NextResponse.json(
        {
          error: "Gemini API key is missing.",
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are a professional SEO blog writer.

Write a high-quality, publication-ready blog about:

"${cleanTopic}"

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
- Do not use generic AI-style phrases.
- Do not mention AI, Gemini, prompts, language models, or content generation.
- Do not invent statistics, studies, quotes, organizations, dates, or unsupported facts.
- If a specific fact is uncertain, use careful general wording.
- End with a useful conclusion.

Use clean Markdown formatting.

Return ONLY the finished blog article in Markdown.
`;

    console.log("Starting Gemini generation...");
    console.log("Model: gemini-3.6-flash");
    console.log("Topic:", cleanTopic);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      console.log("Gemini response received.");

      const blog = response.text;

      console.log(
        "Gemini text length:",
        blog ? blog.length : 0
      );

      if (!blog || !blog.trim()) {
        console.error(
          "Gemini returned an empty response."
        );

        return NextResponse.json(
          {
            error: "Gemini returned empty content.",
          },
          { status: 502 }
        );
      }

      console.log("Blog generated successfully.");

      return NextResponse.json(
        {
          content: blog.trim(),
        },
        { status: 200 }
      );
    } catch (error: unknown) {
      console.error("========== GEMINI ERROR ==========");
      console.error(error);
      console.error("===================================");

      let message = "Unknown Gemini error";
      let status: number | undefined;

      if (error instanceof Error) {
        message = error.message;
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error
      ) {
        const possibleStatus = (
          error as { status?: unknown }
        ).status;

        if (typeof possibleStatus === "number") {
          status = possibleStatus;
        }
      }

      console.error("Gemini status:", status);
      console.error("Gemini message:", message);

      return NextResponse.json(
        {
          error: "Gemini API request failed.",
          details: message,
          status,
        },
        {
          status: status && status >= 400 && status < 600
            ? status
            : 500,
        }
      );
    }
  } catch (error) {
    console.error("Generate route error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error";

    return NextResponse.json(
      {
        error: "Unable to generate the blog.",
        details: message,
      },
      { status: 500 }
    );
  }
}