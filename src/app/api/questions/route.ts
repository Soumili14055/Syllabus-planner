// File: src/app/api/questions/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // ✅ --- MORE FOCUSED PROMPT ---
    const prompt = `
      You are an expert academic tutor. Your task is to create practice questions for ONE specific topic ONLY.
      IMPORTANT: Do NOT create general questions for a "final exam" or "mid-term exam". The questions MUST relate ONLY to the single topic provided below.
      IGNORE any other topics or context outside of this one topic.

      The specific topic is: "${topic}"

      Based ONLY on this topic, generate:
      - Two distinct short-answer questions worth 5 marks each.
      - Two distinct long-answer, analytical questions worth 10 marks each.

      The output MUST be a valid JSON object with the keys "five_mark_questions" (an array of strings) and "ten_mark_questions" (an array of strings).
    `;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        },
    });
    const response = await result.response;
    const questions = response.text();

    if (!questions) {
        throw new Error("AI returned an empty response for questions.");
    }
    
    return NextResponse.json(JSON.parse(questions));

  } catch (error) {
    console.error("--- QUESTIONS API ERROR ---", error);
    return NextResponse.json(
      { error: "Failed to generate questions." },
      { status: 500 }
    );
  }
}