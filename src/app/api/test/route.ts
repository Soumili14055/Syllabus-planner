// File: src/app/api/test/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { subject, syllabusText } = await request.json();

    if (!syllabusText || !subject) {
      return NextResponse.json({ error: "Syllabus text and subject are required." }, { status: 400 });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // ✅ PROMPT UPDATED FOR THE NEW 50-MARK TEST STRUCTURE
    const prompt = `
      You are a university professor creating a final exam. Your task is to generate a comprehensive, 50-mark exam paper for the subject of "${subject}".
      The exam MUST cover the entire syllabus provided for context.

      The exam structure MUST be as follows:
      1.  **Multiple Choice Questions:** 10 questions, 1 mark each (Total 10 marks).
      2.  **Short-Answer Questions:** 2 questions, 5 marks each (Total 10 marks).
      3.  **Long-Answer Questions:** 2 questions, 15 marks each (Total 30 marks).

      CRUCIAL: For each short-answer and long-answer question, you MUST provide an array of "keywords" that a good answer should contain. This will be used for automated grading.

      The output MUST be a single, valid JSON object with the following structure:
      {
        "subject": "${subject}",
        "total_marks": 50,
        "mcqs": [ { "question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "C" } ],
        "short_questions": [ { "question": "...", "marks": 5, "keywords": ["keyword1", "keyword2"] } ],
        "long_questions": [ { "question": "...", "marks": 15, "keywords": ["keyword1", "keyword2", "keyword3"] } ]
      }

      --- SYLLABUS CONTEXT ---
      ${syllabusText}
    `;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        },
    });
    
    const testData = result.response.text();
    return NextResponse.json(JSON.parse(testData));

  } catch (error) {
    console.error("--- TEST GENERATION API ERROR ---", error);
    return NextResponse.json({ error: "Failed to generate the test." }, { status: 500 });
  }
}