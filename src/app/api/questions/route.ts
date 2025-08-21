// File: src/app/api/questions/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json(); // Get the topic from the request

    if (!topic) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    // This prompt is specifically for creating questions
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert exam question creator. Based on the following topic, generate two types of questions:
      1. One short-answer question worth 5 marks that tests knowledge.
      2. One long-answer, analytical question worth 10 marks that tests deeper understanding.

      The topic is: "${topic}"

      The output MUST be a valid JSON object with the keys "five_mark_question" and "ten_mark_question".
      
      Example format:
      {
        "five_mark_question": "Explain the concept of ...",
        "ten_mark_question": "Critically analyze the impact of ..."
      }
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