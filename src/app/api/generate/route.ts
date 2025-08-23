// File: src/app/api/generate/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const syllabusFile = formData.get("syllabusFile") as File | null;
    const endDate = formData.get("endDate") as string | null;

    // Validation checks remain the same
    if (!syllabusFile || !endDate) { return NextResponse.json({ error: "Syllabus file and end date are required." }, { status: 400 }); }
    if (syllabusFile.type !== 'application/pdf') { return NextResponse.json({ error: "Invalid file type. Please upload a PDF." }, { status: 400 }); }
    if (syllabusFile.size > 5 * 1024 * 1024) { return NextResponse.json({ error: "File size exceeds the 5MB limit." }, { status: 400 }); }

    const fileBuffer = Buffer.from(await syllabusFile.arrayBuffer());
    const pdfData = await pdf(fileBuffer);
    const syllabusText = pdfData.text.trim();

    if (!syllabusText) { return NextResponse.json({ error: "Could not extract text from the PDF." }, { status: 400 }); }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    
    // ✅ --- NEW, SMARTER PROMPT ---
    const prompt = `You are an expert curriculum analyzer. Your primary task is to extract the main academic topics and sub-topics from the provided syllabus content for each subject and organize them into a weekly plan.

    IMPORTANT: You MUST IGNORE and EXCLUDE any instructional text, assignments, or specific tasks like "Read Chapter 1", "Solve problems 1-5", "Complete the assignment", "Review lecture notes", etc. Focus ONLY on the names of the academic subjects, chapters, and topics.

    The "tasks" array for each week should contain the key sub-topics or concepts to learn, NOT instructional tasks.

    The output MUST be a valid JSON object with a single key "schedule", which contains an array of "subject" objects. Each "subject" object must have a "subject_name" (string) and a "weekly_plan" (an array of week objects). Each week object must have "week" (number), "topic" (string for the main chapter/module), and "tasks" (an array of strings for the sub-topics).

    Example of desired output:
    {
      "schedule": [
        {
          "subject_name": "Physics",
          "weekly_plan": [
            { "week": 1, "topic": "Kinematics", "tasks": ["Vectors and Scalars", "Uniform Motion", "Projectile Motion"] }
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
        generationConfig: { responseMimeType: "application/json" },
    });
    const response = await result.response;
    const scheduleData = JSON.parse(response.text());

    return NextResponse.json({ schedule: scheduleData.schedule, syllabusText: syllabusText });

  } catch (error) {
    console.error("--- GENERATE API CATCH BLOCK ERROR ---", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: `An internal server error occurred: ${errorMessage}` }, { status: 500 });
  }
}