// File: src/app/api/grade/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { question, keywords, userAnswer, marks } = await request.json();
    if (!question || !keywords || !userAnswer || !marks) {
      return NextResponse.json({ error: "Missing required fields for grading." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a fair and strict teaching assistant grading an exam answer. Your task is to evaluate a student's answer based on the original question and a list of essential keywords.
      Original Question (worth ${marks} marks): "${question}"
      Essential Keywords: ${keywords.join(", ")}
      Student's Answer: "${userAnswer}"
      Instructions:
      1.  Read the student's answer carefully.
      2.  Compare it against the essential keywords.
      3.  Determine how many of the keywords are present and correctly explained.
      4.  Assign a score out of ${marks} based on the quality and completeness of the answer.
      5.  Provide brief, constructive feedback explaining the score.
      The output MUST be a valid JSON object with the keys "score" (a number) and "feedback" (a string).
    `;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
    });

    const gradingData = result.response.text();
    return NextResponse.json(JSON.parse(gradingData));

  } catch (error) {
    console.error("--- GRADING API ERROR ---", error);
    return NextResponse.json({ error: "Failed to grade the answer." }, { status: 500 });
  }
}