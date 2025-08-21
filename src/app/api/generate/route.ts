// File: src/app/api/generate/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

// Define a type for our schedule structure
type ScheduleItem = {
  week: number;
  topic: string;
  tasks: string[];
};

// Initialize the Google AI client with your API key from .env.local
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const syllabusFile = formData.get("syllabusFile") as File | null;
    const endDate = formData.get("endDate") as string | null;

    // Validation checks
    if (!syllabusFile || !endDate) {
      return NextResponse.json({ error: "Syllabus file and end date are required." }, { status: 400 });
    }
    if (syllabusFile.type !== 'application/pdf') {
      return NextResponse.json({ error: "Invalid file type. Please upload a PDF." }, { status: 400 });
    }
    if (syllabusFile.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: "File size exceeds the 5MB limit." }, { status: 400 });
    }

    // Process the PDF file
    const fileBuffer = Buffer.from(await syllabusFile.arrayBuffer());
    const pdfData = await pdf(fileBuffer);
    const syllabusText = pdfData.text.trim();

    if (!syllabusText) {
        return NextResponse.json({ error: "Could not extract text from the PDF." }, { status: 400 });
    }

    // AI Prompt Engineering for Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    const prompt = `You are an expert academic planner. Generate a detailed, week-by-week study schedule from a syllabus. The schedule must end by the provided deadline. 
    The output MUST be a valid JSON object with a single key "schedule", which contains an array of objects. Each object must have "week" (number), "topic" (string), and "tasks" (an array of strings).

    Example output format:
    {
      "schedule": [
        {
          "week": 1,
          "topic": "Introduction to Course",
          "tasks": ["Read Chapter 1", "Complete introductory assignment", "Review course outline"]
        }
      ]
    }
    
    ---
    Syllabus Content: ${syllabusText.substring(0, 15000)}
    ---
    Schedule Completion Deadline: ${endDate}
    Today's Date: ${new Date().toLocaleDateString('en-CA')}
    `;
    
    // Google Gemini API Call
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponseText = response.text();

    if (!aiResponseText) {
      throw new Error("AI returned an empty response.");
    }
    
    // ✅ **FIX:** Clean the response string to remove the Markdown wrapper
    const cleanedJsonString = aiResponseText.replace(/```json\n|```/g, "").trim();

    // Parse the cleaned string
    const scheduleData = JSON.parse(cleanedJsonString);
    return NextResponse.json(scheduleData);

  } catch (error) {
    console.error("--- API CATCH BLOCK ERROR ---", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: `An internal server error occurred: ${errorMessage}` }, { status: 500 });
  }
}