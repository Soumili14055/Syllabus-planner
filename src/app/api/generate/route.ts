// File: src/app/api/generate/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// ✅ --- New Helper Function to Clean AI Response ---
// This function finds the JSON part of the AI's text and extracts it.
const cleanAndParseJson = (rawText: string) => {
    // Find the first '{' and the last '}' to isolate the JSON object
    const jsonStartIndex = rawText.indexOf('{');
    const jsonEndIndex = rawText.lastIndexOf('}');

    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
        throw new Error("Could not find a valid JSON object in the AI response.");
    }

    const jsonString = rawText.substring(jsonStartIndex, jsonEndIndex + 1);
    return JSON.parse(jsonString);
};


// --- Main API Handler ---
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const syllabusFile = formData.get("syllabusFile") as File | null;
    const endDate = formData.get("endDate") as string | null;

    // --- Validation ---
    if (!syllabusFile || !endDate) {
      return NextResponse.json({ error: "Syllabus file and end date are required." }, { status: 400 });
    }
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(syllabusFile.type)) {
        return NextResponse.json({ error: "Invalid file type. Please upload a PDF, JPG, or PNG." }, { status: 400 });
    }

    if (syllabusFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds the 5MB limit." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    let syllabusText: string;
    let responseData;

    // --- File Processing ---
    const fileBuffer = Buffer.from(await syllabusFile.arrayBuffer());

    if (syllabusFile.type === 'application/pdf') {
      const pdfData = await pdf(fileBuffer);
      syllabusText = pdfData.text.trim();
      if (!syllabusText) {
        return NextResponse.json({ error: "Could not extract text from the PDF." }, { status: 400 });
      }
      const prompt = createFullPrompt(syllabusText, endDate);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      // ✅ FIX: Use the cleaning function to parse the response safely
      responseData = cleanAndParseJson(result.response.text());

    } else { // Image Processing
      const imageBase64 = fileBuffer.toString("base64");
      const imagePart = { inlineData: { mimeType: syllabusFile.type, data: imageBase64 } };
      
      const prompt = createFullPromptWithOCR(endDate);
      const result = await model.generateContent({
          contents: [{ role: "user", parts: [ { text: prompt }, imagePart ] }],
          generationConfig: { responseMimeType: "application/json" },
      });
      
      // ✅ FIX: Use the cleaning function here as well
      responseData = cleanAndParseJson(result.response.text());
      syllabusText = responseData.syllabusText || "Text extracted from image.";
    }

    return NextResponse.json({
      schedule: responseData.schedule,
      studyNotes: responseData.study_notes,
      practiceQuestions: responseData.practice_questions,
      syllabusText: syllabusText,
    });

  } catch (error) {
    console.error("--- GENERATE API CATCH BLOCK ERROR ---", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: `An internal server error occurred: ${errorMessage}` }, { status: 500 });
  }
}

// --- (Helper Functions for Prompts - No Changes Needed) ---

const commonInstructions = `
  You are an expert curriculum analyzer and academic tutor. Your task is to perform three actions based on the provided syllabus content:
  1.  Create a weekly study schedule.
  2.  Generate detailed, high-quality study notes for each main topic in the schedule.
  3.  Create a list of 10 short-answer practice questions that cover the entire syllabus.

  The output MUST be a single, valid JSON object.
`;

const jsonStructure = `
  The JSON object must have THREE top-level keys: "schedule", "study_notes", and "practice_questions".

  1.  "schedule": An array of subject objects. Each subject has a "subject_name" and a "weekly_plan". The "weekly_plan" is an array of week objects, each with a "week" number, a "topic" string, and a "tasks" array of sub-topics. IGNORE instructional text like "Read Chapter 1" for tasks.
  
  2.  "study_notes": An object where each key is a main "topic" string (exactly matching a topic from the weekly_plan) and the value is a string of detailed, well-formatted study notes for that topic. The notes should be comprehensive and easy to understand.

  3.  "practice_questions": An array of 10 strings, where each string is a thought-provoking short-answer question based on the syllabus content.
`;

const createFullPrompt = (syllabusText: string, endDate: string) => `
  ${commonInstructions}
  ${jsonStructure}
  ---
  Syllabus Content: ${syllabusText.substring(0, 30000)}
  ---
  Schedule Completion Deadline: ${endDate}
  Today's Date: ${new Date().toLocaleDateString('en-CA')}
`;

const createFullPromptWithOCR = (endDate: string) => `
  ${commonInstructions}
  First, perform OCR on the image to extract the syllabus text.
  Then, based on the extracted text, generate the JSON output.
  The JSON object must contain a FOURTH top-level key: "syllabusText", which is a string of all the text you extracted.
  ${jsonStructure}
  ---
  Schedule Completion Deadline: ${endDate}
  Today's Date: ${new Date().toLocaleDateString('en-CA')}
`;
