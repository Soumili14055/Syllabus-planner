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
  You are an expert academic tutor. Your task is to create practice questions AND a corresponding grading guide for ONE specific topic.
  IMPORTANT: The questions and keywords MUST relate ONLY to the single topic provided below.

  The specific topic is: "${topic}"

  Generate:
  - Two distinct short-answer questions worth 5 marks each.
  - Two distinct long-answer, analytical questions worth 10 marks each.

  For EACH question you generate, you MUST also provide an array of 3-5 essential keywords that would be expected in a perfect answer.

  The output MUST be a valid JSON object. The JSON should have two keys: "five_mark_questions" and "ten_mark_questions".
  Each key should contain an array of objects. Each object in the array must have two keys:
  - "question": A string containing the question text.
  - "keywords": An array of strings representing the essential keywords for grading.
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