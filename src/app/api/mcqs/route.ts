// File: src/app/api/mcqs/route.ts

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
      You are an expert exam question creator, specializing in Multiple Choice Questions (MCQs) for ONE specific topic.
      IMPORTANT: The questions MUST relate ONLY to the single topic provided below. Do NOT create questions that cover a whole syllabus or a final exam.
      IGNORE any tasks like "read the chapter".

      The specific topic is: "${topic}"

      Generate 5 distinct MCQs based ONLY on this topic. Each question should have 4 options.

      The output MUST be a valid JSON object with a single key "mcqs", which contains an array of objects.
      Each object must have three keys: "question" (string), "options" (an array of 4 strings), and "correct_answer" (a string that exactly matches one of the options).
    `;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        },
    });
    const response = await result.response;
    const mcqsData = response.text();

    if (!mcqsData) {
        throw new Error("AI returned an empty response for MCQs.");
    }
    
    return NextResponse.json(JSON.parse(mcqsData));

  } catch (error) {
    console.error("--- MCQS API ERROR ---", error);
    return NextResponse.json(
      { error: "Failed to generate MCQs." },
      { status: 500 }
    );
  }
}