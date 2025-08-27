// File: src/app/api/quick-test/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// ✅ PROMPT UPDATED for 20 MCQs, 1 mark each, 10 mins
const mcqPrompt = (topic: string) => `
  You are an expert exam creator. Generate a 20-mark MCQ test on the topic: "${topic}".
  
  The test MUST have 20 multiple-choice questions, each worth 1 mark.
  - Total Marks: 20
  - Time Limit: 10 minutes

  The output MUST be a valid JSON object with the structure:
  {
    "subject": "${topic}", 
    "total_marks": 20, 
    "time_limit_minutes": 10, 
    "test_type": "MCQ",
    "mcqs": [ 
      { "question": "...", "options": ["...", "...", "...", "..."], "correct_answer": "..." } 
    ]
  }
`;

// ✅ PROMPT UPDATED for 10 SAQs, 2 marks each, 20 mins
const saqPrompt = (topic: string) => `
  You are an expert exam creator. Generate a 20-mark Short-Answer Question (SAQ) test on the topic: "${topic}".

  The test MUST have 10 short-answer questions, each worth 2 marks.
  For EACH question, provide an array of "keywords" for grading.
  - Total Marks: 20
  - Time Limit: 20 minutes

  The output MUST be a valid JSON object with the structure:
  {
    "subject": "${topic}", 
    "total_marks": 20, 
    "time_limit_minutes": 20, 
    "test_type": "SAQ",
    "short_questions": [ 
      { "question": "...", "marks": 2, "keywords": ["...", "..."] } 
    ]
  }
`;

export async function POST(request: NextRequest) {
  try {
    const { topic, testType } = await request.json();

    if (!topic || !testType) {
      return NextResponse.json({ error: "Topic and testType are required." }, { status: 400 });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = testType === 'MCQ' ? mcqPrompt(topic) : saqPrompt(topic);

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
    });
    
    const testData = result.response.text();
    return NextResponse.json(JSON.parse(testData));

  } catch (error) {
    console.error("--- QUICK TEST API ERROR ---", error);
    return NextResponse.json({ error: "Failed to generate quick test." }, { status: 500 });
  }
}
