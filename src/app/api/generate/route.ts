// File: src/app/api/generate/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const syllabusFile = formData.get("syllabusFile") as File | null;
    const endDate = formData.get("endDate") as string | null;

    // Validation checks (these are good, no changes needed)
    if (!syllabusFile || !endDate) {
      return NextResponse.json({ error: "Syllabus file and end date are required." }, { status: 400 });
    }
    if (syllabusFile.type !== 'application/pdf') {
      return NextResponse.json({ error: "Invalid file type. Please upload a PDF." }, { status: 400 });
    }
    if (syllabusFile.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: "File size exceeds the 5MB limit." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await syllabusFile.arrayBuffer());
    const pdfData = await pdf(fileBuffer);
    const syllabusText = pdfData.text.trim();

    if (!syllabusText) {
        return NextResponse.json({ error: "Could not extract text from the PDF." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    
    // ✅ --- NEW, IMPROVED PROMPT ---
    const prompt = `You are an expert academic planner. The provided syllabus content contains multiple subjects. You MUST identify each subject and generate a separate, detailed, week-by-week study schedule for EACH ONE. The schedules must end by the provided deadline.

    The output MUST be a valid JSON object with a single key "schedule", which contains an array of "subject" objects.
    Each "subject" object must have a "subject_name" (string) and a "weekly_plan" (an array of week objects).
    Each week object must have "week" (number), "topic" (string), and "tasks" (an array of strings).

    Example output format for two subjects:
    {
      "schedule": [
        {
          "subject_name": "Physics",
          "weekly_plan": [
            { "week": 1, "topic": "Kinematics", "tasks": ["Read Chapter 1", "Solve intro problems"] }
          ]
        },
        {
          "subject_name": "Chemistry",
          "weekly_plan": [
            { "week": 1, "topic": "Atomic Structure", "tasks": ["Review periodic table", "Lab report 1"] }
          ]
        }
      ]
    }
    
    ---
    Syllabus Content: ${syllabusText.substring(0, 30000)}
    ---
    Schedule Completion Deadline: ${endDate}
    Today's Date: ${new Date().toLocaleDateString('en-CA')}
    `;
    
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        },
    });
    const response = await result.response;
    const aiResponseText = response.text();

    if (!aiResponseText) {
      throw new Error("AI returned an empty response.");
    }

    const scheduleData = JSON.parse(aiResponseText);
    return NextResponse.json(scheduleData);

  } catch (error) {
    console.error("--- API CATCH BLOCK ERROR ---", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: `An internal server error occurred: ${errorMessage}` }, { status: 500 });
  }
}