// File: app/api/generate/route.ts

import OpenAI from 'openai';
import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log("\n--- [API LOG] OpenAI Endpoint hit ---");

  try {
    const formData = await request.formData();
    const syllabusFile = formData.get("syllabusFile") as File | null;
    const endDate = formData.get("endDate") as string | null;

    if (!syllabusFile || !endDate) {
      return NextResponse.json(
        { error: "File and end date are required." },
        { status: 400 }
      );
    }
    
    const fileBuffer = Buffer.from(await syllabusFile.arrayBuffer());
    const pdfData = await pdf(fileBuffer);
    const syllabusText = pdfData.text;

    console.log("[API LOG] PDF parsed successfully. Text length:", syllabusText.length);
    
    // The main instruction for the AI.
    const systemPrompt = `You are an expert academic planner. Generate a detailed, week-by-week study schedule based on the provided syllabus. Break down each week's topic into smaller, manageable tasks. The output must be a valid JSON array of objects, where each object contains a "week" number, a "topic", and a "tasks" array. Example: [{"week": 1, "topic": "Introduction", "tasks": ["Read Chapter 1"]}]`;

    // The user's specific data.
    const userPrompt = `
      Syllabus Content:
      ---
      ${syllabusText}
      ---
      Completion Deadline: ${endDate}
      Current Date: ${new Date().toLocaleDateString('en-IN')}
    `;

    console.log("[API LOG] Sending prompt to OpenAI...");
    
    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // A fast and capable model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" }, // Ensures the output is valid JSON
    });

    const aiResponseText = response.choices[0].message.content;
    console.log("---------- AI RESPONSE TEXT ----------");
    console.log(aiResponseText);
    console.log("------------------------------------");

    if (!aiResponseText) {
        throw new Error("AI returned an empty response.");
    }
    
    // The response should already be clean JSON because of the "json_object" format
    return NextResponse.json(JSON.parse(aiResponseText));

  } catch (error) {
    console.error("--- [API LOG] CATCH BLOCK ERROR ---", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}