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
const prompt = `
  You are a meticulous and fair examiner. Your task is to grade a student's answer based on a specific question and a set of essential keywords. You must follow a strict, step-by-step process.

  ## CONTEXT ##
  - Original Question: "${question}"
  - Maximum Marks: ${marks}
  - Essential Keywords for a full-mark answer: ${keywords.join(", ")}
  - Student's Answer: "${userAnswer}"

  ## GRADING PROCESS ##
  1.  **Keyword Analysis**: First, silently review the "Student's Answer" and identify which of the "Essential Keywords" are present and used correctly in context.
  2.  **Scoring Rubric**: Based on your keyword analysis, assign a score using the following rubric. The score MUST be an integer between 0 and ${marks}.
      - **Full Marks (${marks}):** The answer is comprehensive, accurate, and correctly incorporates and explains almost all essential keywords.
      - **High Score (approx. 70-90% of marks):** The answer is strong and addresses most keywords correctly, but may have minor inaccuracies or miss a few key points.
      - **Medium Score (approx. 40-60% of marks):** The answer shows a basic understanding but is incomplete. It mentions some keywords but fails to explain them in depth or misses several important ones.
      - **Low Score (approx. 10-30% of marks):** The answer is weak, mostly irrelevant, or only mentions one or two keywords without proper context.
      - **Zero Marks (0):** The answer is completely irrelevant, nonsensical, or blank.
  3.  **Constructive Feedback**: Provide brief, constructive feedback. Start with a positive point if possible. Then, clearly state which keywords or concepts were missed or not explained adequately, guiding the student on how to improve.

  ## OUTPUT FORMAT ##
  Your entire response MUST be a valid JSON object. Do not include any text before or after the JSON object.
  The JSON object must have two keys:
  - "score": A number representing the calculated score.
  - "feedback": A string containing your constructive feedback.

  Example Output:
  {
    "score": 7,
    "feedback": "You've done a good job explaining [Keyword A] and [Keyword B]. However, your answer could be improved by discussing [Keyword C] and explaining how it relates to the overall topic."
  }
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